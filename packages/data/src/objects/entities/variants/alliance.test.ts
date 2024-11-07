import { describe, expect, test } from 'vitest';
import { ENTITY_TYPE, parseEntityTree, parseNominationTree } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const entityData = parseEntityTree(data.entities).filter((d) => d.type === ENTITY_TYPE.Alliance);
const nominationData = parseNominationTree(data.nominations).filter((d) => d.entityType === ENTITY_TYPE.Alliance);

test('Should have all explicit alliances and their data', () => {
  entityData.forEach((objData) => {
    const obj = root.getEntity(ENTITY_TYPE.Alliance, objData.id);
    expect(obj.id, 'To have entity').toBe(objData.id);
    if (objData.name) expect(obj.name, 'To return name').toBe(objData.name);
    if (objData.shortName) expect(obj.shortName, 'To return shortName').toBe(objData.shortName);
    const organizationIds = nominationData
      .filter((d) => d.entityType === ENTITY_TYPE.Alliance && d.entityId === obj.id)
      .map((n) => ('organizations' in n ? n.organizations : []))
      .flat()
      .map((o) => o.entityId);
    expect(obj.organizations.map((o) => o.id).sort()).toEqual(organizationIds.sort());
  });
});

describe('Should allow overwriting of name and shortName format', () => {
  root.setFormatter('allianceName', () => 'OVERRIDDEN NAME');
  root.setFormatter('allianceShortName', () => 'OVERRIDDEN SHORTNAME');
  root.alliances!.forEach((a) => {
    if (a.data.name) expect(a.name, 'To use name in data').toBe(a.data.name);
    else expect(a.name, 'To override name format').toBe('OVERRIDDEN NAME');
    if (a.data.shortName) expect(a.shortName, 'To use shortName in data').toBe(a.data.shortName);
    else expect(a.shortName, 'To override shortName format').toBe('OVERRIDDEN SHORTNAME');
  });
  test('Explicitly delete names', () => {
    root.alliances!.forEach((a) => {
      a.data.name = undefined;
      a.data.shortName = undefined;
      expect(a.name, 'To override name format').toBe('OVERRIDDEN NAME');
      expect(a.shortName, 'To override shortName format').toBe('OVERRIDDEN SHORTNAME');
    });
  });
});
