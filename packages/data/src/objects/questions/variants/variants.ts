import {
  BooleanQuestion,
  DataRoot,
  DateQuestion,
  ImageQuestion,
  MultipleChoiceCategoricalQuestion,
  MultipleTextQuestion,
  NumberQuestion,
  QUESTION_TYPE,
  type QuestionType,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion,
  TextQuestion
} from '../../../internal';

/**
 * Question variants
 * This file contains a utility function for creating question variants as well as type and class mappings for all concrete question types, i.e. those that are not abstract base classes.
 * NB. Make sure to update the types below whenever implemeting new question variants. The code below could most likely be refactored to get rid of some redundancy.
 */

/**
 * Create any question variant based on the `type` property of `data`.
 * @param data - Any question variant data.
 * @param root - The `DataRoot` object.
 * @returns A question variant instance.
 */
export function createQuestion<TType extends QuestionType>({
  data,
  root
}: {
  data: QuestionVariantDataType[TType];
  root: DataRoot;
}): QuestionVariantClass[TType] {
  return new QUESTION_VARIANT[data.type as TType]({ data, root });
}

/**
 * The constructor functions for each concrete question type, i.e., question variant.
 */
export const QUESTION_VARIANT: {
  [KType in QuestionType]: new ({
    data,
    root
  }: {
    data: QuestionVariantDataType[KType];
    root: DataRoot;
  }) => QuestionVariantClass[KType];
} = {
  [QUESTION_TYPE.Text]: TextQuestion,
  [QUESTION_TYPE.Number]: NumberQuestion,
  [QUESTION_TYPE.Boolean]: BooleanQuestion,
  [QUESTION_TYPE.Image]: ImageQuestion,
  [QUESTION_TYPE.Date]: DateQuestion,
  [QUESTION_TYPE.MultipleText]: MultipleTextQuestion,
  [QUESTION_TYPE.SingleChoiceOrdinal]: SingleChoiceOrdinalQuestion,
  [QUESTION_TYPE.SingleChoiceCategorical]: SingleChoiceCategoricalQuestion,
  [QUESTION_TYPE.MultipleChoiceCategorical]: MultipleChoiceCategoricalQuestion
  // [QUESTION_TYPE.PreferenceOrder]: PreferenceOrderQuestion, // TODO: Implement
} as const;

/**
 * A map of the concrete question classes by their question type.
 */
export type QuestionVariantClass = {
  [QUESTION_TYPE.Text]: TextQuestion;
  [QUESTION_TYPE.Number]: NumberQuestion;
  [QUESTION_TYPE.Boolean]: BooleanQuestion;
  [QUESTION_TYPE.Image]: ImageQuestion;
  [QUESTION_TYPE.Date]: DateQuestion;
  [QUESTION_TYPE.MultipleText]: MultipleTextQuestion;
  [QUESTION_TYPE.SingleChoiceOrdinal]: SingleChoiceOrdinalQuestion;
  [QUESTION_TYPE.SingleChoiceCategorical]: SingleChoiceCategoricalQuestion;
  [QUESTION_TYPE.MultipleChoiceCategorical]: MultipleChoiceCategoricalQuestion;
};

/**
 * Any concrete question.
 */
export type QuestionVariant = QuestionVariantClass[keyof QuestionVariantClass];

/**
 * A map of the concrete question constructors’ data arguments by their question type.
 */
export type QuestionVariantDataType = {
  [QUESTION_TYPE.Text]: ConstructorParameters<typeof TextQuestion>[0]['data'];
  [QUESTION_TYPE.Number]: ConstructorParameters<typeof NumberQuestion>[0]['data'];
  [QUESTION_TYPE.Boolean]: ConstructorParameters<typeof BooleanQuestion>[0]['data'];
  [QUESTION_TYPE.Image]: ConstructorParameters<typeof ImageQuestion>[0]['data'];
  [QUESTION_TYPE.Date]: ConstructorParameters<typeof DateQuestion>[0]['data'];
  [QUESTION_TYPE.MultipleText]: ConstructorParameters<typeof MultipleTextQuestion>[0]['data'];
  [QUESTION_TYPE.SingleChoiceOrdinal]: ConstructorParameters<typeof SingleChoiceOrdinalQuestion>[0]['data'];
  [QUESTION_TYPE.SingleChoiceCategorical]: ConstructorParameters<typeof SingleChoiceCategoricalQuestion>[0]['data'];
  [QUESTION_TYPE.MultipleChoiceCategorical]: ConstructorParameters<typeof MultipleChoiceCategoricalQuestion>[0]['data'];
};

/**
 * Any concrete question constructors’ data argument type.
 */
export type QuestionVariantData = QuestionVariantDataType[keyof QuestionVariantDataType];
