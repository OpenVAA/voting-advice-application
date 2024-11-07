import { describe, expect, test } from 'vitest';
import { ENTITY_TYPE, parseEntityTree, parseNominationTree } from '../../../internal';
import { contentsMatch, getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const entityData = parseEntityTree(data.entities).filter((d) => d.type === ENTITY_TYPE.Faction);
const nominationData = parseNestedNominations(parseNominationTree(data.nominations)).filter(
  (d) => d.entityType === ENTITY_TYPE.Faction
);

test('Should have all explicit factions and their data', () => {
  entityData.forEach((objData) => {
    const obj = root.getEntity(ENTITY_TYPE.Faction, objData.id);
    expect(obj.id, 'To have entity').toBe(objData.id);
    if (objData.name) expect(obj.name, 'To return name').toBe(objData.name);
    if (objData.shortName) expect(obj.shortName, 'To return shortName').toBe(objData.shortName);
  });
});

test('Should have factions for all faction nominations', () => {
  const implicitObjs = root.factions!.filter((a) => a.isGenerated);
  nominationData.forEach((objData) => {
    if (objData.entityId) {
      // This will actually throw if the faction is not found
      expect(!!root.getEntity(ENTITY_TYPE.Faction, objData.entityId), 'To find explicit faction').toBe(true);
    } else {
      let found = 0;
      // Find one and only one implicit faction that matches the nomination, i.e. has the same electionId, constituencyId, parent organization and member candidates
      for (const obj of implicitObjs) {
        if (obj.organization.id !== objData.parent?.entityId) continue;
        for (const n of obj.nominations) {
          if (
            n.election.id === objData.electionId &&
            n.constituency.id === objData.constituencyId &&
            contentsMatch(
              n.candidateNominations.map((o) => o.entity.id),
              objData.candidates.map((o) => o.entityId)
            )
          )
            found++;
        }
      }
      expect(found, 'To find one and only one implicit faction').toBe(1);
    }
  });
});

describe('Should allow overwriting of name format', () => {
  root.setFormatter('factionName', () => 'OVERRIDDEN NAME');
  root.factions!.forEach((f) => {
    if (f.data.name) expect(f.name, 'To use name in data').toBe(f.data.name);
    else expect(f.name, 'To override name format').toBe('OVERRIDDEN NAME');
  });
  test('Explicitly delete names', () => {
    root.factions!.forEach((f) => {
      f.data.name = undefined;
      expect(f.name, 'To override name format').toBe('OVERRIDDEN NAME');
    });
  });
});
