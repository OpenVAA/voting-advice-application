import { expect, test } from 'vitest';
import { ENTITY_TYPE, FactionNomination, parseNominationTree } from '../../../internal';
import {
  contentsMatch,
  ExtendedNominationData,
  getTestData,
  getTestDataRoot,
  parseNestedNominations
} from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNestedNominations(parseNominationTree(data.nominations)).filter(
  (d) => d.entityType === ENTITY_TYPE.Faction
) as Array<ExtendedNominationData<typeof ENTITY_TYPE.Faction>>;

test('Should have nomination objects for all faction nominations with the correct parent and child nominations', () => {
  nominationData.forEach((objData) => {
    const found = findNominations(root.factionNominations ?? [], objData);
    expect(found.length, 'To find one and only one matching faction nomination').toBe(1);
    const obj = found[0];
    // The checks below are in effect already handled by findNominations, but double-checking doesn't hurt either
    if (!objData.parent) throw new Error('Data must have a parent entity');
    expect(obj.parentNomination?.entity.id, 'Parent nomination to refer to the correct entity').toBe(
      objData.parent!.entityId
    );
    expect(
      contentsMatch(
        obj.candidateNominations.map((c) => c.entity.id),
        objData.candidates.map((c) => c.entityId)
      ),
      'To have the same candidates'
    ).toBe(true);
  });
});

/**
 * Find the nomination object that matches the nomination data, i.e. has the same electionId, constituencyId, electionRound and child and parent nominations.
 * @param nominations The entities to search in
 * @param nominationData The data for the nomination
 * @returns An array of matching implicit nominations, which should have one and only one item
 */
function findNominations(
  nominations: Array<FactionNomination>,
  nominationData: ExtendedNominationData<typeof ENTITY_TYPE.Faction>
): Array<FactionNomination> {
  const found = new Array<FactionNomination>();
  for (const obj of nominations) {
    if (
      obj.election.id === nominationData.electionId &&
      ((!nominationData.electionRound && obj.electionRound === 1) ||
        obj.electionRound === nominationData.electionRound) &&
      obj.constituency.id === nominationData.constituencyId &&
      // Explicit entity id
      ((obj.entity.id && obj.entity.id === nominationData.entityId) ||
        // Implicit entity id: the same parent organization id...
        (nominationData.parent &&
          obj.parentNomination?.entity.id === nominationData.parent.entityId &&
          // ...and the same candidates
          contentsMatch(
            (nominationData as ExtendedNominationData<typeof ENTITY_TYPE.Faction>).candidates.map((c) => c.entityId),
            obj.candidateNominations.map((c) => c.entity.id)
          )))
    )
      found.push(obj);
  }
  return found;
}
