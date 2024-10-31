/**
 * The type for an image associated with an answer. The type is an interface for easy extendability.
 */
export interface Image {
  /**
   * The alt text of the image.
   */
  alt?: string;
  /**
   * The url of the default image.
   */
  url: string;
  /**
   * The url of the dark mdoe image in the defaul resolution.
   */
  urlDark?: string;
}
