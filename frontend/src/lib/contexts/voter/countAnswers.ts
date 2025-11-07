import type { Answers, AnyQuestionVariant } from '@openvaa/data';
import type { VoterAnswers } from './answerStore.type';

/**
 * Count the number of non-empty answer in `answers` for the given `questions`. Use for checking whether we can compute matches.
 * TODO: Consider asserting that all answers are also valid.
 */
export function countAnswers({
  questions,
  answers
}: {
  questions: Array<AnyQuestionVariant>;
  answers: Answers | VoterAnswers;
}): number {
  const questionIds = new Set(questions.map((question) => question.id));
  return Object.entries(answers).filter(([key, answer]) => answer?.value != null && questionIds.has(key)).length;
}
