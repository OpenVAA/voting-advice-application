import { describe, it, expect } from 'vitest';
import { localizeRow } from '../utils/localizeRow';

describe('localizeRow', () => {
  it('localizes a top-level field', () => {
    const row = { name: { en: 'Hello', fi: 'Hei' }, id: '123' };
    const result = localizeRow(row, ['name'], 'fi', 'en');
    expect(result).toEqual({ name: 'Hei', id: '123' });
  });

  it('localizes multiple fields', () => {
    const row = { name: { en: 'A' }, short_name: { en: 'B' }, info: null, other: 42 };
    const result = localizeRow(row, ['name', 'short_name', 'info'], 'en', 'en');
    expect(result).toEqual({ name: 'A', short_name: 'B', info: null, other: 42 });
  });

  it('handles nested dot-notation paths', () => {
    const row = { custom_data: { fillingInfo: { en: 'Fill', fi: 'Tayta' } } };
    const result = localizeRow(row, ['custom_data.fillingInfo'], 'fi', 'en');
    expect(result).toEqual({ custom_data: { fillingInfo: 'Tayta' } });
  });

  it('leaves non-listed fields untouched', () => {
    const row = { name: { en: 'A' }, answers: { q1: { value: 3 } } };
    const result = localizeRow(row, ['name'], 'en', 'en');
    expect(result).toEqual({ name: 'A', answers: { q1: { value: 3 } } });
  });

  it('handles missing nested paths gracefully', () => {
    const row = { custom_data: null };
    expect(() => localizeRow(row, ['custom_data.fillingInfo'], 'en', 'en')).not.toThrow();
    const result = localizeRow(row, ['custom_data.fillingInfo'], 'en', 'en');
    expect(result).toEqual({ custom_data: null });
  });

  it('uses 3-tier fallback via getLocalized', () => {
    const row = { name: { fi: 'Nimi' } };
    const result = localizeRow(row, ['name'], 'sv', 'en');
    // getLocalized falls back: sv not found -> en not found -> first key (fi)
    expect(result).toEqual({ name: 'Nimi' });
  });

  it('does not mutate the original row', () => {
    const row = { name: { en: 'Hello' }, id: '123' };
    const original = { ...row };
    localizeRow(row, ['name'], 'en', 'en');
    expect(row).toEqual(original);
  });

  it('does not mutate nested objects in the original row', () => {
    const nestedObj = { fillingInfo: { en: 'Fill', fi: 'Tayta' } };
    const row = { custom_data: nestedObj };
    localizeRow(row, ['custom_data.fillingInfo'], 'fi', 'en');
    // Original nested object should be unchanged
    expect(nestedObj.fillingInfo).toEqual({ en: 'Fill', fi: 'Tayta' });
  });
});
