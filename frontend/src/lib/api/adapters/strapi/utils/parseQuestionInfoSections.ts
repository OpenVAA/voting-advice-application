import { translate } from '$lib/i18n';
import type { QuestionInfoSection } from '@openvaa/app-shared';
import type { StrapiQuestionData } from '../strapiData.type';

export function parseQuestionInfoSections(
  data: StrapiQuestionData['customData'],
  locale: string | null
): Array<QuestionInfoSection> {
  const infoSections = data?.infoSections;
  if (infoSections && Array.isArray(infoSections)) {
    return infoSections
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
