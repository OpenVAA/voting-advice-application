import {locale, t} from '$lib/i18n';
import {logDebugError} from '$lib/utils/logger';

// Utilities for getting Answers to Questions from Candidates and formatting them
// TODO: These will be deprecated when we get proper Classes defs and methods for Question objects using the vaa-data module.

/**
 * Get the candidate's answer for the given questions.
 * @param candidate The Candidate
 * @param question The Question object
 * @returns An `AnswerProps` object with the answer
 */
export function getAnswer(candidate: CandidateProps, question: QuestionProps) {
  const match = candidate.answers?.find((a) => a.questionId === question.id);
  return {
    answer: match?.answer,
    openAnswer: match?.openAnswer
  };
}

/**
 * Get the candidate's Likert answer for the given question.
 * @param candidate The Candidate
 * @param question The Question object
 * @returns An `AnswerProps` object with an integer answer
 */
export function getLikertAnswer(candidate: CandidateProps, question: QuestionProps) {
  if (question.type !== 'singleChoiceOrdinal') {
    logDebugError(`getLikertAnswer: Question ${question.id} is not a Likert question.`);
    return {
      answer: undefined,
      openAnswer: undefined
    };
  }
  const {answer, openAnswer} = getAnswer(candidate, question);
  return {
    answer: answer as number,
    openAnswer
  };
}

/**
 * Fetch the candidate's answer for the given question and return it as a string or arra of string that can be displayed to the user.
 * @param candidate The Candidate object
 * @param question The Question object
 * @returns A string, an array of strings, or `undefined` if the answer is missing, invalid or would be an empty list
 */
export function getAnswerForDisplay(
  candidate: CandidateProps,
  question: QuestionProps
): string | string[] | undefined {
  const {answer} = getAnswer(candidate, question);
  if (answer == null || answer === '') return undefined;
  const qt = question.type;
  if (qt === 'boolean') return t.get((answer as boolean) ? 'common.answerYes' : 'common.answerNo');
  if (qt === 'date') {
    const format =
      question.dateType && question.dateType in DATE_FORMATS
        ? DATE_FORMATS[question.dateType]
        : DATE_FORMATS.yearMonthDay;
    return new Date(answer as Date).toLocaleDateString(locale.get(), format);
  }
  if (['singleChoiceOrdinal', 'singleChoiceCategorical'].includes(qt))
    return getChoiceLabel(question, answer);
  if (['multipleChoiceCategorical', 'preferenceOrder'].includes(qt)) {
    const labels = getChoiceLabels(question, answer);
    return labels?.length ? labels : undefined;
  }
  if (['text', 'number'].includes(qt)) return `${answer}`;
  throw new Error('Not implemented');
}

/**
 * Get the translated label for a single choice question.
 * @param question The Question object
 * @param answer The Candidate's answer
 * @returns The answer's translated label or `undefined`
 */
function getChoiceLabel(
  question: QuestionProps,
  answer: ReturnType<typeof getAnswer>['answer']
): string | undefined {
  const label = question.values?.find((v) => v.key === (answer as number))?.label;
  if (label == null) {
    logDebugError(`Invalid question choice ${answer} for question ${question.id}`);
    return undefined;
  }
  return label;
}

/**
 * Get the translated labels for a multiple choice question.
 * @param question The Question object
 * @param answer The Candidate's answer
 * @returns The answer's translated labels or `undefined`
 */
function getChoiceLabels(
  question: QuestionProps,
  answers: ReturnType<typeof getAnswer>['answer']
): string[] | undefined {
  if (!Array.isArray(answers)) {
    logDebugError(`Invalid question answers (${answers}) for question ${question.id}`);
    return undefined;
  }
  return answers.map((a) => getChoiceLabel(question, a)).filter((l) => l != null) as string[];
}

/**
 * The date formats passed to `new Date().toLocaleDateString()` when displaying dates.
 */
export const DATE_FORMATS: Record<DateType, Intl.DateTimeFormatOptions> = {
  yearMonthDay: {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  },
  yearMonth: {
    year: 'numeric',
    month: 'long'
  },
  monthDay: {
    month: 'long',
    day: 'numeric'
  },
  month: {
    month: 'long'
  },
  weekday: {
    weekday: 'long'
  }
};
