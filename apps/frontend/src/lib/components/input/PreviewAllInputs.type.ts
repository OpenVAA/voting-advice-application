import type { SvelteHTMLElements } from 'svelte/elements';

export type PreviewAllInputsProps = SvelteHTMLElements['div'] & {
  /**
   * Optional info text to display with inputs.
   */
  info?: string;
  /**
   * Whether inputs are locked. @default false
   */
  locked?: boolean;
};
