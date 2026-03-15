import type { SvelteHTMLElements } from 'svelte/elements';

export type MatchScoreProps = SvelteHTMLElements['div'] & {
  /**
   * The match score as a `string` or a `number`. Note that `$t('components.matchScore.label')` will be used display the score.
   */
  score: string | number;
  /**
   * The label to display under the score. @default $t('components.matchScore.label')
   */
  label?: string;
  /**
   * Whether to show the label. @default true
   */
  showLabel?: boolean;
};
