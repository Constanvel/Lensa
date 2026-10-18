import Link from "next/link";

import { citationLabel, type Citation } from "@/lib/types";

/**
 * Opened by `?cite=<id>` rather than by client state, so it survives without
 * JavaScript, can be linked to, and costs the reader no hydration. Closing is
 * a link back to the essay.
 *
 * Bottom sheet below 640, a 480px centred sheet to 1023, a 360px drawer at the
 * right from 1024 — and from 1280 the reader makes room for it instead of
 * being covered (`.reader-frame[data-cite]`).
 */
export function CitationDrawer({
  citation,
  index,
  paragraph,
  closeHref,
}: {
  citation: Citation;
  /** Its number in the essay's single run of citation marks. */
  index: number;
  /** The paragraph it supports, numbered the way a reader counts. */
  paragraph: number;
  closeHref: string;
}) {
  return (
    <aside className="cite-drawer" aria-label={`Citation ${index}`}>
      <div className="rule-b flex items-baseline gap-3 pb-5">
        <h2 className="head-sm m-0">Citation {index}</h2>
        <span className="meta">Paragraph {paragraph}</span>
        <Link href={closeHref} scroll={false} replace className="text-btn text-btn-bare plain ml-auto">
          Close
        </Link>
      </div>

      <div className="pt-5">
        <span className="meta meta-wrap block">
          {citation.work.title} · {citationLabel(citation)}
        </span>

        {citation.quote ? (
          <blockquote className="serif-md mt-4 mb-0 border-l-2 border-[color:var(--rule)] pl-4 italic">
            “{citation.quote}”
          </blockquote>
        ) : (
          // A citation may point at a chapter without quoting it. Say so
          // rather than leaving the drawer looking half-loaded.
          <p className="note-lg mt-4 mb-0">
            This citation points at the chapter without quoting it.
          </p>
        )}
      </div>
    </aside>
  );
}
