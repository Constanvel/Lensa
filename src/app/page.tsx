import Link from "next/link";

import { EmptyState, EssayCard } from "@/components/ui";
import { LENSES, LENS_KEYS, isLens } from "@/lib/lenses";
import { feedEssays, publishedCount } from "@/lib/queries";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ lens?: string }>;
}) {
  const { lens: raw } = await searchParams;
  const lens = raw && isLens(raw) ? raw : undefined;

  const [essays, total] = await Promise.all([feedEssays(lens), publishedCount()]);

  return (
    <main className="page">
      <div className="flex items-baseline justify-between gap-6 pb-6">
        <h1 className="subhead">Latest essays</h1>
        <span className="meta">{total.toLocaleString("en-GB")} published</span>
      </div>

      <div className="flex flex-wrap gap-x-5 pb-2">
        <Link href="/" className="filter plain" data-on={!lens}>
          All lenses
        </Link>
        {LENS_KEYS.map((key) => (
          <Link key={key} href={`/?lens=${key}`} className="filter plain" data-on={lens === key}>
            {LENSES[key].name}
          </Link>
        ))}
      </div>

      {essays.length === 0 ? (
        <div className="rule-t pt-14">
          <EmptyState
            headline={lens ? `No essays under ${LENSES[lens].name} yet.` : "Your feed is empty."}
            body={
              lens
                ? "The first essay in a lens sets the terms the others argue with."
                : "Follow a lens or a character and essays will collect here as they are published."
            }
            action={{ label: "Browse the six lenses", href: "/lenses" }}
          />
        </div>
      ) : (
        <>
          {essays.map((essay) => (
            <EssayCard key={essay.id} essay={essay} />
          ))}
          <div className="rule-t" />
        </>
      )}
    </main>
  );
}
