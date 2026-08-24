"use client";

import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { Button, MetadataLabel, TextButton, cx, type ForcedState, type Verdict } from "./primitives";
import { countWords } from "@/lib/types";

export type CounterTextareaProps = Omit<ComponentPropsWithoutRef<"textarea">, "className"> & {
  label: ReactNode;
  labelHidden?: boolean;
  /** Word budget. The count turns oxblood past it; nothing is truncated. */
  maxWords: number;
  verdict?: Verdict;
  note?: ReactNode;
  className?: string;
  controlClassName?: string;
  force?: ForcedState;
  loading?: boolean;
};

export function CounterTextarea({
  label,
  labelHidden = false,
  maxWords,
  verdict,
  note,
  className,
  controlClassName,
  force,
  loading = false,
  rows = 4,
  value,
  defaultValue,
  onChange,
  disabled,
  ...rest
}: CounterTextareaProps) {
  const [internal, setInternal] = useState(String(defaultValue ?? ""));
  const text = value !== undefined ? String(value) : internal;
  const words = countWords(text);
  const over = words > maxWords;

  return (
    <label className={cx("block", className)}>
      <span className="mb-3 flex items-baseline justify-between gap-4">
        <span className={cx(labelHidden ? "sr-only" : "label", "mb-0")}>{label}</span>
        <MetadataLabel tone={over ? "accent" : "muted"}>
          {words} / {maxWords} words
        </MetadataLabel>
      </span>
      <textarea
        rows={rows}
        className={cx("field", controlClassName)}
        data-verdict={verdict}
        data-force={force}
        data-loading={loading ? "true" : undefined}
        disabled={disabled || loading}
        value={value}
        defaultValue={defaultValue}
        onChange={(event) => {
          if (value === undefined) setInternal(event.target.value);
          onChange?.(event);
        }}
        {...rest}
      />
      {note && (
        <span className="verdict" data-verdict={verdict}>
          {note}
        </span>
      )}
    </label>
  );
}

export type SpoilerBlockProps = {
  /** Names the chapters it gives away, before you decide to see it. */
  covers: string;
  children: ReactNode;
  /** Render already open, for specimens and for readers who are caught up. */
  defaultRevealed?: boolean;
  className?: string;
};

/**
 * Blur is a filter, so the paragraph is already laid out underneath and
 * revealing never moves the scroll.
 */
export function SpoilerBlock({ covers, children, defaultRevealed = false, className }: SpoilerBlockProps) {
  const [revealed, setRevealed] = useState(defaultRevealed);

  return (
    <div className={cx("spoiler", className)}>
      <div className={revealed ? undefined : "gated"} aria-hidden={!revealed}>
        {children}
      </div>
      {!revealed && (
        <div className="gate">
          <MetadataLabel>{covers}</MetadataLabel>
          <Button caps onClick={() => setRevealed(true)} className="bg-[color:var(--raised)]">
            Reveal this paragraph
          </Button>
        </div>
      )}
    </div>
  );
}

export type ToastProps = {
  tone?: "neutral" | "done" | "error";
  title?: ReactNode;
  children: ReactNode;
  onDismiss?: () => void;
  className?: string;
  force?: ForcedState;
};

/** Border is --rule: a toast is a surface, not something you press. */
export function Toast({ tone = "neutral", title, children, onDismiss, className, force }: ToastProps) {
  return (
    <div
      className={cx("toast", className)}
      data-tone={tone === "neutral" ? undefined : tone}
      data-force={force}
      role={tone === "error" ? "alert" : "status"}
    >
      <span className="toast-body">
        {title && (
          <MetadataLabel
            tone={tone === "error" ? "accent" : tone === "done" ? "moss" : "muted"}
            className="mb-[6px] block"
          >
            {title}
          </MetadataLabel>
        )}
        {children}
      </span>
      {onDismiss && (
        <TextButton underline={false} onClick={onDismiss} className="mt-[2px]">
          Dismiss
        </TextButton>
      )}
    </div>
  );
}
