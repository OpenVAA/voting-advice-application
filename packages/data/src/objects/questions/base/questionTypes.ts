/**
 * The types of basic questions that do not have enumerated choices.
 */
export const SIMPLE_QUESTION_TYPE = {
  Text: 'text',
  Number: 'number',
  Boolean: 'boolean',
  Image: 'image',
  Date: 'date',
  MultipleText: 'multipleText'
} as const;

/**
 * The types of basic questions that do not have enumerated choices.
 */
export type SimpleQuestionType = (typeof SIMPLE_QUESTION_TYPE)[keyof typeof SIMPLE_QUESTION_TYPE];

/**
 * The types of enumerated questions where only a single choice can be selected.
 */
export const SINGLE_CHOICE_QUESTION_TYPE = {
  SingleChoiceOrdinal: 'singleChoiceOrdinal',
  SingleChoiceCategorical: 'singleChoiceCategorical'
} as const;

/**
 * The types of enumerated questions where only a single choice can be selected.
 */
export type SingleChoiceQuestionType = (typeof SINGLE_CHOICE_QUESTION_TYPE)[keyof typeof SINGLE_CHOICE_QUESTION_TYPE];

/**
 * The types of enumerated questions where multiple choices can be selected.
 */
export const MULTIPLE_CHOICE_QUESTION_TYPE = {
  MultipleChoiceCategorical: 'multipleChoiceCategorical'
  // PreferenceOrder: 'preferenceOrder', // TODO: Implement
} as const;

/**
 * The types of enumerated questions where multiple choices can be selected.
 */
export type MultipleChoiceQuestionType =
  (typeof MULTIPLE_CHOICE_QUESTION_TYPE)[keyof typeof MULTIPLE_CHOICE_QUESTION_TYPE];

/**
 * The types of all enumerated questions.
 */
export const CHOICE_QUESTION_TYPE = {
  ...SINGLE_CHOICE_QUESTION_TYPE,
  ...MULTIPLE_CHOICE_QUESTION_TYPE
} as const;

/**
 * The types of all enumerated questions.
 */
export type ChoiceQuestionType = (typeof CHOICE_QUESTION_TYPE)[keyof typeof CHOICE_QUESTION_TYPE];

/**
 * The types of any question. The `type` property of `QuestionData` determines the `Question` subclass that it uses.
 */
export const QUESTION_TYPE = {
  ...SIMPLE_QUESTION_TYPE,
  ...CHOICE_QUESTION_TYPE
} as const;

/**
 * The types of any question. The `type` property of `QuestionData` determines the `Question` subclass that it uses.
 */
export type QuestionType = (typeof QUESTION_TYPE)[keyof typeof QUESTION_TYPE];
