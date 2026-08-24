import { redirect } from "next/navigation";

import { SignInForm } from "./signin-form";
import { currentUser } from "@/lib/supabase/server";

export const metadata = { title: "Sign in · Lensa" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; expired?: string }>;
}) {
  const user = await currentUser();
  if (user) redirect("/me");

  const { mode, expired } = await searchParams;

  return (
    <main className="column-narrow">
      <div className="pb-10 font-serif text-2xl leading-none tracking-[-0.01em] text-[color:var(--ink)]">
        Lensa
      </div>
      <SignInForm mode={mode === "signup" ? "signup" : "signin"} expired={expired === "1"} />
    </main>
  );
}
