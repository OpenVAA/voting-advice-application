import { locale } from '$lib/i18n';

/**
 * Abbreviate a string.
 * @param text The localized string json to translate
 * @param method The abbreviation method. @default acronym
 * @param length The maximum abbreviation length. @default 3
 */
export function abbreviate(text: string, options: AbbreviationOptions = {}) {
  if (!text) return '';
  const { method = 'acronym', length = 3 } = options;
  switch (method) {
    case 'acronym':
      return text
        .split(/(\s|-)+/)
        .map((w) => (w === '' || w === ' ' ? '' : w.substring(0, 1).toLocaleUpperCase(locale.get())))
        .slice(0, length)
        .join('');
    default:
      return `${text.substring(0, length)}.`;
  }
}

interface AbbreviationOptions {
  method?: 'acronym' | 'truncate';
  length?: number;
}
