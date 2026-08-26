import assert from "node:assert/strict";
import test from "node:test";

import {
  countSentences,
  countWords,
  effectiveClaimKind,
  isUnsourced,
  numberParagraphs,
  oneSentence,
  readingMinutes,
  THESIS_MAX,
} from "./types.ts";

// Run with: npm test

const cited = [{ chapter: 93, quote: "…" }] as never;

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

test("an empty textarea counts zero words, not one", () => {
  assert.equal(countWords(""), 0);
  assert.equal(countWords("   \n  "), 0);
  assert.equal(countWords("one"), 1);
  assert.equal(countWords("  two   words  "), 2);
});

test("an unsourced Textual claim reads as Interpretive", () => {
  assert.equal(effectiveClaimKind({ claim_kind: "textual", citations: [] }), "interpretive");
  assert.ok(isUnsourced({ claim_kind: "textual", citations: [] }));
});

test("a sourced Textual claim keeps its badge", () => {
  assert.equal(effectiveClaimKind({ claim_kind: "textual", citations: cited }), "textual");
  assert.ok(!isUnsourced({ claim_kind: "textual", citations: cited }));
});

test("Interpretive and Speculative are never demoted for want of a source", () => {
  assert.equal(effectiveClaimKind({ claim_kind: "interpretive", citations: [] }), "interpretive");
  assert.equal(effectiveClaimKind({ claim_kind: "speculative", citations: [] }), "speculative");
  assert.ok(!isUnsourced({ claim_kind: "speculative", citations: [] }));
});

test("paragraph numbers skip headings and restart per essay", () => {
  const numbered = numberParagraphs([
    { id: "a", position: 0, kind: "paragraph", essay_id: "e1" },
    { id: "h", position: 1, kind: "heading", essay_id: "e1" },
    { id: "b", position: 2, kind: "paragraph", essay_id: "e1" },
    { id: "c", position: 0, kind: "paragraph", essay_id: "e2" },
  ]);
  const by = Object.fromEntries(numbered.map((n) => [n.id, n.paragraph]));

  assert.equal(by.a, 1);
  // The heading sits between them and takes no number of its own.
  assert.equal(by.b, 2);
  // The next essay starts again at one.
  assert.equal(by.c, 1);
});

test("reading time never rounds to zero", () => {
  assert.equal(readingMinutes("one word"), 1);
  assert.equal(readingMinutes(Array(2200).fill("word").join(" ")), 10);
});
