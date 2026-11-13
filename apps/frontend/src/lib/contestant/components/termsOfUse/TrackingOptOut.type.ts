import type { SvelteHTMLElements } from 'svelte/elements';

export type TrackingOptOutProps = SvelteHTMLElements['div'] & {
  /**
   * Bindable: Whether the user opts out of the collection of usage data. @default false
   */
  optOut?: boolean;
};
