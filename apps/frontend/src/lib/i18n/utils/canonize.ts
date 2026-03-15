/**
 * Return a canonical locale name for `locale` or `undefined``
 * if it's not a valid locale.
 */
export function canonize(locale: string): string | undefined {
  try {
    return Intl.getCanonicalLocales(locale)[0];
  } catch {
    return undefined;
  }
}
