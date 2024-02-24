import {defaultLocale, locale as currentLocale} from '../';
import {matchLocale} from './matchLocale';

/**
 * Return the correct string for the `locale` using soft-matching from
 * the supplied `LocalizedString` object.
 * @param strings An object with locale-translation key-value pairs
 * @param locale The target locale
 * @returns The translalated string or ''
 */
export function translate(strings: LocalizedString | undefined | null, locale?: string): string {
  if (strings == null || Object.keys(strings).length === 0) return '';
  locale ??= currentLocale.get();
  let key: string | undefined;
  if (locale in strings) {
    key = locale;
  } else {
    const match = matchLocale(locale, Object.keys(strings));
    key = match ?? defaultLocale;
  }
  return strings[key] ?? strings[defaultLocale] ?? Object.values(strings)[0] ?? '';
}
