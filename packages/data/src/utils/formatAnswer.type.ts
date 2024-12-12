import {
  AnswerValue,
  AnyQuestionVariant,
  MultipleChoiceCategoricalQuestion,
  QUESTION_TYPE,
  QuestionVariant,
  SimpleQuestionType,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '../internal';

/**
 * The type for all `Answer.value` formatters.
 * @param value - The value of the answer which, in case of `ChoiceQuestion`s, has already been resolved to the corresponding label.
 * @param question - The `Question` to which the `Answer` is.
 * @param locale - The optional locale to use. If not defined, the default locale will be used.
 * @returns A formatted string or array of strings representing the answer.
 */
export type AnswerFormatter<TType extends Exclude<SimpleQuestionType, typeof QUESTION_TYPE.MultipleText>> = (args: {
  locale?: string | null;
  value: AnswerValue[TType];
  question: CompatibleQuestionVariants<TType>;
}) => string;

/**
 * The type for `Answer.value` formatters that have an array-type answer.
 * @param value - The value of the answer which, in case of `ChoiceQuestion`s, has already been resolved to the corresponding label.
 * @param question - The `Question` to which the `Answer` is.
 * @param locale - The optional locale to use. If not defined, the default locale will be used.
 * @param separator - The separator to use between the items in the array.
 * @param empty - The string to use when the array is empty.
 * @param map - An optional mapping function for the answer items.
 * @returns A formatted string or array of strings representing the answer.
 */
export type ArrayAnswerFormatter = (
  args: {
    value: AnswerValue[typeof QUESTION_TYPE.MultipleText];
    question: CompatibleQuestionVariants<typeof QUESTION_TYPE.MultipleText>;
    locale?: string | null;
  } & ArrayAnswerFormatterOptions
) => string;

export type ArrayAnswerFormatterOptions = {
  separator?: string;
  empty?: string;
  map?: (item: string) => string;
};

/**
 * The type for the `MISSING_VALUE` formater.
 * @param question - The `Question` to which the `Answer` is missing.
 * @returns A formatted string representing the missing answer.
 */
export type MissingAnswerFormatter = (args: { locale?: string | null; question: AnyQuestionVariant }) => string;

/**
 * Map a `SimpleQuestionType` to its related `QuestionType` and possible matching `ChoiceQuestion`s.
 */
export type CompatibleQuestionVariants<TType extends SimpleQuestionType> =
  | QuestionVariant[TType]
  | (TType extends typeof QUESTION_TYPE.Text
      ? SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion
      : TType extends typeof QUESTION_TYPE.MultipleText
        ? MultipleChoiceCategoricalQuestion
        : never);
