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
   * The declared parameter type is an ASSERTION at the only call site that matters.
   *
   * `localizeRow` hands over a raw `jsonb` column behind a `as Record<string, string> | null | undefined` cast, and no column it localizes carries a constraint: `name` / `short_name` / `info` are declared as bare `jsonb` in `102-entities.sql` and `103-questions.sql`, and `is_localized_string` — the function that would enforce the shape — is defined but referenced by ZERO constraints, its only caller being `validate_answer_value`. So `UPDATE candidates SET name = '"Ada"'::jsonb` is accepted by the database today, and `bulk_import` builds its column list from the JSON keys it is handed.
   *
   * The consequence of throwing here is not a dropped field: `localizeRow` runs from `toDataObject` over EVERY row of the provider's entity, question and constituency reads, so one malformed row would throw out of the read that contains it and fail the page load — against this phase's own stated posture (`parseJsonbColumn.ts:42`, `:69`: one malformed row must not fail the read that contains it, T-157-06).
   */
  describe('is total for any JSONB value the database can hold', () => {
    it('returns null for a scalar, which no constraint prevents a localized column from holding', () => {
      // `'"plain name"'::jsonb` — a JSON string, which is what `JSON.parse('"plain name"')` yields.
      expect(getLocalized(JSON.parse('"plain name"'), 'en')).toBeNull();
      expect(getLocalized(42 as never, 'en')).toBeNull();
      expect(getLocalized(true as never, 'en')).toBeNull();
    });

    it('returns null for an array rather than its first element', () => {
      // Arrays pass an `in` test because they are objects, so the tier-3 branch used to return `'a'` for this — a value the SQL counterpart raises on.
      expect(getLocalized(['a', 'b'] as never, 'en')).toBeNull();
      expect(getLocalized([] as never, 'en')).toBeNull();
    });

    it('does not throw for any of them', () => {
      for (const value of [JSON.parse('"plain name"'), 42, true, ['a'], []]) {
        expect(() => getLocalized(value as never, 'en')).not.toThrow();
      }
    });
  });
});
