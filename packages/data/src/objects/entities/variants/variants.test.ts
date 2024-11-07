import { expect, test } from 'vitest';
import { parseEntityTree } from './variants';
import { ENTITY_TYPE } from '../../../internal';
import { getTestData } from '../../../testUtils';

test('Should insert type to all items', () => {
  const tree = getTestData().entities;
  const entityData = parseEntityTree(tree);
  entityData.forEach((d) => {
    expect(Object.values(ENTITY_TYPE).includes(d.type)).toBe(true);
  });
});
