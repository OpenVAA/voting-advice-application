import { browser } from '$app/environment';
import { constants } from '$lib/utils/constants';

/**
 * Convert a local path to an absolute URL based on the current environment.
 * @param path - The path without a leading slash
 * @returns An URL string.
 */
export function localPathToUrl(path: string): string {
  const baseUrl = '';
  return `${baseUrl}/${path.replace(/^\//, '')}`;
}
