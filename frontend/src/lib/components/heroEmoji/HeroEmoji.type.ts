import type { SvelteHTMLElements } from 'svelte/elements';
export type HeroEmojiProps = SvelteHTMLElements['div'] & {
  /**
   *  The emoji to use. Note that all non-emoji characters will be removed. If `undefined` the component will not be rendered at all. @default `undefined`
   */
  emoji?: string;
};
