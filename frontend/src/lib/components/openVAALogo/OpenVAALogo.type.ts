import type {SvelteHTMLElements} from 'svelte/elements';
import type {Color} from '$lib/components/shared/colors';

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
   * For arbitrary values, you can supply a `class` property, such as
   * `h-[3.15rem] w-[3.15rem]`.
   *
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | null;

  /**
   * The color of the logo as one of the predefined colours.
   * For arbitrary values, you can supply a `class` property, such as
   * `fill-[#123456]`.
   *
   * @default 'neutral'
   */
  color?: Color | null;
};
