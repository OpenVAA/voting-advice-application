import type { AriaRole, SvelteHTMLElements } from 'svelte/elements';
export type HeadingGroupProps = SvelteHTMLElements['hgroup'] & {
  /**
   * The Aria role description of the `<hgroup>` element.
   *
   * @default $t('aria.headingGroup')
   */
  'aria-roledescription'?: string | null;
  /**
   * The Aria role of the `<hgroup>` element.
   *
   * @default 'group'
   */
  role?: AriaRole | null;
};
