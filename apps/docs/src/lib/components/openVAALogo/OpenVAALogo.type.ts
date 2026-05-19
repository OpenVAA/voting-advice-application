import type { SvelteHTMLElements } from 'svelte/elements';

export type OpenVAALogoProps = SvelteHTMLElements['svg'] & {
  /**
   * The `<title>` of the SVG logo. Functions much the same way as the `alt``
   * attribute of an `<img>`.
   *
   * @default 'OpenVAA'
   */
  title?: string;

  /**
   * The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'.
   *
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | null;

  /**
   * The color of the logo as one of the predefined colours.
   *
   * @default 'neutral'
   */
  color?: 'primary' | 'secondary' | 'neutral' | null;
};
