import assert from "node:assert/strict";
import test from "node:test";

import {
  countSentences,
  effectiveClaimKind,
  isUnsourced,
  oneSentence,
  readingMinutes,
  THESIS_MAX,
} from "./types.ts";

// Run with: npm test

const cited = { work_title: "Berserk", locator: "ch. 093", quote: "…" } as never;

test("a second sentence is refused, not truncated", () => {
  assert.equal(
    oneSentence("The Eclipse is a repetition. Griffith says so.", THESIS_MAX),
    "The Eclipse is a repetition.",
  );
  assert.equal(
    oneSentence("Griffith's ascent is the fulfilment of a logic", THESIS_MAX),
    "Griffith's ascent is the fulfilment of a logic",
  );
  // Newlines cannot smuggle a second sentence past the check.
  assert.equal(oneSentence("One thing.\nAnother thing.", THESIS_MAX), "One thing.");
});

test("a character description keeps two sentences and drops the third", () => {
  assert.equal(
    oneSentence("A harbour clerk. She keeps two sets of books. She is lying.", 220, 2),
    "A harbour clerk. She keeps two sets of books.",
  );
});

test("the thesis is capped before the sentence rule runs", () => {
  const long = "a".repeat(400);
  assert.equal(oneSentence(long, THESIS_MAX).length, THESIS_MAX);
});

test("counting sentences ignores mid-word punctuation", () => {
  assert.equal(countSentences("One. Two."), 2);
  assert.equal(countSentences("Ch. 93 is the load-bearing line."), 2);
  assert.equal(countSentences(""), 0);
});

test("an unsourced Textual claim reads as Interpretive", () => {
  assert.equal(effectiveClaimKind({ claim_kind: "textual", citation: null }), "interpretive");
  assert.ok(isUnsourced({ claim_kind: "textual", citation: null }));
});

test("a sourced Textual claim keeps its badge", () => {
  assert.equal(effectiveClaimKind({ claim_kind: "textual", citation: cited }), "textual");
  assert.ok(!isUnsourced({ claim_kind: "textual", citation: cited }));
});

test("Interpretive and Speculative are never demoted for want of a source", () => {
  assert.equal(effectiveClaimKind({ claim_kind: "interpretive", citation: null }), "interpretive");
  assert.equal(effectiveClaimKind({ claim_kind: "speculative", citation: null }), "speculative");
  assert.ok(!isUnsourced({ claim_kind: "speculative", citation: null }));
});

test("reading time never rounds to zero", () => {
  assert.equal(readingMinutes("one word"), 1);
  assert.equal(readingMinutes(Array(2200).fill("word").join(" ")), 10);
});
