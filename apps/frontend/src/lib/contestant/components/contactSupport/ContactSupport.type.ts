import type { Snippet } from 'svelte';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { ButtonProps } from '$lib/components/button';
import type { IconName } from '$lib/components/icon';
import type { TranslationKey } from '$types';

/**
 * The fragment of the support section on the Help page. A `ContactSupport` block with the `'help'` action links to it, and the block the Help page renders carries it as its `id`.
 */
export const SUPPORT_ANCHOR = 'support';

export type ContactSupportProps = SvelteHTMLElements['div'] & {
  /**
   * Optional lead-in rendered above the button, e.g. a sentence saying when to contact support. Not rendered with `sentence`.
   */
  children?: Snippet;
  /**
   * The translation key of a sentence holding the placeholder `{contactSupportLink}`. With it the block is that sentence, one paragraph carrying the other attributes, with the link to support in place of the placeholder, and no button.
   */
  sentence?: TranslationKey;
  /**
   * Where the button or the link leads: `'help'` to the support section of the Help page, `'email'` to an email to the support address. @default 'help'
   */
  action?: 'help' | 'email';
  /**
   * The variant of the button. @default 'prominent'
   */
  variant?: ButtonProps['variant'];
  /**
   * The icon of the button, or `null` for a button with no icon. @default 'help' for the `'help'` action, 'feedback' for the `'email'` action
   */
  icon?: IconName | null;
  /**
   * The position of the icon in the button. Passed to the `Button`. @default the `Button`’s own default for its variant
   */
  iconPos?: ButtonProps['iconPos'];
};
