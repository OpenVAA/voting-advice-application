import type { AnyQuestionVariant, QuestionCategory } from '@openvaa/data';

/**
 * The `Question`s in the selected `QuestionCategory`s as well as some utility methods.
 * This unseemly structure is needed to allow custom ordering of `Question`s and also to bypass having to call `getApplicableQuestions` for each `QuestionCategory`.
 */

export type QuestionBlocks = {
  /**
   * The `Question`s in the selected `QuestionCategory`s as an array of arrays. Only applicable `Question`s are included, and their order can be changed by the `start` parameter which sets the first `Question` to use.
   */
  blocks: Array<QuestionBlock>;
  /**
   * The `Question`s in the blocks as an array.
   */
  questions: Array<AnyQuestionVariant>;
  /**
   * Find a `QuestionBlock` by its `QuestionCategory`.
   * @param category - The `QuestionCategory` to find.
   * @returns The block and its index, or `undefined` if not found.
   */
  getByCategory: (category: QuestionCategory) => { block: QuestionBlock; index: number } | undefined;
  /**
   * Find a `QuestionBlock` by a `Question` contained in it.
   * @param question - The `Question` to find.
   * @returns The block, its index within the block and its index in all, or `undefined` if not found.
   */
  getByQuestion: (
    question: AnyQuestionVariant
  ) => { block: QuestionBlock; index: number; indexInBlock: number; indexOfBlock: number } | undefined;
};
/**
 * An array of `Question`s.
 */

export type QuestionBlock = Array<AnyQuestionVariant>;
