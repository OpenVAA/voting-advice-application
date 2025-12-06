import { describe, expect, test } from 'vitest';
import { cachifyUrl } from './cachifyUrl';

describe('cachifyUrl', () => {
  test('should wrap a simple string URL with cache proxy', () => {
    const url = 'http://example.com/api/data';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=http%3A%2F%2Fexample.com%2Fapi%2Fdata');
  });

  test('should wrap a URL object with cache proxy', () => {
    const url = new URL('http://example.com/api/data');
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=http%3A%2F%2Fexample.com%2Fapi%2Fdata');
  });

  test('should properly encode URL with query parameters', () => {
    const url = 'http://example.com/api/data?foo=bar&baz=qux';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=http%3A%2F%2Fexample.com%2Fapi%2Fdata%3Ffoo%3Dbar%26baz%3Dqux');
  });

  test('should properly encode URL with special characters', () => {
    const url = 'http://example.com/api/data?search=hello world&category=food drink';
    const result = cachifyUrl(url);

    expect(result).toBe(
      '/api/cache?resource=http%3A%2F%2Fexample.com%2Fapi%2Fdata%3Fsearch%3Dhello%20world%26category%3Dfood%20drink'
    );
  });

  test('should handle URL with hash fragment', () => {
    const url = 'http://example.com/api/data#section';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=http%3A%2F%2Fexample.com%2Fapi%2Fdata%23section');
  });

  test('should handle https URLs', () => {
    const url = 'https://secure.example.com/api/data';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=https%3A%2F%2Fsecure.example.com%2Fapi%2Fdata');
  });

  test('should handle URLs with ports', () => {
    const url = 'http://example.com:8080/api/data';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=http%3A%2F%2Fexample.com%3A8080%2Fapi%2Fdata');
  });

  test('should handle URLs with multiple encoded characters', () => {
    const url = 'http://example.com/api/data?filters[name][$eq]=test&filters[age][$gt]=18';
    const result = cachifyUrl(url);

    expect(result).toContain('/api/cache?resource=');
    // Verify that brackets and special characters are properly encoded
    expect(decodeURIComponent(result.split('resource=')[1])).toBe(url);
  });

  test('should handle relative-looking paths (though typically used with full URLs)', () => {
    const url = '/api/data';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=%2Fapi%2Fdata');
  });

  test('should preserve URL path structure in encoded form', () => {
    const url = 'http://example.com/api/v1/users/123/profile';
    const result = cachifyUrl(url);

    expect(result).toBe('/api/cache?resource=http%3A%2F%2Fexample.com%2Fapi%2Fv1%2Fusers%2F123%2Fprofile');

    // Verify we can decode back to original URL
    const encodedPart = result.split('resource=')[1];
    expect(decodeURIComponent(encodedPart)).toBe(url);
  });
});
