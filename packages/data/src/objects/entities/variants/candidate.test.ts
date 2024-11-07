import { describe, expect, test } from 'vitest';
import { ENTITY_TYPE, parseEntityTree } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const entityData = parseEntityTree(data.entities).filter((d) => d.type === ENTITY_TYPE.Candidate);

test('Should have all candidates and their data', () => {
  entityData.forEach((objData) => {
    const obj = root.getEntity(ENTITY_TYPE.Candidate, objData.id);
    expect(obj.id, 'To have entity').toBe(objData.id);
    if (objData.firstName) expect(obj.firstName, 'To return firstName').toBe(objData.firstName);
    if (objData.lastName) expect(obj.lastName, 'To return lastName').toBe(objData.lastName);
    if (objData.organizationId) expect(obj.organization?.id, 'To return organization').toBe(objData.organizationId);
    else expect(obj.organization, 'To return null').toBeNull();
  });
});

describe('Should allow overwriting of name and shortName format', () => {
  root.setFormatter('candidateName', () => 'OVERRIDDEN NAME');
  root.setFormatter('candidateShortName', () => 'OVERRIDDEN SHORTNAME');
  root.candidates!.forEach((c) => {
    if (c.data.name) expect(c.name, 'To use name in data').toBe(c.data.name);
    else expect(c.name, 'To override name format').toBe('OVERRIDDEN NAME');
    if (c.data.shortName) expect(c.shortName, 'To use shortName in data').toBe(c.data.shortName);
    else expect(c.shortName, 'To override shortName format').toBe('OVERRIDDEN SHORTNAME');
  });
  test('Explicitly delete names', () => {
    root.candidates!.forEach((c) => {
      c.data.name = undefined;
      c.data.shortName = undefined;
      expect(c.name, 'To override name format').toBe('OVERRIDDEN NAME');
      expect(c.shortName, 'To override shortName format').toBe('OVERRIDDEN SHORTNAME');
    });
  });
});
