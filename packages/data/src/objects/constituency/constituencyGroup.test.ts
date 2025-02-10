import { describe, expect, test } from 'vitest';
import { Constituency, Id } from '../../internal';
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

describe('ConstituencyGroup.impliedBy and getImpliedConstituency', () => {
  const parentGroup = root.getConstituencyGroup('constituencyGroup-1');
  const childGroup = root.getConstituencyGroup('constituencyGroup-3');
  const grandChildGroup = root.getConstituencyGroup('constituencyGroup-4');
  const unrelatedGroup = root.getConstituencyGroup('constituencyGroup-2');

  test('Should return true when the groups are equal', () => {
    expect(unrelatedGroup.impliedBy(unrelatedGroup)).toBe(true);
  });

  test('Should return true for parents implied by children', () => {
    expect(parentGroup.impliedBy(childGroup)).toBe(true);
  });

  test('Should return false for children implied by parents', () => {
    expect(childGroup.impliedBy(parentGroup)).toBe(false);
  });

  test('Should return false for unrelated groups', () => {
    expect(childGroup.impliedBy(unrelatedGroup)).toBe(false);
    expect(parentGroup.impliedBy(unrelatedGroup)).toBe(false);
    expect(unrelatedGroup.impliedBy(childGroup)).toBe(false);
    expect(unrelatedGroup.impliedBy(parentGroup)).toBe(false);
  });

  test('Should return all parents with getImpliedConstituency and all children should imply a parent', () => {
    expect(parentGroup.impliedBy(childGroup)).toBe(true);
    const found = new Set<Id>();
    for (const constituency of childGroup.constituencies) {
      const parent = parentGroup.getImpliedConstituency(constituency);
      expect(parent, 'Each child should imply a parent').toBeInstanceOf(Constituency);
      found.add(parent!.id);
    }
    expect(Array.from(found)).toEqual(expect.arrayContaining(parentGroup.constituencies.map((c) => c.id)));
    expect(found.size).toBe(parentGroup.constituencies.length);
  });

  test('Should return grand parent with getImpliedConstituency', () => {
    const grandChild = grandChildGroup.constituencies[0];
    expect(parentGroup.getImpliedConstituency(grandChild)).toBeInstanceOf(Constituency);
  });

  test('Should self with getImpliedConstituency', () => {
    const self = parentGroup.constituencies[0];
    expect(parentGroup.getImpliedConstituency(self)).toBe(self);
  });
});
