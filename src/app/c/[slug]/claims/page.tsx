import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/ui";
import { characterBySlug, claimsForCharacter } from "@/lib/queries";

export default async function ClaimLedgerPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; claim?: string }>;
}) {
  const { slug } = await params;
  const { sort: rawSort, claim: filter } = await searchParams;
  const sort = rawSort === "supported" ? "supported" : "contested";

  const character = await characterBySlug(slug);
  if (!character) notFound();

  const claims = await claimsForCharacter(character.id, sort);
  const contested = claims.filter((claim) => claim.contesting > 0);
  const visible = filter ? claims.filter((claim) => claim.id === filter) : claims;

  const base = `/c/${slug}/claims`;
  const href = (next: Record<string, string | undefined>) => {
    const query = new URLSearchParams();
    if ((next.sort ?? sort) !== "contested") query.set("sort", next.sort ?? sort);
    const claim = "claim" in next ? next.claim : filter;
    if (claim) query.set("claim", claim);
    const qs = query.toString();
    return qs ? `${base}?${qs}` : base;
  };

  return (
    <main className="page">
      <div className="measure pb-12">
        <div className="meta mb-4">Claim ledger</div>
        <h1 className="display mb-5">{character.name}</h1>
        <p className="lead m-0">
          Every Textual claim written about this character, with the source it rests on and the essays that
          support or contest it. Interpretive and Speculative claims are not listed here: a ledger is only
          useful if its entries can be checked.
        </p>
      </div>

      {claims.length === 0 ? (
        <div className="rule-t pt-12">
          <EmptyState
            headline="No textual claims recorded."
            body="A claim enters the ledger when an essay marks a paragraph Textual and cites its source."
            action={{ label: "See how claims are marked", href: "/rules" }}
          />
        </div>
      ) : (
        <>
          {contested.length > 0 && (
            <section className="rule-t pt-8 pb-10">
              <div className="mb-7 flex flex-wrap items-baseline gap-x-5 gap-y-2">
                <h2 className="meta m-0">Contested claims · {contested.length}</h2>
                <span className="meta meta-wrap">Supporting essays in moss, contesting in oxblood</span>
                {filter && (
                  <Link href={href({ claim: undefined })} className="text-btn plain">
                    Clear filter
                  </Link>
                )}
              </div>

              <div className="max-w-[560px]">
                {contested.map((claim) => {
                  const total = claim.supporting + claim.contesting || 1;
                  const dimmed = filter && filter !== claim.id;
                  return (
                    <Link
                      key={claim.id}
                      href={href({ claim: filter === claim.id ? undefined : claim.id })}
                      aria-pressed={filter === claim.id}
                      className={`plain block w-full pb-5 text-left transition-opacity duration-100 ${
                        dimmed ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <span className="serif-sm mb-2 block">{claim.text}</span>
                      <span className="flex items-center gap-3">
                        <span className="flex h-2 flex-1">
                          <span
                            className="bg-[color:var(--moss)]"
                            style={{ width: `${(claim.supporting / total) * 100}%` }}
                          />
                          <span
                            className="bg-[color:var(--accent)]"
                            style={{ width: `${(claim.contesting / total) * 100}%` }}
                          />
                        </span>
                        <span className="meta w-[52px] flex-none text-right">
                          {claim.supporting} / {claim.contesting}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          <div className="flex flex-wrap items-baseline gap-x-6 pb-1">
            <span className="meta">{claims.length} claims · sort by</span>
            <Link href={href({ sort: "contested" })} className="filter plain" data-on={sort === "contested"}>
              Most contested
            </Link>
            <Link href={href({ sort: "supported" })} className="filter plain" data-on={sort === "supported"}>
              Most supported
            </Link>
          </div>

          <div className="flex flex-col">
            {visible.map((claim) => (
              <div key={claim.id} className={`rule-t py-5 ${claim.contesting ? "row-contested" : ""}`}>
                <p
                  className={`serif-md m-0 mb-[10px] max-w-[640px] [text-wrap:pretty] ${
                    claim.contesting ? "text-[color:var(--ink)]" : "text-[color:var(--ink2)]"
                  }`}
                >
                  {claim.text}
                </p>
                <div className="meta-row meta gap-x-[14px] gap-y-1">
                  <span>
                    {claim.work_title} · {claim.locator}
                  </span>
                  <span>{claim.supporting} supporting</span>
                  {claim.contesting ? (
                    <span className="meta-accent">{claim.contesting} contesting</span>
                  ) : (
                    <span>No contests</span>
                  )}
                </div>
              </div>
            ))}
            <div className="rule-t" />
          </div>
        </>
      )}
    </main>
  );
}
