import type {SvelteHTMLElements} from 'svelte/elements';

export type SurveyBannerProps = SvelteHTMLElements['div'] & {
  /**
   *The layout variant of the banner. @default default
   */
  variant?: 'default' | 'compact';
};
