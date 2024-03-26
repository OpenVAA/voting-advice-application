import {locale, t} from '$lib/i18n';
import {logDebugError} from '$lib/utils/logger';

// Utilities for getting Answers to Questions from Candidates and formatting them
// TODO: These will be deprecated when we get proper Classes defs and methods for Question objects using the vaa-data module.

/**
 * Get the entity's answer for the given questions.
 * @param entity The Entity
 * @param question The Question object
 * @returns An `AnswerProps` object with the answer
 */
export function getAnswer(entity: EntityProps, question: QuestionProps): AnswerProps | undefined {
  return entity.answers[question.id] ?? undefined;
}

/**
 * Get the entity's Likert answer for the given question.
 * @param entity The Entity
 * @param question The Question object
 * @returns An `AnswerProps` object with an integer answer
 */
export function getLikertAnswer(entity: EntityProps, question: QuestionProps) {
  if (question.type !== 'singleChoiceOrdinal') {
    logDebugError(`getLikertAnswer: Question ${question.id} is not a Likert question.`);
    return {
      answer: undefined,
      openAnswer: undefined
    };
  }
  const answer = getAnswer(entity, question);
  return answer
    ? {
        value: answer.value as number,
        openAnswer: answer.openAnswer
      }
    : undefined;
}

/**
 * Fetch the entity's answer for the given question and return it as a string or arra of string that can be displayed to the user.
 * @param entity The Candidate object
 * @param question The Question object
 * @returns A string, an array of strings, or `undefined` if the answer is missing, invalid or would be an empty list
 */
export function getAnswerForDisplay(
  entity: EntityProps,
  question: QuestionProps
): string | string[] | undefined {
  const answer = getAnswer(entity, question);
  if (answer == null || answer.value === '') return undefined;
  const qt = question.type;
  if (qt === 'boolean')
    return t.get((answer.value as boolean) ? 'common.answerYes' : 'common.answerNo');
  if (qt === 'date') {
    const format =
      question.dateType && question.dateType in DATE_FORMATS
        ? DATE_FORMATS[question.dateType]
        : DATE_FORMATS.yearMonthDay;
    return new Date(answer.value as Date).toLocaleDateString(locale.get(), format);
  }
  if (['singleChoiceOrdinal', 'singleChoiceCategorical'].includes(qt))
    return getChoiceLabel(question, answer.value);
  if (['multipleChoiceCategorical', 'preferenceOrder'].includes(qt)) {
    const labels = getChoiceLabels(question, answer.value);
    return labels?.length ? labels : undefined;
  }
  if (['text', 'number'].includes(qt)) return `${answer.value}`;
  throw new Error('Not implemented');
}

/**
 * Get the translated label for a single choice question.
 * @param question The Question object
 * @param answer The Candidate's answer
 * @returns The answer's translated label or `undefined`
 */
function getChoiceLabel(question: QuestionProps, answer: AnswerProps['value']): string | undefined {
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
  answers: AnswerProps['value']
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
