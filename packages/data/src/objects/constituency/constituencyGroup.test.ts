import { expect, test } from 'vitest';
import { getTestData, getTestDataRoot } from '../../testUtils';

const root = getTestDataRoot();
const data = getTestData();

test('Should have all constituencyGroups', () => {
  expect(root.constituencyGroups?.length).toBe(data.constituencies.groups.length);
});

test('Should have constituencies for each group', () => {
  root.constituencyGroups!.forEach((obj) => {
    const objData = data.constituencies.groups.find((d) => d.id === obj.id);
    expect(objData).toBeDefined();
    expect(obj.constituencies.map((c) => c.id).sort()).toEqual(objData!.constituencyIds.sort());
  });
});
