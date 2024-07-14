import type { Question } from '$lib/types/candidateAttributes';

export type RenderQuestionProps = {
  /**
   * The question to be rendered
   */
  question: Question;

  /**
   * All the questions belonging to the same category
   */
  categoryQuestions: Array<Question>;
};
