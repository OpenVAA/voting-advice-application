// Import the helper function that capitalizes the first letter of a string.
import { ucFirst } from '$lib/utils/text/ucFirst';
// Import the Public Suffix List (PSL) library to parse domain names.
import psl from 'psl';
// Import the punycode library to convert punycode domains to Unicode.
import punycode from 'punycode';

/**
 * Checks if a URL is absolute.
 * 
 * This function determines whether the given URL string starts with either "http://" or "https://".
 * It first verifies that the input is a string and then converts it to lowercase to ensure case-insensitive matching.
 * 
 * @param url - The URL string to check.
 * @returns True if the URL starts with "http://" or "https://", false otherwise.
 */
export function isAbsoluteUrl(url: string): boolean {
  // Return false immediately if the input is not a string.
  if (typeof url !== 'string') return false;
  // Convert the URL to lowercase for case-insensitive comparison.
  const lowerUrl = url.toLowerCase();
  // Check if the URL starts with either "http://" or "https://".
  return lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://');
}

/**
 * Validates and normalizes a URL.
 * 
 * This function attempts to construct a URL object from the given string.
 * If the URL string does not include a protocol, it will automatically prepend "http://".
 * It also validates the domain and ensures that the protocol is allowed.
 * 
 * @param url - The URL string to validate.
 * @param options.checkDomain - A flag indicating whether the domain should be validated.
 * @param options.allowedProtocols - An array of allowed protocols (default: ['http:', 'https:']).
 * @returns The normalized URL string if valid, or undefined if the URL is invalid.
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
  // Return undefined if the input is not a string or if it is an empty/whitespace string.
  if (typeof url !== 'string' || url.trim() === '') return undefined;

  let validUrl: URL;
  try {
    // Try to create a URL object from the input.
    validUrl = new URL(url);
  } catch {
    try {
      // If the first attempt fails, assume the protocol is missing and prepend "http://".
      validUrl = new URL(`http://${url}`);
    } catch {
      // If the URL is still invalid, return undefined.
      return undefined;
    }
  }

  // Remove any trailing dot from the hostname (e.g., "example.com." becomes "example.com").
  const normalizedHost = validUrl.hostname.endsWith('.')
    ? validUrl.hostname.slice(0, -1)
    : validUrl.hostname;
    
  // If domain validation is enabled, check that the normalized hostname is valid.
  if (checkDomain && !isValidDomain(normalizedHost)) return undefined;
  // Ensure the protocol of the URL is one of the allowed protocols.
  if (!allowedProtocols.includes(validUrl.protocol)) return undefined;
  
  // Return the full normalized URL string.
  return `${validUrl}`;
}

/**
 * Validates the domain part of a URL.
 * 
 * This function splits the domain by dots and checks that it has at least two non-empty parts.
 * It also removes any trailing dot from the domain before performing the check.
 * 
 * @param domain - The domain string to validate.
 * @returns True if the domain is valid, false otherwise.
 */
function isValidDomain(domain: string): boolean {
  // Remove trailing dot if present.
  const normalizedDomain = domain.endsWith('.') ? domain.slice(0, -1) : domain;
  // Split the domain into parts based on the dot separator.
  const parts = normalizedDomain.split('.');
  // A valid domain should have at least two parts and none of the parts should be empty.
  return parts.length > 1 && parts.every((part) => part.length > 0);
}

/**
 * Extracts and formats a display-friendly link text from a URL.
 * 
 * This function uses the Public Suffix List (via the psl library) to parse the hostname and extract the registered 
 * (non-public) domain portion. If the domain is encoded in punycode, it converts it back to Unicode for better readability.
 * Finally, it capitalizes the first letter of the resulting string.
 * 
 * For example:
 * - "https://www.example.com" will yield "Example".
 * - "http://domain.co.uk" will yield "Domain".
 * - "http://subdomain.domain.co.uk" will yield "Domain".
 * - "http://xn--fsqu00a.xn--0zwm56d" (punycode for "例子.测试") will yield "例子".
 * 
 * @param url - The URL from which to extract the link text.
 * @param maxLength - The maximum length for the displayed text (default: 30 characters).
 * @param defaultText - The fallback text to use if the extracted text exceeds maxLength.
 * @returns The formatted link text, or undefined if the URL is invalid.
 */
export function getLinkText(url: string, maxLength = 30, defaultText?: string): string | undefined {
  try {
    // Create a URL object from the input and extract the hostname.
    const host = new URL(url).host;
    if (!host) throw new Error('No host found');

    // Remove any trailing dot from the hostname.
    const normalizedHost = host.endsWith('.') ? host.slice(0, -1) : host;
    
    // Parse the hostname using the PSL library to extract domain details.
    // The result includes the registered (non-public) domain in parsed.sld.
    const parsed = psl.parse(normalizedHost);
    if (parsed.error || !parsed.sld) throw new Error('PSL parsing error');

    // Get the registered domain (the second-level domain) from the parsed result.
    let text = parsed.sld;
    
    // If the domain is in punycode (starts with "xn--"), convert it to Unicode.
    if (text.startsWith('xn--')) {
      text = punycode.toUnicode(text);
    }
    
    // If the extracted text is longer than the maximum allowed length,
    // return the default text if provided, or a shortened version with an ellipsis.
    if (text.length > maxLength) return defaultText ?? text.substring(0, maxLength) + '…';
    
    // Capitalize the first letter of the text and return it.
    return ucFirst(text);
  } catch (error) {
    // Log any errors to the console for debugging purposes.
    console.error(error);
    return undefined;
  }
}
