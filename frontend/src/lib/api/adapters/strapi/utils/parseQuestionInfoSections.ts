import { translate } from '$lib/i18n';
import type { QuestionInfoSection } from '@openvaa/app-shared';

export function parseQuestionInfoSections(data: Array<object>, locale: string | null): Array<QuestionInfoSection> {
  const out: Array<QuestionInfoSection> = [];

  if (data && Array.isArray(data)) {
    for (const value of data) {
      if (!value || typeof value !== 'object') continue;
      const { title, content, visible } = value as {
        content?: LocalizedString;
        title?: LocalizedString;
        visible?: boolean;
      };
      if (title && content) {
        out.push({
          title: translate(title, locale),
          content: translate(content, locale),
          // True by default
          visible: visible !== false
        });
      }
    }
  }

  return out;
}
