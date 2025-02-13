import { translate } from '$lib/i18n/utils/translate';
import type { StrapiAnswerData } from '../strapiDataProvider.type';

/**
 * Parse Strapi Answer data.
 * NB. Answers whose question property is `null` are excluded. This can happen when questions are converted to drafts later.
 * @param answers Answer data from Strapi
 * @param locale Optional locale to use for translating localized strings
 * @returns The Answers as LegacyAnswerProps
 */
export function parseAnswers(answers: Array<StrapiAnswerData>, locale?: string): LegacyAnswerDict {
  const dict = {} as LegacyAnswerDict;
  answers.forEach((a) => {
    const questionId = a.attributes.question?.data?.id;
    if (questionId == null) return;
    dict[`${questionId}`] = {
      value: isLocalized(a.attributes.value) ? translate(a.attributes.value, locale) : a.attributes.value,
      openAnswer: translate(a.attributes.openAnswer, locale)
    };
  });
  return dict;
}

/** Quick and dirty test to check whether and object may be a localized string */
function isLocalized(value: unknown): value is LocalizedString {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
