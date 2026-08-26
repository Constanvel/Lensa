import Link from "next/link";
import { notFound } from "next/navigation";

import { LensChip } from "@/components/kit";
import { EmptyState, EssayRow, Stat } from "@/components/ui";
import { LENSES, LENS_KEYS, isLens, lensName } from "@/lib/lenses";
import { MEDIUM_LABEL } from "@/lib/types";
import { createDraft } from "@/lib/actions";
import { characterBySlug, characterStats, essaysForCharacter } from "@/lib/queries";
import { currentUser } from "@/lib/supabase/server";

export default async function CharacterPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lens?: string }>;
}) {
  const { slug } = await params;
  const { lens: raw } = await searchParams;
  const lens = raw && isLens(raw) ? raw : undefined;

  const character = await characterBySlug(slug);
  if (!character) notFound();

  const [essays, stats, user] = await Promise.all([
    essaysForCharacter(character.id, lens),
    characterStats(character.id),
    currentUser(),
  ]);

  const start = createDraft.bind(null, character.id);

  return (
    <main className="page">
      <div className="flex items-start gap-6 pb-12">
        <div className="avatar flex h-24 w-24 items-end justify-center pb-[6px]">
          <span className="text-[9px] leading-none font-medium tracking-[0.08em] text-[color:var(--muted)] uppercase">
            portrait
          </span>
        </div>
        <div>
          <h1 className="display mb-2">{character.name}</h1>
          <p className="m-0 font-serif text-2xl leading-[1.3] italic text-[color:var(--muted)]">
            <Link href={`/w/${character.work.slug}`} className="plain hover:text-[color:var(--ink)]">
              {character.work.title}
            </Link>
            {` · ${MEDIUM_LABEL[character.work.medium]}`}
          </p>
          {character.description && (
            <p className="serif-md mt-4 mb-0 max-w-[560px] text-[color:var(--ink2)] [text-wrap:pretty]">
              {character.description}
            </p>
          )}
        </div>
      </div>

      <div className="rule-t rule-b flex flex-wrap">
        <div className="flex-[0_0_200px] py-5 pr-6">
          <Stat label="Essays" value={stats.essayCount === 0 ? "None yet" : stats.essayCount} />
        </div>
        <div className="flex-[0_0_240px] border-l border-[color:var(--rule)] px-6 py-5">
          <Stat label="Most used lens" value={stats.topLens ? lensName(stats.topLens) : "—"} />
        </div>
        <div className="min-w-0 flex-1 border-l border-[color:var(--rule)] py-5 pl-6">
          <div className="meta mb-2">Most contested claim</div>
          {stats.mostContested ? (
            <>
              <p className="serif-md m-0 mb-[6px] max-w-[520px] text-[19px] leading-[1.5]">
                “{stats.mostContested.text}”
              </p>
              <div className="meta-row">
                <span className="meta">
                  {stats.mostContested.contesting} contesting · {stats.mostContested.supporting} supporting
                </span>
                <Link href={`/c/${character.slug}/claims`} className="text-btn text-btn-strong plain">
                  Open claim ledger
                </Link>
              </div>
            </>
          ) : (
            <p className="note-lg m-0">
              No textual claims recorded.{" "}
              <Link href={`/c/${character.slug}/claims`}>See the ledger</Link>
            </p>
          )}
        </div>
      </div>

      {stats.essayCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-8 pb-4">
          <LensChip href={`/c/${slug}`} selected={!lens}>
            All lenses
          </LensChip>
          {LENS_KEYS.map((key) => (
            <LensChip key={key} href={`/c/${slug}?lens=${key}`} selected={lens === key}>
              {LENSES[key].name}
            </LensChip>
          ))}
        </div>
      )}

      {essays.length > 0 ? (
        <>
          {essays.map((essay) => (
            <EssayRow
              key={essay.id}
              essay={essay}
              parts={[
                ...(essay.lenses ?? []).map(lensName),
                essay.reading_minutes ? `${essay.reading_minutes} min` : "",
                essay.author.display_name,
              ].filter(Boolean)}
            />
          ))}
          <div className="rule-t" />
        </>
      ) : lens ? (
        // The character has essays, just none under this lens. Saying nobody
        // has written on them would be false.
        <div className="rule-t max-w-[600px] pt-14">
          <EmptyState
            headline={`No essays on ${character.name} under ${LENSES[lens].name} yet.`}
            body="A lens is a method, not a category. The first essay to use one here sets the terms the rest argue with."
            action={{ label: "Show every lens", href: `/c/${slug}` }}
          />
        </div>
      ) : (
        <div className="max-w-[600px] pt-14">
          <p className="head-sm m-0 mb-3 [text-wrap:pretty]">
            Nobody has written on {character.name} yet.
          </p>
          <p className="note-lg m-0 mb-8">
            The first essay sets the terms the others argue with, so it tends to get read more than any that
            follow.
          </p>

          <div className="rule-t py-6">
            <div className="meta mb-4">What an essay here looks like</div>
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-5 gap-y-3">
              <span className="meta meta-strong">One thesis</span>
              <span className="serif-md text-[color:var(--ink2)]">
                A single arguable sentence. A second is refused.
              </span>
              <span className="meta meta-strong">One or two lenses</span>
              <span className="serif-md text-[color:var(--ink2)]">
                Declared up front, so disagreement stays locatable.
              </span>
              <span className="meta meta-strong">Marked claims</span>
              <span className="serif-md text-[color:var(--ink2)]">
                Every paragraph labelled Textual, Interpretive, or Speculative — Textual needs a citation.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="rule-t mt-8 pt-6">
        {user ? (
          <form action={start}>
            <button type="submit" className="btn btn-accent">
              {stats.essayCount === 0 ? "Write the first essay" : "Write on this character"}
            </button>
          </form>
        ) : (
          <Link href="/signin" className="btn btn-accent plain">
            Sign in to write
          </Link>
        )}
      </div>
    </main>
  );
}
