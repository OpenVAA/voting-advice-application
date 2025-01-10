import { expect, test } from 'vitest';
import {
  Alliance,
  AllianceNomination,
  ENTITY_TYPE,
  parseNominationTree,
  PublicAllianceNominationData
} from '../../../internal';
import { contentsMatch, getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNominationTree(data.nominations).filter((d) => d.entityType === ENTITY_TYPE.Alliance);
const implicitObjs = root.alliances!.filter((a) => a.isGenerated);

test('Should have nomination objects and alliance entities for all alliance nominations', () => {
  nominationData.forEach((objData) => {
    if (objData.entityId) {
      // This will actually throw if the alliance is not found
      expect(!!root.getEntity(ENTITY_TYPE.Alliance, objData.entityId), 'To find explicit alliance').toBe(true);
    } else {
      expect(
        findNominations(root.allianceNominations ?? [], objData).length,
        'To find one and only one alliance nomination'
      ).toBe(1);
      expect(findEntities(implicitObjs, objData).length, 'To find one and only one implicit alliance').toBe(1);
    }
  });
});

test('Should have nested nominations', () => {
  nominationData.forEach((objData) => {
    const obj = findNominations(root.allianceNominations ?? [], objData)[0];
    expect(
      contentsMatch(
        obj!.lists.map((o) => o.entity.id),
        objData.organizations.map((o) => o.entityId)
      )
    ).toBe(true);
  });
});

/**
 * Find the implicit alliance that matches the nomination, i.e. has the same electionId, constituencyId, and member organizations
 * @param entities The entities to search in
 * @param nominationData The data for the nomination
 * @returns An array of matching implicit alliances, which should have one and only one item
 */
function findEntities(entities: Array<Alliance>, nominationData: PublicAllianceNominationData): Array<Alliance> {
  const found = new Array<Alliance>();
  // Find the implicit alliance that matches the nomination, i.e. has the same electionId, constituencyId, and member organizations
  for (const obj of entities) {
    for (const n of obj.nominations) {
      if (
        n.election.id === nominationData.electionId &&
        n.constituency.id === nominationData.constituencyId &&
        contentsMatch(
          n.organizationNominations.map((o) => o.entity.id),
          nominationData.organizations.map((o) => o.entityId)
        )
      )
        found.push(obj);
    }
  }
  return found;
}

/**
 * Find the nomination object that matches the nomination data, i.e. has the same electionId, electionRound, constituencyId, and member organizations
 * @param nominations The entities to search in
 * @param nominationData The data for the nomination
 * @returns An array of matching implicit nominations, which should have one and only one item
 */
function findNominations(
  nominations: Array<AllianceNomination>,
  nominationData: PublicAllianceNominationData
): Array<AllianceNomination> {
  const found = new Array<AllianceNomination>();
  for (const obj of nominations) {
    if (
      obj.election.id === nominationData.electionId &&
      ((!nominationData.electionRound && obj.electionRound === 1) ||
        obj.electionRound === nominationData.electionRound) &&
      obj.constituency.id === nominationData.constituencyId &&
      contentsMatch(
        obj.organizationNominations.map((o) => o.entity.id),
        nominationData.organizations.map((o) => o.entityId)
      )
    )
      found.push(obj);
  }
  return found;
}
