import type {SvelteHTMLElements} from 'svelte/elements';
export type AppLogoProps = SvelteHTMLElements['div'] & {
  /**
   * The `alt` text for the logo image.
   */
  alt: string;
  /**
   * If `true`, the light and dark versions of the logo will be reversed.
   * Set to `true` if using the logo on a dark background.
   *
   * @default `false`
   */
  inverse?: boolean | null;
  /**
   * The size of the logo as one of the predefined sizes 'sm', 'md' or 'lg'.
   * For arbitrary values, you can supply a `class` attribute, such as
   * class="h-[3.5rem]"`.
   *
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | null;
};
