/**
 * A Context containing all localization-related utilities.
 *
 * - `locale` is the current locale string (constant within a page lifecycle, locale changes trigger full page reloads)
 * - `locales` is the array of available locale codes
 * - `t` is a plain function for translating message keys
 * - `translate` is a plain function for translating localized objects
 *
 * All properties are plain values — use them directly without `$` prefix.
 */
export type I18nContext = {
  locale: string;
  locales: readonly string[];
  t: (key: string, params?: Record<string, unknown>) => string;
  translate: (strings: LocalizedString | string | undefined | null, locale?: string | null) => string;
};
