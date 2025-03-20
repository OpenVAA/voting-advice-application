import { browser } from '$app/environment';
import { constants } from '$lib/utils/constants';

/**
 * Convert a local path to an absolute URL based on the current environment.
 * @param path - The path without a leading slash
 * @returns An URL string.
 */
export function localPathToUrl(path: string): string {
  const baseUrl = browser ? constants.PUBLIC_BROWSER_FRONTEND_URL : constants.PUBLIC_SERVER_FRONTEND_URL;
  return `${baseUrl}/${path.replace(/^\//, '')}`;
}
