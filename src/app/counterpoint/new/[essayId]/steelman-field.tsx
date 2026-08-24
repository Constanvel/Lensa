"use client";

import { useState } from "react";

import { countSentences } from "@/lib/types";

const MAX = 320;

export function SteelmanField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const sentences = countSentences(value);
  const ready = value.trim().length >= 20;

  return (
    <>
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <label className="label mb-0 text-[color:var(--ink)]" htmlFor="steelman">
          State their argument in two sentences · required
        </label>
        <span className="meta">{sentences} of 2 sentences</span>
      </div>
      <textarea
        id="steelman"
        name="steelman"
        rows={4}
        maxLength={MAX}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="field field-lg"
        data-verdict={value.length === 0 ? undefined : ready ? "accepted" : "rejected"}
      />
      <p className="note mt-4 mb-10 max-w-[560px]">
        Their strongest version, not their weakest. The author of the original essay is shown this summary and
        may mark it fair or dispute it, and that mark is published alongside your counterpoint.
      </p>
      <button type="submit" className="btn btn-strong" aria-disabled={!ready} disabled={!ready}>
        Continue to the rebuttal
      </button>
    </>
  );
}
