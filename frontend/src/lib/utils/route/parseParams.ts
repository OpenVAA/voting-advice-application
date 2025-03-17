import qs from 'qs';
import { isArrayParam, type Params } from './params';
import { logDebugError } from '../logger';

/**
 * Parse params from params and the URL.
 */
export function parseParams({
  params,
  url
}: {
  params?: Record<string, string> | null;
  url?: URL | null;
}): Partial<Params> {
  const parsed: Partial<Params> = {};
  if (url) {
    for (const [key, value] of Object.entries(qs.parse(url.search.replace(/^\?/g, '')))) {
      if (isArrayParam(key)) {
        parsed[key] = [value].flat().filter((v) => v != null && v !== '') as Array<string>;
      } else if (typeof value === 'string') {
        parsed[key] = value;
      } else {
        logDebugError(`Invalid search param value for ${key}: ${value}`);
      }
    }
  }
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      parsed[key] = (isArrayParam(key) ? value.split('/') : value) as Params[typeof key];
    }
  }
  return parsed;
}
