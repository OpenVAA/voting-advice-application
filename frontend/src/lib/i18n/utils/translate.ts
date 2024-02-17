import {defaultLocale, locale as currentLocale, locales} from '../';
import {matchLocale} from './matchLocale';

/** We'll create a lookup table here for use with translate */
const localeMatches: Record<string, string> = {};

/**
 * Return the correct string for the `locale` using soft-matching from
 * `supportedLocales`. Note that if a locale is not included in
 * `supportedLocales` it won't be returned even if it is in `strings`.
 * @param strings An object with locale-translation key-value pairs
 * @param locale The target locale
 * @returns The translalated string or ''
 */
export function translate(strings: LocalizedString | undefined | null, locale?: string): string {
  if (strings == null || Object.keys(strings).length === 0) return '';
  locale ??= currentLocale.get();
  let key: string | undefined;
  if (locale in localeMatches) {
    key = localeMatches[locale];
  } else {
    const match = matchLocale(locale, locales.get());
    key = match ?? defaultLocale;
    localeMatches[locale] = key;
  }
  return strings[key] ?? strings[defaultLocale] ?? Object.values(strings)[0];
}
