import { beforeEach, describe, expect, test } from 'vitest';
import { clearOverrides, getOverride, setOverrides } from '../overrides';

describe('Runtime override wrapper', () => {
  beforeEach(() => {
    clearOverrides();
  });

  test('getOverride returns undefined when no overrides set', () => {
    expect(getOverride('dynamic.appName')).toBeUndefined();
  });

  test('setOverrides + getOverride returns override value', () => {
    setOverrides('en', { dynamic: { appName: 'My Custom VAA' } });
    expect(getOverride('dynamic.appName')).toBe('My Custom VAA');
  });

  test('getOverride returns undefined for non-overridden key', () => {
    setOverrides('en', { dynamic: { appName: 'My Custom VAA' } });
    expect(getOverride('dynamic.otherKey')).toBeUndefined();
  });

  test('getOverride handles ICU plural in override string', () => {
    setOverrides('en', {
      results: { numShown: '{numShown, plural, =0 {None} =1 {One item} other {# items}}' }
    });
    expect(getOverride('results.numShown', { numShown: 0 })).toBe('None');
    expect(getOverride('results.numShown', { numShown: 1 })).toBe('One item');
    expect(getOverride('results.numShown', { numShown: 5 })).toBe('5 items');
  });

  test('getOverride returns raw template on ICU parse error', () => {
    setOverrides('en', { bad: { key: '{broken, plural, }' } });
    // The catch arm at `overrides.ts:36` returns the template *unchanged*, which is what this test's title promises. Asserting the exact string — not merely that a string came back — is what makes an empty string, a key name, or a half-formatted result fail here.
    // Do not weaken this back to `typeof result`: every one of those wrong values is a string.
    const result = getOverride('bad.key', { broken: 1 });
    expect(result).toBe('{broken, plural, }');
  });

  test('clearOverrides removes all overrides', () => {
    setOverrides('en', { dynamic: { appName: 'Custom' } });
    expect(getOverride('dynamic.appName')).toBe('Custom');
    clearOverrides();
    expect(getOverride('dynamic.appName')).toBeUndefined();
  });

  test('overrides are locale-scoped', () => {
    setOverrides('en', { dynamic: { appName: 'English Custom' } });
    setOverrides('fi', { dynamic: { appName: 'Finnish Custom' } });
    // getLocale() returns 'en' from the test stub
    expect(getOverride('dynamic.appName')).toBe('English Custom');
  });
});
