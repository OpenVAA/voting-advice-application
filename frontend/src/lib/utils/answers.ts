import {locale, t} from '$lib/i18n';
import {logDebugError} from '$lib/utils/logger';
import {checkUrl} from './links';

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
      value: undefined,
      openAnswer: undefined
    };
  }
  const answer = getAnswer(entity, question);
  return answer
    ? {
        value: parseInt(answer.value),
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
  const {value} = getAnswer(entity, question) ?? {};
  if (value == null || value === '') return undefined;
  const qt = question.type;
  if (qt === 'boolean') return t.get(value ? 'common.answerYes' : 'common.answerNo');
  if (qt === 'date') {
    const format =
      question.dateType && question.dateType in DATE_FORMATS
        ? DATE_FORMATS[question.dateType]
        : DATE_FORMATS.yearMonthDay;
    const date = new Date(value);
    return `${date}` == 'Invalid Date' ? undefined : date.toLocaleDateString(locale.get(), format);
  }
  if (['singleChoiceOrdinal', 'singleChoiceCategorical'].includes(qt))
    return getChoiceLabel(question, value);
  if (['multipleChoiceCategorical', 'preferenceOrder'].includes(qt)) {
    const labels = getChoiceLabels(question, value);
    return labels?.length ? labels : undefined;
  }
  if (qt === 'linkList') {
    if (!Array.isArray(value)) {
      logDebugError(`Invalid linkList value ${value} for question ${question.id}`);
      return undefined;
    }
    return value.map((v) => `${v}`).filter((v) => checkUrl(v) != null);
  }
  if (qt === 'link') {
    return checkUrl(`${value}`);
  }
  if (['text', 'number'].includes(qt)) return `${value}`;
  throw new Error(`Question type ${qt} not implemented`);
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
