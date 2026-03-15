import type { Answer, Answers } from '@openvaa/data';
import type { Readable } from 'svelte/store';
import type { Frozen } from '$lib/utils/freeze';

/**
 * An extended store for holding the voter's `Answer`s. The answers can be read in the ordinary way, but setting and deleting them can only be done using the dedicated methods.
 * The returned `Answers` are frozen to prevent accidental modifications.
 */
export type AnswerStore = Readable<Frozen<Answers>> & {
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
