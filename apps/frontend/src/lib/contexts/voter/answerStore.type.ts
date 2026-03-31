import type { Answer, Answers } from '@openvaa/data';
import type { Frozen } from '$lib/utils/freeze';

/**
 * An extended reactive object for holding the voter's `Answer`s. The answers can be read via the `answers` getter, but setting and deleting them can only be done using the dedicated methods.
 * The returned `Answers` are frozen to prevent accidental modifications.
 */
export type AnswerStore = {
  /**
   * The current frozen answers.
   */
  readonly answers: Frozen<Answers>;
  /**
   * Set an answer for a specific question.
   */
  setAnswer: (questionId: string, value?: Answer['value']) => void;
  /**
   * Delete an answer for a specific question.
   */
  deleteAnswer: (questionId: string) => void;
  /**
   * Delete all answers.
   */
  reset: () => void;
};
