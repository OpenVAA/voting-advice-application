import type { dir, locale, locales, t, translate } from '$lib/i18n';

/**
 * A `Context` containing all localization-related stores.
 */

export type I18nContext = {
  /** A store reflecting the writing direction (`'ltr'` | `'rtl'`) of the current locale. */
  dir: typeof dir;
  locale: typeof locale;
  locales: typeof locales;
  t: typeof t;
  translate: typeof translate;
};
