import type { SvelteHTMLElements } from 'svelte/elements';
import type { IconName } from './icons';

export type IconProps = SvelteHTMLElements['svg'] & {
  /** The name of the icon to use */
  name: IconName;

  /**
   * The size of the icon as one of the predefined sizes 'sm', 'md' or 'lg'. For arbitrary values, you can supply a `class` property, such as `h-[3.15rem] w-[3.15rem]`.
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | null;

  /**
   * The color of the icon as one of the predefined colours. For arbitrary values, use the `customColor` and `customColorDark` properties.
   * @default 'current'
   */
  color?: Color | null;

  /**
   * A custom color string to use for the icon, e.g. in case of parties, which will override the `color` property. Make sure to define both `customColor` and `customColorDark` together.
   */
  customColor?: string | null;

  /**
   * A custom color string to use for the icon in dark mode, which will override the `color` property.
   */
  customColorDark?: string | null;

  /**
   * Whether to horizontally mirror the icon under RTL. When `undefined` (the default), directional icons (see `DIRECTIONAL_ICONS`, e.g. `next`/`previous`) mirror automatically. Pass `false` to opt out — e.g. when an arrow is rotated into a vertical chevron — or `true` to force mirroring.
   */
  mirrored?: boolean | null;
};
