import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { CLAIM_LABEL, type ClaimKind } from "@/lib/types";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Renders a state that is normally a pseudo-class. The CSS rule lists
 * `:hover` and `[data-force="hover"]` together, so a specimen on
 * /design/states cannot drift from the real control.
 */
export type ForcedState = "hover" | "focus" | "active";

/** Fields carry their verdict on the underline: 2px moss, or 2px oxblood. */
export type Verdict = "accepted" | "rejected";

type StateProps = {
  className?: string;
  force?: ForcedState;
  loading?: boolean;
};

function stateAttrs({ force, loading }: StateProps) {
  return { "data-force": force, "data-loading": loading ? "true" : undefined };
}

// ─── buttons ────────────────────────────────────────────────────────────────

export type ButtonProps = Omit<ComponentPropsWithoutRef<"button">, "className"> &
  StateProps & {
    variant?: "primary" | "secondary";
    /** Small caps at 12px, for the compact buttons in dense rows. */
    caps?: boolean;
    /** Static state: opacity down and a small caps label. Never a spinner. */
    loadingLabel?: string;
  };

export function Button({
  variant = "secondary",
  caps = false,
  className,
  force,
  loading = false,
  loadingLabel = "Saving",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cx("btn", variant === "primary" && "btn-accent", caps && "btn-caps", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...stateAttrs({ force, loading })}
      {...rest}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, "variant">) {
  return <Button variant="secondary" {...props} />;
}

export type TextButtonProps = Omit<ComponentPropsWithoutRef<"button">, "className"> &
  StateProps & {
    tone?: "muted" | "strong" | "accent";
    /** false drops the hairline under the text; the touch target is unchanged. */
    underline?: boolean;
    href?: string;
  };

/**
 * The 44px target comes from `.text-btn::after { inset: -12px -8px }`, so the
 * underline hugs the text and nothing on the page shifts to make room.
 */
export function TextButton({
  tone = "muted",
  underline = true,
  href,
  className,
  force,
  loading = false,
  children,
  disabled,
  ...rest
}: TextButtonProps) {
  const classes = cx(
    "text-btn",
    tone === "strong" && "text-btn-strong",
    tone === "accent" && "text-btn-accent",
    !underline && "text-btn-bare",
    className,
  );

  if (href) {
    const { type: _type, ...anchorProps } = rest;
    return (
      <Link
        href={href}
        className={cx(classes, "plain")}
        aria-disabled={disabled || undefined}
        {...stateAttrs({ force, loading })}
        {...(anchorProps as ComponentPropsWithoutRef<"a">)}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...stateAttrs({ force, loading })}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * Oxblood text on paper, never a filled button. Oxblood here means the action
 * destroys something — it is the same token as a contested claim and an error.
 */
export function DestructiveAction(props: Omit<TextButtonProps, "tone">) {
  return <TextButton tone="accent" {...props} />;
}

// ─── fields ─────────────────────────────────────────────────────────────────

type FieldShell = StateProps & {
  label: ReactNode;
  /** Hidden visually, still read out. */
  labelHidden?: boolean;
  verdict?: Verdict;
  /** One line of small caps saying why the field was accepted or rejected. */
  note?: ReactNode;
  controlClassName?: string;
};

function FieldNote({ verdict, note }: { verdict?: Verdict; note?: ReactNode }) {
  if (!note) return null;
  return (
    <span className="verdict" data-verdict={verdict}>
      {note}
    </span>
  );
}

export type TextInputProps = Omit<ComponentPropsWithoutRef<"input">, "className"> &
  FieldShell & {
    scale?: "default" | "lg" | "title" | "ui" | "num";
  };

/** Resting underline is --edge. --rule is 1.3:1 on paper and reads as inert. */
export function TextInput({
  label,
  labelHidden = false,
  verdict,
  note,
  scale = "default",
  className,
  controlClassName,
  force,
  loading = false,
  disabled,
  ...rest
}: TextInputProps) {
  return (
    <label className={cx("block", className)}>
      <span className={labelHidden ? "sr-only" : "label"}>{label}</span>
      <input
        className={cx(
          "field",
          scale === "lg" && "field-lg",
          scale === "title" && "field-title",
          scale === "ui" && "field-ui",
          scale === "num" && "field-num",
          controlClassName,
        )}
        data-verdict={verdict}
        disabled={disabled || loading}
        {...stateAttrs({ force, loading })}
        {...rest}
      />
      <FieldNote verdict={verdict} note={note} />
    </label>
  );
}

export type SelectProps = Omit<ComponentPropsWithoutRef<"select">, "className"> &
  FieldShell & {
    options: Array<{ value: string; label: string; disabled?: boolean }>;
  };

export function Select({
  label,
  labelHidden = false,
  verdict,
  note,
  options,
  className,
  controlClassName,
  force,
  loading = false,
  disabled,
  ...rest
}: SelectProps) {
  return (
    <label className={cx("block", className)}>
      <span className={labelHidden ? "sr-only" : "label"}>{label}</span>
      <span className="relative block">
        <select
          className={cx("select", controlClassName)}
          data-verdict={verdict}
          disabled={disabled || loading}
          {...stateAttrs({ force, loading })}
          {...rest}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {/* currentColor, so the chevron follows the token, not a hex. */}
        <span className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-[color:var(--muted)]">
          <svg
            viewBox="0 0 12 12"
            width={12}
            height={12}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M2.5 4.5L6 8l3.5-3.5" />
          </svg>
        </span>
      </span>
      <FieldNote verdict={verdict} note={note} />
    </label>
  );
}

export type SearchFieldProps = Omit<ComponentPropsWithoutRef<"input">, "className"> &
  StateProps & {
    label?: ReactNode;
    labelHidden?: boolean;
  };

export function SearchField({
  label = "Search",
  labelHidden = true,
  className,
  force,
  loading = false,
  disabled,
  ...rest
}: SearchFieldProps) {
  return (
    <label className={cx("block", className)}>
      <span className={labelHidden ? "sr-only" : "label"}>{label}</span>
      <input
        type="search"
        className="search"
        placeholder="Search characters, works, essays"
        disabled={disabled || loading}
        {...stateAttrs({ force, loading })}
        {...rest}
      />
    </label>
  );
}

// ─── chips and badges ───────────────────────────────────────────────────────

export type LensChipProps = Omit<ComponentPropsWithoutRef<"button">, "className"> &
  StateProps & {
    selected?: boolean;
  };

/** Unselected border is --edge, the same token every resting control uses. */
export function LensChip({
  selected = false,
  className,
  force,
  loading = false,
  children,
  disabled,
  ...rest
}: LensChipProps) {
  return (
    <button
      type="button"
      className={cx("chip", className)}
      aria-pressed={selected}
      disabled={disabled || loading}
      {...stateAttrs({ force, loading })}
      {...rest}
    >
      {children}
    </button>
  );
}

const BADGE_CLASS: Record<ClaimKind, string> = {
  textual: "badge badge-textual",
  interpretive: "badge badge-interpretive",
  speculative: "badge badge-speculative",
};

export type ClaimBadgeProps = {
  kind: ClaimKind;
  /** An unsourced Textual claim shows as Interpretive with a dashed underline. */
  demoted?: boolean;
  selected?: boolean;
  className?: string;
};

/**
 * Label, tint and border weight all differ — 3px solid, 2px solid, 2px dashed.
 * Colour is never the only distinction.
 */
export function ClaimBadge({ kind, demoted = false, selected = false, className }: ClaimBadgeProps) {
  return (
    <span
      className={cx(BADGE_CLASS[kind], demoted && "badge-demoted", selected && "badge-selected", className)}
    >
      {CLAIM_LABEL[kind]}
    </span>
  );
}

export type CitationChipProps = Omit<ComponentPropsWithoutRef<"button">, "className"> &
  StateProps & {
    /** Oxblood plus a dashed underline: the citation is missing. */
    unsourced?: boolean;
  };

export function CitationChip({
  unsourced = false,
  className,
  force,
  loading = false,
  children,
  disabled,
  ...rest
}: CitationChipProps) {
  return (
    <button
      type="button"
      className={cx("cite-chip", className)}
      data-unsourced={unsourced ? "true" : undefined}
      disabled={disabled || loading}
      {...stateAttrs({ force, loading })}
      {...rest}
    >
      {children}
    </button>
  );
}

// ─── surfaces ───────────────────────────────────────────────────────────────

export type AvatarProps = Omit<ComponentPropsWithoutRef<"img">, "className" | "src" | "alt"> & {
  size?: number;
  src?: string | null;
  alt: string;
  className?: string;
};

/** Square, never a circle. Without a source it stays a hatched placeholder. */
export function Avatar({ size = 48, src, alt, className, ...rest }: AvatarProps) {
  if (!src) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={cx("avatar", className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- portraits come from
    // arbitrary hosts; next/image would need a remotePatterns entry per host.
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cx("avatar", className)}
      style={{ width: size, height: size }}
      {...rest}
    />
  );
}

export function Divider({
  orientation = "horizontal",
  className,
}: {
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  return (
    <hr
      className={cx("divider", orientation === "vertical" && "divider-vertical", className)}
      aria-orientation={orientation}
    />
  );
}

export type MetadataLabelProps = Omit<ComponentPropsWithoutRef<"span">, "className"> & {
  tone?: "muted" | "strong" | "ink" | "accent" | "moss";
  /** Let it wrap instead of holding one line. */
  wrap?: boolean;
  className?: string;
};

/** Always Inter 500 12px uppercase, tracking .08em. Never hand-rolled. */
export function MetadataLabel({ tone = "muted", wrap = false, className, children, ...rest }: MetadataLabelProps) {
  return (
    <span
      className={cx(
        "meta",
        tone === "strong" && "meta-strong",
        tone === "ink" && "meta-ink",
        tone === "accent" && "meta-accent",
        tone === "moss" && "meta-moss",
        wrap && "meta-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

export type PaginationProps = {
  page: number;
  pages: number;
  hrefFor: (page: number) => string;
  className?: string;
};

export function Pagination({ page, pages, hrefFor, className }: PaginationProps) {
  const hasPrevious = page > 1;
  const hasNext = page < pages;

  return (
    <nav className={cx("pagination", className)} aria-label="Pagination">
      {hasPrevious ? (
        <TextButton href={hrefFor(page - 1)} tone="strong">
          Previous
        </TextButton>
      ) : (
        <span className="text-btn opacity-50" aria-disabled>
          Previous
        </span>
      )}
      <MetadataLabel className="mx-auto">
        Page {page} of {pages}
      </MetadataLabel>
      {hasNext ? (
        <TextButton href={hrefFor(page + 1)} tone="strong">
          Next
        </TextButton>
      ) : (
        <span className="text-btn opacity-50" aria-disabled>
          Next
        </span>
      )}
    </nav>
  );
}

// ─── editor rows ────────────────────────────────────────────────────────────

function CheckMark() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={11}
      height={11}
      fill="none"
      stroke="var(--paper)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8.4l3.2 3.2L13 4.8" />
    </svg>
  );
}

export type ChecklistItemProps = Omit<ComponentPropsWithoutRef<"input">, "className" | "type"> &
  StateProps & {
    /** A row the system enforces: shown ticked, not operable, with a note. */
    enforced?: boolean;
    note?: ReactNode;
    noteTone?: "muted" | "accent" | "moss";
  };

/**
 * A real checkbox behind the styled box, so it works without JavaScript and
 * announces itself correctly. Unchecked border is --edge.
 */
export function ChecklistItem({
  enforced = false,
  note,
  noteTone = "muted",
  className,
  force,
  loading = false,
  children,
  disabled,
  checked,
  defaultChecked,
  ...rest
}: ChecklistItemProps) {
  if (enforced) {
    return (
      <div className={cx("check-row", className)} {...stateAttrs({ force, loading })}>
        <span className="checkbox opacity-50" data-on={checked || defaultChecked ? "true" : undefined}>
          <CheckMark />
        </span>
        <span className="check-label">{children}</span>
        {note && (
          <MetadataLabel tone={noteTone} className="pt-[2px]">
            {note}
          </MetadataLabel>
        )}
      </div>
    );
  }

  return (
    <label
      className={cx("check-row cursor-pointer", className)}
      // The focus ring belongs on the box, not on the whole row.
      data-force={force === "focus" ? undefined : force}
      data-loading={loading ? "true" : undefined}
    >
      <input
        type="checkbox"
        className="sr-only"
        disabled={disabled || loading}
        checked={checked}
        defaultChecked={defaultChecked}
        {...rest}
      />
      <span className="checkbox" data-force={force === "focus" ? "focus" : undefined}>
        <CheckMark />
      </span>
      <span className="check-label">{children}</span>
      {note && (
        <MetadataLabel tone={noteTone} className="pt-[2px]">
          {note}
        </MetadataLabel>
      )}
    </label>
  );
}

export type LensPickerRowProps = Omit<ComponentPropsWithoutRef<"input">, "className" | "type"> &
  StateProps & {
    /** The lens as it is set on screen. `name` stays the form field name. */
    label: ReactNode;
    definition: ReactNode;
    selected?: boolean;
  };

/** The definition is set inline, so the writer picks a method, not a word. */
export function LensPickerRow({
  label,
  definition,
  selected = false,
  className,
  force,
  loading = false,
  disabled,
  ...rest
}: LensPickerRowProps) {
  return (
    <label
      className={cx("lens-row", !disabled && "cursor-pointer", className)}
      data-on={selected ? "true" : undefined}
      aria-disabled={disabled || undefined}
      {...stateAttrs({ force, loading })}
    >
      <input type="checkbox" className="sr-only" defaultChecked={selected} disabled={disabled} {...rest} />
      <span className="lens-row-name">{label}</span>
      <span className="lens-row-def">{definition}</span>
      <MetadataLabel tone={selected ? "ink" : "muted"} className="md:text-right">
        {selected ? "Selected" : "Add"}
      </MetadataLabel>
    </label>
  );
}

export type SelfAuditRowProps = {
  kind: ClaimKind;
  /** Eight words, formatting stripped. It is a mirror, not a judgement. */
  words: string;
  className?: string;
};

export function SelfAuditRow({ kind, words, className }: SelfAuditRowProps) {
  return (
    <div className={cx("audit-row", className)}>
      <span>
        <ClaimBadge kind={kind} />
      </span>
      <span className="audit-text">{words}…</span>
    </div>
  );
}
