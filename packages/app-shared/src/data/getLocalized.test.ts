import { describe, expect, it } from 'vitest';
import { getLocalized } from './getLocalized';

describe('getLocalized', () => {
  it('returns exact locale match (tier 1)', () => {
    expect(getLocalized({ en: 'Hello', fi: 'Hei' }, 'en')).toBe('Hello');
  });

  it('returns correct value for different locales (tier 1)', () => {
    expect(getLocalized({ en: 'Hello', fi: 'Hei', sv: 'Hej' }, 'fi')).toBe('Hei');
    expect(getLocalized({ en: 'Hello', fi: 'Hei', sv: 'Hej' }, 'sv')).toBe('Hej');
  });

  it('falls back to default locale when requested not found (tier 2)', () => {
    expect(getLocalized({ en: 'Hello', fi: 'Hei' }, 'sv', 'en')).toBe('Hello');
  });

  it('prefers the default locale over the first key (tier 2)', () => {
    expect(getLocalized({ fi: 'a', en: 'b' }, 'sv', 'en')).toBe('b');
    expect(getLocalized({ fi: 'a', en: 'b' }, 'fi', 'en')).toBe('a');
  });

  it('falls back to first available key when neither requested nor default found (tier 3)', () => {
    expect(getLocalized({ fi: 'Hei', sv: 'Hej' }, 'de', 'en')).toBe('Hei');
  });

  it('returns null for null input', () => {
    expect(getLocalized(null, 'en')).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(getLocalized(undefined, 'en')).toBeNull();
  });

  it('returns null for empty object', () => {
    expect(getLocalized({}, 'en')).toBeNull();
  });

  it('requested locale takes priority over default locale', () => {
    expect(getLocalized({ en: 'Hello', fi: 'Hei' }, 'en', 'fi')).toBe('Hello');
  });

  it('uses "en" as default locale when not specified', () => {
    expect(getLocalized({ en: 'English', fi: 'Finnish' }, 'sv')).toBe('English');
  });

  /**
   * The declared parameter type is not enforced by the database: the localized columns are bare `jsonb`, so a row can hold a scalar, an array, or an object whose values are not strings. `localizeRow` runs over every row of a read, so each of these must degrade to `null` rather than throw.
   */
  describe('is total for any JSONB value the database can hold', () => {
    it('returns null for a scalar, which no constraint prevents a localized column from holding', () => {
      // `'"plain name"'::jsonb` — a JSON string, which is what `JSON.parse('"plain name"')` yields.
      expect(getLocalized(JSON.parse('"plain name"'), 'en')).toBeNull();
      expect(getLocalized(42 as never, 'en')).toBeNull();
      expect(getLocalized(true as never, 'en')).toBeNull();
    });

    it('returns null for an array rather than its first element', () => {
      // Arrays are objects, so without the guard the first-key tier would return `'a'`.
      expect(getLocalized(['a', 'b'] as never, 'en')).toBeNull();
      expect(getLocalized([] as never, 'en')).toBeNull();
    });

    it('returns null when the matching tier holds a non-string', () => {
      expect(getLocalized({ en: 42 } as never, 'en')).toBeNull();
      expect(getLocalized({ en: null } as never, 'en')).toBeNull();
      expect(getLocalized({ en: { nested: 'x' } } as never, 'en')).toBeNull();
    });

    it('skips a non-string tier and falls through to the next one', () => {
      expect(getLocalized({ fi: 42, en: 'Hello' } as never, 'fi', 'en')).toBe('Hello');
      expect(getLocalized({ en: null, fi: 'x' } as never, 'en', 'en')).toBe('x');
      expect(getLocalized({ sv: 1, de: null, fi: 'Hei' } as never, 'en', 'en')).toBe('Hei');
    });

    it('does not throw for any of them', () => {
      for (const value of [JSON.parse('"plain name"'), 42, true, ['a'], [], { en: 42 }, { en: null }]) {
        expect(() => getLocalized(value as never, 'en')).not.toThrow();
      }
    });
  });
});
