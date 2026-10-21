import { isLocalizedString } from '@openvaa/app-shared';
import { formatId } from '$lib/api/utils/formatId';
import { translate } from '$lib/i18n';
import type { LocalizedString } from '@openvaa/app-shared';
import type { Answers } from '@openvaa/data';
import type { LocalizedAnswers } from '$lib/api/base/dataWriter.type';

/**
 * Whether `value` is a collection of localized strings — the shape a multilingual `multipleText` answer is stored in, one localized string per row.
 *
 * This is the single seam where a stored answer value is resolved to the reading locale, so a shape it does not recognize is passed through untranslated and then dropped downstream by the question's own value check. Without this arm a multilingual row list would save correctly and read back empty, losing the candidate's answer with no error anywhere. A `multipleChoice` answer is an array of plain id strings and is NOT matched, because a plain string is not a localized one.
 */
function isLocalizedStringArray(value: unknown): value is Array<LocalizedString> {
  return Array.isArray(value) && value.length > 0 && value.every((v) => isLocalizedString(v));
}

/**
 * Translate answers stored as json.
 * @param answers - Answer json.
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
    const translated = isLocalizedString(value)
      ? translate(value, locale)
      : isLocalizedStringArray(value)
        ? value.map((v) => translate(v, locale))
        : value;
    dict[qid] = {
      value: translated instanceof Date ? translated.toISOString() : translated,
      info: translate(info, locale)
    };
  });
  return dict;
}
