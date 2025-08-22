import { type AnyQuestionVariant, QUESTION_TYPE } from '@openvaa/data';
import { type SupportedQuestion } from '../../types';

/**
 * Type guard to check if a question is supported by the condensation system
 * @param question - Any question variant to check
 * @returns true if the question can be processed by argument condensation
 */
export function isSupportedQuestion(question: AnyQuestionVariant): question is SupportedQuestion {
  return (
    question.type === QUESTION_TYPE.Boolean ||
    question.type === QUESTION_TYPE.SingleChoiceOrdinal ||
    question.type === QUESTION_TYPE.SingleChoiceCategorical
  );
}
