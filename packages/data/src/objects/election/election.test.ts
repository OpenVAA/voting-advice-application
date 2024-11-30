import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { ENTITY_TYPE, parseNominationTree } from '../../internal';
import { getTestData, getTestDataRoot, parseNestedNominations } from '../../testUtils';

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
  const nominationData = parseNestedNominations(parseNominationTree(data.nominations));
  root.elections!.forEach((election) => {
    election.constituencyGroups
      .map((g) => g.constituencies)
      .flat()
      .forEach((c) => {
        const constNominations = nominationData.filter(
          (d) => d.electionId === election.id && (d.electionRound ?? 1) === election.round && d.constituencyId === c.id
        );
        /** The nomination counts for this election-constituency pair */
        const constCounts = Object.fromEntries(
          Object.values(ENTITY_TYPE).map((t) => [t, constNominations.filter((n) => n.entityType === t).length])
        );
        expect(election.getAllianceNominations(c).length, `Alliance nominations: ${election.id} / ${c.id}`).toEqual(
          constCounts.alliance
        );
        expect(election.getCandidateNominations(c).length, `Candidate nominations: ${election.id} / ${c.id}`).toEqual(
          constCounts.candidate
        );
        expect(election.getFactionNominations(c).length, `Faction nominations: ${election.id} / ${c.id}`).toEqual(
          constCounts.faction
        );
        expect(
          election.getOrganizationNominations(c).length,
          `Organization nominations: ${election.id} / ${c.id}`
        ).toEqual(constCounts.organization);
      });
  });
});

test('Should have correct number of nominations for the second round of elections', () => {
  const nominationData = parseNestedNominations(parseNominationTree(data.nominations));
  // Make a copy of root so as not to affect the original data
  const root = getTestDataRoot();
  root.elections!.forEach((election) => {
    // Set election round to 2
    election.data.round = 2;
    election.constituencyGroups
      .map((g) => g.constituencies)
      .flat()
      .forEach((c) => {
        const constNominations = nominationData.filter(
          (d) => d.electionId === election.id && (d.electionRound ?? 1) === election.round && d.constituencyId === c.id
        );
        /** The nomination counts for this election-constituency pair */
        const constCounts = Object.fromEntries(
          Object.values(ENTITY_TYPE).map((t) => [t, constNominations.filter((n) => n.entityType === t).length])
        );
        expect(election.getAllianceNominations(c).length, `Alliance nominations: ${election.id} / ${c.id}`).toEqual(
          constCounts.alliance
        );
        expect(election.getCandidateNominations(c).length, `Candidate nominations: ${election.id} / ${c.id}`).toEqual(
          constCounts.candidate
        );
        expect(election.getFactionNominations(c).length, `Faction nominations: ${election.id} / ${c.id}`).toEqual(
          constCounts.faction
        );
        expect(
          election.getOrganizationNominations(c).length,
          `Organization nominations: ${election.id} / ${c.id}`
        ).toEqual(constCounts.organization);
      });
  });
});

describe('getApplicableConstituency', () => {
  const election = root.elections![0];
  const constituencies = election.constituencyGroups[0].constituencies;
  test('Should return applicable constituency', () => {
    expect(election.getApplicableConstituency([constituencies[0], { id: 'NOT_THERE' }])).toBe(constituencies[0]);
  });
  test('Should return undefined if no constituency is applicable', () => {
    expect(election.getApplicableConstituency([{ id: 'NOT_THERE' }])).toBeUndefined();
  });
  test('Should throw is more than one constituency is applicable', () => {
    expect(() => election.getApplicableConstituency([constituencies[0], constituencies[1]])).toThrow();
  });
});
