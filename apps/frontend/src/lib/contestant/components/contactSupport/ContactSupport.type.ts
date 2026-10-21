import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { ButtonProps } from '$lib/components/button';

/**
 * The fragment of the support section on the Help page. A `ContactSupport` block with the `'help'` action links to it, and the block the Help page renders carries it as its `id`.
 */
export const SUPPORT_ANCHOR = 'support';

export type ContactSupportProps = SvelteHTMLElements['div'] & {
  /**
   * Optional lead-in rendered above the button, e.g. a sentence saying when to contact support.
   */
  children?: Snippet;
  /**
   * Where the button leads: `'help'` links to the support section of the Help page, `'email'` opens an email to the support address. @default 'help'
   */
  action?: 'help' | 'email';
  /**
   * The variant of the button. @default 'prominent'
   */
  variant?: ButtonProps['variant'];
  /**
   * The position of the icon in the button. Passed to the `Button`. @default the `Button`’s own default for its variant
   */
  iconPos?: ButtonProps['iconPos'];
};
