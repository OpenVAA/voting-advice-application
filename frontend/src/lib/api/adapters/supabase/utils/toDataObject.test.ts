import { describe, it, expect } from 'vitest';
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
});
