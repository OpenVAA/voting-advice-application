import type { Image } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type ImageProps = SvelteHTMLElements['img'] & {
  /**
   * The `Image` object to display.
   */
  image: Image;
  /**
   * The preferred format of the image. The default one will be used if the format is not defined or not available.
   */
  format?: keyof NonNullable<Image['formats']>;
};
