import type { locale, locales, t } from '$lib/i18n';

/**
 * A `Context` containing all localization-related stores.
 */

export type I18nContext = {
  locale: typeof locale;
  locales: typeof locales;
  t: typeof t;
};
