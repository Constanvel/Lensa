import type { Lens } from "./lenses";

export type ClaimKind = "textual" | "interpretive" | "speculative";

export const CLAIM_KINDS: ClaimKind[] = ["textual", "interpretive", "speculative"];

export const CLAIM_LABEL: Record<ClaimKind, string> = {
  textual: "Textual",
  interpretive: "Interpretive",
  speculative: "Speculative",
};

export type SpoilerLevel = "none" | "arc" | "full" | "adaptations";

export const SPOILER_LABEL: Record<SpoilerLevel, string> = {
  none: "No spoilers",
  arc: "Through one arc",
  full: "Full work",
  adaptations: "Full work and adaptations",
};

export type Medium = "novel" | "manga" | "anime" | "film" | "series" | "game";

export const MEDIUM_LABEL: Record<Medium, string> = {
  novel: "Novel",
  manga: "Manga",
  anime: "Anime",
  film: "Film",
  series: "Series",
  game: "Game",
};

export type Profile = {
  id: string;
  handle: string;
  display_name: string;
  bio: string | null;
  lenses: Lens[];
  onboarded_at: string | null;
};

export type Work = {
  id: string;
  slug: string;
  title: string;
  creator: string | null;
  medium: Medium;
  year: number | null;
  unit_label: string;
  unit_count: number | null;
};

export type Character = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  portrait_url: string | null;
  created_by: string | null;
  created_at: string;
  work: Work;
};

export type EssayStatus = "draft" | "published";

export type Essay = {
  id: string;
  slug: string | null;
  title: string | null;
  thesis: string | null;
  lenses: Lens[];
  spoiler_level: SpoilerLevel;
  status: EssayStatus;
  reading_minutes: number | null;
  published_at: string | null;
  updated_at: string;
  /** Set when this essay is a counterpoint to another. */
  answers_essay_id: string | null;
  /** What the counterpoint contests: "thesis", or "paragraph 4". */
  contests: string | null;
  /** The opposing argument stated in the counterpoint author's own words. */
  steelman: string | null;
  /** The original author's verdict on that summary. */
  steelman_mark: "fair" | "disputed" | null;
  author: Pick<Profile, "id" | "handle" | "display_name">;
  character: Pick<Character, "id" | "slug" | "name"> & { work: Pick<Work, "slug" | "title"> };
};

export type Citation = {
  id: string;
  block_id: string;
  work_title: string;
  locator: string;
  quote: string;
};

export type Block = {
  id: string;
  essay_id: string;
  position: number;
  kind: "paragraph" | "heading";
  claim_kind: ClaimKind;
  body: string;
  margin_note: string | null;
  /** Chapter range this block gives away, if any. */
  covers_from: number | null;
  covers_to: number | null;
  /** The counterpoint that prompted this paragraph's rewrite. */
  revised_after_essay_id: string | null;
  citation: Citation | null;
};

export type Claim = {
  id: string;
  character_id: string;
  text: string;
  work_title: string;
  locator: string;
  supporting: number;
  contesting: number;
};

export type Revision = {
  id: string;
  note: string;
  created_at: string;
  prompted_by: { display_name: string } | null;
};

export type ReadingProgress = {
  work_id: string;
  position: number;
};

/**
 * An unsourced Textual claim is shown demoted to Interpretive with a dashed
 * underline. The stored claim_kind is untouched — sourcing it restores it.
 */
export function effectiveClaimKind(block: Pick<Block, "claim_kind" | "citation">): ClaimKind {
  return block.claim_kind === "textual" && !block.citation ? "interpretive" : block.claim_kind;
}

export function isUnsourced(block: Pick<Block, "claim_kind" | "citation">): boolean {
  return block.claim_kind === "textual" && !block.citation;
}

/** A thesis is one sentence. A second is refused, not truncated. */
export const THESIS_MAX = 180;

export function oneSentence(input: string, max: number, allowed = 1): string {
  const flat = input.replace(/[\r\n]+/g, " ").slice(0, max);
  const stops = flat.match(/[.!?]/g);
  if (!stops || stops.length <= allowed) return flat;
  let seen = 0;
  for (let i = 0; i < flat.length; i++) {
    if (/[.!?]/.test(flat[i])) {
      seen++;
      if (seen === allowed) return flat.slice(0, i + 1);
    }
  }
  return flat;
}

export function countSentences(input: string): number {
  return (input.match(/[.!?](\s|$)/g) || []).length;
}

/** Word budget for the counter on a textarea. Whitespace alone is zero words. */
export function countWords(input: string): number {
  const trimmed = input.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** Roughly 220 words a minute, which is what the mockups assume. */
export function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}
