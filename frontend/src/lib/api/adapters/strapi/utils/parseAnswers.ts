import { formatId } from '$lib/api/utils/formatId';
import { translate } from '$lib/i18n/utils/translate';
import type { Serializable } from '@openvaa/core';
import type { Answers } from '@openvaa/data';
import type { StrapiAnswerData, StrapiRelation } from '../strapiData.type';

/**
 * Parse Strapi Answer data.
 * NB. Answers whose question property is `null` are excluded. This can happen when questions are converted to drafts later.
 * @param answers Answer data from Strapi
 * @param locale Optional locale to use for translating localized strings
 * @returns The Answers as AnswerProps
 */
export function parseAnswers(answers: StrapiRelation<StrapiAnswerData>, locale: string | null): Answers | undefined {
  if (!answers) return undefined;
  const dict = {} as Answers;
  answers.data.forEach((a) => {
    const { openAnswer, value, question } = a.attributes;
    const qid = formatId(question?.data.id);
    if (qid == null) throw new Error(`Missing question id in answer ${a.id}`);
    dict[qid] = {
      value: dateToString(isLocalized(value) ? translate(value, locale) : value),
      info: translate(openAnswer, locale)
    };
  });
  return dict;
}

/**
 * Convert a possible `Date` to string but otherwise do nothing.
 */
function dateToString(value: Date | Serializable): Serializable {
  return value instanceof Date ? value.toISOString() : value;
}

/**
 * Quick and dirty test to check whether and object may be a localized string
 */
function isLocalized(value: unknown): value is LocalizedString {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
