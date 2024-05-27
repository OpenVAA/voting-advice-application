import type {SvelteHTMLElements} from 'svelte/elements';
export type StretchBackgroundProps = SvelteHTMLElements['div'] & {
  /**
   * Optional named background color for the section.
   */
  bgColor?: Color;

  /**
   * The padding to apply to the contents with `default` matching the padding used on the basic page template. @default 'default'
   */
  padding?: 'default' | 'medium' | 'none';

  /**
   * Whether to stretch the background to the bottom of the page as well. @default false
   */
  toBottom?: boolean;
};
