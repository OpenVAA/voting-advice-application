import { translate } from '$lib/i18n/utils';
import type { StrapiQuestionData } from '../strapiData.type';

export function parseQuestionInfoSections(
  data: StrapiQuestionData['attributes']['customData'],
  locale: string | null
): Array<QuestionInfoSection> {
  const out: Array<QuestionInfoSection> = [];

  for (const value of (data as CustomData['Question'])?.infoSections ?? []) {
    const { title, text, visible } = value as {
      text?: LocalizedString;
      title?: LocalizedString;
      visible?: boolean;
    };

    out.push({
      title: translate(title, locale) || '',
      text: translate(text, locale) || '',
      visible: Boolean(visible ?? false)
    });
  }

  return out;
}
