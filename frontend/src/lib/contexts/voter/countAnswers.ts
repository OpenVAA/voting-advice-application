import type { Answers, AnyQuestionVariant } from '@openvaa/data';

/**
 * Count the number of non-empty answer in `answers` for the given `questions`. Use for checking whether we can compute matches.
 * TODO: Consider asserting that all answers are also valid.
 */
export function countAnswers({
  questions,
  answers
}: {
  questions: Array<AnyQuestionVariant>;
  answers: Answers;
}): number {
  const questionIds = new Set(questions.map((question) => question.id));
  return Object.entries(answers).filter(([key, value]) => value != null && questionIds.has(key)).length;
}
