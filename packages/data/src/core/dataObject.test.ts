import { expect, test } from 'vitest';
import { DataObject, DataRoot } from '../internal';

test('DataObject', () => {
  class MockDataObject extends DataObject {}
  const root = new DataRoot();
  const id = 'ID';
  const name = 'NAME';
  const shortName = 'SHORT_NAME';

  const dataObject1 = new MockDataObject({ data: { id, order: 1 }, root });

  expect(dataObject1.order, 'order getter').toEqual(1);
  expect(dataObject1.root, 'root getter').toBe(root);

  expect(dataObject1.debug, 'debug getter when undefined').toBeUndefined();
  root.debug = true;
  expect(dataObject1.debug, 'debug getter to get root.debug').toEqual(true);
  root.debug = false;

  const dataObject2 = new MockDataObject({ data: { id }, root });
  expect(dataObject2.order, 'order getter default').toEqual(Infinity);

  const dataObject3 = new MockDataObject({ data: { id, name, shortName }, root });
  expect(dataObject3.id, 'id getter').toEqual(id);
  expect(dataObject3.name, 'name getter').toEqual(name);
  expect(dataObject3.shortName, 'shortName getter').toEqual(shortName);

  const dataObject4 = new MockDataObject({ data: { id, name }, root });
  expect(dataObject4.shortName, 'shortName getter to default to name').toEqual(name);

  const dataObject5 = new MockDataObject({ data: { id }, root });
  expect(dataObject5.name, 'name getter default').toEqual('');
});
