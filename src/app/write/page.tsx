import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui";
import { createDraft } from "@/lib/actions";
import { characterList, essaysByAuthor } from "@/lib/queries";
import { currentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Write an essay · Lensa" };

export default async function WritePage() {
  const profile = await currentProfile();
  if (!profile) redirect("/signin");

  const [characters, drafts] = await Promise.all([
    characterList(),
    essaysByAuthor(profile.id, "draft"),
  ]);

  return (
    <main className="mx-auto max-w-[680px] px-6 pt-12 pb-24">
      <h1 className="title mb-3">Write an essay</h1>
      <p className="serif-md m-0 mb-10 text-[color:var(--ink2)] [text-wrap:pretty]">
        An essay is written against one character. Pick the page it belongs on; the draft is created and
        saved from there.
      </p>

      {drafts.length > 0 && (
        <section className="pb-12">
          <h2 className="meta mb-4">Continue a draft</h2>
          {drafts.map((draft, i) => (
            <Link
              key={draft.id}
              href={`/write/${draft.id}`}
              className={`plain row row-hover flex flex-wrap items-baseline gap-4 px-2 -ml-2 ${
                i === drafts.length - 1 ? "row-last" : ""
              }`}
            >
              <span className="serif-md flex-1">{draft.thesis || draft.title || "No thesis yet"}</span>
              <span className="meta">{draft.character.name}</span>
            </Link>
          ))}
        </section>
      )}

      <section>
        <h2 className="meta mb-4">Start a new one</h2>
        {characters.length === 0 ? (
          <div className="rule-t pt-8">
            <EmptyState
              headline="No character pages yet."
              body="An essay needs a character page to sit on. Add one and the draft follows."
              action={{ label: "Add a character", href: "/characters/new" }}
            />
          </div>
        ) : (
          characters.map((character, i) => (
            <form
              key={character.id}
              action={createDraft.bind(null, character.id)}
              className={`row flex flex-wrap items-baseline gap-4 ${
                i === characters.length - 1 ? "row-last" : ""
              }`}
            >
              <span className="serif-md flex-1">{character.name}</span>
              <span className="meta">{character.work.title}</span>
              <button type="submit" className="text-btn text-btn-strong">
                Write
              </button>
            </form>
          ))
        )}
      </section>

      <div className="rule-t mt-8 pt-6">
        <Link href="/characters/new" className="btn plain">
          Add a character
        </Link>
      </div>
    </main>
  );
}
