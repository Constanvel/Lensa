/**
 * The Lensa component library.
 *
 * Every component is typed, takes a `className`, and writes no colour of its
 * own — the classes it applies live in `src/app/globals.css`, which is the only
 * file in the product allowed to hold a hex value.
 *
 * Two rules the library enforces rather than documents:
 * - Every text button gets its 44px target from `.text-btn::after`
 *   (`inset: -12px -8px`), so the underline hugs the text and nothing shifts.
 * - Every resting control boundary — inputs, selects, the search field,
 *   unchecked checkboxes, unselected chips, the secondary button — is `--edge`.
 *   `--rule` measures 1.3:1 on paper and fails as a control boundary.
 *
 * `/design/states` renders the whole inventory in both themes.
 */

export {
  cx,
  Button,
  PrimaryButton,
  SecondaryButton,
  TextButton,
  DestructiveAction,
  TextInput,
  Select,
  SearchField,
  LensChip,
  ClaimBadge,
  CitationChip,
  Avatar,
  Divider,
  MetadataLabel,
  Pagination,
  ChecklistItem,
  LensPickerRow,
  SelfAuditRow,
} from "./primitives";

export type {
  ForcedState,
  Verdict,
  ButtonProps,
  TextButtonProps,
  TextInputProps,
  SelectProps,
  SearchFieldProps,
  LensChipProps,
  ClaimBadgeProps,
  CitationChipProps,
  AvatarProps,
  MetadataLabelProps,
  PaginationProps,
  ChecklistItemProps,
  LensPickerRowProps,
  SelfAuditRowProps,
} from "./primitives";

export { CounterTextarea, SpoilerBlock, Toast } from "./client";

export type { CounterTextareaProps, SpoilerBlockProps, ToastProps } from "./client";
