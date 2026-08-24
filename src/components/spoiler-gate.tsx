"use client";

import { useState, type ReactNode } from "react";

/**
 * Blur is a filter, so the paragraph is already laid out underneath and
 * revealing never moves the scroll. The gate names the chapters it covers
 * before you decide to see it.
 */
export function SpoilerGate({ covers, children }: { covers: string; children: ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative">
      <div className={revealed ? undefined : "gated"} aria-hidden={!revealed}>
        {children}
      </div>
      {!revealed && (
        <div className="gate">
          <span className="meta">{covers}</span>
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="btn btn-caps bg-[color:var(--raised)]"
          >
            Reveal this paragraph
          </button>
        </div>
      )}
    </div>
  );
}
