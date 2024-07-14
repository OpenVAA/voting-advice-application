import { t } from '$lib/i18n';
import { logDebugError } from '$lib/utils/logger';
import { ucFirst } from '$lib/utils/text/ucFirst';

/**
 * Ensures an url is valid.
 * @returns the url or `undefined` if it is invalid.
 */
export function checkUrl(url: string): string | undefined {
  try {
    new URL(url);
    return url;
  } catch (e) {
    logDebugError(`Invalid url ${url}`);
    return undefined;
  }
}

/**
 * Returns a nice text to display for a link.
 * @param url The link
 * @param maxLength The maximum length of the text to display
 * @param defaultText The text to display if the url is longer than `maxLength`. @default t.get('common.website')
 * @param errorText The text to display if the url is invalid. @default t.get('common.missingAnswer')
 */
export function getLinkText(
  url: string,
  maxLength = 30,
  defaultText?: string,
  errorText?: string
): string {
  try {
    const host = new URL(url)?.host;
    if (!host) throw new Error();
    const parts = host.split('.');
    const text = parts[parts.length - 2];
    if (!text) throw new Error();
    if (text.length > maxLength) return defaultText ?? t.get('common.website');
    return ucFirst(text);
  } catch (e) {
    logDebugError(`Invalid url ${url}`);
    return errorText ?? t.get('common.missingAnswer');
  }
}
