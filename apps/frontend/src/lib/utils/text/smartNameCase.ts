import { toNameCase } from './toNameCase';

/**
 * Smart-case a name: a name written all in capitals is name-cased, and any other name is answered as it is.
 *
 * A name is all in capitals when it holds at least one letter and equals its own upper-case form, so `MATTI-PEKKA` becomes `Matti-Pekka` and `ÄIJÄLÄ` becomes `Äijälä`. A name that holds a lower-case letter was written by a person in the case they chose (`McDonald`, `van der Berg`) and is left untouched, and so is a name with no letter at all. The identity-callback Edge Function holds a copy of this function in `nameCase.ts`, and its `nameCase.test.ts` asserts the two answer alike.
 *
 * @param text - The name.
 * @param locale - Optional locale for case conversion.
 * @returns The name-cased text when the text is all in capitals, the text unchanged otherwise.
 */
export function smartNameCase(text: string, locale?: string): string {
  return /\p{L}/u.test(text) && text === text.toLocaleUpperCase(locale) ? toNameCase(text, locale) : text;
}
