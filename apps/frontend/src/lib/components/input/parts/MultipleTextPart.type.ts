/**
 * Props for the `MultipleTextPart` component — the row list `Input` renders for its multi-text kinds.
 *
 * This contract came with the part: it was the prop contract of the standalone `MultipleTextInput` component the part absorbed. What moved with the rows stayed; what belongs to the owning `Input` — the outer container, the group label, the info text, the lock badge and the shaded-background flag — left, because `Input` renders all of those for every kind.
 *
 * Each value is an opaque string: no numeric coercion, no de-duplication, no sorting, no case folding and no Unicode normalization. Empty rows are dropped on emission and duplicates are preserved. When `multilingual`, emptiness is decided per locale by the same trim rule, so a row that is empty in the displayed locale but written in another survives.
 */
export type MultipleTextPartProps = {
  /**
   * The id of the owning `Input`. Per-row field ids are derived from it, and the group label it renders is referenced as `{id}-label` by every field's `aria-labelledby`.
   */
  id: string;
  /**
   * The current value. An array of opaque strings, or — when `multilingual` — an array of localized strings, one per row. An array of plain strings is also accepted when `multilingual`, and each such row is read as the displayed locale's text, mirroring how `Input` widens a plain string into a localized one for its single-language multilingual kinds. Empty or absent renders the `minItems` floor of empty rows (or a single empty row when `minItems` is unset). @default undefined
   */
  value?: Array<string> | Array<LocalizedString> | null;
  /**
   * Whether every row renders one field per supported locale rather than a single plain field.
   * @default false
   */
  multilingual?: boolean;
  /**
   * Whether the non-displayed locales are revealed. Only meaningful when `multilingual`. @default false
   */
  isTranslationsVisible?: boolean;
  /**
   * Whether the rows and their controls are disabled. @default false
   */
  disabled?: boolean;
  /**
   * Minimum number of rows. When `> 1`, that many rows are rendered initially and per-row removal is prevented below this floor. Reordering is allowed even at the floor. @default 1
   */
  minItems?: number;
  /**
   * Maximum number of rows. When set, the Add button is disabled once the row count reaches this ceiling. @default undefined
   */
  maxItems?: number;
  /**
   * The owning `Input`'s focus-target array, indexed by row and then by locale position. `Input` refocuses its first entry after the translation toggle is pressed.
   */
  mainInputs: Array<HTMLElement>;
  /**
   * Event handler triggered on every edit, add, remove or reorder with the new value: the on-screen rows with empty rows dropped, order preserved and duplicates kept. An array of plain strings, or — when `multilingual` — an array of localized strings carrying only the locales actually written.
   */
  onChange?: (value: Array<string> | Array<LocalizedString>) => void;
};
