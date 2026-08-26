"use client";

import { useShell } from "./app-shell";
import { Icon } from "./icons";
import { CLAIM_KINDS, CLAIM_LABEL, type ClaimKind } from "@/lib/types";

const TONE: Record<ClaimKind, string> = {
  textual: "meta-moss",
  interpretive: "meta-ochre",
  speculative: "meta-violet",
};

/**
 * Inside the reader the bar collapses: the thesis on one line, the three claim
 * counts at the right. The counts follow what is actually badged on the page,
 * so an unsourced Textual claim is tallied where it is shown — Interpretive.
 */
export function ReaderTopBar({
  thesis,
  counts,
}: {
  thesis: string;
  counts: Record<ClaimKind, number>;
}) {
  const { openDrawer } = useShell();

  return (
    <div className="topbar">
      <button type="button" aria-label="Open navigation" onClick={openDrawer} className="menu-btn">
        <Icon.menu />
      </button>

      <p className="reader-thesis" title={thesis}>
        {thesis}
      </p>

      <div className="reader-counts">
        {CLAIM_KINDS.map((kind) => (
          <span key={kind} className={`meta ${TONE[kind]}`}>
            {counts[kind]}
            <span className="hidden sm:inline"> {CLAIM_LABEL[kind]}</span>
            <span className="sm:hidden"> {CLAIM_LABEL[kind].slice(0, 1)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
