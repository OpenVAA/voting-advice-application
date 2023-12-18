import type {Color} from '$lib/components/shared/colors';

export type ExpanderProps = {
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
  iconColor?: Color | null;
  /**
   * The position of the next-icon that is used in the expander.
   *
   * @default 'text'
   */
  iconPos?: string | null;
  /**
   * Variable with which to configure the expanders title if no variants
   * are in use.
   */
  customizeTitle?: string | null;
  /**
   * Variable with which to configure the expanders content if no variants
   * are in use.
   */
  customizeContent?: string | null;
} & ( // Types of expanders which define their appearance.
  | {
      variant: 'readMore' | null;
    }
  | {
      variant?: 'category' | null;
    }
  | {
      variant?: 'question' | null;
    }
  | {
      variant?: 'unansweared-question' | null;
    }
);
