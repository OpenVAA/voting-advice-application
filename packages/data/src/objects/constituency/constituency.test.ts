import { expect, test } from 'vitest';
import { getTestData, getTestDataRoot } from '../../testUtils';

const root = getTestDataRoot();
const data = getTestData();

test('Should have all constituencies', () => {
  expect(root.constituencies?.length).toBe(data.constituencies.constituencies.length);
});

test('Should have parentConstituencies if defined and null otherwise', () => {
  root.constituencies!.forEach((obj) => {
    const objData = data.constituencies.constituencies.find((d) => d.id === obj.id);
    expect(objData).toBeDefined();
    if (objData!.parentId) {
      expect(obj.parentConstituency?.id).toBe(objData!.parentId);
    } else {
      expect(obj.parentConstituency).toBeNull();
    }
  });
});
