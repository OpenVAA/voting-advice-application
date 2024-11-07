import type { SvelteHTMLElements } from 'svelte/elements';
export type PreHeadingProps = SvelteHTMLElements['p'] & {
  /**
   * The Aria role description of the `<p>` element representing
   * the pre-title.
   *
   * @default $t('aria.preHeading')
   */
  'aria-roledescription'?: string | null;
};
