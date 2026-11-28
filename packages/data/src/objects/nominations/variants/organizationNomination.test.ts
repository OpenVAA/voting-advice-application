import { expect, test } from 'vitest';
import { ENTITY_TYPE, parseNominationTree } from '../../../internal';
import { contentsMatch, getTestData, getTestDataRoot, parseNestedNominations } from '../../../testUtils';
import type { OrganizationNomination } from '../../../internal';
import type { ExtendedNominationData } from '../../../testUtils';

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNestedNominations(parseNominationTree(data.nominations)).filter(
  (d) => d.entityType === ENTITY_TYPE.Organization
) as Array<ExtendedNominationData<typeof ENTITY_TYPE.Organization>>;

test('Should have nomination objects for all Organization nominations with the correct parent and child nominations', () => {
  nominationData.forEach((objData) => {
    const found = findNominations(root.organizationNominations ?? [], objData);
    expect(found.length, 'To find one and only one matching Organization nomination').toBe(1);
    const obj = found[0];
    if (objData.parent) {
      expect(
        obj.allianceNomination?.organizationNominations.map((n) => n.entity.id).includes(obj.entity.id),
        'Have a parent nomination whose children include this Organization'
      ).toBe(true);
    }
    if (objData.factions) {
      // NB. The checkd below does not ensure exact match, but we rely on `factionNomination.test.ts` to handle such details
      expect(obj.factionNominations.length, 'Have the same number of factions').toBe(objData.factions.length);
      expect(
        contentsMatch(
          obj.factionNominations.flatMap((f) => f.candidateNominations.map((c) => c.entity.id)),
          objData.factions.flatMap((f) => f.candidates.map((c) => c.entityId))
        ),
        'Have factions with the same candidates'
      ).toBe(true);
    } else if (objData.candidates) {
      expect(
        contentsMatch(
          obj.candidateNominations.map((c) => c.entity.id),
          objData.candidates.map((c) => c.entityId)
        ),
        'Have the same candidates'
      ).toBe(true);
    }
    // We do not check for null candidates, because the nominations might be provided as a flat array instead of a nested tree
  });
});

test('Should list its direct child nominations and all its candidate nominations', () => {
  const orgs = root.organizationNominations ?? [];
  const withFactions = orgs.filter((o) => o.hasFactions);
  const withCandidates = orgs.filter((o) => o.hasCandidates);
  expect(withFactions.length, 'Test data to include an organization nominated through factions').toBeGreaterThan(0);
  expect(withCandidates.length, 'Test data to include an organization with direct candidates').toBeGreaterThan(0);
  for (const obj of withFactions) {
    expect(obj.childNominations).toEqual(obj.factionNominations);
    expect(obj.allCandidateNominations).toEqual(obj.factionNominations.flatMap((f) => f.candidateNominations));
    expect(obj.allCandidateNominations.length).toBeGreaterThan(0);
  }
  for (const obj of withCandidates) {
    expect(obj.childNominations).toEqual(obj.candidateNominations);
    expect(obj.allCandidateNominations).toEqual(obj.candidateNominations);
  }
});

/**
 * Find the nomination object that matches the nomination data, i.e. has the same electionId, electionRound, constituencyId and entityId.
 * @param nominations - The entities to search in
 * @param nominationData - The data for the nomination
 * @returns An array of matching implicit nominations, which should have one and only one item
 */
function findNominations(
  nominations: Array<OrganizationNomination>,
  nominationData: ExtendedNominationData<typeof ENTITY_TYPE.Organization>
): Array<OrganizationNomination> {
  const found = new Array<OrganizationNomination>();
  for (const obj of nominations) {
    // if (obj.entity.id === 'organization-2') console.info(obj.electionRound, nominationData.electionRound);
    if (
      obj.election.id === nominationData.electionId &&
      ((!nominationData.electionRound && obj.electionRound === 1) ||
        obj.electionRound === nominationData.electionRound) &&
      obj.constituency.id === nominationData.constituencyId &&
      obj.entity.id === nominationData.entityId
    )
      found.push(obj);
  }
  return found;
}
