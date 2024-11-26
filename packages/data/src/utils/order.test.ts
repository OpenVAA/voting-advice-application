import { describe, expect, test } from 'vitest';
import { order } from './order';
import { DataObject, DataObjectData, DataRoot } from '../internal';

describe('order', () => {
  class MockDataObject extends DataObject {}
  const root = new DataRoot();
  const data: DataObjectData = { id: '1' };
  const order0 = new MockDataObject({ data, root });
  const order1 = new MockDataObject({ data: { ...data, order: 1 }, root });
  const order2 = new MockDataObject({ data: { ...data, order: 2 }, root });
  const ordered = [order1, order2, order0];
  test('sort in ascending order with unspecified last', () => {
    expect([order2, order0, order1].sort(order)).toEqual(ordered);
  });
});
