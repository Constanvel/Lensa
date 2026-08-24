import { NextResponse } from "next/server";

import { supabaseServer } from "@/lib/supabase/server";
import { CLAIM_LABEL, type ClaimKind } from "@/lib/types";

/** Every draft and published essay, with citations, as plain text. */
export async function GET() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse("Not signed in", { status: 401 });

  const { data: essays } = await supabase
    .from("essays")
    .select(
      `title, thesis, status, published_at, lenses,
       character:characters ( name, work:works ( title ) ),
       blocks ( position, kind, claim_kind, body, citations ( work_title, locator, quote ) ),
       revisions ( note, created_at )`,
    )
    .eq("author_id", auth.user.id)
    .order("created_at", { ascending: true });

  const lines: string[] = ["LENSA EXPORT", new Date().toISOString(), ""];

  for (const essay of (essays ?? []) as never[]) {
    const e = essay as {
      title: string | null;
      thesis: string | null;
      status: string;
      published_at: string | null;
      lenses: string[];
      character: { name: string; work: { title: string } };
      blocks: {
        position: number;
        kind: string;
        claim_kind: ClaimKind;
        body: string;
        citations: { work_title: string; locator: string; quote: string } | null;
      }[];
      revisions: { note: string; created_at: string }[];
    };

    lines.push("─".repeat(60));
    lines.push(e.title ?? "Untitled draft");
    lines.push(`${e.character.name} · ${e.character.work.title}`);
    lines.push(`${e.status}${e.published_at ? ` · ${e.published_at}` : ""}`);
    if (e.lenses?.length) lines.push(`Lenses: ${e.lenses.join(", ")}`);
    lines.push("");
    lines.push(`THESIS: ${e.thesis ?? "—"}`);
    lines.push("");

    for (const block of [...(e.blocks ?? [])].sort((a, b) => a.position - b.position)) {
      if (block.kind === "heading") {
        lines.push(`## ${block.body}`, "");
        continue;
      }
      lines.push(`[${CLAIM_LABEL[block.claim_kind].toUpperCase()}]`);
      lines.push(block.body);
      if (block.citations) {
        lines.push(
          `    source: ${block.citations.work_title} · ${block.citations.locator} — “${block.citations.quote}”`,
        );
      }
      lines.push("");
    }

    if (e.revisions?.length) {
      lines.push("REVISIONS");
      for (const revision of e.revisions) lines.push(`  ${revision.created_at} — ${revision.note}`);
      lines.push("");
    }
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": 'attachment; filename="lensa-export.txt"',
    },
  });
}
