import {
  AnswerValue,
  MultipleChoiceCategoricalQuestion,
  QUESTION_TYPE,
  QuestionVariant,
  QuestionVariantClass,
  SimpleQuestionType,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion,
} from '../internal';

/**
 * The type for all `Answer.value` formatters.
 * @param value - The value of the answer which, in case of `ChoiceQuestion`s, has already been resolved to the corresponding label.
 * @param question - The `Question` toi which the `Answer` is.
 * @param locale - The optional locale to use. If not defined, the default locale will be used.
 * @returns A formatted string representing the answer.
 */
export type AnswerFormatter<TType extends SimpleQuestionType> = ({
  locale,
  value,
  question,
}: {
  locale?: string | null;
  value: AnswerValue[TType];
  question: CompatibleQuestionVariants<TType>;
}) => string;

/**
 * Map a `SimpleQuestionType` to its related `QuestionType` and possible matching `ChoiceQuestion`s.
 */
export type CompatibleQuestionVariants<TType extends SimpleQuestionType> =
  | QuestionVariantClass[TType]
  | (TType extends typeof QUESTION_TYPE.Text
      ? SingleChoiceCategoricalQuestion | SingleChoiceOrdinalQuestion
      : TType extends typeof QUESTION_TYPE.MultipleText
      ? MultipleChoiceCategoricalQuestion
      : never);

/**
 * The type for the `MISSING_VALUE` formater.
 * @param question - The `Question` toi which the `Answer` is missing.
 * @returns A formatted string representing the missing answer.
 */
export type MissingAnswerFormatter = ({
  locale,
  question,
}: {
  locale?: string | null;
  question: QuestionVariant;
}) => string;
