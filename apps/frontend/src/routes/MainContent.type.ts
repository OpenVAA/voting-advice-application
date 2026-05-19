import type { Snippet } from 'svelte';
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
   * Optional `aria-label` for the section that contains the primary page actions. @default t('aria.primaryActionsLabel')
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
  /**
   * Optional content for the complementary notification displayed at the top of the page.
   */
  note?: Snippet;
  /**
   * An optional hero image.
   */
  hero?: Snippet;
  /**
   * Optional content for the main title block, defaults to a `<h1>` element containing the required `title` property.
   */
  heading?: Snippet;
  /**
   * Optional full width content displayed between the default slot and `primaryActions`.
   */
  fullWidth?: Snippet;
  /**
   * Optional content for the primary actions displayed at the bottom of the page.
   */
  primaryActions?: Snippet;
  /**
   * Default content of the page.
   */
  children?: Snippet;
};
