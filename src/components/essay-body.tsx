import Link from "next/link";

import { SpoilerBlock } from "./kit";
import { BlockBadge } from "./ui";
import { isContested, unitNoun, type Block } from "@/lib/types";

function coversLabel(block: Block, unit: string) {
  const noun = unitNoun(unit);
  if (block.covers_to && block.covers_to !== block.covers_from) {
    return `Covers ${noun}s ${block.covers_from}–${block.covers_to}`;
  }
  return `Covers ${noun} ${block.covers_from}`;
}

/**
 * The essay measure never exceeds 680px. The badge column is decided by the
 * container's own width (see `.essay` in globals.css), so the reader keeps its
 * geometry wherever it is embedded rather than reading the viewport behind it.
 */
export function EssayBody({
  blocks,
  position,
  unitLabel,
  openCitation,
}: {
  blocks: Block[];
  /** The reader's position in the work, or null when nothing is tracked. */
  position: number | null;
  unitLabel: string;
  /** The citation whose drawer is open, so its mark can say so. */
  openCitation?: string;
}) {
  let citationIndex = 0;

  return (
    <div className="essay">
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

        // Spoilers follow the reader's stored position for the work, never a
        // per-essay toggle: the essay does not get to decide what you know.
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
            <div className="badge-cell">
              <span className="flex items-start">
                <BlockBadge block={block} />
                {cites.map(({ citation, index }) => (
                  <Link
                    key={citation.id}
                    href={`?cite=${citation.id}`}
                    scroll={false}
                    replace
                    aria-label={`Citation ${index}`}
                    aria-current={openCitation === citation.id ? "true" : undefined}
                    className={`plain border-0 bg-transparent p-0 pl-1 align-super text-[11px] leading-none font-medium ${
                      openCitation === citation.id
                        ? "text-[color:var(--ink)] underline"
                        : "text-[color:var(--muted)] hover:text-[color:var(--ink)]"
                    }`}
                  >
                    {index}
                  </Link>
                ))}
              </span>
              {/* Oxblood is reserved, and a disputed paragraph is one of the four
                  things it is reserved for. */}
              {isContested(block) && (
                <span className="meta meta-accent">Contested · {block.contests.length}</span>
              )}
              {/* The aside lives in the margin column, and nowhere below it. */}
              {block.margin_note && <span className="margin-note">{block.margin_note}</span>}
            </div>
            <div />
            {gated ? (
              <SpoilerBlock covers={coversLabel(block, unitLabel)}>{paragraph}</SpoilerBlock>
            ) : (
              paragraph
            )}
          </div>
        );
      })}
    </div>
  );
}
