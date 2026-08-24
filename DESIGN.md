# Lensa — permanent constraints

These are not preferences. Breaking one stops the product being Lensa.
Tokens and the classes that carry them live in `src/app/globals.css`.

## No machine-authored content

No screen may contain generated text, an assistant persona, a chat interface, or
an avatar representing a machine. Every word visible here was written by a
person. Permanent, not a scope cut.

Deliberately absent, and not to be reintroduced: an AI sparring panel, generated
counterarguments, suggested lenses, automatic speculation detection. Their
purposes survive as manual equivalents — the pre-publish checklist the writer
ticks themselves, the lens picker showing each definition inline, and the self
audit that mirrors the writer's own claim types back at them.

## No shadows

`box-shadow` and `text-shadow` are reset to `none !important` on `*`. Depth is
the hairline (`--rule`) and the raised ground (`--raised`). No exception.

## Geometry

- Radius 2px for controls, 0 for cards. Every Tailwind radius scale — including
  `--radius-full` — maps to 2px, so `rounded-full` cannot produce a pill. Square
  avatars, never circles.
- The essay measure never exceeds 680px at any width. Surplus viewport becomes
  margin, never a longer line. Page container caps at 1080px, then centres.
- Control height 44px. Text buttons take their 44px target from
  `::after { inset: -12px -8px }`, so the underline hugs the text and nothing on
  the page shifts.

## Type

Literata for essay body, titles and form values. Inter for UI, metadata labels
and buttons. A metadata label is always Inter 500 12px uppercase, tracking .08em
— that is the `.meta` class, and it should never be hand-rolled.

## Token discipline

- `--rule` — dividers, card borders, toast borders, row separators, disabled
  controls. Nothing interactive at rest.
- `--edge` — the boundary of anything interactive at rest: input/textarea/select
  underlines, secondary button borders, the search field, unselected lens chips,
  unchecked checkboxes. `--rule` measures 1.3:1 on paper and fails as a control
  boundary; `--edge` is 3.4:1.
- `--focus` — a 2px outline at 2px offset on every interactive element. Never
  removed, never replaced by the browser default.
- `--accent` (oxblood) means exactly four things: a contested claim, an error, a
  destructive action, an unsourced citation. It is never the focus ring and never
  the wordmark.

## Claim badges

Textual is moss with `border-left: 3px solid`. Interpretive is ochre with
`2px solid`. Speculative is violet with `2px dashed`. Label, tint and border
weight all differ — colour is never the only distinction, and simplifying this to
colour alone breaks it for anyone who cannot use it.

## Loading

Loading is a static state: opacity down plus a small caps label (`.loading`). No
spinner, no skeleton shimmer, anywhere.

## Breakpoints — 640 / 1024 / 1280

Below 1024 the margin badge becomes an inline label above the paragraph, the left
rail becomes a 200px drawer, and the citation drawer becomes a bottom sheet. At
1024 and up the badge returns to a 132px margin column with a 32px gutter, and
the rail is permanent with its labels always set. At 1280 and up the citation
drawer sits beside the measure rather than over it.

## Scope decisions

- Citation enforcement is a warning, not a blocker. An unsourced Textual claim
  publishes demoted to Interpretive with a dashed underline until it is sourced
  (`effectiveClaimKind` in `src/lib/types.ts`).
- The steelman gate is the one hard stop, and it applies only to counterpoints.

## The component library

`src/components/kit` holds the typed components. Build new UI from it rather than
from raw class names, and add to it rather than around it. Every component takes
a `className` and writes no colour of its own.

Both invariants above are enforced by the class, not the component, so older
markup that still applies `.text-btn` or `.field` directly is equally covered.
`/design/states` renders the whole inventory in both themes; it ships with the
app on purpose, because a states page kept in a separate tool stops matching the
product. Hover, focus and active are rendered there through a `force` prop whose
CSS rule also lists the real pseudo-class, so a specimen cannot drift.

## Architecture

Server Components by default; a Client Component only where state is genuinely
required. Filters and sorts go through `searchParams`, not state, so they survive
without JavaScript and can be shared as URLs. Rail collapse and theme persist in
cookies read on the server and flipped by Server Actions — there is no client
store for chrome.
