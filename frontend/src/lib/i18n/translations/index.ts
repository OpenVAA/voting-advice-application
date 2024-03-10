import type {Translations} from '@sveltekit-i18n/base';
export * from './translations.type';

/* Be sure to update these arrays every time you add a new locale to `./translations` */
const keys = [
  'aria',
  'actionLabels',
  'candidate',
  'candidateApp',
  'candidates',
  'common',
  'components',
  'error',
  'footer',
  'header',
  'intro',
  'navigation',
  'parties',
  'questions',
  'results',
  'viewTexts'
];
const locales = {en: 'English', fi: 'Suomi'};

/**
 * All available locales
 */
export const staticTranslations: {
  [locale: string]: {
    name: string;
    loaders: {
      key: string;
      loader: () => Promise<Translations.Input>;
    }[];
  };
} = {};

for (const [locale, name] of Object.entries(locales)) {
  staticTranslations[locale] = {
    name,
    loaders: keys.map((key) => ({
      key,
      loader: async () => (await import(`./${locale}/${key}.json`)).default
    }))
  };
}
