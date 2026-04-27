import { describe, it, expect } from 'vitest';
import { getLocalized } from '../utils/getLocalized';

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
});
