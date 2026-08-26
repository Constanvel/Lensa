"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ChangeEvent } from "react";

import { ChecklistItem, CitationChip, ClaimBadge, SelfAuditRow, TextButton, Toast } from "@/components/kit";
import { LENSES, LENS_KEYS, MAX_LENSES_PER_ESSAY } from "@/lib/lenses";
import {
  CLAIM_KINDS,
  CLAIM_LABEL,
  SPOILER_LABEL,
  THESIS_MAX,
  citationLabel,
  oneSentence,
  unitNoun,
  type Block,
  type Citation,
  type ClaimKind,
  type Essay,
  type SpoilerLevel,
} from "@/lib/types";
import {
  addBlock,
  publishEssay,
  removeBlock,
  removeCitation,
  saveBlock,
  saveCitation,
  saveDraft,
  toggleEssayLens,
  type SaveResult,
} from "@/lib/actions";

type Draft = Record<string, { body: string; kind: ClaimKind }>;
type Save = () => Promise<SaveResult>;

/** Long enough not to write on every keystroke, short enough to lose nothing. */
const AUTOSAVE_MS = 1200;

/** The whole meta column and the reader's masthead share this width. */
const COLUMN = "mx-auto max-w-[824px] px-6";

function autoGrow(event: ChangeEvent<HTMLTextAreaElement>) {
  event.target.style.height = "auto";
  event.target.style.height = `${event.target.scrollHeight}px`;
}

/** Formatting stripped, eight words. It is a mirror, not a judgement. */
function eightWords(body: string) {
  const words = body.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return words.slice(0, 8).join(" ") || "—";
}

export function Editor({ essay, blocks }: { essay: Essay; blocks: Block[] }) {
  const [pending, startTransition] = useTransition();

  const [thesis, setThesis] = useState(essay.thesis ?? "");
  const [title, setTitle] = useState(essay.title ?? "");
  const [spoiler, setSpoiler] = useState<SpoilerLevel>(essay.spoiler_level);
  const [draft, setDraft] = useState<Draft>(() =>
    Object.fromEntries(blocks.map((b) => [b.id, { body: b.body, kind: b.claim_kind }])),
  );

  const [selected, setSelected] = useState<string | null>(null);
  const [citeFor, setCiteFor] = useState<{
    blockId: string;
    citation: Citation | null;
  } | null>(null);
  const [audit, setAudit] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [checks, setChecks] = useState({ thesis: false, objection: false });
  const [saved, setSaved] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    tone: "neutral" | "error";
    text: string;
  } | null>(null);

  // The call that failed, held so Retry repeats exactly it rather than
  // guessing at what the text was when it went.
  const failed = useRef<Save | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── saving ───────────────────────────────────────────────────────────────

  const run = (save: Save) => {
    startTransition(async () => {
      let result: SaveResult;
      try {
        result = await save();
      } catch {
        // A dropped connection never reaches the action, so it returns no
        // result to report. It is still a failed save and reads as one.
        result = {
          ok: false,
          error: "The connection dropped before the draft was saved.",
        };
      }

      if (result.ok) {
        failed.current = null;
        setSaved(
          new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        );
        setToast({ tone: "neutral", text: "Draft saved" });
      } else {
        failed.current = save;
        setToast({ tone: "error", text: result.error });
      }
    });
  };

  /** Typing reschedules; the text is written once the writer stops. */
  const later = (save: Save) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      run(save);
    }, AUTOSAVE_MS);
  };

  const now = (save: Save) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    run(save);
  };

  const metaSave =
    (values: { thesis: string; title: string; spoiler: SpoilerLevel }): Save =>
    () => {
      const data = new FormData();
      data.set("thesis", values.thesis);
      data.set("title", values.title);
      data.set("spoiler_level", values.spoiler);
      return saveDraft(essay.id, data);
    };

  const blockSave =
    (id: string, body: string, kind: ClaimKind): Save =>
    () =>
      saveBlock(essay.id, id, body, kind);

  // The neutral toast confirms and goes. The error one stays until it is
  // dealt with, because it is the only record that the text is unsaved.
  useEffect(() => {
    if (toast?.tone !== "neutral") return;
    const id = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(id);
  }, [toast]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const setKind = (id: string, kind: ClaimKind) => {
    setDraft((current) => ({ ...current, [id]: { ...current[id], kind } }));
    setSelected(null);
    now(blockSave(id, draft[id]?.body ?? "", kind));
  };

  // ── counts ───────────────────────────────────────────────────────────────

  const citationsFor = (id: string) => blocks.find((block) => block.id === id)?.citations ?? [];
  const kindOf = (block: Block) => draft[block.id]?.kind ?? block.claim_kind;
  const paragraphs = blocks.filter((block) => block.kind === "paragraph");

  // Enforcement is a warning: the count is shown, publishing is not blocked.
  const unsourced = paragraphs.filter(
    (block) => kindOf(block) === "textual" && citationsFor(block.id).length === 0,
  ).length;

  const tally = CLAIM_KINDS.map(
    (kind) => `${paragraphs.filter((block) => kindOf(block) === kind).length} ${CLAIM_LABEL[kind]}`,
  ).join("  ·  ");

  const overLength = thesis.length > THESIS_MAX;

  return (
    <main className="pb-24">
      <div className={`${COLUMN} pt-6 md:pt-10`}>
        <div className="rule-b flex flex-wrap items-center gap-4 pb-8">
          <span className="meta">{pending ? "Saving" : saved ? `Draft · saved ${saved}` : "Draft"}</span>
          {essay.counterpoint && <span className="meta meta-accent">Counterpoint</span>}
          <span className="ml-auto" />
          <button
            type="button"
            onClick={() => {
              setAudit((v) => !v);
              setCheckOpen(false);
            }}
            className={`btn ${audit ? "btn-strong bg-[color:var(--raised)]" : "border-[color:var(--rule)]"}`}
          >
            {audit ? "Close self audit" : "Self audit"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCheckOpen(true);
              setAudit(false);
            }}
            className="btn btn-accent"
          >
            Publish
          </button>
        </div>
      </div>

      {checkOpen ? (
        <div className={COLUMN}>
          <PrePublish
            essayId={essay.id}
            checks={checks}
            setChecks={setChecks}
            unsourced={unsourced}
            onBack={() => setCheckOpen(false)}
          />
        </div>
      ) : (
        <>
          <div className={COLUMN}>
            <div className="rule-b py-8">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <label className="label mb-0" htmlFor="thesis">
                  Thesis · one sentence
                </label>
                <span className={`meta ${overLength ? "meta-accent" : ""}`}>
                  {thesis.length} / {THESIS_MAX}
                </span>
              </div>
              <textarea
                id="thesis"
                rows={2}
                value={thesis}
                onChange={(event) => {
                  const next = oneSentence(event.target.value, THESIS_MAX);
                  setThesis(next);
                  later(metaSave({ thesis: next, title, spoiler }));
                }}
                onBlur={() => now(metaSave({ thesis, title, spoiler }))}
                className="field field-lg"
              />
              <p className="note mt-3 mb-0">
                A second sentence is refused, not truncated. The thesis is what readers judge the essay by.
              </p>
            </div>

            <div className="py-8">
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  later(metaSave({ thesis, title: next, spoiler }));
                }}
                onBlur={() => now(metaSave({ thesis, title, spoiler }))}
                className="field field-title"
              />
            </div>
          </div>

          {audit ? (
            <div className={`${COLUMN} py-8`}>
              <div className="meta mb-2">Self audit · formatting stripped</div>
              <p className="note-lg m-0 mb-6">
                Every block in order, eight words each, with the claim type you gave it.
              </p>

              {blocks.map((block) =>
                block.kind === "heading" ? (
                  <div key={block.id} className="audit-row">
                    <span className="meta">Heading</span>
                    <span className="audit-text">{eightWords(draft[block.id]?.body ?? "")}</span>
                  </div>
                ) : (
                  <SelfAuditRow
                    key={block.id}
                    kind={kindOf(block)}
                    words={eightWords(draft[block.id]?.body ?? "")}
                  />
                ),
              )}

              <div className="rule-t mt-0 flex flex-wrap gap-6 pt-5">
                <span className="meta">{tally}</span>
              </div>
            </div>
          ) : (
            <div className="py-8">
              <div className={`${COLUMN} meta mb-5`}>Body · select a paragraph to assign its claim type</div>

              {blocks.map((block) => {
                const entry = draft[block.id] ?? {
                  body: block.body,
                  kind: block.claim_kind,
                };

                // A heading is not a claim, so it carries no badge and no toolbar.
                if (block.kind === "heading") {
                  return (
                    <div className="p-row" key={block.id}>
                      <div className="badge-cell" />
                      <div />
                      <input
                        value={entry.body}
                        onChange={(event) => {
                          const body = event.target.value;
                          setDraft((current) => ({
                            ...current,
                            [block.id]: { ...entry, body },
                          }));
                          later(blockSave(block.id, body, entry.kind));
                        }}
                        onBlur={(event) => now(blockSave(block.id, event.target.value, entry.kind))}
                        placeholder="Section heading"
                        aria-label="Section heading"
                        className="head-sm w-full border-0 bg-transparent p-0 outline-none"
                      />
                    </div>
                  );
                }

                const isTextual = entry.kind === "textual";
                const citations = citationsFor(block.id);
                const demoted = isTextual && citations.length === 0;
                const open = selected === block.id;

                return (
                  <div className="p-row" key={block.id}>
                    {/* The badge hangs where the reader's badge hangs. */}
                    <div className="badge-cell">
                      <button
                        type="button"
                        onClick={() => setSelected(open ? null : block.id)}
                        className="border-0 bg-transparent p-0"
                        aria-expanded={open}
                        aria-label={`Claim type for this paragraph: ${CLAIM_LABEL[entry.kind]}`}
                      >
                        <ClaimBadge
                          kind={demoted ? "interpretive" : entry.kind}
                          demoted={demoted}
                          selected={open}
                        />
                      </button>
                    </div>
                    <div />
                    <div>
                      {open && (
                        <div className="mb-[10px] flex w-fit overflow-hidden rounded-[2px] border border-[color:var(--rule)] bg-[color:var(--raised)]">
                          {CLAIM_KINDS.map((kind, i) => (
                            <button
                              key={kind}
                              type="button"
                              onClick={() => setKind(block.id, kind)}
                              aria-pressed={entry.kind === kind}
                              className={`meta h-10 flex-none border-0 bg-transparent px-[14px] ${
                                entry.kind === kind
                                  ? "text-[color:var(--ink)]"
                                  : "text-[color:var(--ink2)] hover:text-[color:var(--ink)]"
                              } ${i < CLAIM_KINDS.length - 1 ? "border-r border-[color:var(--rule)]" : ""}`}
                            >
                              {CLAIM_LABEL[kind]}
                            </button>
                          ))}
                        </div>
                      )}

                      <textarea
                        rows={3}
                        value={entry.body}
                        onChange={(event) => {
                          autoGrow(event);
                          const body = event.target.value;
                          setDraft((current) => ({
                            ...current,
                            [block.id]: { ...entry, body },
                          }));
                          later(blockSave(block.id, body, entry.kind));
                        }}
                        onBlur={(event) => now(blockSave(block.id, event.target.value, entry.kind))}
                        placeholder="Write the paragraph."
                        className="body-p w-full resize-none border-0 bg-transparent p-0 outline-none"
                      />

                      <div className="flex flex-wrap items-center gap-5">
                        {citations.map((citation) => (
                          <CitationChip
                            key={citation.id}
                            onClick={() => setCiteFor({ blockId: block.id, citation })}
                          >
                            {citation.work.title} · {citationLabel(citation)}
                          </CitationChip>
                        ))}

                        {/* Accent and dashed only while a Textual claim is unsourced. */}
                        <CitationChip
                          unsourced={demoted}
                          onClick={() => setCiteFor({ blockId: block.id, citation: null })}
                        >
                          {citations.length ? "Add another source" : "Add a source"}
                        </CitationChip>

                        {blocks.length > 1 && (
                          <TextButton
                            underline={false}
                            onClick={() => startTransition(() => removeBlock(essay.id, block.id))}
                          >
                            Remove
                          </TextButton>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className={COLUMN}>
                <button
                  type="button"
                  onClick={() => startTransition(() => addBlock(essay.id))}
                  className="btn btn-caps"
                >
                  Add a paragraph
                </button>
              </div>
            </div>
          )}

          <div className={COLUMN}>
            <div className="rule-t py-8">
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <span className="label mb-0">Lens</span>
                <span className="meta">
                  {essay.lenses?.length ?? 0} selected · maximum {MAX_LENSES_PER_ESSAY}
                </span>
              </div>
              <div className="flex flex-col">
                {LENS_KEYS.map((key) => {
                  const on = (essay.lenses ?? []).includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => startTransition(() => toggleEssayLens(essay.id, key))}
                      className={`rule-t -ml-2 grid w-full grid-cols-1 items-baseline gap-y-[6px] border-0 px-2 py-[14px] text-left md:grid-cols-[150px_minmax(0,1fr)_88px] md:gap-5 ${
                        on ? "bg-[color:var(--raised)]" : "bg-transparent hover:bg-[color:var(--raised)]"
                      }`}
                    >
                      <span
                        className={`font-serif text-[17px] leading-[1.4] ${
                          on ? "text-[color:var(--ink)]" : "text-[color:var(--ink2)]"
                        }`}
                      >
                        {LENSES[key].name}
                      </span>
                      <span className="font-serif text-[15px] leading-[1.55] text-[color:var(--ink2)] [text-wrap:pretty]">
                        {LENSES[key].short}
                      </span>
                      <span className={`meta md:text-right ${on ? "text-[color:var(--ink)]" : ""}`}>
                        {on ? "Selected" : "Add"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rule-t py-8">
              <span className="label">Spoiler level</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SPOILER_LABEL) as SpoilerLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setSpoiler(level);
                      now(metaSave({ thesis, title, spoiler: level }));
                    }}
                    className="chip"
                    data-on={spoiler === level}
                  >
                    {level === "none" ? "None" : SPOILER_LABEL[level]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {citeFor && (
        <CitationDrawer
          key={citeFor.citation?.id ?? citeFor.blockId}
          essayId={essay.id}
          blockId={citeFor.blockId}
          index={blocks.filter((b) => b.kind === "paragraph").findIndex((b) => b.id === citeFor.blockId) + 1}
          existing={citeFor.citation}
          work={essay.character.work}
          onClose={() => setCiteFor(null)}
        />
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-6 bottom-6 z-40 flex justify-start">
          <div className="pointer-events-auto">
            <Toast
              tone={toast.tone}
              title={toast.tone === "error" ? "Not saved" : undefined}
              onDismiss={() => setToast(null)}
            >
              {toast.tone === "error" ? (
                <>
                  {toast.text}
                  {/* The text is still in the editor; this repeats the write. */}
                  <TextButton
                    tone="accent"
                    onClick={() => {
                      const save = failed.current;
                      if (save) run(save);
                    }}
                    className="mt-2 block"
                  >
                    Retry
                  </TextButton>
                </>
              ) : (
                toast.text
              )}
            </Toast>
          </div>
        </div>
      )}
    </main>
  );
}

function PrePublish({
  essayId,
  checks,
  setChecks,
  unsourced,
  onBack,
}: {
  essayId: string;
  checks: { thesis: boolean; objection: boolean };
  setChecks: (value: { thesis: boolean; objection: boolean }) => void;
  unsourced: number;
  onBack: () => void;
}) {
  const rows: [keyof typeof checks, string][] = [
    ["thesis", "My thesis is one sentence."],
    ["objection", "I have named the strongest objection to my own argument somewhere in the essay."],
  ];

  return (
    <div className="pt-10">
      <div className="meta pb-5">Before you publish</div>
      <p className="lead mb-8">
        Read these back to yourself. Nothing here blocks publishing. The rest is a prompt to think, and you
        are the one who answers it.
      </p>

      {rows.map(([key, label]) => (
        <ChecklistItem
          key={key}
          checked={checks[key]}
          onChange={() => setChecks({ ...checks, [key]: !checks[key] })}
        >
          {label}
        </ChecklistItem>
      ))}

      {/* The one row the system fills in. It warns and counts; it does not stop. */}
      <ChecklistItem
        enforced
        checked={unsourced === 0}
        note={unsourced ? `Warning · ${unsourced} still unsourced` : "All sourced"}
        noteTone={unsourced ? "accent" : "moss"}
        className="rule-b"
      >
        Every Textual block has a citation.
      </ChecklistItem>

      {unsourced > 0 && (
        <p className="note-lg mt-4 mb-0">
          Publishing is not blocked. Each unsourced Textual claim is shown demoted to Interpretive with a
          dashed underline until it is sourced.
        </p>
      )}

      <div className="rule-t mt-2 flex flex-wrap items-center gap-5 pt-8">
        <form action={publishEssay.bind(null, essayId)}>
          <button type="submit" className="btn btn-accent">
            Publish essay
          </button>
        </form>
        <TextButton underline={false} onClick={onBack}>
          Back to the draft
        </TextButton>
      </div>
    </div>
  );
}

function CitationDrawer({
  essayId,
  blockId,
  index,
  existing,
  work,
  onClose,
}: {
  essayId: string;
  blockId: string;
  index: number;
  existing: Citation | null;
  /** MVP: a citation points at the work the character belongs to. */
  work: { id: string; title: string; unit_label: string };
  onClose: () => void;
}) {
  const [quote, setQuote] = useState(existing?.quote ?? "");
  const [, startTransition] = useTransition();

  return (
    // A sheet under the measure, not a column beside it: a panel to the right
    // would either cover the paragraph being cited or narrow the 680px the
    // writer is working in, and the measure is the whole point of the surface.
    <aside className="fixed inset-x-0 bottom-0 z-30 max-h-[75vh] overflow-y-auto border-t border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-5">
      <div className="mx-auto max-w-[824px]">
        <div className="rule-b flex items-baseline gap-3 pb-5">
          <h2 className="head-sm m-0">Citation</h2>
          <span className="meta">Paragraph {index}</span>
          <button type="button" onClick={onClose} className="text-btn text-btn-bare ml-auto">
            Close
          </button>
        </div>

        <form action={saveCitation.bind(null, essayId, blockId)} onSubmit={onClose}>
          <input type="hidden" name="citation_id" value={existing?.id ?? ""} />
          <input type="hidden" name="work_id" value={work.id} />

          <div className="pt-5">
            <span className="label">Work</span>
            <p className="serif-md m-0 text-[color:var(--ink)]">{work.title}</p>
          </div>
          <div className="pt-5">
            <label className="label" htmlFor="chapter">
              {unitNoun(work.unit_label) === "episode" ? "Episode" : "Chapter"}
            </label>
            <input
              id="chapter"
              name="chapter"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              defaultValue={existing?.chapter ?? ""}
              placeholder="93"
              className="field"
            />
            <p className="note mt-2 mb-0">Page numbers are not accepted: editions disagree.</p>
          </div>
          <div className="pt-5">
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <label className="label mb-0" htmlFor="quote">
                Quote · optional
              </label>
              <span className="meta">{quote.length} / 200</span>
            </div>
            <textarea
              id="quote"
              name="quote"
              rows={4}
              maxLength={200}
              value={quote}
              onChange={(event) => setQuote(event.target.value)}
              className="field"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-6">
            <button type="submit" className="btn btn-strong">
              Save citation
            </button>
            {existing && (
              <TextButton
                tone="accent"
                onClick={() => {
                  startTransition(() => removeCitation(essayId, existing.id));
                  onClose();
                }}
                className="ml-3"
              >
                Remove
              </TextButton>
            )}
          </div>
        </form>
      </div>
    </aside>
  );
}

export function CounterpointNotice({ essay, answers }: { essay: Essay; answers: string | null }) {
  if (!essay.counterpoint) return null;
  return (
    <div className="mx-auto max-w-[824px] px-6 pt-10">
      <div className="quiet-bar">
        <div className="meta mb-[10px]">The argument you are answering</div>
        <p className="serif-md m-0 text-[color:var(--ink2)]">{essay.counterpoint.claim}</p>
        <p className="serif-md mt-3 mb-0 text-[color:var(--ink2)]">
          At its strongest · {essay.counterpoint.strongest}
        </p>
        {answers && (
          <Link
            href={`/counterpoint/new/${answers}`}
            className="text-btn text-btn-bare plain mt-3 inline-flex"
          >
            Edit the steelman
          </Link>
        )}
      </div>
    </div>
  );
}
