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
 * @param url - The URL string to check.
 * @param options.checkDomain - If `true`, the domain is checked.
 * @param options.allowedProtocols - An array of the allowed protocols.
 * @returns the url or `undefined` if it is invalid.
 */
export function checkUrl(
  url: string,
  {
    checkDomain = true,
    allowedProtocols = ['http:', 'https:']
  }: {
    checkDomain?: boolean;
    allowedProtocols?: Array<string>;
  } = {}
): string | undefined {
  let validUrl: URL;
  try {
    validUrl = new URL(url);
  } catch {
    try {
      validUrl = new URL(`http://${url}`);
    } catch {
      return undefined;
    }
  }
  if (checkDomain && !isValidDomain(validUrl.hostname)) return undefined;
  if (!allowedProtocols.includes(validUrl.protocol)) return undefined;
  return `${validUrl}`;
}

/**
 * Checks if the domain is valid by ensuring it has at least two parts.
 * @param domain - The domain to check.
 * @returns `true` if the domain is valid, false otherwise.
 */
function isValidDomain(domain: string): boolean {
  const parts = domain.split('.');
  return parts.length > 1 && parts.every((part) => part.length > 0);
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
