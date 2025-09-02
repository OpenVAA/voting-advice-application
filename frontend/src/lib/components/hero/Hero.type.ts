import type { HeroContent } from '@openvaa/app-shared';
import type { SvelteHTMLElements } from 'svelte/elements';

export type HeroProps = SvelteHTMLElements['div'] & {
  /**
   * The content to display.
   */
  content: HeroContent;
};
