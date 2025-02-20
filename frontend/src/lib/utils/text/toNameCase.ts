/**
 * Capitalize the first letter of each word in a string, even those separated by dashes.
 * @param text - The text to capitalize.
 * @param locale - Optional locale for case conversion.
 */
export function toNameCase(text: string, locale?: string): string {
  return text.replace(
    /(\b[^\s-]+)/g,
    (t) => `${t[0].toLocaleUpperCase(locale)}${t.slice(1).toLocaleLowerCase(locale)}`
  );
}
