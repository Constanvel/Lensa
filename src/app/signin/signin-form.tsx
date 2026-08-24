"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { sendMagicLink, type AuthFormState } from "@/lib/actions";
import { supabaseBrowser } from "@/lib/supabase/client";

const EMAIL = /^[^@\s]+@[^@\s.]+\.[^@\s]+$/;

export function SignInForm({ mode, expired }: { mode: "signin" | "signup"; expired: boolean }) {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(sendMagicLink, {
    state: expired ? "form" : "form",
    email: "",
    error: null,
  });

  const [email, setEmail] = useState(state.email);
  const verdict = email.length === 0 ? "" : EMAIL.test(email) ? "accepted" : "rejected";
  const ok = verdict === "accepted";

  const message =
    state.error ??
    (email.length === 0
      ? "No password. The link works once and expires in fifteen minutes."
      : ok
        ? "Recognised address — a link can be sent here"
        : "That address is missing an @");

  if (state.state === "sent") {
    return (
      <div>
        <h1 className="subhead mb-4">Check your email</h1>
        <p className="serif-md m-0 mb-2 text-[color:var(--ink2)] [text-wrap:pretty]">
          A sign-in link is on its way to {state.email}. It works once and expires in fifteen minutes.
        </p>
        <p className="note-lg rule-t mt-6 mb-0 pt-6">
          You can close this tab. Opening the link on any device signs you in there.
        </p>
        <form action={formAction} className="mt-6 flex flex-wrap gap-5">
          <input type="hidden" name="email" value={state.email} />
          <button type="submit" className="text-btn text-btn-accent" disabled={pending}>
            Send it again
          </button>
          <Link href="/signin" className="text-btn text-btn-bare plain">
            Use a different address
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="subhead mb-3">
        {expired ? "That link has expired" : mode === "signup" ? "Make an account" : "Sign in to Lensa"}
      </h1>
      <p className="serif-md m-0 mb-10 text-[color:var(--ink2)] [text-wrap:pretty]">
        {expired
          ? "Sign-in links last fifteen minutes and work once. Nothing is wrong with your account."
          : "Lensa is where readers write analytical essays about fictional characters, and argue with each other’s readings in public."}
      </p>

      <form action={formAction}>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="field field-ui"
          data-verdict={state.error ? "rejected" : verdict || undefined}
        />
        <div className="verdict" data-verdict={state.error ? "rejected" : verdict || undefined}>
          {message}
        </div>
        {/* Unfilled until the address parses. */}
        <button
          type="submit"
          className={`btn mt-1 w-full ${ok ? "btn-accent" : ""}`}
          aria-disabled={!ok || pending}
          disabled={!ok || pending}
        >
          {pending ? "Sending" : expired ? "Send a new link" : "Email me a sign-in link"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-4">
        <span className="h-px flex-1 bg-[color:var(--rule)]" />
        <span className="meta">or</span>
        <span className="h-px flex-1 bg-[color:var(--rule)]" />
      </div>

      <button
        type="button"
        className="btn w-full"
        onClick={() =>
          supabaseBrowser().auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth/callback` },
          })
        }
      >
        Continue with Google
      </button>

      <div className="rule-t mt-10 flex flex-wrap items-center gap-2 pt-6">
        <span className="note">
          {mode === "signup" ? "Already have an account?" : "No account yet?"}
        </span>
        <Link
          href={mode === "signup" ? "/signin" : "/signin?mode=signup"}
          className="text-btn text-btn-accent plain"
        >
          {mode === "signup" ? "Sign in" : "Make one"}
        </Link>
      </div>
    </div>
  );
}
