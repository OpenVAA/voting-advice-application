import type {SvelteHTMLElements} from 'svelte/elements';
import type {Color} from '$lib/components/shared/colors';

export type AvatarProps = SvelteHTMLElements['figure'] & {
  /**
   * The name of the entity. This is used either for the `alt` text of a possible image or the construction of a initials for a placeholder.
   */
  name: string;

  /**
   * The `src` of the avatar image.
   */
  src?: string;

  /**
   * These can be provided to override the automatic initials construction.
   */
  initials?: string;

  /**
   * The background color of the initials placeholder. @default 'base-300'
   */
  color?: Color;
};
