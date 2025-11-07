import type { Id } from '@openvaa/core';
import type { Answer } from '@openvaa/data';
import type { Readable } from 'svelte/store';
import type { Frozen } from '$lib/utils/freeze';

/**
 * An extended store for holding the voter's `Answer`s. The answers can be read in the ordinary way, but setting and deleting them can only be done using the dedicated methods.
 * The returned `VoterAnswers` are frozen to prevent accidental modifications.
 */
export type AnswerStore = Readable<Frozen<VoterAnswers>> & {
  /**
   * Set an answer for a specific question and optionally its weight, too.
   */
  setAnswer: (questionId: string, value: VoterAnswer['value'], options?: { weight?: number }) => void;
  /**
   * Set the weight for a specific question.
   */
  setWeight: (questionId: string, weight: number) => void;
  /**
   * Delete an answer for a specific question, including its weight.
   */
  deleteAnswer: (questionId: string) => void;
  /**
   * Reset the weight for a specific question, while retaining the answer value itself.
   */
  resetWeight: (questionId: string) => void;
  /**
   * Delete all answers and weights.
   */
  reset: () => void;
};

export type VoterAnswers = Record<Id, VoterAnswer | null | undefined>;

/**
 * The Voter answer may contain both the value and the weight, or either alone.
 */
export type VoterAnswer =
  | {
      /**
       * The answer value.
       */
      value: Answer['value'];
      /**
       * Possible weights for this answer. Default is `1`.
       */
      weight?: number | null;
    }
  | {
      /**
       * The answer value.
       */
      value?: Answer['value'];
      /**
       * Possible weights for this answer. Default is `1`.
       */
      weight: number;
    };
