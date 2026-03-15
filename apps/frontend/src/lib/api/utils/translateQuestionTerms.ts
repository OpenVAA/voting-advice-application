import { translate, translateObject } from '$lib/i18n';
import type { LocalizedTermDefinition, TermDefinition } from '@openvaa/app-shared';

export function translateQuestionTerms(
  data: Array<LocalizedTermDefinition> | null,
  locale: string | null
): Array<TermDefinition> {
  if (Array.isArray(data)) {
    return data
      .filter((v) => v && typeof v === 'object')
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
