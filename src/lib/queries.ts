import { supabaseServer } from "./supabase/server";
import type { Lens } from "./lenses";
import type { Block, Character, Claim, Essay, Work } from "./types";

const ESSAY_SELECT = `
  id, slug, title, thesis, lenses, spoiler_level, status, reading_minutes,
  published_at, updated_at, answers_essay_id, contests, steelman, steelman_mark,
  author:profiles!essays_author_id_fkey ( id, handle, display_name ),
  character:characters ( id, slug, name, work:works ( slug, title ) )
`;

const BLOCK_SELECT = `
  id, essay_id, position, kind, claim_kind, body, margin_note,
  covers_from, covers_to, revised_after_essay_id,
  citation:citations ( id, block_id, work_title, locator, quote )
`;

/** Supabase returns embedded one-to-one rows as objects; the types line up. */
function rows<T>(data: unknown): T[] {
  return (data ?? []) as T[];
}

// ─── feed ──────────────────────────────────────────────────────────────────

export async function feedEssays(lens?: Lens) {
  const supabase = await supabaseServer();
  let query = supabase
    .from("essays")
    .select(ESSAY_SELECT)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(40);

  if (lens) query = query.contains("lenses", [lens]);

  const { data } = await query;
  return rows<Essay>(data);
}

export async function publishedCount() {
  const supabase = await supabaseServer();
  const { count } = await supabase
    .from("essays")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  return count ?? 0;
}

export async function lensTallies() {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("essays").select("lenses").eq("status", "published");
  const tally: Record<string, number> = {};
  for (const row of rows<{ lenses: Lens[] }>(data)) {
    for (const lens of row.lenses ?? []) tally[lens] = (tally[lens] ?? 0) + 1;
  }
  return tally;
}

// ─── characters ────────────────────────────────────────────────────────────

export async function characterBySlug(slug: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("characters")
    .select(
      `id, slug, name, description, portrait_url, created_by, created_at,
       work:works ( id, slug, title, creator, medium, year, unit_label, unit_count )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as Character | null) ?? null;
}

export async function characterList() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("characters")
    .select(`id, slug, name, work:works ( slug, title )`)
    .order("name");
  return rows<{ id: string; slug: string; name: string; work: { slug: string; title: string } }>(data);
}

export async function essaysForCharacter(characterId: string, lens?: Lens) {
  const supabase = await supabaseServer();
  let query = supabase
    .from("essays")
    .select(ESSAY_SELECT)
    .eq("character_id", characterId)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (lens) query = query.contains("lenses", [lens]);

  const { data } = await query;
  return rows<Essay>(data);
}

export async function characterStats(characterId: string) {
  const essays = await essaysForCharacter(characterId);
  const tally: Record<string, number> = {};
  for (const essay of essays) {
    for (const lens of essay.lenses ?? []) tally[lens] = (tally[lens] ?? 0) + 1;
  }
  const topLens = Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const claims = await claimsForCharacter(characterId, "contested");
  return { essayCount: essays.length, topLens, mostContested: claims[0] ?? null };
}

// ─── the claim ledger ──────────────────────────────────────────────────────

export async function claimsForCharacter(characterId: string, sort: "contested" | "supported") {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("claim_tallies")
    .select("id, character_id, text, work_title, locator, supporting, contesting")
    .eq("character_id", characterId);

  const claims = rows<Claim>(data);
  return claims.sort((a, b) =>
    sort === "contested"
      ? b.contesting - a.contesting || b.supporting - a.supporting
      : b.supporting - a.supporting || b.contesting - a.contesting,
  );
}

export async function claimsForWork(workId: string, limit = 4) {
  const supabase = await supabaseServer();
  const { data: chars } = await supabase.from("characters").select("id, slug, name").eq("work_id", workId);
  const characters = rows<{ id: string; slug: string; name: string }>(chars);
  if (characters.length === 0) return [];

  const { data } = await supabase
    .from("claim_tallies")
    .select("id, character_id, text, work_title, locator, supporting, contesting")
    .in("character_id", characters.map((c) => c.id))
    .gt("contesting", 0)
    .order("contesting", { ascending: false })
    .limit(limit);

  const byId = new Map(characters.map((c) => [c.id, c]));
  return rows<Claim>(data).map((claim) => ({ ...claim, character: byId.get(claim.character_id)! }));
}

export async function contestedClaims(limit = 3) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("claim_tallies")
    .select("id, character_id, text, work_title, locator, supporting, contesting")
    .gt("contesting", 0)
    .order("contesting", { ascending: false })
    .limit(limit);

  const claims = rows<Claim>(data);
  if (claims.length === 0) return [];

  const { data: chars } = await supabase
    .from("characters")
    .select("id, slug, name, work:works ( title )")
    .in("id", claims.map((c) => c.character_id));

  const byId = new Map(
    rows<{ id: string; slug: string; name: string; work: { title: string } }>(chars).map((c) => [c.id, c]),
  );
  return claims.map((claim) => ({ ...claim, character: byId.get(claim.character_id) ?? null }));
}

// ─── essays ────────────────────────────────────────────────────────────────

export async function essayBySlug(slug: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("essays").select(ESSAY_SELECT).eq("slug", slug).maybeSingle();
  return (data as Essay | null) ?? null;
}

export async function essayById(id: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase.from("essays").select(ESSAY_SELECT).eq("id", id).maybeSingle();
  return (data as Essay | null) ?? null;
}

export async function blocksForEssay(essayId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("blocks")
    .select(BLOCK_SELECT)
    .eq("essay_id", essayId)
    .order("position");
  return rows<Block>(data);
}

export async function counterpointsFor(essayId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("essays")
    .select(ESSAY_SELECT)
    .eq("answers_essay_id", essayId)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return rows<Essay>(data);
}

export async function countCounterpoints(essayId: string) {
  const supabase = await supabaseServer();
  const { count } = await supabase
    .from("essays")
    .select("id", { count: "exact", head: true })
    .eq("answers_essay_id", essayId)
    .eq("status", "published");
  return count ?? 0;
}

export async function revisionsFor(essayId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("revisions")
    .select(`id, note, created_at, prompted_by:essays!revisions_prompted_by_essay_id_fkey (
      author:profiles!essays_author_id_fkey ( display_name ) )`)
    .eq("essay_id", essayId)
    .order("created_at", { ascending: false });

  return rows<{
    id: string;
    note: string;
    created_at: string;
    prompted_by: { author: { display_name: string } } | null;
  }>(data);
}

// ─── works ─────────────────────────────────────────────────────────────────

export async function workBySlug(slug: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("works")
    .select("id, slug, title, creator, medium, year, unit_label, unit_count")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Work | null) ?? null;
}

export async function workList() {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("works")
    .select("id, slug, title, creator, medium, year, unit_label, unit_count")
    .order("title");
  return rows<Work>(data);
}

/** Every character in a work, with how many published essays each carries. */
export async function rosterForWork(workId: string, sort: "essays" | "az") {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("characters")
    .select("id, slug, name, essays ( id, status )")
    .eq("work_id", workId);

  const roster = rows<{ id: string; slug: string; name: string; essays: { status: string }[] }>(data).map(
    (character) => ({
      id: character.id,
      slug: character.slug,
      name: character.name,
      count: (character.essays ?? []).filter((e) => e.status === "published").length,
    }),
  );

  return roster.sort((a, b) =>
    sort === "az" ? a.name.localeCompare(b.name) : b.count - a.count || a.name.localeCompare(b.name),
  );
}

// ─── writers ───────────────────────────────────────────────────────────────

export async function profileByHandle(handle: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("profiles")
    .select("id, handle, display_name, bio, lenses, onboarded_at")
    .eq("handle", handle)
    .maybeSingle();
  return data ?? null;
}

export async function essaysByAuthor(authorId: string, status: "published" | "draft") {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("essays")
    .select(ESSAY_SELECT)
    .eq("author_id", authorId)
    .eq("status", status)
    .order(status === "published" ? "published_at" : "updated_at", { ascending: false });
  return rows<Essay>(data);
}

export async function counterpointsReceived(authorId: string) {
  const supabase = await supabaseServer();
  const { data: mine } = await supabase.from("essays").select("id").eq("author_id", authorId);
  const ids = rows<{ id: string }>(mine).map((e) => e.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("essays")
    .select(ESSAY_SELECT)
    .in("answers_essay_id", ids)
    .eq("status", "published")
    .order("published_at", { ascending: false });
  return rows<Essay>(data);
}

/** Steelmen written against this author's essays that still want a verdict. */
export async function steelmenAwaiting(authorId: string) {
  const received = await counterpointsReceived(authorId);
  return received.filter((essay) => essay.steelman && !essay.steelman_mark);
}

export async function authorLensTally(authorId: string) {
  const essays = await essaysByAuthor(authorId, "published");
  const tally: Record<string, number> = {};
  for (const essay of essays) {
    for (const lens of essay.lenses ?? []) tally[lens] = (tally[lens] ?? 0) + 1;
  }
  return Object.entries(tally).sort((a, b) => b[1] - a[1]);
}

// ─── reading position ──────────────────────────────────────────────────────

export async function readingProgress(userId: string) {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("reading_progress")
    .select("position, work:works ( id, slug, title, unit_label, unit_count )")
    .eq("user_id", userId);

  return rows<{
    position: number;
    work: { id: string; slug: string; title: string; unit_label: string; unit_count: number | null };
  }>(data);
}

// ─── search ────────────────────────────────────────────────────────────────

export async function search(term: string) {
  const supabase = await supabaseServer();
  const like = `%${term}%`;

  const [characters, works, essays, writers] = await Promise.all([
    supabase
      .from("characters")
      .select("id, slug, name, work:works ( slug, title ), essays ( id, status )")
      .ilike("name", like)
      .limit(10),
    supabase
      .from("works")
      .select("id, slug, title, medium, characters ( id )")
      .ilike("title", like)
      .limit(10),
    supabase
      .from("essays")
      .select(ESSAY_SELECT)
      .eq("status", "published")
      .or(`title.ilike.${like},thesis.ilike.${like}`)
      .limit(10),
    supabase.from("profiles").select("id, handle, display_name").ilike("display_name", like).limit(10),
  ]);

  return {
    characters: rows<{
      id: string;
      slug: string;
      name: string;
      work: { slug: string; title: string };
      essays: { status: string }[];
    }>(characters.data),
    works: rows<{ id: string; slug: string; title: string; medium: string; characters: { id: string }[] }>(
      works.data,
    ),
    essays: rows<Essay>(essays.data),
    writers: rows<{ id: string; handle: string; display_name: string }>(writers.data),
  };
}
