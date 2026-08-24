"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { createCharacter, type CharacterFormState } from "@/lib/actions";
import { MEDIUM_LABEL, type Medium } from "@/lib/types";

const DESCRIPTION_MAX = 220;

export function CharacterForm({ initialName, works }: { initialName: string; works: string[] }) {
  const [state, formAction, pending] = useActionState<CharacterFormState, FormData>(createCharacter, {
    error: null,
    values: { name: initialName, work: "" },
  });

  const [name, setName] = useState(initialName);
  const [work, setWork] = useState("");
  const [description, setDescription] = useState("");

  // ponytail: name uniqueness is checked on submit, not per keystroke — one
  // round trip instead of a debounced lookup. Add live checking if the
  // duplicate rate justifies it.
  const nameVerdict = name.trim().length < 2 ? "rejected" : state.error ? "rejected" : "accepted";
  const nameMessage =
    name.trim().length < 2
      ? "A name is required"
      : (state.error ?? "Available once submitted — no character under this name yet");

  const matches = work.trim()
    ? works.filter((title) => title.toLowerCase().includes(work.trim().toLowerCase())).slice(0, 3)
    : [];

  return (
    <form action={formAction}>
      <div className="pb-7">
        <label className="label" htmlFor="name">
          Character name
        </label>
        <input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="field field-lg"
          data-verdict={name.length === 0 ? undefined : nameVerdict}
        />
        {!state.existingSlug && (
          <div className="verdict" data-verdict={name.length === 0 ? undefined : nameVerdict}>
            {nameMessage}
          </div>
        )}

        {state.existingSlug && (
          <div className="accent-bar mt-4">
            <div className="meta meta-accent mb-[6px]">A character with this name already exists</div>
            <p className="note-lg mb-2 text-[color:var(--ink2)]">
              If this is the same character, write on the existing page instead of making a second one.
            </p>
            <Link href={`/c/${state.existingSlug}`} className="text-btn text-btn-accent plain">
              Open that page
            </Link>
          </div>
        )}
      </div>

      <div className="pb-7">
        <label className="label" htmlFor="work">
          Source work
        </label>
        <input
          id="work"
          name="work"
          value={work}
          onChange={(event) => setWork(event.target.value)}
          className="field field-lg"
        />
        {matches.length > 0 && (
          <div className="rule-b">
            {matches.map((title) => (
              <button
                key={title}
                type="button"
                onClick={() => setWork(title)}
                className="rule-b flex w-full items-baseline gap-3 border-0 bg-transparent py-3 text-left last:border-b-0"
              >
                <span className="serif-sm flex-1">{title}</span>
                <span className="meta">Existing work</span>
              </button>
            ))}
          </div>
        )}
        <p className="note mt-[10px] mb-0">
          Matched against works already on Lensa. Adding a new work needs a title and a medium.
        </p>
      </div>

      <div className="pb-7">
        <span className="label">Medium</span>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(MEDIUM_LABEL) as Medium[]).map((value, i) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="medium"
                value={value}
                defaultChecked={i === 0}
                className="peer sr-only"
              />
              <span className="chip peer-checked:border-[color:var(--ink2)] peer-checked:bg-[color:var(--raised)] peer-checked:text-[color:var(--ink)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[color:var(--focus)]">
                {MEDIUM_LABEL[value]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="pb-10">
        <div className="mb-2 flex items-baseline justify-between gap-4">
          <label className="label mb-0" htmlFor="description">
            Description · two sentences, neutral
          </label>
          <span className="meta">{DESCRIPTION_MAX - description.length} characters left</span>
        </div>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={description}
          maxLength={DESCRIPTION_MAX}
          onChange={(event) => setDescription(event.target.value)}
          className="field"
        />
        <p className="note mt-[10px] mb-0">
          A third sentence is refused. Judgements belong in essays, where they can be contested.
        </p>
      </div>

      <div className="rule-t flex items-center gap-4 pt-6">
        <button type="submit" className="btn btn-accent" disabled={pending}>
          {pending ? "Creating" : "Create page"}
        </button>
        <Link href="/characters" className="text-btn text-btn-bare plain">
          Cancel
        </Link>
      </div>
    </form>
  );
}
