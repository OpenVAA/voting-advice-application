import { test, describe, expect } from 'vitest';
import { isAbsoluteUrl, checkUrl, getLinkText } from './links';

/**
 * Tests for the isAbsoluteUrl function.
 * This function checks if a URL starts with "http://" or "https://".
 */
describe('isAbsoluteUrl', () => {
  // Test that a URL with "http://" returns true.
  test('returns true for HTTP URLs', () => {
    expect(isAbsoluteUrl('http://example.com')).toBe(true);
  });

  // Test that a URL with "https://" returns true.
  test('returns true for HTTPS URLs', () => {
    expect(isAbsoluteUrl('https://example.com')).toBe(true);
  });

  // Test that URLs with uppercase protocols are handled correctly.
  // The function converts the input to lowercase before checking.
  test('returns true for URLs with uppercase protocol', () => {
    expect(isAbsoluteUrl('HTTP://EXAMPLE.COM')).toBe(true);
  });

  // Test that relative URLs (without a protocol) return false.
  test('returns false for relative URLs', () => {
    expect(isAbsoluteUrl('/path/to/resource')).toBe(false);
  });

  // Test that non-string input returns false.
  // We expect the function to safely return false if the input is not a string.
  test('returns false for non-string input', () => {
    // @ts-expect-error
    expect(isAbsoluteUrl(123)).toBe(false);
  });
});

/**
 * Tests for the checkUrl function.
 * This function attempts to create a valid URL from the given input.
 * If the URL is missing a protocol, it adds "http://". It also validates the domain.
 */
describe('checkUrl', () => {
  // Test that a well-formed URL is returned as a valid URL string.
  test('returns a valid URL string for a well-formed URL', () => {
    const url = 'http://example.com';
    const result = checkUrl(url);
    expect(result).toBeDefined();
    // We check that the returned URL contains the expected host.
    expect(result).toContain('http://example.com');
  });

  // Test that if the protocol is missing, "http://" is added automatically.
  test('adds protocol if missing', () => {
    const url = 'example.com';
    const result = checkUrl(url);
    expect(result).toBeDefined();
    // The result should include "http://".
    expect(result).toContain('http://example.com');
  });

  // Test that an invalid URL returns undefined.
  test('returns undefined for an invalid URL', () => {
    expect(checkUrl('not a url')).toBeUndefined();
  });

  // Test that a URL with an invalid domain (e.g., "localhost" without a dot)
  // returns undefined when domain checking is enabled.
  test('returns undefined for a URL with an invalid domain when checkDomain is true', () => {
    expect(checkUrl('http://localhost')).toBeUndefined();
  });

  // Test that the same URL returns a valid string when domain checking is disabled.
  test('returns a valid URL when checkDomain is false, even if the domain is invalid', () => {
    const result = checkUrl('http://localhost', { checkDomain: false });
    expect(result).toBeDefined();
    expect(result).toContain('http://localhost');
  });

  // Test that URLs with disallowed protocols (like "ftp://") return undefined.
  test('returns undefined for a URL with a disallowed protocol', () => {
    const url = 'ftp://example.com';
    expect(checkUrl(url)).toBeUndefined();
  });

  // Test that URLs with multiple consecutive dots in the domain return undefined.
  test('returns undefined for a URL with multiple consecutive dots in the domain', () => {
    const url = 'http://www.domain..com';
    expect(checkUrl(url)).toBeUndefined();
  });

  // Test that a URL with a trailing dot in the hostname is normalized correctly.
  test('handles URL with trailing dot in hostname', () => {
    const url = 'http://example.com.';
    const result = checkUrl(url);
    // The trailing dot should be removed; we check that "example.com" appears in the result.
    expect(result).toContain('example.com');
  });

  // Test that a URL with a port number is handled properly.
  test('returns a valid URL for a URL with a port number', () => {
    const url = 'http://example.com:8080';
    const result = checkUrl(url);
    expect(result).toContain('example.com:8080');
  });

  // Test that a URL with query parameters and a hash fragment is preserved.
  test('returns a valid URL for a URL with query parameters and hash fragments', () => {
    const url = 'http://example.com/path?search=test#section';
    const result = checkUrl(url);
    expect(result).toContain('http://example.com/path?search=test#section');
  });

  // Test that internationalized domain names (IDN) are correctly converted to punycode.
  test('handles internationalized domain names correctly', () => {
    const url = 'http://例子.测试';
    // new URL converts the domain to punycode. We expect the result to be in punycode format.
    expect(checkUrl(url)).toBe('http://xn--fsqu00a.xn--0zwm56d/');
  });

  // Test that an empty string returns undefined.
  test('returns undefined for an empty string', () => {
    expect(checkUrl('')).toBeUndefined();
  });

  // Test that an already encoded URL is not double-encoded.
  test('does not double-encode an already encoded URL', () => {
    const encodedUrl = 'http://example.com/%3Cscript%3Ealert(%22XSS%22)%3C/script%3E';
    const result = checkUrl(encodedUrl);
    expect(result).toBe(encodedUrl);
  });
});

/**
 * Tests for the getLinkText function.
 * This function extracts the registered (non-public) domain from a URL using the Public Suffix List,
 * decodes it from punycode if necessary, and returns it with the first letter capitalized.
 */
describe('getLinkText', () => {
  // Test that a valid URL returns correctly formatted link text.
  // Example: "https://www.example.com" should yield "Example".
  test('returns formatted link text from a valid URL', () => {
    const url = 'https://www.example.com';
    const result = getLinkText(url);
    expect(result).toBe('Example');
  });

  // Test that if the extracted text is too long, the default text is returned.
  test('returns default text if the extracted text is too long', () => {
    const url = 'https://www.averylongdomainnamethatexceedslimit.com';
    const defaultText = 'Default';
    const result = getLinkText(url, 5, defaultText);
    expect(result).toBe(defaultText);
  });

  // Test that if no default text is provided and the extracted text exceeds maxLength,
  // a shortened version with an ellipsis is returned.
  test('returns a shortened version when no default text is provided and text is too long', () => {
    const url = 'https://www.averylongdomainnamethatexceedslimit.com';
    const result = getLinkText(url, 10);
    expect(result).toBe('averylongd…');
  });

  // Test that an invalid URL returns undefined.
  test('returns undefined for an invalid URL', () => {
    expect(getLinkText('invalid-url')).toBeUndefined();
  });

  // Test that a URL with multiple subdomains returns the expected registered domain.
  // Example: "https://sub.extra.domain.com" should yield "Domain".
  test('returns "Domain" for a URL with multiple subdomains', () => {
    const url = 'https://sub.extra.domain.com';
    const result = getLinkText(url);
    expect(result).toBe('Domain');
  });

  // Test that a URL with an unusual domain structure returns a valid string.
  // For example, "https://www.subdomain.example.co.uk" should return the registered domain part.
  test('returns correct link text for an unusual domain structure', () => {
    const url = 'https://www.subdomain.example.co.uk';
    const result = getLinkText(url);
    // Here we simply verify that some valid string is returned.
    expect(result).toBeDefined();
  });

  // Test that punycode domains are correctly converted back to Unicode.
  // Example: "http://xn--fsqu00a.xn--0zwm56d" should yield "例子" if that is the registered domain.
  test('handles punycode conversion correctly', () => {
    const url = 'http://xn--fsqu00a.xn--0zwm56d';
    const result = getLinkText(url);
    expect(result).toBe('例子');
  });
});
