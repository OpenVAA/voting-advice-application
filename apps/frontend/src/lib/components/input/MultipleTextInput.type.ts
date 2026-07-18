import type { HTMLAttributes } from 'svelte/elements';

/**
 * Props for the `MultipleTextInput` component.
 *
 * A row-list input for `MultipleTextQuestion`s whose answer value is an
 * `Array<string>` (D-01). Each value is an opaque, plain (non-multilingual)
 * string — multilingual `multipleText` values are out of this phase's input
 * scope. Empty rows are dropped on save and duplicates are preserved (D-02).
 */
export type MultipleTextInputProps = Omit<HTMLAttributes<HTMLDivElement>, 'value' | 'id' | 'onchange'> & {
  /**
   * The current value: an array of opaque strings. Empty/absent → renders the
   * `minItems` floor of empty rows (or a single empty row when `minItems` is
   * unset). @default undefined
   */
  value?: Array<string> | null;
  /**
   * The label shown above the row list.
   */
  label: string;
  /**
   * Additional info displayed below the row list.
   */
  info?: string;
  /**
   * If `locked` the inputs and controls are disabled and a lock badge is shown.
   */
  locked?: boolean;
  /**
   * The id used to derive per-row input ids and the label association. If not
   * provided, a unique id is generated.
   */
  id?: string;
  /**
   * Minimum number of rows (D-02). When `> 1`, that many rows are rendered
   * initially and per-row removal is prevented below this floor. @default 1
   */
  minItems?: number;
  /**
   * Maximum number of rows (D-02). When set, the Add button is disabled once
   * the row count reaches this ceiling.
   */
  maxItems?: number;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background.
   * @default false
   */
  onShadedBg?: boolean;
  /**
   * Event handler triggered when the value changes with the new value: the
   * on-screen rows with empty rows dropped, order preserved, duplicates kept.
   */
  onChange?: (value: Array<string>) => void;
};
