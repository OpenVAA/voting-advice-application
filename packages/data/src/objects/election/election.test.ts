import { expect, test } from 'vitest';
import { parseNominationTree } from '../../internal';
import { getNominationCounts, getTestData, getTestDataRoot } from '../../testUtils';

const root = getTestDataRoot();
const data = getTestData();

test('Should have all elections', () => {
  expect(root.elections?.length).toBe(data.elections.length);
});

test('Should return null for invalid date', () => {
  const election = root.elections![0];
  election.data.date = 'invalid-date';
  expect(election.date).toBeNull();
});

test('Should have constituencyGroups', () => {
  root.elections!.forEach((obj) => {
    const objData = data.elections.find((d) => d.id === obj.id);
    expect(objData).toBeDefined();
    expect(obj.constituencyGroups.map((g) => g.id).sort()).toEqual(objData!.constituencyGroupIds.sort());
  });
});

test('Should have correct number of nominations', () => {
  const nominationData = parseNominationTree(data.nominations);
  root.elections!.forEach((election) => {
    election.constituencyGroups
      .map((g) => g.constituencies)
      .flat()
      .forEach((c) => {
        /** The nomination counts for this election-constituency pair */
        const constCounts = getNominationCounts(
          nominationData.filter((d) => d.electionId === election.id && d.constituencyId === c.id)
        );
        expect(election.getAllianceNominations(c).length, 'Alliance nominations').toEqual(constCounts.alliance);
        expect(election.getCandidateNominations(c).length, 'Candidate nominations').toEqual(constCounts.candidate);
        expect(election.getFactionNominations(c).length, 'Faction nominations').toEqual(constCounts.faction);
        expect(election.getOrganizationNominations(c).length, 'Organization nominations').toEqual(
          constCounts.organization
        );
      });
  });
});
