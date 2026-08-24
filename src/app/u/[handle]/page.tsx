import { notFound } from "next/navigation";

import { EmptyState, EssayRow, Stat } from "@/components/ui";
import { lensName } from "@/lib/lenses";
import {
  authorLensTally,
  counterpointsReceived,
  essaysByAuthor,
  profileByHandle,
} from "@/lib/queries";

export default async function WriterPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const profile = await profileByHandle(handle);
  if (!profile) notFound();

  const [essays, received, tally] = await Promise.all([
    essaysByAuthor(profile.id, "published"),
    counterpointsReceived(profile.id),
    authorLensTally(profile.id),
  ]);

  const top = tally[0]?.[1] ?? 1;

  return (
    <main className="page">
      <div className="measure pb-12">
        <h1 className="display mb-5">{profile.display_name}</h1>
        {profile.bio && <p className="lead m-0">{profile.bio}</p>}
      </div>

      <div className="rule-t rule-b flex flex-wrap">
        <div className="flex-[0_0_200px] py-5 pr-6">
          <Stat label="Essays written" value={essays.length} />
        </div>
        <div className="flex-[0_0_240px] border-l border-[color:var(--rule)] px-6 py-5">
          <Stat label="Counterpoints received" value={received.length} />
        </div>
        <div className="min-w-0 flex-1 border-l border-[color:var(--rule)] py-5 pl-6">
          <div className="meta mb-[14px]">Lenses most used</div>
          {tally.length === 0 ? (
            <p className="note m-0">Nothing published yet.</p>
          ) : (
            <div className="grid max-w-[420px] grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-3">
              {tally.map(([lens, count], i) => (
                <div key={lens} className="contents">
                  <span className="text-[15px] leading-[1.3] text-[color:var(--ink)]">{lensName(lens)}</span>
                  <span
                    className="h-[3px]"
                    style={{
                      width: `${Math.round((count / top) * 100)}%`,
                      background: i === 0 ? "var(--ink)" : "var(--ink2)",
                    }}
                  />
                  <span className="meta">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pt-8">
        {essays.length === 0 ? (
          <EmptyState
            headline="Nothing published yet."
            body="Drafts stay private. Publishing puts an essay here and opens it to counterpoints."
            action={{ label: "Open the writing rules", href: "/rules" }}
          />
        ) : (
          <>
            {essays.map((essay) => (
              <EssayRow
                key={essay.id}
                essay={essay}
                parts={[
                  essay.character.name,
                  ...(essay.lenses ?? []).map(lensName),
                  essay.reading_minutes ? `${essay.reading_minutes} min` : "",
                ].filter(Boolean)}
              />
            ))}
            <div className="rule-t" />
          </>
        )}
      </div>
    </main>
  );
}
