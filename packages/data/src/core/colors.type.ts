/**
 * The format for defining colors in a way that supports the default and dark themes. The type is an interface for easy extendability.
 */

export interface Colors {
  /**
   * The colour to use by default.
   */
  normal: string;
  /**
   * The color used when the dark theme is requested.
   */
  dark?: string | null;
}
