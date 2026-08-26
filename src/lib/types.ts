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

/** The form posts a string; the column is an enum. Anything unrecognised is none. */
export function asSpoilerLevel(value: string): SpoilerLevel {
  return value in SPOILER_LABEL ? (value as SpoilerLevel) : "none";
}

/**
 * Works count in chapters, episodes or parts. Everything downstream — a
 * citation's chapter, a block's covered range, a reader's position — is the
 * same integer, and only the noun changes.
 */
export function unitNoun(unitLabel: string): string {
  return unitLabel === "episodes" ? "episode" : unitLabel === "parts" ? "part" : "chapter";
}

export function unitShort(unitLabel: string): string {
  return unitLabel === "episodes" ? "ep." : unitLabel === "parts" ? "pt." : "ch.";
}

export const MEDIUM_LABEL: Record<Medium, string> = {
  novel: "Novel",
  manga: "Manga",
  anime: "Anime",
  film: "Film",
  series: "Series",
  game: "Game",
};

/** The form posts a string; the column is an enum. Anything else is a novel. */
export function asMedium(value: string): Medium {
  return value in MEDIUM_LABEL ? (value as Medium) : "novel";
}

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
  /** Set when this essay is a counterpoint. It answers one paragraph, not the essay. */
  counterpoint: Counterpoint | null;
  author: Pick<Profile, "id" | "handle" | "display_name">;
  character: Pick<Character, "id" | "slug" | "name"> & {
    work: Pick<Work, "id" | "slug" | "title" | "unit_label">;
  };
};

/**
 * The steelman gate, as a row. Both answers are written before the rebuttal
 * exists, and the row cannot be stored without them — so there is no such
 * thing as a counterpoint that skipped the gate.
 */
export type Counterpoint = {
  id: string;
  essay_id: string;
  /** The paragraph being answered. */
  target_block_id: string;
  /** One: what that paragraph claims, in the answerer's own words. */
  claim: string;
  /** Two: the strongest case for that claim, not the weakest. */
  strongest: string;
  /** The answered author's verdict, published alongside the counterpoint. */
  mark: "fair" | "disputed" | null;
};

/** An essay that answers a paragraph, with the position of the paragraph resolved. */
export type CounterpointEssay = Essay & { counterpoint: Counterpoint; targetParagraph: number };

export const STEELMAN_MIN = 20;
export const STEELMAN_MAX = 320;

/** A citation points at a chapter. The quote is optional. */
export type Citation = {
  id: string;
  block_id: string;
  chapter: number;
  quote: string | null;
  work: Pick<Work, "slug" | "title" | "unit_label">;
};

export function citationLabel(citation: Citation): string {
  return `${unitShort(citation.work.unit_label)} ${citation.chapter}`;
}

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
  citations: Citation[];
  /** One row per reader who marked this paragraph disputed. */
  contests: { user_id: string }[];
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
export function effectiveClaimKind(block: Pick<Block, "claim_kind" | "citations">): ClaimKind {
  return isUnsourced(block) ? "interpretive" : block.claim_kind;
}

export function isUnsourced(block: Pick<Block, "claim_kind" | "citations">): boolean {
  return block.claim_kind === "textual" && (block.citations?.length ?? 0) === 0;
}

/**
 * Readers count paragraphs, not blocks: a heading takes no number of its own.
 * Counts restart per essay, so a block's position and the number a reader
 * would give it are not the same thing.
 */
export function numberParagraphs<
  T extends { id: string; position: number; kind: string; essay_id: string },
>(blocks: T[]): { id: string; paragraph: number }[] {
  const counted = new Map<string, number>();
  return [...blocks]
    .sort((a, b) => a.position - b.position)
    .map((block) => {
      const soFar = counted.get(block.essay_id) ?? 0;
      const paragraph = block.kind === "paragraph" ? soFar + 1 : soFar;
      if (block.kind === "paragraph") counted.set(block.essay_id, paragraph);
      return { id: block.id, paragraph };
    });
}

/** A contested paragraph is one at least one reader has marked disputed. */
export function isContested(block: Pick<Block, "contests">): boolean {
  return (block.contests?.length ?? 0) > 0;
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
