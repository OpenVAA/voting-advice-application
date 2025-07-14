import { translate } from '$lib/i18n';
import type { QuestionInfoSection } from '@openvaa/app-shared';

export function parseQuestionInfoSections(data: Array<object>, locale: string | null): Array<QuestionInfoSection> {
  if (data && Array.isArray(data)) {
    return data
      .filter((v) => v && typeof v === 'object')
      .map((v) => v as Partial<QuestionInfoSection>)
      .flatMap((section) => {
        const { title, content, visible = true } = section;
        return content && title
          ? {
              title: translate(title, locale),
              content: translate(content, locale),
              visible
            }
          : [];
      });
  }

  return [];
}
