import { redirect } from "next/navigation";

import { LENSES, LENS_KEYS, MAX_LENSES_AT_ONBOARDING } from "@/lib/lenses";
import {
  chooseWorks,
  finishOnboarding,
  saveOnboardingPositions,
  skipOnboarding,
} from "@/lib/actions";
import { readingProgress, workList } from "@/lib/queries";
import { currentProfile } from "@/lib/supabase/server";

export const metadata = { title: "Welcome · Lensa" };

const STEP_LABEL = ["One of three", "Two of three", "Three of three"];

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const profile = await currentProfile();
  if (!profile) redirect("/signin");

  const { step: rawStep } = await searchParams;
  const step = rawStep === "2" ? 2 : rawStep === "3" ? 3 : 1;

  const [works, progress] = await Promise.all([workList(), readingProgress(profile.id)]);

  return (
    <main className="mx-auto max-w-[680px] px-6 pt-12 pb-24">
      <div className="flex items-baseline gap-4 pb-10">
        {/* Progress as small caps only. No bar, no dots. */}
        <span className="meta text-[color:var(--ink)]">{STEP_LABEL[step - 1]}</span>
        <form action={skipOnboarding} className="ml-auto">
          <button type="submit" className="text-btn text-btn-bare">
            Skip setup
          </button>
        </form>
      </div>

      {step === 1 && (
        <form action={chooseWorks}>
          <h1 className="subhead mb-3">What have you read?</h1>
          <p className="serif-md m-0 mb-8 text-[color:var(--ink2)] [text-wrap:pretty]">
            Essays are written against specific works. Picking a few keeps your feed to arguments you can
            judge.
          </p>

          <div className="flex flex-wrap gap-2 pb-8">
            {works.map((work) => (
              <label key={work.id} className="cursor-pointer">
                <input type="checkbox" name="work" value={work.id} className="peer sr-only" />
                <span className="chip peer-checked:border-[color:var(--ink2)] peer-checked:bg-[color:var(--raised)] peer-checked:text-[color:var(--ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]">
                  {work.title}
                </span>
              </label>
            ))}
            {works.length === 0 && (
              <p className="note-lg m-0">No works on Lensa yet. You can skip this and add one later.</p>
            )}
          </div>

          <div className="rule-t flex items-center gap-4 pt-6">
            <span className="meta flex-1 overflow-hidden text-ellipsis">
              Pick as many as you like
            </span>
            <button type="submit" className="btn btn-strong">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 2 && (
        <form action={saveOnboardingPositions}>
          <h1 className="subhead mb-3">How far in are you?</h1>
          <p className="serif-md m-0 mb-8 text-[color:var(--ink2)] [text-wrap:pretty]">
            Paragraphs past your position stay blurred, labelled with the chapters they cover. You can change
            this any time from the rail.
          </p>

          {progress.length === 0 ? (
            <p className="note-lg rule-t rule-b py-6">
              Nothing picked. You can set a position later from Settings.
            </p>
          ) : (
            progress.map(({ work, position }, i) => (
              <div
                key={work.id}
                className={`rule-t flex items-baseline gap-3 py-4 ${
                  i === progress.length - 1 ? "rule-b" : ""
                }`}
              >
                <span className="serif-md flex-1">{work.title}</span>
                <input
                  name={`position:${work.id}`}
                  defaultValue={position}
                  inputMode="numeric"
                  className="field field-num"
                  aria-label={`Position in ${work.title}`}
                />
                <span className="meta">
                  of {work.unit_count ?? "—"} {work.unit_label}
                </span>
              </div>
            ))
          )}

          <div className="flex items-center gap-4 pt-6">
            <a href="/welcome?step=1" className="text-btn text-btn-bare plain">
              Back
            </a>
            <button type="submit" className="btn btn-strong ml-auto">
              Continue
            </button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form action={finishOnboarding}>
          <h1 className="subhead mb-3">Which lenses interest you?</h1>
          <p className="serif-md m-0 mb-8 text-[color:var(--ink2)] [text-wrap:pretty]">
            A lens is the instrument an essay reads with. Pick up to {MAX_LENSES_AT_ONBOARDING}; you are not
            committing to writing in them.
          </p>

          {LENS_KEYS.map((key) => (
            <label key={key} className="rule-t flex cursor-pointer items-start gap-5 py-5">
              <input
                type="checkbox"
                name="lens"
                value={key}
                defaultChecked={(profile.lenses ?? []).includes(key)}
                className="peer sr-only"
              />
              <span className="meta w-16 flex-none pt-[6px] peer-checked:text-[color:var(--accent)]">
                {LENSES[key].name}
              </span>
              <span className="serif-md flex-1 text-[color:var(--ink2)]">{LENSES[key].long}</span>
            </label>
          ))}

          <div className="rule-t flex items-center gap-4 pt-6">
            <a href="/welcome?step=2" className="text-btn text-btn-bare plain">
              Back
            </a>
            <button type="submit" className="btn btn-accent ml-auto">
              Start reading
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
