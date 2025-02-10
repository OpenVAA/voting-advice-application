import { translate } from '$lib/i18n/utils';
import type { StrapiQuestionData } from '../strapiData.type';

export function parseQuestionInfoSections(
  data: StrapiQuestionData['attributes']['customData'],
  locale: string | null
): Array<QuestionInfoSection> {
  const out: Array<QuestionInfoSection> = [];

  if (data && typeof data === 'object' && 'infoSections' in data && Array.isArray(data.infoSections)) {
    for (const value of (data as CustomData['Question'])?.infoSections ?? []) {
      if (!value || typeof value !== 'object') continue;

      const { title, text, visible } = value as {
        text?: LocalizedString;
        title?: LocalizedString;
        visible?: boolean;
      };

      if (title && text) {
        out.push({
          title: translate(title, locale) || '',
          text: translate(text, locale) || '',
          visible: !!visible
        });
      }
    }
  }

  return out;
}
