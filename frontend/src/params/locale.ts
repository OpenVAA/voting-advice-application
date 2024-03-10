import {locales} from '$lib/i18n';
import {matchLocale} from '$lib/i18n/utils';

/**
 * Only supported locales are valid `locale` params.
 */
export function match(param: string) {
  return locales && matchLocale(param, locales.get()) != null;
}
