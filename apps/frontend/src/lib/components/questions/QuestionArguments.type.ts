import type { AnyQuestionVariant } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionArgumentsProps = SvelteHTMLElements['div'] & {
  /**
   * The question whose arguments to display.
   */
  question: AnyQuestionVariant;
};
