import { expect, test } from 'vitest';
import { CandidateNomination, ENTITY_TYPE, parseNominationTree } from '../../../internal';
import { ExtendedNominationData, getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNestedNominations(parseNominationTree(data.nominations)).filter(
  (d) => d.entityType === ENTITY_TYPE.Candidate
);

test('Should have nomination objects for all candidate nominations with the correct parent nominations', () => {
  nominationData.forEach((objData) => {
    const found = findNominations(root.candidateNominations ?? [], objData);
    expect(found.length, 'To find one and only one matching candidate nomination').toBe(1);
    const obj = found[0];
    // The checks below are in effect already handled by findNominations, but double-checking doesn't hurt either
    if (objData.parent) {
      expect(obj.parentNomination?.entity.type, 'Parent nomination to be the correct type').toBe(
        objData.parent.entityType
      );
      if (objData.parent.entityId)
        expect(obj.parentNomination?.entity.id, 'Parent nomination to refer to the correct explicit entity').toBe(
          objData.parent.entityId
        );
    } else {
      expect(obj.parentNomination, 'Parent nomination to be null').toBeNull();
    }
  });
});

/**
 * Find the nomination object that matches the nomination data, i.e. has the same electionId, electionRound, constituencyId, entityId and parent nomination.
 * @param nominations The entities to search in
 * @param nominationData The data for the nomination
 * @returns An array of matching implicit nominations, which should have one and only one item
 */
function findNominations(
  nominations: Array<CandidateNomination>,
  nominationData: ExtendedNominationData
): Array<CandidateNomination> {
  const found = new Array<CandidateNomination>();
  for (const obj of nominations) {
    if (
      obj.election.id === nominationData.electionId &&
      ((!nominationData.electionRound && obj.electionRound === 1) ||
        obj.electionRound === nominationData.electionRound) &&
      obj.constituency.id === nominationData.constituencyId &&
      obj.entity.id === nominationData.entityId &&
      // No parent
      ((!nominationData.parent && !obj.parentNomination) ||
        // Faction parent
        (nominationData.parent?.entityType === ENTITY_TYPE.Faction &&
          obj.factionList?.parentNomination &&
          // Explicit faction: check faction id
          ((nominationData.parent.entityId && obj.factionList.entity.id === nominationData.parent.entityId) ||
            // Implicit faction: check that faction’s parent organization id
            (!nominationData.parent.entityId &&
              nominationData.parent.parent &&
              obj.factionList.parentNomination.entity.id === nominationData.parent.parent.entityId))) ||
        // Organization parent
        (nominationData.parent?.entityType === ENTITY_TYPE.Organization &&
          obj.list &&
          obj.list.entity.id === nominationData.parent.entityId))
    )
      found.push(obj);
  }
  return found;
}
