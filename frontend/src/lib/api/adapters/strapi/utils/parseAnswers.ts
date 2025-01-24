import { isLocalizedString } from '@openvaa/app-shared';
import { formatId } from '$lib/api/utils/formatId';
import { translate } from '$lib/i18n';
import type { Answers } from '@openvaa/data';
import type { LocalizedAnswers } from '$lib/api/base/dataWriter.type';

/**
 * Translate answers stored as json.
 * @param answers - Answer json from Strapi
 * @param locale - Optional locale to use for translating localized strings
 * @returns An `Answers` object
 */
export function parseAnswers(answers: LocalizedAnswers | null, locale: string | null): Answers | undefined {
  if (!answers) return undefined;
  const dict = {} as Answers;
  Object.entries(answers).forEach(([questionId, answer]) => {
    if (!answer) return;
    const { info, value } = answer;
    const qid = formatId(questionId);
    const translated = isLocalizedString(value) ? translate(value, locale) : value;
    dict[qid] = {
      value: translated instanceof Date ? translated.toISOString() : translated,
      info: translate(info, locale)
    };
  });
  return dict;
}
