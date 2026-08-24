import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/ui";
import { markSteelman } from "@/lib/actions";
import { counterpointsReceived, essaysByAuthor, steelmenAwaiting } from "@/lib/queries";
import { currentProfile } from "@/lib/supabase/server";

export const metadata = { title: "My work · Lensa" };

function when(value: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "long" });
}

export default async function MyWorkPage() {
  const profile = await currentProfile();
  if (!profile) redirect("/signin");

  const [drafts, published, received, awaiting] = await Promise.all([
    essaysByAuthor(profile.id, "draft"),
    essaysByAuthor(profile.id, "published"),
    counterpointsReceived(profile.id),
    steelmenAwaiting(profile.id),
  ]);

  const marked = received.filter((essay) => !awaiting.some((a) => a.id === essay.id));

  return (
    <main className="page">
      <div className="measure pb-12">
        <h1 className="title mb-4">My work</h1>
        <p className="serif-md m-0 text-[color:var(--ink2)] [text-wrap:pretty]">
          Everything you have written, and everything written against it. Nothing here notifies you; it waits
          until you come looking.
        </p>
      </div>

      <section className="pb-16">
        <div className="mb-5 flex items-baseline gap-4">
          <h2 className="meta m-0">Drafts</h2>
          <span className="meta">{drafts.length}</span>
          <Link href="/write" className="btn btn-caps plain ml-auto">
            Start an essay
          </Link>
        </div>

        {drafts.length === 0 ? (
          <div className="rule-t pt-8">
            <EmptyState
              headline="No drafts saved."
              body="A draft is created the moment you pick a character, and saved as you write."
              action={{ label: "Start an essay", href: "/write" }}
            />
          </div>
        ) : (
          drafts.map((draft, i) => (
            <article
              key={draft.id}
              className={`rule-t ${i === drafts.length - 1 ? "rule-b" : ""}`}
            >
              <Link href={`/write/${draft.id}`} className="plain block py-5">
                <p
                  className={`serif-md m-0 mb-[10px] max-w-[640px] [text-wrap:pretty] ${
                    draft.thesis ? "" : "text-[color:var(--muted)]"
                  }`}
                >
                  {draft.thesis || "No thesis yet"}
                </p>
                <div className="meta-row meta gap-y-1">
                  <span>
                    {draft.character.name} · {draft.character.work.title}
                  </span>
                  <span>Edited {when(draft.updated_at)}</span>
                  {draft.answers_essay_id && <span className="meta-accent">Counterpoint</span>}
                </div>
              </Link>
            </article>
          ))
        )}
      </section>

      <section className="pb-16">
        <div className="mb-5 flex items-baseline gap-4">
          <h2 className="meta m-0">Published</h2>
          <span className="meta">{published.length}</span>
          <Link href={`/u/${profile.handle}`} className="text-btn text-btn-bare plain ml-auto">
            See public profile
          </Link>
        </div>

        {published.length === 0 ? (
          <div className="rule-t pt-8">
            <EmptyState
              headline="You have not published yet."
              body="Drafts stay private. Publishing puts an essay on your profile and opens it to counterpoints."
              action={{ label: "Open the writing rules", href: "/rules" }}
            />
          </div>
        ) : (
          published.map((essay, i) => (
            <article key={essay.id} className={`rule-t ${i === published.length - 1 ? "rule-b" : ""}`}>
              <Link href={`/e/${essay.slug}`} className="plain block py-5">
                <p className="serif-md m-0 mb-[10px] max-w-[640px] [text-wrap:pretty]">{essay.thesis}</p>
                <div className="meta-row meta gap-y-1">
                  <span className="meta-strong">{essay.title}</span>
                  <span>{when(essay.published_at)}</span>
                </div>
              </Link>
            </article>
          ))
        )}
      </section>

      <section>
        <div className="mb-5 flex items-baseline gap-4">
          <h2 className="meta m-0">Responses</h2>
          {/* A passive list. No dots, no counts styled as alerts. */}
          <span className="meta">
            {awaiting.length === 0
              ? "Nothing awaiting you"
              : `${awaiting.length} awaiting your judgement`}
          </span>
        </div>

        {awaiting.map((counterpoint) => (
          <div key={counterpoint.id} className="rule-t py-6">
            <div className="meta meta-accent mb-[10px]">Steelman awaiting your mark</div>
            <p className="serif-md m-0 mb-2 max-w-[640px] [text-wrap:pretty]">
              {counterpoint.author.display_name} summarised your argument in order to answer it. You decide
              whether the summary is fair.
            </p>
            <p className="note-lg quiet-bar m-0 mb-4 max-w-[640px] text-[color:var(--ink2)]">
              {counterpoint.steelman}
            </p>
            <div className="flex flex-wrap gap-5">
              <form action={markSteelman.bind(null, counterpoint.id, "fair")}>
                <button type="submit" className="text-btn text-btn-strong">
                  Mark fair
                </button>
              </form>
              <form action={markSteelman.bind(null, counterpoint.id, "disputed")}>
                <button type="submit" className="text-btn text-btn-accent">
                  Dispute it
                </button>
              </form>
              <Link href={`/e/${counterpoint.slug}`} className="text-btn text-btn-bare plain">
                Read the counterpoint
              </Link>
            </div>
          </div>
        ))}

        {marked.map((counterpoint, i) => (
          <article key={counterpoint.id} className={`rule-t ${i === marked.length - 1 ? "rule-b" : ""}`}>
            <Link href={`/e/${counterpoint.slug}`} className="plain block py-5">
              <p className="serif-md m-0 mb-[10px] max-w-[640px] [text-wrap:pretty]">
                {counterpoint.thesis}
              </p>
              <div className="meta-row meta gap-y-1">
                <span className="meta-strong">
                  {counterpoint.title} · {counterpoint.author.display_name}
                </span>
                {counterpoint.steelman_mark === "fair" && <span className="meta-moss">Marked fair</span>}
                {counterpoint.steelman_mark === "disputed" && (
                  <span className="meta-accent">Disputed</span>
                )}
              </div>
            </Link>
          </article>
        ))}

        {received.length === 0 && (
          <div className="rule-t pt-8">
            <EmptyState
              headline="Nothing written against you yet."
              body="A counterpoint arrives with its author's summary of your argument, and you decide whether that summary is fair."
              action={{ label: "How the steelman gate works", href: "/rules" }}
            />
          </div>
        )}
      </section>
    </main>
  );
}
