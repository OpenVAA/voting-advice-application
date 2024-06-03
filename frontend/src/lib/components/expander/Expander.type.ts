import type {SvelteHTMLElements} from 'svelte/elements';

export type ExpanderProps = SvelteHTMLElements['div'] & {
  /**
   * Title is seen as the text in the expander's visible part, and it is mandatory.
   * Title will also be used as a 'aria-label' for a checkbow on which the
   * expander operates on.
   */
  title: string;
  /**
   * The color of the next-icon that is used in the expander.
   *
   * @default 'primary'
   */
  iconColor?: Color;
  /**
   * The position of the next-icon that is used in the expander.
   *
   * @default 'text'
   */
  iconPos?: string;
  /**
   * Variable with which to configure the expanders title if no variants
   * are in use.
   */
  titleClass?: string;
  /**
   * Variable with which to configure the expanders content if no variants
   * are in use.
   */
  contentClass?: string;
  /**
   * Variable used to define if the expander is expanded or not by default.
   */
  defaultExpanded?: boolean;
  /**
   * Variable used to define a variant for the expander.
   */
  variant?: 'read-more' | 'category' | 'question';
};
