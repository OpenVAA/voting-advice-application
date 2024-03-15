import type {SvelteHTMLElements} from 'svelte/elements';

export type MatchScoreProps = SvelteHTMLElements['div'] & {
  /**
   * The match score as a `string` or a `number`. Note that if the score is a percentabe, you must include a %-sign in the `string`.
   */
  score: string | number;
  /**
   * The label to display under the score. @default $t('components.matchScore.label')
   */
  label?: string;
};
