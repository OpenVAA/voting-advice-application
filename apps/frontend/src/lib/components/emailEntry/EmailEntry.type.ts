import type { SvelteHTMLElements } from 'svelte/elements';

export type EmailEntryProps = SvelteHTMLElements['div'] & {
  /**
   * Bindable: The address in the first field. @default ''
   */
  email?: string;
  /**
   * The base of the two controls' ids: the address takes `<id>-email` and its confirmation `<id>-confirmation`. @default a generated id
   */
  id?: string;
};
