"use client";

import { useState } from "react";

import { STEELMAN_MAX, STEELMAN_MIN, countSentences } from "@/lib/types";

/**
 * Two answers, not one. The first is what the paragraph claims; the second is
 * the strongest version of that claim. Splitting them is what stops the gate
 * being satisfied by a summary written to be easy to knock down.
 */
export function SteelmanField({ claim, strongest }: { claim: string; strongest: string }) {
  const [one, setOne] = useState(claim);
  const [two, setTwo] = useState(strongest);

  const ready = one.trim().length >= STEELMAN_MIN && two.trim().length >= STEELMAN_MIN;

  return (
    <>
      <Answer
        id="claim"
        label="What does the paragraph claim? · required"
        value={one}
        onChange={setOne}
        sentences={2}
      />

      <Answer
        id="strongest"
        label="What is the strongest case for that claim? · required"
        value={two}
        onChange={setTwo}
        sentences={2}
      />

      <p className="note mt-4 mb-10 max-w-[560px]">
        Their strongest version, not their weakest. The author of the original essay is shown both answers and
        may mark them fair or dispute them, and that mark is published alongside your counterpoint.
      </p>

      <button type="submit" className="btn btn-strong" aria-disabled={!ready} disabled={!ready}>
        Continue to the rebuttal
      </button>
    </>
  );
}

function Answer({
  id,
  label,
  value,
  onChange,
  sentences,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  sentences: number;
}) {
  const written = countSentences(value);

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label className="label mb-0 text-[color:var(--ink)]" htmlFor={id}>
          {label}
        </label>
        <span className="meta">
          {written} of {sentences} sentences
        </span>
      </div>
      <textarea
        id={id}
        name={id}
        rows={4}
        maxLength={STEELMAN_MAX}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="field field-lg"
        data-verdict={
          value.length === 0 ? undefined : value.trim().length >= STEELMAN_MIN ? "accepted" : "rejected"
        }
      />
    </div>
  );
}
