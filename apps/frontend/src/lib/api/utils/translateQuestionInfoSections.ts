import { translate } from '$lib/i18n';
import type { LocalizedQuestionInfoSection, QuestionInfoSection } from '@openvaa/app-shared';

export function translateQuestionInfoSections(
  data: Array<LocalizedQuestionInfoSection> | null,
  locale: string | null
): Array<QuestionInfoSection> {
  if (data && Array.isArray(data)) {
    return data
      .filter((v) => v && typeof v === 'object')
      .flatMap((section) => {
        const { title, content } = section;
        return content && title
          ? {
              title: translate(title, locale),
              content: translate(content, locale)
            }
          : [];
      });
  }

  return [];
}
