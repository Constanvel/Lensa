import type { ReactNode } from "react";

import { DismissibleToastSpec } from "./demo";
import {
  Avatar,
  ChecklistItem,
  CitationChip,
  ClaimBadge,
  CounterTextarea,
  DestructiveAction,
  Divider,
  LensChip,
  LensPickerRow,
  MetadataLabel,
  Pagination,
  PrimaryButton,
  SearchField,
  SecondaryButton,
  SelfAuditRow,
  Select,
  SpoilerBlock,
  TextButton,
  TextInput,
  Toast,
} from "@/components/kit";
import { LENSES } from "@/lib/lenses";

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rule-t pt-8 pb-12">
      <div className="mb-7 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="meta meta-ink m-0">{title}</h2>
        {note && <MetadataLabel wrap>{note}</MetadataLabel>}
      </div>
      <div className="flex flex-col gap-9">{children}</div>
    </section>
  );
}

function Component({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="serif-md mb-4 text-[color:var(--ink2)]">{name}</h3>
      <div className="flex flex-wrap items-start gap-x-8 gap-y-6">{children}</div>
    </div>
  );
}

function Spec({ state, width, children }: { state: string; width?: number; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3" style={width ? { width, maxWidth: "100%" } : undefined}>
      <MetadataLabel>{state}</MetadataLabel>
      {children}
    </div>
  );
}

/** Every component, every state it has, in whichever theme wraps this. */
export function Inventory() {
  return (
    <div>
      <Section
        title="Boundaries"
        note="--edge on anything you can press or type into · --rule on anything you cannot"
      >
        <Component name="The two tokens, side by side">
          <Spec state="--edge · resting control" width={260}>
            <TextInput label="Email" defaultValue="ines@kovac.st" scale="ui" />
          </Spec>
          <Spec state="--rule · divider" width={260}>
            <div className="pt-[13px]">
              <Divider />
            </div>
            <MetadataLabel wrap className="mt-3">
              Never a control boundary
            </MetadataLabel>
          </Spec>
          <Spec state="--rule · disabled control" width={260}>
            <TextInput label="Email" defaultValue="ines@kovac.st" scale="ui" disabled />
          </Spec>
        </Component>
      </Section>

      <Section title="Buttons" note="Control height 44px · radius 2px">
        <Component name="Primary button">
          <Spec state="Default">
            <PrimaryButton>Publish essay</PrimaryButton>
          </Spec>
          <Spec state="Hover">
            <PrimaryButton force="hover">Publish essay</PrimaryButton>
          </Spec>
          <Spec state="Focus visible">
            <PrimaryButton force="focus">Publish essay</PrimaryButton>
          </Spec>
          <Spec state="Active">
            <PrimaryButton force="active">Publish essay</PrimaryButton>
          </Spec>
          <Spec state="Disabled">
            <PrimaryButton disabled>Publish essay</PrimaryButton>
          </Spec>
          <Spec state="Loading">
            <PrimaryButton loading loadingLabel="Publishing">
              Publish essay
            </PrimaryButton>
          </Spec>
        </Component>

        <Component name="Secondary button">
          <Spec state="Default">
            <SecondaryButton>Save draft</SecondaryButton>
          </Spec>
          <Spec state="Hover">
            <SecondaryButton force="hover">Save draft</SecondaryButton>
          </Spec>
          <Spec state="Focus visible">
            <SecondaryButton force="focus">Save draft</SecondaryButton>
          </Spec>
          <Spec state="Active">
            <SecondaryButton force="active">Save draft</SecondaryButton>
          </Spec>
          <Spec state="Disabled">
            <SecondaryButton disabled>Save draft</SecondaryButton>
          </Spec>
          <Spec state="Loading">
            <SecondaryButton loading>Save draft</SecondaryButton>
          </Spec>
        </Component>

        <Component name="Text button">
          <Spec state="Default">
            <TextButton>Open claim ledger</TextButton>
          </Spec>
          <Spec state="Hover">
            <TextButton force="hover">Open claim ledger</TextButton>
          </Spec>
          <Spec state="Focus visible">
            <TextButton force="focus">Open claim ledger</TextButton>
          </Spec>
          <Spec state="Active">
            <TextButton force="active">Open claim ledger</TextButton>
          </Spec>
          <Spec state="Disabled">
            <TextButton disabled>Open claim ledger</TextButton>
          </Spec>
          <Spec state="Loading">
            <TextButton loading>Open claim ledger</TextButton>
          </Spec>
          <Spec state="No underline">
            <TextButton underline={false}>Done</TextButton>
          </Spec>
          <Spec state="As a link">
            <TextButton href="/rules" tone="strong">
              The writing rules
            </TextButton>
          </Spec>
        </Component>

        <Component name="Destructive text action">
          <Spec state="Default">
            <DestructiveAction>Delete account</DestructiveAction>
          </Spec>
          <Spec state="Hover">
            <DestructiveAction force="hover">Delete account</DestructiveAction>
          </Spec>
          <Spec state="Focus visible">
            <DestructiveAction force="focus">Delete account</DestructiveAction>
          </Spec>
          <Spec state="Active">
            <DestructiveAction force="active">Delete account</DestructiveAction>
          </Spec>
          <Spec state="Disabled">
            <DestructiveAction disabled>Delete account</DestructiveAction>
          </Spec>
          <Spec state="Loading">
            <DestructiveAction loading>Delete account</DestructiveAction>
          </Spec>
        </Component>
      </Section>

      <Section
        title="Fields"
        note="Accepted is a 2px moss underline · rejected is 2px oxblood plus one line saying why"
      >
        <Component name="Text input">
          <Spec state="Default" width={260}>
            <TextInput label="Character name" defaultValue="Rickert" />
          </Spec>
          <Spec state="Hover" width={260}>
            <TextInput label="Character name" defaultValue="Rickert" force="hover" />
          </Spec>
          <Spec state="Focus visible" width={260}>
            <TextInput label="Character name" defaultValue="Rickert" force="focus" />
          </Spec>
          <Spec state="Accepted" width={260}>
            <TextInput
              label="Character name"
              defaultValue="Rickert"
              verdict="accepted"
              note="Available — no character under this name"
            />
          </Spec>
          <Spec state="Rejected" width={260}>
            <TextInput
              label="Character name"
              defaultValue="Vela Ostrand"
              verdict="rejected"
              note="Already exists · The Salt Ledger"
            />
          </Spec>
          <Spec state="Disabled" width={260}>
            <TextInput label="Character name" defaultValue="Rickert" disabled />
          </Spec>
          <Spec state="Loading" width={260}>
            <TextInput label="Character name" defaultValue="Rickert" loading />
          </Spec>
          <Spec state="Title scale" width={340}>
            <TextInput label="Title" defaultValue="Late Evidence" scale="title" />
          </Spec>
        </Component>

        <Component name="Textarea with word counter">
          <Spec state="Default" width={340}>
            <CounterTextarea
              label="Steelman · required"
              maxWords={60}
              defaultValue="Kovač argues that the band was never an end for Griffith, so the Eclipse introduces no new intention."
            />
          </Spec>
          <Spec state="Over the budget" width={340}>
            <CounterTextarea
              label="Steelman · required"
              maxWords={12}
              defaultValue="Kovač argues that the band was never an end for Griffith, so the Eclipse introduces no new intention."
            />
          </Spec>
          <Spec state="Accepted" width={340}>
            <CounterTextarea
              label="Steelman · required"
              maxWords={60}
              verdict="accepted"
              note="Two sentences · ready to send"
              defaultValue="Kovač argues that the band was never an end for Griffith. The Eclipse introduces no new intention."
            />
          </Spec>
          <Spec state="Rejected" width={340}>
            <CounterTextarea
              label="Steelman · required"
              maxWords={60}
              verdict="rejected"
              note="Say more — one clause is not a summary"
              defaultValue="She is wrong."
            />
          </Spec>
          <Spec state="Disabled" width={340}>
            <CounterTextarea label="Steelman · required" maxWords={60} defaultValue="" disabled />
          </Spec>
        </Component>

        <Component name="Select">
          <Spec state="Default" width={260}>
            <Select
              label="Medium"
              defaultValue="manga"
              options={[
                { value: "novel", label: "Novel" },
                { value: "manga", label: "Manga" },
                { value: "film", label: "Film" },
              ]}
            />
          </Spec>
          <Spec state="Hover" width={260}>
            <Select
              label="Medium"
              force="hover"
              defaultValue="manga"
              options={[{ value: "manga", label: "Manga" }]}
            />
          </Spec>
          <Spec state="Focus visible" width={260}>
            <Select
              label="Medium"
              force="focus"
              defaultValue="manga"
              options={[{ value: "manga", label: "Manga" }]}
            />
          </Spec>
          <Spec state="Accepted" width={260}>
            <Select
              label="Medium"
              verdict="accepted"
              note="Matches the work on file"
              defaultValue="manga"
              options={[{ value: "manga", label: "Manga" }]}
            />
          </Spec>
          <Spec state="Rejected" width={260}>
            <Select
              label="Medium"
              verdict="rejected"
              note="Pick a medium before saving"
              defaultValue=""
              options={[
                { value: "", label: "—" },
                { value: "manga", label: "Manga" },
              ]}
            />
          </Spec>
          <Spec state="Disabled" width={260}>
            <Select
              label="Medium"
              disabled
              defaultValue="manga"
              options={[{ value: "manga", label: "Manga" }]}
            />
          </Spec>
        </Component>

        <Component name="Search field">
          <Spec state="Default" width={300}>
            <SearchField label="Search" />
          </Spec>
          <Spec state="Hover" width={300}>
            <SearchField label="Search" force="hover" />
          </Spec>
          <Spec state="Focus visible" width={300}>
            <SearchField label="Search" force="focus" defaultValue="griffith" />
          </Spec>
          <Spec state="Disabled" width={300}>
            <SearchField label="Search" disabled />
          </Spec>
        </Component>
      </Section>

      <Section title="Claims" note="Label, tint and border weight all differ — colour never carries it alone">
        <Component name="Claim badge">
          <Spec state="Textual · 3px solid">
            <ClaimBadge kind="textual" />
          </Spec>
          <Spec state="Interpretive · 2px solid">
            <ClaimBadge kind="interpretive" />
          </Spec>
          <Spec state="Speculative · 2px dashed">
            <ClaimBadge kind="speculative" />
          </Spec>
          <Spec state="Demoted · unsourced Textual">
            <ClaimBadge kind="interpretive" demoted />
          </Spec>
          <Spec state="Selected in the editor">
            <ClaimBadge kind="textual" selected />
          </Spec>
        </Component>

        <Component name="Citation chip">
          <Spec state="Sourced">
            <CitationChip>Berserk · ch. 093</CitationChip>
          </Spec>
          <Spec state="Sourced · hover">
            <CitationChip force="hover">Berserk · ch. 093</CitationChip>
          </Spec>
          <Spec state="Sourced · focus visible">
            <CitationChip force="focus">Berserk · ch. 093</CitationChip>
          </Spec>
          <Spec state="Unsourced">
            <CitationChip unsourced>Unsourced — add a citation</CitationChip>
          </Spec>
          <Spec state="Unsourced · hover">
            <CitationChip unsourced force="hover">
              Unsourced — add a citation
            </CitationChip>
          </Spec>
          <Spec state="Disabled">
            <CitationChip disabled>Berserk · ch. 093</CitationChip>
          </Spec>
          <Spec state="Loading">
            <CitationChip loading>Berserk · ch. 093</CitationChip>
          </Spec>
        </Component>

        <Component name="Self audit row">
          <Spec state="Textual" width={420}>
            <SelfAuditRow kind="textual" words="Melville gives Ahab a stated motive in" />
          </Spec>
          <Spec state="Interpretive" width={420}>
            <SelfAuditRow kind="interpretive" words="What Ahab cannot tolerate is not the" />
          </Spec>
          <Spec state="Speculative" width={420}>
            <SelfAuditRow kind="speculative" words="Had the Pequod turned back, the novel" />
          </Spec>
        </Component>

        <Component name="Spoiler blur block">
          <Spec state="Gated" width={420}>
            <SpoilerBlock covers="Covers chapters 297–301">
              <p className="body-p">
                The Eclipse is usually read as a reversal. Structurally it is a repetition: the same
                transaction the arc has staged a dozen times, at the only scale it had left to stage it.
              </p>
            </SpoilerBlock>
          </Spec>
          <Spec state="Revealed" width={420}>
            <SpoilerBlock covers="Covers chapters 297–301" defaultRevealed>
              <p className="body-p">
                The Eclipse is usually read as a reversal. Structurally it is a repetition: the same
                transaction the arc has staged a dozen times, at the only scale it had left to stage it.
              </p>
            </SpoilerBlock>
          </Spec>
        </Component>
      </Section>

      <Section title="Choice" note="Unselected chips and unchecked boxes both rest on --edge">
        <Component name="Lens chip">
          <Spec state="Default · unselected">
            <LensChip>Nietzschean</LensChip>
          </Spec>
          <Spec state="Hover">
            <LensChip force="hover">Nietzschean</LensChip>
          </Spec>
          <Spec state="Focus visible">
            <LensChip force="focus">Nietzschean</LensChip>
          </Spec>
          <Spec state="Active">
            <LensChip force="active">Nietzschean</LensChip>
          </Spec>
          <Spec state="Selected">
            <LensChip selected>Nietzschean</LensChip>
          </Spec>
          <Spec state="Disabled">
            <LensChip disabled>Nietzschean</LensChip>
          </Spec>
          <Spec state="Loading">
            <LensChip loading>Nietzschean</LensChip>
          </Spec>
        </Component>

        <Component name="Checklist item">
          <Spec state="Unchecked" width={420}>
            <ChecklistItem name="spec-a">My thesis is one sentence.</ChecklistItem>
          </Spec>
          <Spec state="Checked" width={420}>
            <ChecklistItem name="spec-b" defaultChecked>
              My thesis is one sentence.
            </ChecklistItem>
          </Spec>
          <Spec state="Hover" width={420}>
            <ChecklistItem name="spec-c" force="hover">
              My thesis is one sentence.
            </ChecklistItem>
          </Spec>
          <Spec state="Focus visible" width={420}>
            <ChecklistItem name="spec-d" force="focus">
              My thesis is one sentence.
            </ChecklistItem>
          </Spec>
          <Spec state="Disabled" width={420}>
            <ChecklistItem name="spec-e" disabled>
              My thesis is one sentence.
            </ChecklistItem>
          </Spec>
          <Spec state="Enforced · all sourced" width={520}>
            <ChecklistItem enforced defaultChecked note="All sourced" noteTone="moss">
              Every Textual block has a citation.
            </ChecklistItem>
          </Spec>
          <Spec state="Enforced · warning" width={520}>
            <ChecklistItem enforced note="Warning · 3 still unsourced" noteTone="accent">
              Every Textual block has a citation.
            </ChecklistItem>
          </Spec>
        </Component>

        <Component name="Lens picker row">
          <Spec state="Unselected" width={560}>
            <LensPickerRow name="spec-lens" label="Nietzschean" definition={LENSES.nietzschean.short} />
          </Spec>
          <Spec state="Selected" width={560}>
            <LensPickerRow name="spec-lens" label="Jungian" definition={LENSES.jungian.short} selected />
          </Spec>
          <Spec state="Hover" width={560}>
            <LensPickerRow
              name="spec-lens"
              label="Psychoanalytic"
              definition={LENSES.psychoanalytic.short}
              force="hover"
            />
          </Spec>
          <Spec state="Focus visible" width={560}>
            <LensPickerRow
              name="spec-lens"
              label="Metafictional"
              definition={LENSES.metafictional.short}
              force="focus"
            />
          </Spec>
          <Spec state="Disabled · two already chosen" width={560}>
            <LensPickerRow
              name="spec-lens"
              label="Sociopolitical"
              definition={LENSES.sociopolitical.short}
              disabled
            />
          </Spec>
        </Component>
      </Section>

      <Section title="Surfaces" note="Toast and card borders are --rule; a surface is not a control">
        <Component name="Avatar">
          <Spec state="32px placeholder">
            <Avatar size={32} alt="Griffith" />
          </Spec>
          <Spec state="48px placeholder">
            <Avatar size={48} alt="Griffith" />
          </Spec>
          <Spec state="96px placeholder">
            <Avatar size={96} alt="Griffith" />
          </Spec>
        </Component>

        <Component name="Divider">
          <Spec state="Horizontal" width={260}>
            <Divider />
          </Spec>
          <Spec state="Vertical">
            <div className="flex h-16 items-stretch gap-4">
              <span className="serif-sm">Essays</span>
              <Divider orientation="vertical" />
              <span className="serif-sm">Counterpoints</span>
            </div>
          </Spec>
        </Component>

        <Component name="Metadata label">
          <Spec state="Muted · default">
            <MetadataLabel>14 min</MetadataLabel>
          </Spec>
          <Spec state="Strong">
            <MetadataLabel tone="strong">Ines Kovač</MetadataLabel>
          </Spec>
          <Spec state="Ink">
            <MetadataLabel tone="ink">Step one of two</MetadataLabel>
          </Spec>
          <Spec state="Accent · contested">
            <MetadataLabel tone="accent">9 contesting</MetadataLabel>
          </Spec>
          <Spec state="Moss · marked fair">
            <MetadataLabel tone="moss">Marked fair</MetadataLabel>
          </Spec>
        </Component>

        <Component name="Pagination">
          <Spec state="Middle" width={340}>
            <Pagination page={4} pages={9} hrefFor={(page) => `?page=${page}`} />
          </Spec>
          <Spec state="First page" width={340}>
            <Pagination page={1} pages={9} hrefFor={(page) => `?page=${page}`} />
          </Spec>
          <Spec state="Last page" width={340}>
            <Pagination page={9} pages={9} hrefFor={(page) => `?page=${page}`} />
          </Spec>
        </Component>

        <Component name="Toast">
          <Spec state="Neutral" width={420}>
            <Toast title="Draft">Saved two minutes ago.</Toast>
          </Spec>
          <Spec state="Done · moss rule" width={420}>
            <Toast tone="done" title="Export started">
              23 essays, sent to ines@kovac.st.
            </Toast>
          </Spec>
          <Spec state="Error · oxblood rule" width={420}>
            <Toast tone="error" title="Not saved">
              This draft has not saved for four minutes. Nothing is lost until you close the tab.
            </Toast>
          </Spec>
          <Spec state="Dismissible" width={420}>
            <DismissibleToastSpec />
          </Spec>
        </Component>
      </Section>
    </div>
  );
}
