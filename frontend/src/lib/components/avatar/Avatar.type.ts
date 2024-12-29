import type { SvelteHTMLElements } from 'svelte/elements';

export type AvatarProps = SvelteHTMLElements['figure'] & {
  /**
   * The entity for which to display the avatar.
   */
  entity: MaybeWrappedEntityVariant;
  /**
   * The size of the avatar. @default 'md'
   */
  size?: 'sm' | 'md';
  /**
   * Whether to link the thumbnail to the full image. @default false
   */
  linkFullImage?: boolean;
};
