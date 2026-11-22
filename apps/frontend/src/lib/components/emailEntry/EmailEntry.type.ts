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

/**
 * Why the server did not take the address `showEmailError()` shows a message for: `in-use` for an address another account holds, `invited` for one an invitation was sent to, `too-many-attempts` for a request refused over the per-caller limit before the address was read.
 */
export type EmailEntryErrorReason = 'in-use' | 'invited' | 'too-many-attempts';
