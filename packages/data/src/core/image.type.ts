/**
 * The type for an image associated with an answer or a data property. The type is an interface for easy extendability.
 */
export interface Image extends ImageBase {
  /**
   * Additional size formats of the image.
   */
  formats?: Record<string, ImageBase> | null;
}

interface ImageBase {
  /**
   * The alt text of the image.
   */
  alt?: string | null;
  /**
   * The url of the default image.
   */
  url: string;
  /**
   * The url of the dark mdoe image in the defaul resolution.
   */
  urlDark?: string | null;
}
