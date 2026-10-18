import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { lensName } from "@/lib/lenses";
import { MEDIUM_LABEL, type Medium } from "@/lib/types";
import { search } from "@/lib/queries";

export const metadata = { title: "Search · Lensa" };

/**
 * The field is a plain GET form, so search works with JavaScript off and every
 * result page is a URL. `autoFocus` is the focused state: arriving at /search
 * with nothing typed puts the caret in the field with the --focus ring on it.
 */
function SearchField({ term, autoFocus = false }: { term: string; autoFocus?: boolean }) {
  return (
    <form action="/search" method="get" role="search" className="pb-12">
      <label className="label" htmlFor="q">
        Search
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={term}
        autoFocus={autoFocus}
        placeholder="Characters, works, essays, writers"
        className="search w-full max-w-[560px]"
      />
    </form>
  );
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const term = (q ?? "").trim();

  if (!term) {
    return (
      <main className="page">
        <SearchField term="" autoFocus />
        <p className="lead measure m-0">
          Essay results lead with the thesis, so scanning results means scanning arguments.
        </p>
      </main>
    );
  }

  const { characters, works, essays, writers } = await search(term);
  const total = characters.length + works.length + essays.length + writers.length;

  if (total === 0) {
    return (
      <main className="page">
        <SearchField term={term} />
        <div className="rule-t pt-14">
          <EmptyState
            headline={`Nothing matches “${term}”.`}
            body="No character, work, essay, or writer under that name. If the character exists and Lensa does not have them yet, you can be the one who adds them."
            action={{ label: "Create this character page", href: `/characters/new?name=${encodeURIComponent(term)}` }}
          />
        </div>
      </main>
    );
  }

  // Two characters can share a name: the source work disambiguates, in oxblood.
  const nameCounts = new Map<string, number>();
  for (const character of characters) {
    nameCounts.set(character.name, (nameCounts.get(character.name) ?? 0) + 1);
  }
  const ambiguous = [...nameCounts.values()].some((n) => n > 1);

  return (
    <main className="page">
      <SearchField term={term} />
      <div className="meta rule-t pt-6 pb-12">
        {total} result{total === 1 ? "" : "s"} for “{term}”
      </div>

      {characters.length > 0 && (
        <section className="pb-16">
          <h2 className="meta mb-5">Characters</h2>
          {characters.map((character, i) => {
            const shared = (nameCounts.get(character.name) ?? 0) > 1;
            return (
              <Link
                key={character.id}
                href={`/c/${character.slug}`}
                className={`plain row-hover flex w-full items-center gap-5 border-0 border-t border-[color:var(--rule)] py-4 ${
                  i === characters.length - 1 ? "border-b" : ""
                }`}
              >
                <span className="avatar h-12 w-12" />
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-[19px] leading-[1.4] text-[color:var(--ink)]">
                    {character.name}
                  </span>
                  <span className={`meta mt-1 block ${shared ? "meta-accent" : ""}`}>
                    {character.work.title}
                  </span>
                </span>
                <span className="meta flex-none">
                  {(character.essays ?? []).filter((e) => e.status === "published").length} essays
                </span>
              </Link>
            );
          })}
          {ambiguous && (
            <p className="note mt-[14px] mb-0">
              More than one character shares this name. The source work is marked in oxblood on each.
            </p>
          )}
        </section>
      )}

      {works.length > 0 && (
        <section className="pb-16">
          <h2 className="meta mb-5">Works</h2>
          {works.map((work, i) => (
            <Link
              key={work.id}
              href={`/w/${work.slug}`}
              className={`plain row-hover flex flex-wrap items-baseline gap-4 border-0 border-t border-[color:var(--rule)] py-[18px] ${
                i === works.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="flex-1 font-serif text-[19px] leading-[1.4] text-[color:var(--ink)]">
                {work.title}
              </span>
              <span className="meta">
                {MEDIUM_LABEL[work.medium as Medium]} · {(work.characters ?? []).length} characters
              </span>
            </Link>
          ))}
        </section>
      )}

      {essays.length > 0 && (
        <section className="pb-16">
          <h2 className="meta mb-5">Essays</h2>
          {essays.map((essay, i) => (
            <article
              key={essay.id}
              className={`border-t border-[color:var(--rule)] ${i === essays.length - 1 ? "border-b" : ""}`}
            >
              <Link href={`/e/${essay.slug}`} className="plain block py-6">
                <p className="body-p mb-3 max-w-[660px]">{essay.thesis}</p>
                <div className="meta-row meta">
                  <span className="meta-strong">{essay.title}</span>
                  <span>{essay.author.display_name}</span>
                  {(essay.lenses ?? []).map((lens) => (
                    <span key={lens}>{lensName(lens)}</span>
                  ))}
                  {essay.reading_minutes ? <span>{essay.reading_minutes} min</span> : null}
                </div>
              </Link>
            </article>
          ))}
        </section>
      )}

      {writers.length > 0 && (
        <section>
          <h2 className="meta mb-5">Writers</h2>
          {writers.map((writer, i) => (
            <Link
              key={writer.id}
              href={`/u/${writer.handle}`}
              className={`plain row-hover flex flex-wrap items-baseline gap-4 border-0 border-t border-[color:var(--rule)] py-[18px] ${
                i === writers.length - 1 ? "border-b" : ""
              }`}
            >
              <span className="flex-1 font-serif text-[19px] leading-[1.4] text-[color:var(--ink)]">
                {writer.display_name}
              </span>
              <span className="meta">@{writer.handle}</span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
