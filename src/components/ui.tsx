import Link from "next/link";
import type { ReactNode } from "react";

import { ClaimBadge } from "@/components/kit";
import { lensNames } from "@/lib/lenses";
import { SPOILER_LABEL, effectiveClaimKind, isUnsourced, type Block, type Essay } from "@/lib/types";

export { ClaimBadge };

export function BlockBadge({ block }: { block: Pick<Block, "claim_kind" | "citations"> }) {
  return <ClaimBadge kind={effectiveClaimKind(block)} demoted={isUnsourced(block)} />;
}

export function Meta({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`meta ${className}`}>{children}</span>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="meta m-0">{children}</h2>;
}

/**
 * One shape for every empty and every error: a Literata line, a muted Inter
 * line, one oxblood action. A missing ledger and a 500 read as one product.
 */
export function EmptyState({
  headline,
  body,
  action,
}: {
  headline: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="max-w-[560px]">
      <p className="head-sm m-0 mb-[10px] text-[color:var(--ink)] [text-wrap:pretty]">{headline}</p>
      <p className="note-lg m-0 mb-4">{body}</p>
      {action && (
        <Link href={action.href} className="text-btn text-btn-accent">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="meta mb-2">{label}</div>
      <div className="subhead text-[color:var(--ink)]">{value}</div>
    </div>
  );
}

export function essayMeta(essay: Essay) {
  const parts = [essay.character.work.title];
  if (essay.lenses?.length) parts.push(lensNames(essay.lenses));
  parts.push(
    essay.spoiler_level === "none" ? SPOILER_LABEL.none : `Spoilers · ${SPOILER_LABEL[essay.spoiler_level]}`,
  );
  if (essay.reading_minutes) parts.push(`${essay.reading_minutes} min`);
  return parts;
}

/** The feed row: thesis first, title second. Scanning results is scanning arguments. */
export function EssayCard({ essay, showCharacter = true }: { essay: Essay; showCharacter?: boolean }) {
  return (
    <article className="rule-t">
      <Link href={`/e/${essay.slug}`} className="plain block cursor-pointer px-0 pt-8 pb-7">
        <p className="body-p mb-[14px] max-w-[660px]">{essay.thesis}</p>
        <h2 className="eyebrow mb-[18px]">{essay.title}</h2>
        <div className="meta-row meta">
          {showCharacter && <span className="meta-strong">{essay.character.name}</span>}
          {essayMeta(essay).map((part) => (
            <span key={part}>{part}</span>
          ))}
          <span className="meta-strong ml-auto">{essay.author.display_name}</span>
        </div>
      </Link>
    </article>
  );
}

/** The tighter variant used on character, profile and search pages. */
export function EssayRow({ essay, parts }: { essay: Essay; parts: string[] }) {
  return (
    <article className="rule-t">
      <Link href={`/e/${essay.slug}`} className="plain block py-7">
        <p className="body-p mb-3 max-w-[660px]">{essay.thesis}</p>
        <div className="meta-row meta">
          <span className="meta-strong">{essay.title}</span>
          {parts.map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>
      </Link>
    </article>
  );
}
