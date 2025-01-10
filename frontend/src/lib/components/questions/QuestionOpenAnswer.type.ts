import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionOpenAnswerProps = SvelteHTMLElements['div'] & {
  /**
   * The open answer content to show.
   */
  content: string;
};
