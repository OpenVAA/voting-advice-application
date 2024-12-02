import { describe } from 'node:test';
import { expect, test } from 'vitest';
import { Constituency, QUESTION_CATEGORY_TYPE } from '../../internal';
import { getTestData, getTestDataRoot, NOMINATION_COUNTS, NOMINATION_COUNTS_ROUND_2 } from '../../testUtils';

const root = getTestDataRoot();
const data = getTestData();

test('Should have all elections', () => {
  expect(root.elections?.length).toBe(2);
});

test('Should return null for invalid date', () => {
  const election = root.elections![0];
  election.data.date = 'invalid-date';
  expect(election.date).toBeNull();
});

test('Should have constituencyGroups', () => {
  const groupIds = {
    'election-1': ['constituencyGroup-1', 'constituencyGroup-2'],
    'election-2': ['constituencyGroup-3']
  };
  root.elections!.forEach((obj) => {
    const objData = data.elections.find((d) => d.id === obj.id);
    expect(objData).toBeDefined();
    expect(obj.constituencyGroups.map((g) => g.id)).toEqual(expect.arrayContaining(groupIds[obj.id]));
  });
});

test('Should have correct number of nominations', () => {
  root.elections!.forEach((election) => {
    election.constituencyGroups
      .map((g) => g.constituencies)
      .flat()
      .forEach((c) => {
        const constCounts = NOMINATION_COUNTS[election.id][c.id];
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
  // Make a copy of root so as not to affect the original data when we change the round below
  const root = getTestDataRoot();
  for (const electionId in NOMINATION_COUNTS_ROUND_2) {
    const election = root.getElection(electionId);
    election.data.round = 2;
    expect(election).toBeDefined();
    for (const constituencyId in NOMINATION_COUNTS_ROUND_2[electionId]) {
      const constCounts = NOMINATION_COUNTS_ROUND_2[electionId][constituencyId];
      const constituency = root.getConstituency(constituencyId);
      expect(constituency).toBeDefined();
      expect(
        election.getAllianceNominations(constituency).length,
        `Second round Alliance nominations: ${election.id} / ${constituency.id}`
      ).toEqual(constCounts.alliance);
      expect(
        election.getCandidateNominations(constituency).length,
        `Second round Candidate nominations: ${election.id} / ${constituency.id}`
      ).toEqual(constCounts.candidate);
      expect(
        election.getFactionNominations(constituency).length,
        `Second round Faction nominations: ${election.id} / ${constituency.id}`
      ).toEqual(constCounts.faction);
      expect(
        election.getOrganizationNominations(constituency).length,
        `Second round Organization nominations: ${election.id} / ${constituency.id}`
      ).toEqual(constCounts.organization);
    }
  }
});

describe('getApplicableConstituency', () => {
  const election = root.elections![0];
  const constituencies = election.constituencyGroups[0].constituencies;
  test('Should return applicable constituency', () => {
    expect(election.getApplicableConstituency([constituencies[0], { id: 'NOT_THERE' } as Constituency])).toBe(
      constituencies[0]
    );
  });
  test('Should return undefined if no constituency is applicable', () => {
    expect(election.getApplicableConstituency([{ id: 'NOT_THERE' } as Constituency])).toBeUndefined();
  });
  test('Should throw is more than one constituency is applicable', () => {
    expect(() => election.getApplicableConstituency([constituencies[0], constituencies[1]])).toThrow();
  });
});

describe('GetQuestions', () => {
  const election = root.getElection('election-1');
  const constituency = root.getConstituency('constituency-1-1');
  test('Should get questions', () => {
    const questions = election.getQuestions({
      type: QUESTION_CATEGORY_TYPE.Opinion,
      constituency: constituency
    });
    // Opinion questions are from 8 to 13, but 8 and 10 are for election-2 only.
    // Question-10 has a constituency filter 'constituency-1-1' but it should not be included because of the election filter
    const ids = [9, 11, 12, 13].map((i) => `question-${i}`);
    expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));
  });
});
