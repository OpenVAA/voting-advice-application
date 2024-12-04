import { describe, expect, test } from 'vitest';
import { filterData } from '$lib/api/utils/filterData';
import type { Id } from '@openvaa/core';
import type { DataObjectData } from '@openvaa/data';

const data: Array<MockData> = [
  { id: '1', name: 'Fully specified', constituencyId: 'A', constituencies: ['B', 'C'] },
  { id: '2', name: 'Empty constituencies', constituencyId: 'B', constituencies: [] },
  { id: '3', name: 'Null constituencies', constituencyId: null, constituencies: null },
  { id: '4', name: 'Undefined constituencies' }
];

type MockData = DataObjectData & {
  constituencyId?: Id | null;
  constituencies?: Array<Id> | null;
};

describe('filterData', () => {
  test('Should return the entire dataset when no filters are provided', () => {
    const result = filterData({ data });
    expect(result).toEqual(data);
  });

  test('Should filter data correctly when a single filter is applied', () => {
    const filters = { id: '1' };
    const result = filterData({ data, filters });
    expect(result).toEqual([data[0]]);
  });

  test('Should handle multiple filters correctly', () => {
    const filters = {
      id: ['1', '2'],
      constituencyId: 'B'
    };
    const result = filterData({ data, filters });
    expect(result).toEqual([data[1]]);
  });

  test('Should handle wrapped values', () => {
    const filters = {
      id: { value: ['1', '2'] },
      constituencyId: { value: 'B' }
    };
    const result = filterData({ data, filters });
    expect(result).toEqual([data[1]]);
  });

  test('Should return an empty array when no items match the filters', () => {
    const filters = {
      constituencyId: 'NEVER'
    };
    const result = filterData({ data, filters });
    expect(result).toEqual([]);
  });

  test('Should include items with missing values when includeMissing is true', () => {
    const filters = {
      constituencyId: {
        value: 'C',
        includeMissing: true
      }
    };
    const result = filterData({ data, filters });
    expect(result).toEqual([data[2], data[3]]);
  });
});
