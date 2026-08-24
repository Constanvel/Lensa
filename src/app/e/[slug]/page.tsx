import Link from "next/link";
import { notFound } from "next/navigation";

import { EssayBody } from "@/components/essay-body";
import { ThesisBar } from "@/components/thesis-bar";
import { essayMeta } from "@/components/ui";
import {
  blocksForEssay,
  counterpointsFor,
  essayBySlug,
  readingProgress,
  revisionsFor,
} from "@/lib/queries";
import { currentProfile } from "@/lib/supabase/server";
import { lensNames } from "@/lib/lenses";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const essay = await essayBySlug(slug);
  return { title: essay?.title ? `${essay.title} · Lensa` : "Lensa" };
}

export default async function ReaderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const essay = await essayBySlug(slug);
  if (!essay || essay.status !== "published") notFound();

  const [blocks, counterpoints, revisions, profile] = await Promise.all([
    blocksForEssay(essay.id),
    counterpointsFor(essay.id),
    revisionsFor(essay.id),
    currentProfile(),
  ]);

  const progress = profile ? await readingProgress(profile.id) : [];
  const here = progress.find((p) => p.work.slug === essay.character.work.slug);

  const published = essay.published_at
    ? new Date(essay.published_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return (
    <main className="pb-24">
      <ThesisBar thesis={essay.thesis ?? ""} />

      <div className="mx-auto max-w-[824px] px-6 pt-10 pb-8 md:pt-16 md:pb-12">
        <div className="meta-row meta mb-6">
          <Link href={`/c/${essay.character.slug}`} className="text-btn text-btn-strong plain">
            {essay.character.name}
          </Link>
          {essayMeta(essay).map((part) => (
            <span key={part}>{part}</span>
          ))}
        </div>

        {essay.answers_essay_id && (
          <div className="quiet-bar mb-6">
            <div className="meta-row mb-[10px]">
              <span className="meta">The argument I am answering</span>
              {essay.steelman_mark === "fair" && <span className="meta meta-moss">Marked fair by author</span>}
              {essay.steelman_mark === "disputed" && (
                <span className="meta meta-accent">Disputed by author</span>
              )}
            </div>
            <p className="serif-md m-0 text-[color:var(--ink2)]">{essay.steelman}</p>
          </div>
        )}

        <p className="body-p ink-bar mb-5">{essay.thesis}</p>
        <h1 className="title mb-5">{essay.title}</h1>
        <div className="note">
          <Link href={`/u/${essay.author.handle}`} className="plain hover:text-[color:var(--ink)]">
            {essay.author.display_name}
          </Link>
          {published && ` · ${published}`}
          {counterpoints.length > 0 &&
            ` · ${counterpoints.length} counterpoint${counterpoints.length === 1 ? "" : "s"}`}
        </div>

        {revisions.length > 0 && (
          <details className="mt-2 max-w-[560px]">
            <summary className="text-btn list-none marker:content-none">
              {revisions[0].prompted_by
                ? `Revised after counterpoint by ${revisions[0].prompted_by.author.display_name}`
                : "Revised since publication"}
            </summary>
            <div className="mt-5 border border-[color:var(--rule)] p-5">
              <div className="meta rule-b pb-4">Revision history</div>
              <p className="note-lg mt-4 mb-5 text-[color:var(--ink2)]">
                Revisions are credited to the counterpoint that prompted them. Changed paragraphs are marked
                in the text with a moss rule.
              </p>
              {revisions.map((revision) => (
                <div key={revision.id} className="rule-t py-[14px]">
                  <div className="meta mb-[6px]">
                    {new Date(revision.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {revision.prompted_by
                      ? ` · after ${revision.prompted_by.author.display_name}`
                      : " · own revision"}
                  </div>
                  <p className="serif-md m-0">{revision.note}</p>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <EssayBody
        blocks={blocks}
        position={here?.position ?? null}
        unitLabel={here?.work.unit_label ?? "chapters"}
      />

      <div className="mx-auto mt-12 max-w-[824px] px-6 md:mt-16">
        <div className="rule-b flex flex-wrap items-center gap-x-5 gap-y-2 pb-6">
          <span className="meta">
            Counterpoints · {counterpoints.length}
          </span>
          <Link href={`/counterpoint/new/${essay.id}`} className="btn btn-caps plain ml-auto">
            Write a counterpoint
          </Link>
        </div>

        {counterpoints.map((counterpoint, i) => (
          <Link
            key={counterpoint.id}
            href={`/e/${counterpoint.slug}`}
            className="card card-link plain mt-4 block cursor-pointer"
            style={{ marginTop: i === 0 ? 24 : 16 }}
          >
            <div className="meta mb-4">Contests · {counterpoint.contests ?? "thesis"}</div>
            <p className="body-p mb-3">{counterpoint.thesis}</p>
            <h3 className="eyebrow mb-4">{counterpoint.title}</h3>
            <div className="meta-row meta">
              {counterpoint.lenses?.length ? <span>{lensNames(counterpoint.lenses)}</span> : null}
              {counterpoint.reading_minutes ? <span>{counterpoint.reading_minutes} min</span> : null}
              <span>{counterpoint.author.display_name}</span>
              {counterpoint.steelman_mark === "fair" && <span className="meta-moss">Marked fair</span>}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
