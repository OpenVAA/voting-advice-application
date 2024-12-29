import { logDebugError } from '$lib/utils/logger';
import { ucFirst } from '$lib/utils/text/ucFirst';

/**
 * Checks if a URL is absolute.
 * @returns true if absolute, false if not.
 */
export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://');
}

/**
 * Ensures an url is valid.
 * @returns the url or `undefined` if it is invalid.
 */
export function checkUrl(url: string): string | undefined {
  try {
    new URL(url);
    return url;
  } catch {
    logDebugError(`Invalid url ${url}`);
    return undefined;
  }
}

/**
 * Returns a nice text to display for a link.
 * @param url The link
 * @param maxLength The maximum length of the text to display
 * @param defaultText The text to display if the url is longer than `maxLength`.
 */
export function getLinkText(url: string, maxLength = 30, defaultText?: string): string | undefined {
  try {
    const host = new URL(url)?.host;
    if (!host) throw new Error();
    const parts = host.split('.');
    const text = parts[parts.length - 2];
    if (!text) throw new Error();
    if (text.length > maxLength) return defaultText ?? text.substring(0, maxLength) + '…';
    return ucFirst(text);
  } catch {
    return undefined;
  }
}
