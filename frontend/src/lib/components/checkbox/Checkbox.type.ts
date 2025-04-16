import type { SvelteHTMLElements } from 'svelte/elements';

export type CheckboxProps = SvelteHTMLElements['label'] & {
  /**
   * The checked state of the checkbox.
   */
  checked?: boolean;
  /**
   * The name attribute for the checkbox input.
   */
  name: string;
  /**
   * The label text for the checkbox.
   */
  label: string;
  /**
   * Whether the checkbox is disabled.
   */
  disabled?: boolean;
};
