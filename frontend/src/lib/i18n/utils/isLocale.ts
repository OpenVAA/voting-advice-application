import {canonize} from './canonize';

/**
 * @param locale The code to test
 * @returns True if `locale` is a valid BCP 47 locale
 */
export function isLocale(locale: string) {
  return canonize(locale) !== undefined;
}
