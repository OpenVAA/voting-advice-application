/**
 * Capitalize the first letter of each word in a string, even those separated by dashes, and lower-case the rest.
 *
 * A word is a run of characters between white space and dashes, so a word that begins with a letter outside ASCII (`ÖSTERBERG`) is cased from its first letter.
 * @param text - The text to capitalize.
 * @param locale - Optional locale for case conversion.
 */
export function toNameCase(text: string, locale?: string): string {
  return text.replace(
    /(\b[^\s-]+)/g,
    (t) => `${t[0].toLocaleUpperCase(locale)}${t.slice(1).toLocaleLowerCase(locale)}`
  );
}
