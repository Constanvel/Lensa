import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { CounterpointNotice, Editor } from "./editor";
import { blocksForEssay, essayById } from "@/lib/queries";
import { currentUser } from "@/lib/supabase/server";

export const metadata = { title: "Editor · Lensa" };

export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ blocked?: string }>;
}) {
  const { id } = await params;
  const { blocked } = await searchParams;

  const user = await currentUser();
  if (!user) redirect("/signin");

  const essay = await essayById(id);
  if (!essay) notFound();
  if (essay.author.id !== user.id) redirect("/me");

  const blocks = await blocksForEssay(essay.id);

  return (
    <>
      {blocked && (
        <div className="mx-auto max-w-[1080px] px-6 pt-6 md:px-12">
          <div className="accent-bar md:ml-36">
            <div className="meta meta-accent mb-1">Not published</div>
            <p className="note-lg m-0">
              {blocked === "steelman"
                ? "A counterpoint needs the steelman before it can publish. That gate is the one thing here that blocks."
                : "An essay needs a thesis and a title before it can publish."}
            </p>
          </div>
        </div>
      )}

      <CounterpointNotice essay={essay} />

      {/* Remounts when the block list changes, so local text never goes stale. */}
      <Editor key={blocks.map((block) => block.id).join(":")} essay={essay} blocks={blocks} />

      {essay.status === "published" && (
        <div className="mx-auto max-w-[1080px] px-6 pb-16 md:px-12">
          <div className="rule-t pt-6 md:ml-36">
            <Link href={`/e/${essay.slug}`} className="text-btn text-btn-bare plain">
              View the published essay
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
