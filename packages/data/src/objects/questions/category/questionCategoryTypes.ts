/**
 * The types of question categories.
 */
export const QUESTION_CATEGORY_TYPE = {
  /**
   * A background question that is not normally used for matching.
   */
  Info: 'info',
  /**
   * An opinion question that is normally used for matching.
   */
  Opinion: 'opinion',
  /**
   * The default type for a question category if it’s not specified.
   */
  Default: 'default'
} as const;

/**
 * The types of question categories.
 */
export type QuestionCategoryType = (typeof QUESTION_CATEGORY_TYPE)[keyof typeof QUESTION_CATEGORY_TYPE];
