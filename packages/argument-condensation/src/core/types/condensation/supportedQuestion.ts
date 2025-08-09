import type { BooleanQuestion, SingleChoiceCategoricalQuestion, SingleChoiceOrdinalQuestion } from '@openvaa/data';

/**
 * Represents a question that can be processed by the condensation system
 */
export type SupportedQuestion = BooleanQuestion | SingleChoiceOrdinalQuestion | SingleChoiceCategoricalQuestion;
