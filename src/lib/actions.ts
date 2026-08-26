"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { supabaseServer } from "./supabase/server";
import { MAX_LENSES_AT_ONBOARDING, MAX_LENSES_PER_ESSAY, isLens } from "./lenses";
import {
  CLAIM_KINDS,
  STEELMAN_MAX,
  STEELMAN_MIN,
  THESIS_MAX,
  asMedium,
  asSpoilerLevel,
  oneSentence,
  readingMinutes,
  type ClaimKind,
} from "./types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 72);
}

async function requireUser() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/signin");
  return { supabase, user: data.user };
}

/** Every write re-checks ownership: Server Actions are reachable by direct POST. */
async function requireOwnEssay(essayId: string) {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("essays")
    .select("id, author_id, status, slug, character_id")
    .eq("id", essayId)
    .maybeSingle();
  if (!data || data.author_id !== user.id) redirect("/me");
  return { supabase, user, essay: data };
}

// ─── session ───────────────────────────────────────────────────────────────

export type AuthFormState = { state: "form" | "sent"; email: string; error: string | null };

export async function sendMagicLink(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email)) {
    return { state: "form", email, error: "That address is missing an @" };
  }

  const supabase = await supabaseServer();
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) return { state: "form", email, error: error.message };
  return { state: "sent", email, error: null };
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

// ─── chrome that persists without a client store ───────────────────────────

export async function toggleTheme(current: "light" | "dark") {
  const store = await cookies();
  store.set("lensa.theme", current === "dark" ? "light" : "dark", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function toggleRail(collapsed: boolean) {
  const store = await cookies();
  store.set("lensa.rail", collapsed ? "0" : "1", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

// ─── characters ────────────────────────────────────────────────────────────

export type CharacterFormState = {
  error: string | null;
  existingSlug?: string;
  values: { name: string; work: string };
};

export async function createCharacter(
  _prev: CharacterFormState,
  formData: FormData,
): Promise<CharacterFormState> {
  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const workTitle = String(formData.get("work") ?? "").trim();
  const medium = asMedium(String(formData.get("medium") ?? "novel"));
  // Two sentences, neutral. A third is refused: judgements belong in essays.
  const description = oneSentence(String(formData.get("description") ?? "").trim(), 220, 2);
  const values = { name, work: workTitle };

  if (name.length < 2) return { error: "A name is required", values };
  if (workTitle.length < 1) return { error: "A source work is required", values };

  let workId: string | undefined;
  const { data: work } = await supabase.from("works").select("id").ilike("title", workTitle).maybeSingle();

  if (work) {
    workId = work.id;
  } else {
    const inserted = await supabase
      .from("works")
      .insert({
        slug: slugify(workTitle),
        title: workTitle,
        medium,
        unit_label: medium === "anime" || medium === "series" ? "episodes" : "chapters",
        created_by: user.id,
      })
      .select("id")
      .single();
    if (inserted.error) return { error: inserted.error.message, values };
    workId = inserted.data.id;
  }

  const { data: existing } = await supabase
    .from("characters")
    .select("slug")
    .eq("work_id", workId)
    .ilike("name", name)
    .maybeSingle();

  if (existing) {
    return { error: `Already exists · ${workTitle}`, existingSlug: existing.slug, values };
  }

  const slug = slugify(`${name}-${workTitle}`);
  const { error } = await supabase.from("characters").insert({
    slug,
    name,
    work_id: workId,
    description: description || null,
    created_by: user.id,
  });

  if (error) return { error: error.message, values };

  revalidatePath("/characters");
  redirect(`/c/${slug}`);
}

// ─── drafts ────────────────────────────────────────────────────────────────

export async function createDraft(characterId: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("essays")
    .insert({ author_id: user.id, character_id: characterId })
    .select("id")
    .single();

  if (error) redirect("/me");

  await supabase.from("blocks").insert({ essay_id: data.id, position: 0, claim_kind: "interpretive" });
  redirect(`/write/${data.id}`);
}

/**
 * Autosave reports back rather than failing silently: the editor keeps the
 * text it could not save and offers Retry against the same call.
 */
export type SaveResult = { ok: true } | { ok: false; error: string };

export async function saveDraft(essayId: string, formData: FormData): Promise<SaveResult> {
  const { supabase } = await requireOwnEssay(essayId);

  const thesis = oneSentence(String(formData.get("thesis") ?? ""), THESIS_MAX);
  const title = String(formData.get("title") ?? "").trim();
  const spoiler = asSpoilerLevel(String(formData.get("spoiler_level") ?? "none"));

  const { error } = await supabase
    .from("essays")
    .update({ thesis, title: title || null, spoiler_level: spoiler, updated_at: new Date().toISOString() })
    .eq("id", essayId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/write/${essayId}`);
  return { ok: true };
}

export async function toggleEssayLens(essayId: string, lens: string) {
  if (!isLens(lens)) return;
  const { supabase } = await requireOwnEssay(essayId);

  const { data } = await supabase.from("essays").select("lenses").eq("id", essayId).single();
  const current = data?.lenses ?? [];
  const next = current.includes(lens)
    ? current.filter((l) => l !== lens)
    : [...current, lens].slice(-MAX_LENSES_PER_ESSAY);

  await supabase.from("essays").update({ lenses: next }).eq("id", essayId);
  revalidatePath(`/write/${essayId}`);
}

export async function saveBlock(
  essayId: string,
  blockId: string,
  body: string,
  kind: ClaimKind,
): Promise<SaveResult> {
  const { supabase } = await requireOwnEssay(essayId);
  const patch: { body: string; claim_kind?: ClaimKind } = { body };
  if (CLAIM_KINDS.includes(kind)) patch.claim_kind = kind;

  const { error } = await supabase
    .from("blocks")
    .update(patch)
    .eq("id", blockId)
    .eq("essay_id", essayId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/write/${essayId}`);
  return { ok: true };
}

export async function addBlock(essayId: string) {
  const { supabase } = await requireOwnEssay(essayId);
  const { data } = await supabase
    .from("blocks")
    .select("position")
    .eq("essay_id", essayId)
    .order("position", { ascending: false })
    .limit(1);

  const position = (data?.[0]?.position ?? -1) + 1;
  await supabase.from("blocks").insert({ essay_id: essayId, position, claim_kind: "interpretive" });
  revalidatePath(`/write/${essayId}`);
}

export async function removeBlock(essayId: string, blockId: string) {
  const { supabase } = await requireOwnEssay(essayId);
  await supabase.from("blocks").delete().eq("id", blockId).eq("essay_id", essayId);
  revalidatePath(`/write/${essayId}`);
}

/**
 * A block may carry several citations, so this adds one or edits one by id.
 * The chapter is the whole locator: page numbers are refused because editions
 * disagree, and the display form is built from the work's unit label.
 */
export async function saveCitation(essayId: string, blockId: string, formData: FormData) {
  const { supabase } = await requireOwnEssay(essayId);

  const citationId = String(formData.get("citation_id") ?? "").trim();
  const workId = String(formData.get("work_id") ?? "").trim();
  const chapter = Number(formData.get("chapter"));
  const quote = String(formData.get("quote") ?? "")
    .trim()
    .slice(0, 200);

  if (!workId || !Number.isInteger(chapter) || chapter < 1) return;

  const row = { block_id: blockId, work_id: workId, chapter, quote: quote || null };
  if (citationId) {
    await supabase.from("citations").update(row).eq("id", citationId).eq("block_id", blockId);
  } else {
    await supabase.from("citations").insert(row);
  }

  revalidatePath(`/write/${essayId}`);
}

export async function removeCitation(essayId: string, citationId: string) {
  const { supabase } = await requireOwnEssay(essayId);
  await supabase.from("citations").delete().eq("id", citationId);
  revalidatePath(`/write/${essayId}`);
}

/**
 * Citation enforcement is a warning, not a blocker (MVP scope): an unsourced
 * Textual claim publishes demoted to Interpretive with a dashed underline.
 *
 * The steelman gate needs no check here any more. A counterpoint row cannot
 * exist without both answers, so a counterpoint that skipped the gate is not
 * a state the database can hold.
 */
export async function publishEssay(essayId: string) {
  const { supabase, essay } = await requireOwnEssay(essayId);

  const { data: full } = await supabase
    .from("essays")
    .select("title, thesis")
    .eq("id", essayId)
    .single();

  if (!full?.thesis?.trim() || !full?.title?.trim()) redirect(`/write/${essayId}?blocked=thesis`);

  const { data: blocks } = await supabase.from("blocks").select("body").eq("essay_id", essayId);
  const words = (blocks ?? []).map((b) => b.body).join(" ");
  const slug = essay.slug ?? `${slugify(full.title!)}-${essayId.slice(0, 6)}`;

  await supabase
    .from("essays")
    .update({
      slug,
      status: "published",
      published_at: new Date().toISOString(),
      reading_minutes: readingMinutes(words),
    })
    .eq("id", essayId);

  revalidatePath("/");
  redirect(`/e/${slug}`);
}

export async function unpublishEssay(essayId: string) {
  const { supabase } = await requireOwnEssay(essayId);
  await supabase.from("essays").update({ status: "draft", published_at: null }).eq("id", essayId);
  revalidatePath("/");
  redirect(`/write/${essayId}`);
}

// ─── the steelman gate ─────────────────────────────────────────────────────

/**
 * Step one. No rebuttal exists until the opposing argument has been stated —
 * twice: what the paragraph claims, and the strongest case for that claim.
 * Both are stored on the counterpoint row, which is what makes the gate real.
 */
export async function startCounterpoint(answersEssayId: string, formData: FormData) {
  const { supabase, user } = await requireUser();

  const targetBlockId = String(formData.get("target_block_id") ?? "").trim();
  const claim = String(formData.get("claim") ?? "")
    .trim()
    .slice(0, STEELMAN_MAX);
  const strongest = String(formData.get("strongest") ?? "")
    .trim()
    .slice(0, STEELMAN_MAX);

  if (claim.length < STEELMAN_MIN || strongest.length < STEELMAN_MIN) {
    redirect(`/counterpoint/new/${answersEssayId}?short=1`);
  }

  const { data: original } = await supabase
    .from("essays")
    .select("id, character_id")
    .eq("id", answersEssayId)
    .single();

  if (!original) redirect("/");

  // The target has to be a paragraph of the essay being answered, whatever
  // the form posted: a Server Action is reachable by direct POST.
  const { data: blocks } = await supabase
    .from("blocks")
    .select("id")
    .eq("essay_id", answersEssayId)
    .eq("kind", "paragraph");

  const blockIds = (blocks ?? []).map((block) => block.id);
  if (!blockIds.includes(targetBlockId)) redirect(`/counterpoint/new/${answersEssayId}?error=1`);

  const { data: drafts } = await supabase
    .from("essays")
    .select("id")
    .eq("author_id", user.id)
    .eq("status", "draft");

  const draftIds = (drafts ?? []).map((draft) => draft.id);
  const { data: existing } = draftIds.length
    ? await supabase
        .from("counterpoints")
        .select("id, essay_id")
        .in("essay_id", draftIds)
        .in("target_block_id", blockIds)
        .maybeSingle()
    : { data: null };

  if (existing) {
    await supabase
      .from("counterpoints")
      .update({ target_block_id: targetBlockId, claim, strongest })
      .eq("id", existing.id);
    redirect(`/write/${existing.essay_id}`);
  }

  const { data, error } = await supabase
    .from("essays")
    .insert({ author_id: user.id, character_id: original.character_id })
    .select("id")
    .single();

  if (error) redirect(`/counterpoint/new/${answersEssayId}?error=1`);

  const { error: gateError } = await supabase
    .from("counterpoints")
    .insert({ essay_id: data.id, target_block_id: targetBlockId, claim, strongest });

  // Without the gate row this is not a counterpoint, so the draft goes too.
  if (gateError) {
    await supabase.from("essays").delete().eq("id", data.id);
    redirect(`/counterpoint/new/${answersEssayId}?error=1`);
  }

  await supabase.from("blocks").insert({ essay_id: data.id, position: 0, claim_kind: "interpretive" });
  redirect(`/write/${data.id}`);
}

/** The answered author's verdict, published alongside the counterpoint. */
export async function markSteelman(counterpointId: string, mark: "fair" | "disputed") {
  const { supabase, user } = await requireUser();

  const { data: counterpoint } = await supabase
    .from("counterpoints")
    .select("id, target_block_id")
    .eq("id", counterpointId)
    .maybeSingle();

  if (!counterpoint) redirect("/me");

  // The verdict belongs to whoever wrote the paragraph being answered.
  const { data: target } = await supabase
    .from("blocks")
    .select("essay_id")
    .eq("id", counterpoint.target_block_id)
    .maybeSingle();

  const { data: original } = target
    ? await supabase.from("essays").select("author_id").eq("id", target.essay_id).maybeSingle()
    : { data: null };

  if (original?.author_id !== user.id) redirect("/me");

  await supabase.from("counterpoints").update({ mark }).eq("id", counterpointId);
  revalidatePath("/me");
}

// ─── reading position ──────────────────────────────────────────────────────

export async function saveReadingPositions(formData: FormData) {
  const { supabase, user } = await requireUser();

  const updates = [...formData.entries()]
    .filter(([key]) => key.startsWith("position:"))
    .map(([key, value]) => ({
      user_id: user.id,
      work_id: key.slice("position:".length),
      position: Math.max(0, Number(value) || 0),
    }));

  if (updates.length) await supabase.from("reading_progress").upsert(updates);
  revalidatePath("/", "layout");
}

// ─── profile ───────────────────────────────────────────────────────────────

export async function saveProfile(formData: FormData) {
  const { supabase, user } = await requireUser();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  if (display_name) {
    await supabase.from("profiles").update({ display_name, bio: bio || null }).eq("id", user.id);
  }
  revalidatePath("/settings");
}

/** Onboarding step one: the works you can judge arguments about. */
export async function chooseWorks(formData: FormData) {
  const { supabase, user } = await requireUser();
  const workIds = formData.getAll("work").map(String);

  if (workIds.length) {
    await supabase
      .from("reading_progress")
      .upsert(workIds.map((work_id) => ({ user_id: user.id, work_id, position: 0 })), {
        onConflict: "user_id,work_id",
        ignoreDuplicates: true,
      });
  }

  redirect("/welcome?step=2");
}

export async function saveOnboardingPositions(formData: FormData) {
  await saveReadingPositions(formData);
  redirect("/welcome?step=3");
}

export async function finishOnboarding(formData: FormData) {
  const { supabase, user } = await requireUser();

  const lenses = formData.getAll("lens").map(String).filter(isLens).slice(0, MAX_LENSES_AT_ONBOARDING);

  await supabase
    .from("profiles")
    .update({ lenses, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/");
}

export async function skipOnboarding() {
  const { supabase, user } = await requireUser();
  await supabase.from("profiles").update({ onboarded_at: new Date().toISOString() }).eq("id", user.id);
  redirect("/");
}
