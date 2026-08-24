import { notFound, redirect } from "next/navigation";

import { SteelmanField } from "./steelman-field";
import { startCounterpoint } from "@/lib/actions";
import { blocksForEssay, essayById } from "@/lib/queries";
import { currentProfile } from "@/lib/supabase/server";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata = { title: "Write a counterpoint · Lensa" };

export default async function CounterpointStepOne({
  params,
  searchParams,
}: {
  params: Promise<{ essayId: string }>;
  searchParams: Promise<{ short?: string }>;
}) {
  const { essayId } = await params;
  const { short } = await searchParams;

  const profile = await currentProfile();
  if (!profile) redirect("/signin");

  const original = await essayById(essayId);
  if (!original || original.status !== "published") notFound();
  if (original.author.id === profile.id) redirect(`/e/${original.slug}`);

  const supabase = await supabaseServer();
  const { data: existing } = await supabase
    .from("essays")
    .select("id, steelman, contests")
    .eq("author_id", profile.id)
    .eq("answers_essay_id", essayId)
    .eq("status", "draft")
    .maybeSingle();

  const blocks = await blocksForEssay(original.id);
  const paragraphs = blocks.filter((block) => block.kind === "paragraph");

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
        <div className="mb-8">
          <span className="label">What you are contesting</span>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="contests"
                value="thesis"
                defaultChecked={!existing?.contests || existing.contests === "thesis"}
                className="peer sr-only"
              />
              <span className="chip peer-checked:border-[color:var(--ink2)] peer-checked:bg-[color:var(--raised)] peer-checked:text-[color:var(--ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]">
                The thesis
              </span>
            </label>
            {paragraphs.map((_, i) => {
              const value = `paragraph ${i + 1}`;
              return (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="contests"
                    value={value}
                    defaultChecked={existing?.contests === value}
                    className="peer sr-only"
                  />
                  <span className="chip peer-checked:border-[color:var(--ink2)] peer-checked:bg-[color:var(--raised)] peer-checked:text-[color:var(--ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]">
                    Paragraph {i + 1}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {short && (
          <div className="accent-bar mb-6">
            <p className="note-lg m-0 text-[color:var(--ink2)]">
              Say more. A summary the other writer would accept takes at least a sentence of real content.
            </p>
          </div>
        )}

        <SteelmanField defaultValue={existing?.steelman ?? ""} />
      </form>

      <p className="note-lg rule-t mt-12 pt-6">
        The gate is two steps and cannot be skipped. Step two is the rebuttal itself, written in the ordinary
        editor with the same claim badges as any other essay.
      </p>
    </main>
  );
}
