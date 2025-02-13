import type { AriaRole, SvelteHTMLElements } from 'svelte/elements';

export type MainContentProps = SvelteHTMLElements['main'] & {
  /**
   * The required page `title`.
   */
  title: string;
  /**
   * Optional class string to add to the `<div>` tag wrapping the `note` slot.
   */
  noteClass?: string;
  /**
   * Aria role for the `note` slot. @default 'note'
   */
  noteRole?: AriaRole;
  /**
   * Optional `aria-label` for the section that contains the primary page actions. @default $t('aria.primaryActionsLabel')
   */
  primaryActionsLabel?: string | undefined | null;
  /**
   * Optional class string to add to the `<div>` tag wrapping the `title` slot.
   */
  titleClass?: string;
  /**
   * Optional class string to add to the `<div>` tag wrapping the `default` slot.
   */
  contentClass?: string;
};
