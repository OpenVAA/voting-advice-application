import { describe, expect, it } from 'vitest';
import { mapRow } from '../utils/mapRow';

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
      organization_id: 'org-1',
      category_id: 'cat-1'
    };
    const result = mapRow(row);
    expect(result).toEqual({
      customData: { foo: 'bar' },
      organizationId: 'org-1',
      categoryId: 'cat-1'
    });
  });
});
