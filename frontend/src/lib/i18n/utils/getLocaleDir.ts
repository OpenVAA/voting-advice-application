import { staticSettings } from '@openvaa/app-shared';
import { matchLocale } from './matchLocale';

/**
 * The writing direction of a locale: `'ltr'` (left-to-right) or `'rtl'` (right-to-left).
 */
export type TextDirection = 'ltr' | 'rtl';

/**
 * Return the writing direction declared for `locale` in the supported-locales settings.
 *
 * This is the single source of truth for document direction (see `staticSettings.supportedLocales[].dir`). The locale is soft-matched against the supported locales, so e.g. `'ar-EG'` resolves to the `'ar'` entry. Unknown locales and locales without an explicit `dir` default to `'ltr'`.
 *
 * @param locale - The locale code, e.g. `'ar'` or `'en'`.
 * @returns The locale's text direction, defaulting to `'ltr'`.
 */
export function getLocaleDir(locale: string | null | undefined): TextDirection {
  if (!locale) return 'ltr';
  const { supportedLocales } = staticSettings;
  const codes = supportedLocales.map((l) => l.code);
  const matched = codes.includes(locale) ? locale : matchLocale(locale, codes);
  const entry = matched ? supportedLocales.find((l) => l.code === matched) : undefined;
  return entry?.dir ?? 'ltr';
}

/**
 * Whether `locale` is a right-to-left language.
 *
 * @param locale - The locale code, e.g. `'ar'` or `'en'`.
 * @returns `true` if the locale's direction is `'rtl'`.
 */
export function isRtl(locale: string | null | undefined): boolean {
  return getLocaleDir(locale) === 'rtl';
}
