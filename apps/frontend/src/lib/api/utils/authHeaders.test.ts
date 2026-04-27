import { describe, expect, test } from 'vitest';
import { hasAuthHeaders } from './authHeaders';

describe('hasAuthHeaders', () => {
  test('should return false when headers parameter is undefined', () => {
    expect(hasAuthHeaders(undefined)).toBe(false);
  });

  test('should return false when headers is an empty Headers object', () => {
    const headers = new Headers();
    expect(hasAuthHeaders(headers)).toBe(false);
  });

  test('should return false when headers contains no authentication headers', () => {
    const headers = { 'Content-Type': 'application/json', 'X-Custom-Header': 'value' };
    expect(hasAuthHeaders(headers)).toBe(false);
  });

  test('should return true when headers contains at least one authentication header from AUTH_HEADERS', () => {
    const headers = { Authorization: 'Bearer token123', 'Content-Type': 'application/json' };
    expect(hasAuthHeaders(headers)).toBe(true);
  });
});
