import type { Translations } from '@sveltekit-i18n/base';
export * from './translations.type';

/**
 * Be sure to update these arrays every time you add a new locale to `./translations`.
 * Translations under the key `xxx` are scheduled for removal.
 */
export const keys = [
  'about',
  'candidateApp.basicInfo',
  'candidateApp.common',
  'candidateApp.error',
  'candidateApp.help',
  'candidateApp.home',
  'candidateApp.info',
  'candidateApp.login',
  'candidateApp.logoutModal',
  'candidateApp.notSupported',
  'candidateApp.preregister',
  'candidateApp.preview',
  'candidateApp.privacy',
  'candidateApp.questions',
  'candidateApp.register',
  'candidateApp.resetPassword',
  'candidateApp.setPassword',
  'candidateApp.settings',
  'common',
  'components',
  'constituencies',
  'dynamic',
  'elections',
  'entityCard',
  'entityDetails',
  'entityFilters',
  'entityList',
  'error',
  'feedback',
  'gameMode',
  'help',
  'info',
  'maintenance',
  'privacy',
  'questions',
  'results',
  'statistics',
  'yourList'
];
export const locales = { en: 'English', fi: 'Suomi', sv: 'Svenska' };

/**
 * Add any payload key / translation key pairs that should be included in the default translations payloads here. They will be available to all translations by default. In addition to these, some values are added from settings. See `init.ts` for more details.
 */
export const DEFAULT_PAYLOAD_KEYS = {
  candidateSingular: 'common.candidate.singular',
  candidatePlural: 'common.candidate.plural',
  partySingular: 'common.organization.singular',
  partyPlural: 'common.organization.plural'
};

/**
 * All available locales
 */
export const staticTranslations: {
  [locale: string]: {
    name: string;
    loaders: Array<{
      key: string;
      loader: () => Promise<Translations.Input>;
    }>;
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
