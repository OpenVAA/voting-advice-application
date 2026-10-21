import type { SvelteHTMLElements } from 'svelte/elements';
import type { EntryWording } from '$lib/contestant/entryFlow';

/**
 * What the status region of the "email sent" body says: that a new email has been asked for, or that one can be asked for again.
 */
export type EmailSentStatus = 'requested' | 'ready';

export type EmailSentPanelProps = SvelteHTMLElements['div'] & {
  /**
   * Which first sentence is shown: for a sign-in link, for a password-recovery link, or for a link mailed to the address a used code was registered with.
   */
  wording: EntryWording;
  /**
   * The address the user typed, shown as text under "Sent to". Without one, no address is shown and the last sentence does not mention a typed address.
   */
  email?: string;
  /**
   * Whether to add the sentence saying that this email may not have been sent because another was asked for shortly before. @default false
   */
  askedAgain?: boolean;
  /**
   * What the polite status region says. Without one the region is empty.
   */
  status?: EmailSentStatus;
};
