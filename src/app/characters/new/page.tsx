import { redirect } from "next/navigation";

import { CharacterForm } from "./character-form";
import { workList } from "@/lib/queries";
import { currentUser } from "@/lib/supabase/server";

export const metadata = { title: "Add a character · Lensa" };

export default async function NewCharacterPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/signin");

  const { name } = await searchParams;
  const works = await workList();

  return (
    <main className="mx-auto max-w-[680px] px-6 pt-12 pb-24">
      <h1 className="title mb-3">Add a character</h1>
      <p className="serif-md m-0 mb-10 text-[color:var(--ink2)] [text-wrap:pretty]">
        A character page is a container for arguments, not a wiki entry. Keep the description neutral:
        everything contestable belongs in an essay.
      </p>
      <CharacterForm initialName={name ?? ""} works={works.map((work) => work.title)} />
    </main>
  );
}
