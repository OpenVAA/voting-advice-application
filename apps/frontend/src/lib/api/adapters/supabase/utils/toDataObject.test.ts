import { describe, expect, it } from 'vitest';
import { toDataObject } from '../utils/toDataObject';

describe('toDataObject', () => {
  it('localizes standard fields and maps columns', () => {
    const row = {
      id: 'abc',
      name: { en: 'Election' },
      short_name: { en: 'Elec' },
      info: null,
      sort_order: 5,
      custom_data: { foo: 1 }
    };
    const result = toDataObject(row, 'en');
    expect(result).toEqual({
      id: 'abc',
      name: 'Election',
      shortName: 'Elec',
      info: null,
      order: 5,
      customData: { foo: 1 }
    });
  });

  it('handles additional localized fields', () => {
    const row = {
      name: { en: 'A' },
      short_name: null,
      info: null,
      custom_data: { fillingInfo: { en: 'Fill' } }
    };
    const result = toDataObject(row, 'en', 'en', ['custom_data.fillingInfo']);
    expect(result.customData).toEqual({ fillingInfo: 'Fill' });
  });

  it('passes through unmapped columns unchanged', () => {
    const row = {
      name: { en: 'A' },
      short_name: null,
      info: null,
      color: { light: '#fff' }
    };
    const result = toDataObject(row, 'en');
    expect(result.color).toEqual({ light: '#fff' });
  });

  it('handles empty/null localized fields', () => {
    const row = {
      name: null,
      short_name: null,
      info: null
    };
    const result = toDataObject(row, 'en');
    expect(result.name).toBeNull();
    expect(result.shortName).toBeNull();
    expect(result.info).toBeNull();
  });

  it('applies column mapping after localization (sort_order -> order, custom_data -> customData)', () => {
    const row = {
      name: { en: 'Test' },
      short_name: { fi: 'T' },
      info: null,
      sort_order: 3,
      custom_data: { key: 'val' }
    };
    const result = toDataObject(row, 'en');
    // Column mapping happened
    expect(result.order).toBe(3);
    expect(result.customData).toEqual({ key: 'val' });
    // Original snake_case keys should not be present
    expect(result.sort_order).toBeUndefined();
    expect(result.custom_data).toBeUndefined();
  });

  it('accepts a concrete typed row without an input cast and maps identically to an untyped call (locks generic)', () => {
    // A concrete row type — NOT Record<string, unknown>. This must flow into the
    // defaulted generic `toDataObject<TRow>` without an `as Record<string, unknown>` cast.
    // If a future change narrowed the parameter back to `Record<string, unknown>`,
    // this typed literal would fail to typecheck (excess-property / index-signature).
    type NominationRow = {
      id: string;
      name: { en: string };
      short_name: null;
      info: null;
      sort_order: number;
    };
    const typedRow: NominationRow = {
      id: 'nom-1',
      name: { en: 'Nomination' },
      short_name: null,
      info: null,
      sort_order: 7
    };
    const typedResult = toDataObject(typedRow, 'en');
    const untypedResult = toDataObject(
      { id: 'nom-1', name: { en: 'Nomination' }, short_name: null, info: null, sort_order: 7 },
      'en'
    );
    expect(typedResult).toEqual(untypedResult);
    expect(typedResult).toEqual({
      id: 'nom-1',
      name: 'Nomination',
      shortName: null,
      info: null,
      order: 7
    });
  });
});
