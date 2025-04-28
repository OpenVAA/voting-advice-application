export type TermProps = {
  /**
   * The text to show in the definition popup.
   */
  definition: string;
  /**
   * Position of the tooltip relative to the term.
   * @default "bottom"
   */
  position?: 'top' | 'bottom';
  /**
   * Whether to show the underline styling
   * @default true
   */
  showUnderline?: boolean;
  /**
   * Whether to force show the tooltip
   * @default false
   */
  forceShow?: boolean;
};
