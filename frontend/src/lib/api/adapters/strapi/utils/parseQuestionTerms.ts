import { translate, translateObject } from '$lib/i18n';
import type { TermDefinition } from '@openvaa/app-shared';
import type { StrapiQuestionData, StrapiQuestionTermDefinitionData } from '../strapiData.type';

export function parseQuestionTerms(
  data: StrapiQuestionData['customData'],
  locale: string | null
): Array<TermDefinition> {
  const terms = data?.terms;
  if (terms && Array.isArray(terms)) {
    return terms
      .filter((v) => v && typeof v === 'object')
      .map((v) => v as StrapiQuestionTermDefinitionData)
      .flatMap((term) => {
        const { triggers, title, content } = term;
        const translatedTriggers = translateObject(triggers, locale);
        const translatedContent = translate(content, locale);
        return translatedTriggers && translatedContent
          ? {
              triggers: translatedTriggers,
              content: translatedContent,
              title: translate(title, locale)
            }
          : [];
      });
  }

  return [];
}
