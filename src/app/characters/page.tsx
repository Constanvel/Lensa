import Link from "next/link";

import { EmptyState } from "@/components/ui";
import { characterList } from "@/lib/queries";

export const metadata = { title: "Characters · Lensa" };

export default async function CharactersPage() {
  const characters = await characterList();

  return (
    <main className="page">
      <div className="measure pb-10">
        <h1 className="title mb-4">Characters</h1>
        <p className="lead m-0">
          A character page is a container for arguments, not a wiki entry. Anyone in a story can be given
          one.
        </p>
      </div>

      {characters.length === 0 ? (
        <div className="rule-t pt-12">
          <EmptyState
            headline="No characters yet."
            body="The first page created sets the terms the others argue with."
            action={{ label: "Add a character", href: "/characters/new" }}
          />
        </div>
      ) : (
        <div className="md:columns-2 md:gap-16">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/c/${character.slug}`}
              className="plain row row-hover flex items-baseline gap-4 break-inside-avoid px-2 py-[11px] -ml-2"
            >
              <span className="serif-md flex-1">{character.name}</span>
              <span className="meta">{character.work.title}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="rule-t flex items-center gap-4 pt-6">
        <Link href="/characters/new" className="btn plain">
          Add a character
        </Link>
        <span className="note">
          Matched against works already on Lensa. Adding a new work needs a title and a medium.
        </span>
      </div>
    </main>
  );
}
