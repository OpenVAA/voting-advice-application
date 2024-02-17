import {isLocale} from '$lib/i18n/utils';

export function match(param) {
  return isLocale(param);
}
