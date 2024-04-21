import {translate, translateObject} from '$lib/i18n/utils/translate';
import type {StrapiAnswerData} from '../getData.type';

// TODO: This check is currently removed because available locales
// in Strapi cannot be checked on the client side, which causes issues
// with the Cand App.
//
// /**
//  * @returns Locales supported by Strapi
//  */
// export function getSupportedLocales(): Promise<LocaleProps[]> {
//   const url = `${constants.BACKEND_URL}/api/i18n/locales`;
//   return fetch(url, {
//     headers: {
//       Authorization: `Bearer ${constants.STRAPI_TOKEN}`
//     }
//   })
//     .then((response) => {
//       return response.json().then((parsed: StrapiLocaleData[] | StrapiError) => {
//         if ('error' in parsed) throw new Error(parsed.error.message);
//         return parsed.map((d) => ({
//           code: d.code,
//           isDefault: d.isDefault ?? false
//         }));
//       });
//     })
//     .catch((e) => {
//       throw error(500, `${e}`);
//     });
// }

/** Quick and dirty test to check whether and object may be a localized string */
export function isLocalized(value: unknown): value is LocalizedString {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse Strapi Answer data
 * @param answers Answer data from Strapi
 * @param locale Optional locale to use for translating localized strings
 * @returns The Answers as AnswerProps
 */
export function parseAnswers(answers: StrapiAnswerData[], locale?: string): AnswerDict {
  const dict = {} as AnswerDict;
  answers.forEach((a) => {
    dict[`${a.attributes.question.data.id}`] = {
      value: isLocalized(a.attributes.value)
        ? translate(a.attributes.value, locale)
        : a.attributes.value,
      openAnswer: translate(a.attributes.openAnswer, locale)
    };
  });
  return dict;
}

/**
 * Parse a custom data object from Strapi. If its root has a `localized` property, its contents will be translated.
 */
export function parseCustomData(data: JSONData): JSONData {
  if (typeof data !== 'object' || data === null || !('localized' in data)) return data;
  const {localized, ...rest} = data;
  if (typeof localized !== 'object' || localized === null) return data;
  return {
    ...translateObject(localized as Record<string, unknown>),
    ...rest
  };
}
