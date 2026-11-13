import type { LocalizedString } from '@openvaa/app-shared';

/**
 * Whether a locale-keyed text has no usable entry for one locale. An entry is usable when it holds something other than whitespace.
 * @param value - The locale-keyed text, or nothing.
 * @param locale - The locale whose entry is judged.
 * @returns `true` when the entry is absent, empty or whitespace alone.
 */
export function missingRequiredLocale(value: LocalizedString | null | undefined, locale: string): boolean {
  return isBlankText(value?.[locale]);
}

/**
 * Whether a value holds no text a reader could see: the one definition of a blank name, for a single text and for one locale's entry alike.
 * @param value - The value, of whatever type it turned out to have.
 * @returns `true` unless the value is a string with something other than whitespace in it.
 */
export function isBlankText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === '';
}

/**
 * The form a locale-keyed name is stored and compared in: each entry trimmed, blank entries left out. An empty entry is not stored, because the display fallback would show it to a reader of that locale in place of the name another locale holds.
 * @param value - The locale-keyed name as entered, or nothing.
 * @returns A new object holding the entries with text, or `null` when there is none.
 */
export function normalizeLocalizedName(value: LocalizedString | null | undefined): LocalizedString | null {
  if (value == null) return null;
  const normalized: LocalizedString = {};
  for (const [locale, entry] of Object.entries(value)) {
    if (typeof entry !== 'string') continue;
    const text = entry.trim();
    if (text !== '') normalized[locale] = text;
  }
  return Object.keys(normalized).length > 0 ? normalized : null;
}

/**
 * Whether two locale-keyed names are the same name once normalised, so that a name whose only difference is padding, a blank entry or the order of its locales does not count as changed.
 * @param a - One name, or nothing.
 * @param b - The other name, or nothing.
 * @returns `true` when the normalised forms hold the same text for the same locales.
 */
export function sameLocalizedName(
  a: LocalizedString | null | undefined,
  b: LocalizedString | null | undefined
): boolean {
  const first = normalizeLocalizedName(a);
  const second = normalizeLocalizedName(b);
  if (first === null || second === null) return first === second;
  const locales = Object.keys(first);
  return locales.length === Object.keys(second).length && locales.every((locale) => first[locale] === second[locale]);
}
