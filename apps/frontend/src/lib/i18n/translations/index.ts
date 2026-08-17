export * from './translations.type';

/**
 * Be sure to update these arrays every time you add a new locale to `./translations`.
 * Translations under the key `xxx` are scheduled for removal.
 */
export const keys = [
  'about',
  'adminApp.argumentCondensation',
  'adminApp.common',
  'adminApp.error',
  'adminApp.factorAnalysis',
  'adminApp.jobs',
  'adminApp.languageFeatures',
  'adminApp.login',
  'adminApp.notSupported',
  'adminApp.questionInfo',
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
  'help',
  'info',
  'maintenance',
  'privacy',
  'questions',
  'results',
  'statistics',
  'yourList'
];

export const locales = {
  en: 'English',
  fi: 'Suomi',
  sv: 'Svenska',
  da: 'Dansk',
  et: 'Eesti',
  fr: 'Fran\u00e7ais',
  lb: 'L\u00ebtzebuergesch'
};

/**
 * All available locales
 */
export const staticTranslations: {
  [locale: string]: {
    name: string;
    loaders: Array<{
      key: string;
      loader: () => Promise<Record<string, unknown>>;
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
