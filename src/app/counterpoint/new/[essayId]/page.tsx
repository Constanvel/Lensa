import { notFound, redirect } from "next/navigation";

import { SteelmanField } from "./steelman-field";
import { startCounterpoint } from "@/lib/actions";
import { blocksForEssay, draftCounterpointOn, essayById } from "@/lib/queries";
import { currentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Write a counterpoint · Lensa" };

export default async function CounterpointStepOne({
  params,
  searchParams,
}: {
  params: Promise<{ essayId: string }>;
  searchParams: Promise<{ short?: string; error?: string }>;
}) {
  const { essayId } = await params;
  const { short, error } = await searchParams;

  const profile = await currentProfile();
  if (!profile) redirect("/signin");

  const original = await essayById(essayId);
  if (!original || original.status !== "published") notFound();
  if (original.author.id === profile.id) redirect(`/e/${original.slug}`);

  const [existing, blocks] = await Promise.all([
    draftCounterpointOn(essayId, profile.id),
    blocksForEssay(original.id),
  ]);

  const paragraphs = blocks.filter((block) => block.kind === "paragraph");
  if (paragraphs.length === 0) notFound();

  const target = existing?.target_block_id ?? paragraphs[0].id;

  return (
    <main className="column">
      <div className="rule-b flex items-baseline gap-4 pb-8">
        <span className="meta text-[color:var(--ink)]">Step one of two</span>
        <span className="meta">The argument you are answering</span>
      </div>

      <div className="quiet-bar my-8 mb-10 py-1">
        <div className="meta mb-[10px]">
          The thesis you are answering · {original.author.display_name}
        </div>
        <p className="body-p m-0">{original.thesis}</p>
      </div>

      <form action={startCounterpoint.bind(null, essayId)}>
        {/* A counterpoint answers a paragraph. There is no option to answer the
            essay as a whole: that is the change the argument turns on. */}
        <div className="mb-8">
          <span className="label">The paragraph you are contesting</span>
          <div className="flex flex-wrap gap-2">
            {paragraphs.map((block, i) => (
              <label key={block.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="target_block_id"
                  value={block.id}
                  defaultChecked={block.id === target}
                  className="peer sr-only"
                />
                <span className="chip peer-checked:border-[color:var(--ink2)] peer-checked:bg-[color:var(--raised)] peer-checked:text-[color:var(--ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]">
                  Paragraph {i + 1}
                </span>
              </label>
            ))}
          </div>
        </div>

        {short && (
          <div className="accent-bar mb-6">
            <p className="note-lg m-0 text-[color:var(--ink2)]">
              Say more. Both answers need at least a sentence of real content — a summary the other writer
              would accept, and the strongest case for it.
            </p>
          </div>
        )}

        {error && (
          <div className="accent-bar mb-6">
            <p className="note-lg m-0 text-[color:var(--ink2)]">
              That paragraph is not part of the essay you are answering. Pick one above and try again.
            </p>
          </div>
        )}

        <SteelmanField claim={existing?.claim ?? ""} strongest={existing?.strongest ?? ""} />
      </form>

      <p className="note-lg rule-t mt-12 pt-6">
        The gate is two steps and cannot be skipped. Step two is the rebuttal itself, written in the ordinary
        editor with the same claim badges as any other essay.
      </p>
    </main>
  );
}
