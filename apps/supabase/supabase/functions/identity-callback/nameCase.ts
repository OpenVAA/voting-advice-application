/**
 * The smart casing of a name the identity provider sends: a name written all in capitals is stored name-cased, and any other name as it was sent.
 *
 * The Edge copy of the frontend's `apps/frontend/src/lib/utils/text/smartNameCase.ts` and `toNameCase.ts`. Supabase deploys each function directory on its own, so the function cannot import the frontend's module; `nameCase.test.ts` runs both over one table of names and asserts they answer alike, so the copy cannot drift from the original without a test failing.
 *
 * Pure functions with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 */

/**
 * Capitalize the first letter of each word in a string, even those separated by dashes, and lower-case the rest.
 *
 * A word is a run of characters between white space and dashes, so a word that begins with a letter outside ASCII (`ÖSTERBERG`) is cased from its first letter.
 * @param text - The text to capitalize.
 * @param locale - Optional locale for case conversion.
 */
export function toNameCase(text: string, locale?: string): string {
  return text.replace(/[^\s-]+/gu, (word) => {
    const [first = '', ...rest] = Array.from(word);
    return `${first.toLocaleUpperCase(locale)}${rest.join('').toLocaleLowerCase(locale)}`;
  });
}

/**
 * Smart-case a name: a name written all in capitals is name-cased, and any other name is answered as it is.
 *
 * A name is all in capitals when it holds at least one letter and equals its own upper-case form, so `MATTI-PEKKA` becomes `Matti-Pekka` and `ÄIJÄLÄ` becomes `Äijälä`. A name that holds a lower-case letter was written by a person in the case they chose (`McDonald`, `van der Berg`) and is left untouched, and so is a name with no letter at all.
 *
 * @param text - The name.
 * @param locale - Optional locale for case conversion.
 * @returns The name-cased text when the text is all in capitals, the text unchanged otherwise.
 */
export function smartNameCase(text: string, locale?: string): string {
  return /\p{L}/u.test(text) && text === text.toLocaleUpperCase(locale) ? toNameCase(text, locale) : text;
}
