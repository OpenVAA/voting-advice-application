import type {Translations} from '@sveltekit-i18n/base';
export * from './translations.type';

/* Be sure to update these arrays every time you add a new locale to `./translations` */
const keys = [
  'about',
  'aria',
  'actionLabels',
  'candidateApp',
  'common',
  'components',
  'error',
  'feedback',
  'header',
  'info',
  'intro',
  'maintenance',
  'navigation',
  'privacy',
  'questions',
  'results',
  'statistics',
  'survey',
  'viewTexts'
];
const locales = {en: 'English', fi: 'Suomi', sv: 'Svenska'};

/**
 * Add any payload key / translation key pairs that should be included in the default translations payloads here. They will be available to all translations by default. In addition to these, some values are added from settings. See `init.ts` for more details.
 */
export const DEFAULT_PAYLOAD_KEYS = {
  candidateSingular: 'common.candidate.singular',
  candidatePlural: 'common.candidate.plural',
  partySingular: 'common.party.singular',
  partyPlural: 'common.party.plural'
};

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
