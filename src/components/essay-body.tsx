import { SpoilerBlock } from "./kit";
import { BlockBadge } from "./ui";
import { citationLabel, isContested, unitNoun, type Block, type Citation } from "@/lib/types";

function coversLabel(block: Block, unit: string) {
  const noun = unitNoun(unit);
  if (block.covers_to && block.covers_to !== block.covers_from) {
    return `Covers ${noun}s ${block.covers_from}–${block.covers_to}`;
  }
  return `Covers ${noun} ${block.covers_from}`;
}

/** The citation card opens on hover or keyboard focus; no script involved. */
function CitationMark({ index, citation }: { index: number; citation: Citation }) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        className="border-0 bg-transparent p-0 pl-1 align-super text-[11px] leading-none font-medium text-[color:var(--muted)]"
        aria-label={`Citation ${index}`}
      >
        {index}
      </button>
      <span className="pointer-events-none absolute top-[30px] right-0 z-25 hidden w-[250px] border border-[color:var(--rule)] bg-[color:var(--paper)] p-[14px] text-left group-hover:block group-focus-within:block">
        <span className="meta meta-wrap mb-2 block">
          {citation.work.title} · {citationLabel(citation)}
        </span>
        {citation.quote && <span className="serif-sm block italic">“{citation.quote}”</span>}
      </span>
    </span>
  );
}

/**
 * The essay measure never exceeds 680px. At 1024 and up the badge sits in a
 * 132px margin column with a 32px gutter; below that it becomes an inline
 * label above the paragraph.
 */
export function EssayBody({
  blocks,
  position,
  unitLabel,
}: {
  blocks: Block[];
  /** The reader's position in the work, or null when nothing is tracked. */
  position: number | null;
  unitLabel: string;
}) {
  let citationIndex = 0;

  return (
    <div>
      {blocks.map((block) => {
        if (block.kind === "heading") {
          return (
            <div className="p-row" key={block.id}>
              <div className="badge-cell" />
              <div />
              <h2 className="head-sm mt-10 mb-2">{block.body}</h2>
            </div>
          );
        }

        const gated = block.covers_from != null && position != null && position < block.covers_from;
        // A block may carry several citations, numbered continuously down the
        // essay so the marks read as one sequence rather than one per paragraph.
        const cites = (block.citations ?? []).map((citation) => ({
          citation,
          index: (citationIndex += 1),
        }));

        const paragraph = (
          <p className={`body-p${block.revised_after_essay_id ? " body-p-revised" : ""}`}>{block.body}</p>
        );

        return (
          <div className="p-row" key={block.id}>
            <div className="badge-cell flex-col items-start gap-3 md:items-end">
              <span className="flex items-start">
                <BlockBadge block={block} />
                {cites.map(({ citation, index }) => (
                  <CitationMark key={citation.id} index={index} citation={citation} />
                ))}
              </span>
              {/* Oxblood is reserved, and a disputed paragraph is one of the four
                  things it is reserved for. */}
              {isContested(block) && (
                <span className="meta meta-accent">Contested · {block.contests.length}</span>
              )}
              {/* The aside lives in the margin at 1024 and up, and nowhere below it. */}
              {block.margin_note && <span className="margin-note hidden md:block">{block.margin_note}</span>}
            </div>
            <div />
            {gated ? <SpoilerBlock covers={coversLabel(block, unitLabel)}>{paragraph}</SpoilerBlock> : paragraph}
          </div>
        );
      })}
    </div>
  );
}
