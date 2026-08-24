"use client";

import Link from "next/link";
import { useState, useTransition, type ChangeEvent } from "react";

import { Icon } from "@/components/icons";
import { ClaimBadge } from "@/components/ui";
import { LENSES, LENS_KEYS, MAX_LENSES_PER_ESSAY } from "@/lib/lenses";
import {
  CLAIM_KINDS,
  CLAIM_LABEL,
  SPOILER_LABEL,
  THESIS_MAX,
  oneSentence,
  type Block,
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
} from "@/lib/actions";

type Draft = Record<string, { body: string; kind: ClaimKind }>;

function autoGrow(event: ChangeEvent<HTMLTextAreaElement>) {
  event.target.style.height = "auto";
  event.target.style.height = `${event.target.scrollHeight}px`;
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
  const [citeFor, setCiteFor] = useState<string | null>(null);
  const [audit, setAudit] = useState(false);
  const [checkOpen, setCheckOpen] = useState(false);
  const [checks, setChecks] = useState({ thesis: false, objection: false });
  const [saved, setSaved] = useState<string | null>(null);

  const persistMeta = () => {
    const data = new FormData();
    data.set("thesis", thesis);
    data.set("title", title);
    data.set("spoiler_level", spoiler);
    startTransition(async () => {
      await saveDraft(essay.id, data);
      setSaved(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    });
  };

  const persistBlock = (id: string) => {
    const entry = draft[id];
    if (!entry) return;
    startTransition(async () => {
      await saveBlock(essay.id, id, entry.body, entry.kind);
      setSaved(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    });
  };

  const setKind = (id: string, kind: ClaimKind) => {
    setDraft((current) => ({ ...current, [id]: { ...current[id], kind } }));
    setSelected(null);
    startTransition(() => saveBlock(essay.id, id, draft[id]?.body ?? "", kind));
  };

  const citationFor = (id: string) => blocks.find((block) => block.id === id)?.citation ?? null;

  // Enforcement is a warning: the count is shown, publishing is not blocked.
  const unsourced = blocks.filter(
    (block) => (draft[block.id]?.kind ?? block.claim_kind) === "textual" && !block.citation,
  ).length;

  const tally = CLAIM_KINDS.map(
    (kind) => `${Object.values(draft).filter((entry) => entry.kind === kind).length} ${CLAIM_LABEL[kind]}`,
  ).join("  ·  ");

  const overLength = thesis.length > THESIS_MAX;

  return (
    <main className="mx-auto flex max-w-[1080px] flex-col items-start gap-0 px-6 pt-6 pb-24 md:flex-row md:gap-12 md:px-12 md:pt-10 lg:max-w-[1400px]">
      <div className="w-full min-w-0 flex-1 md:max-w-[824px] md:flex-[0_1_824px]">
        <div className="rule-b flex flex-wrap items-center gap-4 pb-8 md:ml-36">
          <span className="meta">
            {pending ? "Saving" : saved ? `Draft · saved ${saved}` : "Draft"}
          </span>
          {essay.answers_essay_id && <span className="meta meta-accent">Counterpoint</span>}
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

        {checkOpen ? (
          <PrePublish
            essayId={essay.id}
            checks={checks}
            setChecks={setChecks}
            unsourced={unsourced}
            onBack={() => setCheckOpen(false)}
          />
        ) : (
          <>
            <div className="rule-b py-8 md:ml-36">
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
                onChange={(event) => setThesis(oneSentence(event.target.value, THESIS_MAX))}
                onBlur={persistMeta}
                className="field field-lg"
              />
              <p className="note mt-3 mb-0">
                A second sentence is refused, not truncated. The thesis is what readers judge the essay by.
              </p>
            </div>

            <div className="py-8 md:ml-36">
              <label className="label" htmlFor="title">
                Title
              </label>
              <input
                id="title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                onBlur={persistMeta}
                className="field field-title"
              />
            </div>

            {audit ? (
              <div className="py-8 md:ml-36">
                <div className="meta mb-2">Self audit · formatting stripped</div>
                <p className="note-lg m-0 mb-6">
                  Every block in order, eight words each, with the claim type you gave it. No judgement is
                  attached. It is a mirror.
                </p>
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="rule-t grid grid-cols-[116px_minmax(0,1fr)] items-baseline gap-6 py-3"
                  >
                    <span>
                      <ClaimBadge kind={draft[block.id]?.kind ?? block.claim_kind} />
                    </span>
                    <span className="serif-md">
                      {(draft[block.id]?.body ?? "").split(/\s+/).slice(0, 8).join(" ") || "—"}…
                    </span>
                  </div>
                ))}
                <div className="rule-t mt-0 flex flex-wrap gap-6 pt-5">
                  <span className="meta">{tally}</span>
                </div>
              </div>
            ) : (
              <div className="py-8">
                <div className="meta mb-5 md:ml-36">
                  Body · select a paragraph to assign its claim type
                </div>

                {blocks.map((block) => {
                  const entry = draft[block.id] ?? { body: block.body, kind: block.claim_kind };
                  const isTextual = entry.kind === "textual";
                  const citation = citationFor(block.id);
                  const demoted = isTextual && !citation;
                  const open = selected === block.id;

                  return (
                    <div
                      key={block.id}
                      className="relative mb-6 block md:grid md:grid-cols-[116px_28px_minmax(0,1fr)]"
                    >
                      <div className="mb-2 flex items-start justify-start md:mb-0 md:justify-end md:pt-[7px]">
                        <button
                          type="button"
                          onClick={() => setSelected(open ? null : block.id)}
                          className="border-0 bg-transparent p-0"
                          aria-expanded={open}
                          aria-label={`Claim type for this paragraph: ${CLAIM_LABEL[entry.kind]}`}
                          style={open ? { outline: "1px solid var(--ink2)", outlineOffset: 2 } : undefined}
                        >
                          <ClaimBadge kind={demoted ? "interpretive" : entry.kind} demoted={demoted} />
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
                                className={`meta h-10 flex-none border-0 bg-transparent px-[14px] text-[color:var(--ink2)] hover:text-[color:var(--ink)] ${
                                  i < CLAIM_KINDS.length - 1
                                    ? "border-r border-[color:var(--rule)]"
                                    : ""
                                }`}
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
                            setDraft((current) => ({ ...current, [block.id]: { ...entry, body } }));
                          }}
                          onBlur={() => persistBlock(block.id)}
                          placeholder="Write the paragraph."
                          className="body-p w-full resize-none border-0 bg-transparent p-0 outline-none"
                        />

                        <div className="flex flex-wrap items-center gap-5">
                          {isTextual && (
                            <button
                              type="button"
                              onClick={() => setCiteFor(block.id)}
                              className="cite-chip"
                              data-unsourced={demoted}
                            >
                              {citation
                                ? `${citation.work_title} · ${citation.locator}`
                                : "Unsourced — add a citation"}
                            </button>
                          )}
                          {blocks.length > 1 && (
                            <button
                              type="button"
                              onClick={() => startTransition(() => removeBlock(essay.id, block.id))}
                              className="text-btn text-btn-bare"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="md:ml-36">
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

            <div className="rule-t py-8 md:ml-36">
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

            <div className="rule-t py-8 md:ml-36">
              <span className="label">Spoiler level</span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SPOILER_LABEL) as SpoilerLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      setSpoiler(level);
                      const data = new FormData();
                      data.set("thesis", thesis);
                      data.set("title", title);
                      data.set("spoiler_level", level);
                      startTransition(() => saveDraft(essay.id, data));
                    }}
                    className="chip"
                    data-on={spoiler === level}
                  >
                    {level === "none" ? "None" : SPOILER_LABEL[level]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {citeFor && (
        <CitationDrawer
          key={citeFor}
          essayId={essay.id}
          blockId={citeFor}
          index={blocks.findIndex((block) => block.id === citeFor) + 1}
          existing={citationFor(citeFor)}
          defaultWork={essay.character.work.title}
          onClose={() => setCiteFor(null)}
        />
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
    <div className="pt-10 md:ml-36">
      <div className="meta pb-5">Before you publish</div>
      <p className="lead mb-8">
        Read these back to yourself. Nothing here blocks publishing. The rest is a prompt to think, and you
        are the one who answers it.
      </p>

      {rows.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setChecks({ ...checks, [key]: !checks[key] })}
          className="rule-t -ml-2 flex w-full items-start gap-[14px] border-0 bg-transparent px-2 py-4 text-left hover:bg-[color:var(--raised)]"
        >
          <span className="checkbox" data-on={checks[key]}>
            {checks[key] && <Icon.check />}
          </span>
          <span className="flex-[1_1_260px] text-[15px] leading-[1.5] text-[color:var(--ink)]">{label}</span>
        </button>
      ))}

      <div className="rule-t rule-b -ml-2 flex flex-wrap items-start gap-[14px] px-2 py-4">
        <span className="checkbox opacity-50" data-on={unsourced === 0}>
          {unsourced === 0 && <Icon.check />}
        </span>
        <span className="flex-[1_1_260px] text-[15px] leading-[1.5] text-[color:var(--ink)]">
          Every Textual block has a citation.
        </span>
        <span className={`meta pt-[2px] ${unsourced ? "meta-accent" : "meta-moss"}`}>
          {unsourced ? `Warning · ${unsourced} still unsourced` : "All sourced"}
        </span>
      </div>

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
        <button type="button" onClick={onBack} className="text-btn text-btn-bare">
          Back to the draft
        </button>
      </div>
    </div>
  );
}

function CitationDrawer({
  essayId,
  blockId,
  index,
  existing,
  defaultWork,
  onClose,
}: {
  essayId: string;
  blockId: string;
  index: number;
  existing: { work_title: string; locator: string; quote: string } | null;
  defaultWork: string;
  onClose: () => void;
}) {
  const [quote, setQuote] = useState(existing?.quote ?? "");
  const [, startTransition] = useTransition();

  return (
    <aside
      className="sticky bottom-0 z-30 mx-[-24px] mt-6 mb-[-64px] w-[calc(100%+48px)] border-t border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-5 lg:sticky lg:top-[88px] lg:mx-0 lg:mb-0 lg:w-[340px] lg:flex-[0_0_340px] lg:border lg:p-6"
    >
      <div className="rule-b flex items-baseline gap-3 pb-5">
        <h2 className="head-sm m-0">Citation</h2>
        <span className="meta">Paragraph {index}</span>
        <button type="button" onClick={onClose} className="text-btn text-btn-bare ml-auto">
          Close
        </button>
      </div>

      <form action={saveCitation.bind(null, essayId, blockId)} onSubmit={onClose}>
        <div className="pt-5">
          <label className="label" htmlFor="work_title">
            Work
          </label>
          <input
            id="work_title"
            name="work_title"
            defaultValue={existing?.work_title ?? defaultWork}
            className="field"
          />
        </div>
        <div className="pt-5">
          <label className="label" htmlFor="locator">
            Chapter or episode
          </label>
          <input
            id="locator"
            name="locator"
            defaultValue={existing?.locator ?? ""}
            placeholder="ch. 093"
            className="field"
          />
          <p className="note mt-2 mb-0">Page numbers are not accepted: editions disagree.</p>
        </div>
        <div className="pt-5">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <label className="label mb-0" htmlFor="quote">
              Quote
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
            <button
              type="button"
              onClick={() => {
                startTransition(() => removeCitation(essayId, blockId));
                onClose();
              }}
              className="text-btn text-btn-accent ml-3"
            >
              Remove
            </button>
          )}
        </div>
      </form>
    </aside>
  );
}

export function CounterpointNotice({ essay }: { essay: Essay }) {
  if (!essay.answers_essay_id) return null;
  return (
    <div className="mx-auto max-w-[1080px] px-6 pt-10 md:px-12">
      <div className="quiet-bar md:ml-36">
        <div className="meta mb-[10px]">The argument you are answering</div>
        <p className="serif-md m-0 text-[color:var(--ink2)]">{essay.steelman}</p>
        <Link href={`/counterpoint/new/${essay.answers_essay_id}`} className="text-btn text-btn-bare plain mt-3 inline-flex">
          Edit the steelman
        </Link>
      </div>
    </div>
  );
}
