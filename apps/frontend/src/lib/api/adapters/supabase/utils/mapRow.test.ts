import { describe, it, expect } from 'vitest';
import { mapRow, mapRowToDb, mapRows } from '../utils/mapRow';

describe('mapRow', () => {
  it('renames COLUMN_MAP keys to camelCase', () => {
    const row = { sort_order: 1, first_name: 'Alice', last_name: 'Smith' };
    const result = mapRow(row);
    expect(result).toEqual({ order: 1, firstName: 'Alice', lastName: 'Smith' });
  });

  it('passes unmapped keys through unchanged', () => {
    const row = { id: '123', name: 'Test', type: 'candidate' };
    const result = mapRow(row);
    expect(result).toEqual({ id: '123', name: 'Test', type: 'candidate' });
  });

  it('handles mixed mapped and unmapped keys', () => {
    const row = { sort_order: 1, name: 'Test' };
    const result = mapRow(row);
    expect(result).toEqual({ order: 1, name: 'Test' });
  });

  it('handles empty objects', () => {
    const result = mapRow({});
    expect(result).toEqual({});
  });

  it('passes JSONB columns through as-is without modification', () => {
    const answers = { q1: { value: 3 } };
    const row = { answers, customization: { theme: 'dark' }, name: { en: 'Hello', fi: 'Hei' } };
    const result = mapRow(row);
    expect(result.answers).toBe(answers); // same reference
    expect(result.customization).toEqual({ theme: 'dark' });
    expect(result.name).toEqual({ en: 'Hello', fi: 'Hei' });
  });

  it('maps all common column names correctly', () => {
    const row = {
      custom_data: { foo: 'bar' },
      is_generated: false,
      organization_id: 'org-1',
      category_id: 'cat-1'
    };
    const result = mapRow(row);
    expect(result).toEqual({
      customData: { foo: 'bar' },
      isGenerated: false,
      organizationId: 'org-1',
      categoryId: 'cat-1'
    });
  });
});

describe('mapRowToDb', () => {
  it('reverses camelCase properties to snake_case columns', () => {
    const obj = { order: 1, firstName: 'Alice', lastName: 'Smith' };
    const result = mapRowToDb(obj);
    expect(result).toEqual({ sort_order: 1, first_name: 'Alice', last_name: 'Smith' });
  });

  it('passes unmapped keys through unchanged', () => {
    const obj = { id: '123', name: 'Test', type: 'candidate' };
    const result = mapRowToDb(obj);
    expect(result).toEqual({ id: '123', name: 'Test', type: 'candidate' });
  });

  it('handles mixed mapped and unmapped keys', () => {
    const obj = { order: 1, name: 'Test' };
    const result = mapRowToDb(obj);
    expect(result).toEqual({ sort_order: 1, name: 'Test' });
  });
});

describe('mapRows', () => {
  it('maps an array of rows', () => {
    const rows = [
      { sort_order: 1, name: 'A' },
      { sort_order: 2, name: 'B' }
    ];
    const result = mapRows(rows);
    expect(result).toEqual([
      { order: 1, name: 'A' },
      { order: 2, name: 'B' }
    ]);
  });

  it('returns empty array for empty input', () => {
    const result = mapRows([]);
    expect(result).toEqual([]);
  });
});
