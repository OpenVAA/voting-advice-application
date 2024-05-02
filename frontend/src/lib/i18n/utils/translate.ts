import {defaultLocale, locale as currentLocale} from '../';
import {matchLocale} from './matchLocale';

/**
 * Return the correct string for the `locale` using soft-matching from the supplied `LocalizedString` object.
 * @param strings An object with locale-translation key-value pairs
 * @param locale The target locale
 * @returns The translalated string or ''
 */
export function translate(strings: LocalizedString | undefined | null, locale?: string): string {
  return (translateObject(strings, locale) as string) ?? '';
}

/**
 * Return the correct property for the `locale` using soft-matching from the supplied localized object.
 * @param strings An object with locale-content key-value pairs
 * @param locale The target locale
 * @returns The localized content or `undefined`
 */
export function translateObject<T extends Record<string, unknown> | null | undefined>(
  obj: T,
  locale?: string
) {
  if (!isTranslation(obj)) return undefined;
  locale ??= currentLocale.get();
  let key: string | undefined;
  if (locale in obj) {
    key = locale;
  } else {
    const match = matchLocale(locale, Object.keys(obj));
    key = match ?? defaultLocale;
  }
  return obj[key] ?? obj[defaultLocale] ?? Object.values(obj)[0] ?? undefined;
}

/**
 * Check if an object is a valid LocalizedString and is not empty.
 */
export function isTranslation(obj: unknown): obj is LocalizedString {
  return obj != null && typeof obj === 'object' && Object.keys(obj).length > 0;
}
