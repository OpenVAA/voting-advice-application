import { translate, translateObject } from '$lib/i18n';
import type { TermDefinition } from '@openvaa/app-shared';
import type { StrapiQuestionData } from '../strapiData.type';

export function parseQuestionTerms(
  data: StrapiQuestionData['customData'],
  locale: string | null
): Array<TermDefinition> {
  const out: Array<TermDefinition> = [];

  if (data && typeof data === 'object' && 'terms' in data && Array.isArray(data.terms)) {
    for (const term of data.terms) {
      if (!term || typeof term !== 'object') continue;

      const { triggers, title, content } = term;

      if (triggers && typeof triggers === 'object' && content) {
        const translatedContent = translate(content, locale);
        const translatedTriggers = translateObject(triggers, locale);

        if (translatedTriggers && Array.isArray(translatedTriggers) && translatedContent) {
          out.push({
            title: translate(title, locale),
            content: translatedContent,
            triggers: translatedTriggers
          });
        }
      }
    }
  }

  return out;
}
