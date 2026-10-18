import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui";
import { MEDIUM_LABEL } from "@/lib/types";
import { claimsForWork, rosterForWork, workBySlug } from "@/lib/queries";

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug } = await params;
  const { sort: rawSort } = await searchParams;
  const sort = rawSort === "az" ? "az" : "essays";

  const work = await workBySlug(slug);
  if (!work) notFound();

  const [roster, claims] = await Promise.all([rosterForWork(work.id, sort), claimsForWork(work.id)]);
  const essayCount = roster.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <main className="page">
      <div className="measure pb-10">
        <div className="meta pb-5">
          {MEDIUM_LABEL[work.medium]}
          {work.year ? ` · ${work.year}` : ""}
        </div>
        <h1 className="display mb-5">{work.title}</h1>
        {work.creator && <p className="serif-md mb-5 text-[color:var(--ink2)]">{work.creator}</p>}
        <div className="flex flex-wrap gap-6">
          <span className="meta">
            {work.unit_count ?? "—"} {work.unit_label}
          </span>
          <span className="meta">
            {roster.length} {roster.length === 1 ? "character" : "characters"}
          </span>
          <span className="meta">
            {essayCount} {essayCount === 1 ? "essay" : "essays"}
          </span>
        </div>
      </div>

      <div className="rule-t pt-8 pb-12">
        <div className="flex items-baseline gap-4 pb-4">
          <span className="meta">Characters</span>
          <span className="meta">{roster.length}</span>
          <span className="ml-auto" />
          {roster.length > 1 && (
            <>
              <Link href={`/w/${slug}`} className="filter plain" data-on={sort === "essays"}>
                By essays
              </Link>
              <Link href={`/w/${slug}?sort=az`} className="filter plain" data-on={sort === "az"}>
                A to Z
              </Link>
            </>
          )}
        </div>

        {roster.length === 0 ? (
          <EmptyState
            headline="No character pages here yet."
            body="Anyone in the story can be given one."
            action={{ label: "Add a character", href: "/characters/new" }}
          />
        ) : (
          <div className={roster.length >= 8 ? "md:columns-2 md:gap-16" : undefined}>
            {roster.map((entry) => (
              <Link
                key={entry.id}
                href={`/c/${entry.slug}`}
                className="plain row row-hover flex items-baseline gap-4 break-inside-avoid px-2 py-[11px] -ml-2"
              >
                <span className="serif-md flex-1">{entry.name}</span>
                <span className="meta">
                  {entry.count === 0 ? "No essays" : `${entry.count} ${entry.count === 1 ? "essay" : "essays"}`}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {claims.length > 0 && (
        <div className="measure rule-t pt-8">
          <div className="meta pb-5">Most contested claims in this work</div>
          {claims.map((claim) => (
            <Link
              key={claim.id}
              href={`/c/${claim.character.slug}/claims?claim=${claim.id}`}
              className="plain row row-hover flex flex-wrap items-baseline gap-x-4 gap-y-2 px-2 -ml-2"
            >
              <span className="serif-md flex-[1_1_320px] [text-wrap:pretty]">{claim.text}</span>
              <span className="meta">{claim.character.name}</span>
              <span className="meta meta-accent">{claim.contesting} contest</span>
            </Link>
          ))}
          <div className="rule-t" />
        </div>
      )}
    </main>
  );
}
