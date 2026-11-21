import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';

export type PendingAddressPanelProps = SvelteHTMLElements['div'] & {
  /**
   * Called when "Use another email address" is pressed. The caller shows the email form, in this panel's `changeForm` or elsewhere.
   */
  onchangeaddress: () => void;
  /**
   * The test ids of "Send again", of the count in its label, of "Use another email address" and of the status region. Each screen that renders the panel passes its own.
   */
  testIds: { resend: string; countdown: string; change: string; status: string };
  /**
   * Whether "Send again" and "Use another email address" are left out, for a screen that shows something else in their place. The status region stays, and so does the count, which goes on from where it was when they are shown again. @default false
   */
  hideActions?: boolean;
  /**
   * Shown in place of "Use another email address", under "Send again", e.g. the form for another address.
   */
  changeForm?: Snippet;
};
