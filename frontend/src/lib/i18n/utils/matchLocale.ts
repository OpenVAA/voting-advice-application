/**
 * Performs a soft match between locales.
 * NB. This implementation is not 100% accurate, and it does not work properly
 * with some legacy ('grandfathered') locales or fully proprietary ones.
 * @param targets The locale or ordered list of locales to find
 * @param locales The locales to find the target in
 * @returns The first matching locale in `locales` or `undefined` if not found.
 */
export function matchLocale(targets: string | Array<string>, locales: Array<string>): string | undefined {
  if (locales.length === 0) return undefined;
  for (const target of Array.isArray(targets) ? targets : [targets]) {
    // Wildcard match
    if (target === '*') return locales[0];
    // Perform matching in lowercase
    const [targetLc, localesLc] = [target.toLowerCase(), locales.map((l) => l.toLowerCase())];
    // Exact match
    let index = localesLc.indexOf(targetLc);
    if (index > -1) return locales[index];
    // Lang match without country
    const lang = targetLc.split('-')[0];
    index = localesLc.indexOf(lang);
    if (index > -1) return locales[index];
    // Lang match with country for both locale and strings
    const found = locales.find((_, i) => localesLc[i].startsWith(`${lang}-`));
    if (found !== undefined) return found;
  }
  return undefined;
}
