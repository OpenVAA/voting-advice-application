import { locale, t } from '$lib/i18n';
import { logDebugError } from '$lib/utils/logger';
import { checkUrl } from './links';

// Utilities for getting Answers to Questions from Candidates and formatting them
// TODO: These will be deprecated when we get proper Classes defs and methods for Question objects using the @openvaa/data module.

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
export function getLikertAnswer(entity: EntityProps, question: QuestionProps): AnswerProps<number> | undefined {
  if (question.type !== 'singleChoiceOrdinal') {
    logDebugError(`getLikertAnswer: Question ${question.id} is not a Likert question.`);
    return undefined;
  }
  const answer = getAnswer(entity, question);
  if (answer?.value == null) return undefined;
  const value = typeof answer.value === 'number' ? answer.value : parseInt(`${answer?.value}`);
  if (isNaN(value)) {
    logDebugError(`getLikertAnswer: Answer ${answer.value} to ${question.id} is not a number.`);
    return undefined;
  }
  return {
    value,
    openAnswer: answer.openAnswer
  };
}

/**
 * Fetch the entity's answer for the given question and return it as a string or arra of string that can be displayed to the user.
 * @param entity The Candidate object
 * @param question The Question object
 * @returns A string, an array of strings, or `undefined` if the answer is missing, invalid or would be an empty list
 */
export function getAnswerForDisplay(entity: EntityProps, question: QuestionProps): string | Array<string> | undefined {
  const { value } = getAnswer(entity, question) ?? {};
  if (value == null || value === '') return undefined;
  const qt = question.type;
  if (qt === 'boolean') return t.get(value ? 'common.answer.yes' : 'common.answer.no');
  if (qt === 'date') {
    const format =
      question.dateType && question.dateType in DATE_FORMATS
        ? DATE_FORMATS[question.dateType]
        : DATE_FORMATS.yearMonthDay;
    let date: Date | undefined;
    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    }
    if (date == null || isNaN(date.getTime())) {
      logDebugError(`Invalid date value ${value} for question ${question.id}`);
      return undefined;
    }
    return date.toLocaleDateString(locale.get(), format);
  }
  if (['singleChoiceOrdinal', 'singleChoiceCategorical'].includes(qt)) return getChoiceLabel(question, value);
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
function getChoiceLabels(question: QuestionProps, answers: AnswerProps['value']): Array<string> | undefined {
  if (!Array.isArray(answers)) {
    logDebugError(`Invalid question answers (${answers}) for question ${question.id}`);
    return undefined;
  }
  return answers.map((a) => getChoiceLabel(question, a)).filter((l) => l != null) as Array<string>;
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

/**
 * Check wheter an answer to a question in empty.
 * @param question The Question object
 * @param answer The Candidate's answer
 * @returns A boolean value indicating whether the answer is empty
 */
export function answerIsEmpty(question: QuestionProps, answer?: AnswerProps): boolean {
  if (!answer) return true;
  const answerValue = answer.value;
  if (question.type === 'boolean') {
    return answerValue == null;
  } else if (question.type === 'singleChoiceCategorical' || question.type === 'singleChoiceOrdinal') {
    return answerValue === '' || answerValue == null;
  } else if (question.type === 'multipleChoiceCategorical') {
    return Array.isArray(answerValue) && answerValue.length === 0;
  } else if (question.type === 'text' || question.type === 'link') {
    // Empty string or nullish object
    if (!answerValue) return true;
    // Localized string
    if (typeof answerValue === 'object') return Object.values(answerValue).every((value) => !value);
    // Non-empty string
    return false;
  } else if (question.type === 'date') {
    return answerValue === '' || answerValue == null;
  } else {
    throw new Error(`Unknown question type: ${question.type}`);
  }
}
