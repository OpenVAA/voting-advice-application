/**
 * The three helpers that decide what a locale-keyed name holds: whether the entry of one locale is missing, what the stored form of a name is, and whether two names are the same name. A blank entry is the same thing to all three: absent, empty, or whitespace alone.
 */

import { describe, expect, it } from 'vitest';
import { isBlankText, missingRequiredLocale, normalizeLocalizedName, sameLocalizedName } from './localizedText';
import type { LocalizedString } from '@openvaa/app-shared';

const IN_TWO_LOCALES: LocalizedString = { en: 'The Example Party', fi: 'Esimerkkipuolue' };
const PADDED: LocalizedString = { en: '  The Example Party ', fi: '\tEsimerkkipuolue\n' };
const WITH_BLANK_ENTRIES: LocalizedString = { en: 'The Example Party', fi: '', sv: '   ' };
const ONLY_BLANK_ENTRIES: LocalizedString = { en: '', fi: '  ', sv: '\n' };

describe('missingRequiredLocale', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['a value without the locale', { fi: 'Esimerkkipuolue' }],
    ['an empty entry', { en: '', fi: 'Esimerkkipuolue' }],
    ['an entry of whitespace', { en: ' \t\n', fi: 'Esimerkkipuolue' }]
  ] as const)('is true for %s', (_, value) => {
    expect(missingRequiredLocale(value, 'en')).toBe(true);
  });

  it('is false for an entry with text', () => {
    expect(missingRequiredLocale(IN_TWO_LOCALES, 'en')).toBe(false);
    expect(missingRequiredLocale({ en: ' A ' }, 'en')).toBe(false);
  });

  it('judges the named locale alone', () => {
    expect(missingRequiredLocale({ en: 'The Example Party' }, 'fi')).toBe(true);
    expect(missingRequiredLocale({ en: '', fi: 'Esimerkkipuolue' }, 'fi')).toBe(false);
  });
});

describe('isBlankText', () => {
  it.each([
    ['an empty string', ''],
    ['whitespace alone', ' \t\n '],
    ['nothing', undefined],
    ['null', null],
    ['a number', 0],
    ['an object', { en: 'Name' }]
  ])('is true for %s', (_label, value) => {
    expect(isBlankText(value)).toBe(true);
  });

  it('is false for a string with text, padded or not', () => {
    expect(isBlankText('Ada')).toBe(false);
    expect(isBlankText('  Ada ')).toBe(false);
  });
});

describe('normalizeLocalizedName', () => {
  it('trims each entry', () => {
    expect(normalizeLocalizedName(PADDED)).toEqual(IN_TWO_LOCALES);
  });

  it('drops blank entries', () => {
    expect(normalizeLocalizedName(WITH_BLANK_ENTRIES)).toEqual({ en: 'The Example Party' });
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['an empty object', {}],
    ['an object of blank entries', ONLY_BLANK_ENTRIES]
  ] as const)('returns null when no entry is left: %s', (_, value) => {
    expect(normalizeLocalizedName(value)).toBeNull();
  });

  it('keeps both locales of a value with text in two', () => {
    expect(normalizeLocalizedName(IN_TWO_LOCALES)).toEqual(IN_TWO_LOCALES);
  });

  it('returns a new object and leaves the value it was given as it was', () => {
    const value: LocalizedString = { en: ' The Example Party ', fi: '' };

    const normalized = normalizeLocalizedName(value);

    expect(normalized).not.toBe(value);
    expect(value).toEqual({ en: ' The Example Party ', fi: '' });
  });
});

describe('sameLocalizedName', () => {
  it('is true for two values whose normalised forms are equal, whatever their key order', () => {
    expect(sameLocalizedName({ en: 'The Example Party', fi: 'Esimerkkipuolue' }, PADDED)).toBe(true);
    expect(sameLocalizedName({ fi: 'Esimerkkipuolue', en: 'The Example Party' }, IN_TWO_LOCALES)).toBe(true);
    expect(sameLocalizedName(WITH_BLANK_ENTRIES, { en: 'The Example Party' })).toBe(true);
  });

  it('is true for null beside an object of blank entries', () => {
    expect(sameLocalizedName(null, ONLY_BLANK_ENTRIES)).toBe(true);
    expect(sameLocalizedName(ONLY_BLANK_ENTRIES, undefined)).toBe(true);
    expect(sameLocalizedName(null, undefined)).toBe(true);
  });

  it('is false when one locale’s text differs', () => {
    expect(sameLocalizedName(IN_TWO_LOCALES, { en: 'The Example Party', fi: 'Toinen puolue' })).toBe(false);
  });

  it('is false when one value holds a locale the other lacks', () => {
    expect(sameLocalizedName(IN_TWO_LOCALES, { en: 'The Example Party' })).toBe(false);
    expect(sameLocalizedName({ en: 'The Example Party' }, IN_TWO_LOCALES)).toBe(false);
    expect(sameLocalizedName(null, IN_TWO_LOCALES)).toBe(false);
  });
});
