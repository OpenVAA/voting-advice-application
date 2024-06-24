import type {_AnswerDict} from '$lib/_vaa-data/candidate.type';
import type {SerializableValue} from '$lib/_vaa-data/data.type';
import {translate} from '$lib/i18n/utils/translate';
import type {StrapiAnswerData} from '../strapiDataProvider.type';

/**
 * Parse Strapi Answer data.
 * NB. Answers whose question property is `null` are excluded. This can happen when questions are converted to drafts later.
 * @param answers Answer data from Strapi
 * @param locale Optional locale to use for translating localized strings
 * @returns The Answers as AnswerProps
 */
export function parseAnswers(answers: StrapiAnswerData[], locale?: string): _AnswerDict {
  const dict = {} as _AnswerDict;
  answers.forEach((a) => {
    const questionId = a.attributes.question?.data?.id;
    if (questionId == null) return;
    dict[`${questionId}`] = {
      value: dateToString(
        isLocalized(a.attributes.value) ? translate(a.attributes.value, locale) : a.attributes.value
      ),
      openAnswer: translate(a.attributes.openAnswer, locale)
    };
  });
  return dict;
}

function dateToString<TValue extends Date | SerializableValue>(value: TValue): SerializableValue {
  return value instanceof Date ? value.toISOString() : value;
}

/** Quick and dirty test to check whether and object may be a localized string */
function isLocalized(value: unknown): value is LocalizedString {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
