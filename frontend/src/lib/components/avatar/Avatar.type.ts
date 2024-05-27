import type {SvelteHTMLElements} from 'svelte/elements';

export type AvatarProps = SvelteHTMLElements['figure'] & {
  /**
   * The name of the entity. This is used either for the `alt` text of a possible image or the construction of a initials for a placeholder.
   */
  name: string;

  /**
   * The possible avatar image.
   */
  image?: ImageProps;

  /**
   * These can be provided to override the automatic initials construction.
   */
  initials?: string;

  /**
   * The size of the avatar. @default 'md'
   */
  size?: 'sm' | 'md';

  /**
   * The background color of the initials placeholder. @default 'base-300'
   */
  color?: Color;

  /**
   * The color of the initials text placeholder. @default 'neutral'
   */
  textColor?: Color;

  /**
   * A custom color string to use for the background color of the initials placeholder, e.g. in case of parties, which will override the `color` property. Make sure to define both `customColor` and `customColorDark` together.
   */
  customColor?: string | null;

  /**
   * A custom color string to use for the background color of the initials placeholder in dark mode, which will override the `color` property.
   */
  customColorDark?: string | null;

  /**
   * Whether to link the thumbnail to the full image. @default false
   */
  linkFullImage?: boolean;
};
