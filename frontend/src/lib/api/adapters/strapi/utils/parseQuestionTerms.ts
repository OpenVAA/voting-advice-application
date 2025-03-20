import { translate } from '$lib/i18n';
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

      const { triggers, title, content } = term as {
        triggers?: Array<string>;
        title?: LocalizedString;
        content?: LocalizedString;
      };

      if (triggers && Array.isArray(triggers) && triggers.length && content) {
        out.push({
          title: translate(title, locale),
          content: translate(content, locale),
          triggers
        });
      }
    }
  }

  return out;
}