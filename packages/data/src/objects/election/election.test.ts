import { describe, expect, test } from 'vitest';
import { DataRoot, QUESTION_CATEGORY_TYPE } from '../../internal';
import { getTestData, getTestDataRoot, NOMINATION_COUNTS, NOMINATION_COUNTS_ROUND_2 } from '../../testUtils';
import type { Constituency } from '../../internal';

const root = getTestDataRoot();
const data = getTestData();

test('Should have all elections', () => {
  expect(root.elections?.length).toBe(3);
});

test('Should return null for invalid date', () => {
  const election = root.elections![0];
  election.data.date = 'invalid-date';
  expect(election.date).toBeNull();
});

test('Should have constituencyGroups', () => {
  const groupIds = {
    'election-1': ['constituencyGroup-1', 'constituencyGroup-2'],
    'election-2': ['constituencyGroup-3'],
    'election-3': ['constituencyGroup-4']
  };
  root.elections!.forEach((obj) => {
    const objData = data.elections.find((d) => d.id === obj.id);
    expect(objData).toBeDefined();
    expect(obj.constituencyGroups.map((g) => g.id)).toEqual(groupIds[obj.id]);
  });
});

test('Should have correct number of nominations', () => {
  root.elections!.forEach((election) => {
    election.constituencyGroups
      .map((g) => g.constituencies)
      .flat()
      .forEach((c) => {
        // If an election is not included in the NOMINATION_COUNTS object, expect it to have no nominations
        const constCounts = NOMINATION_COUNTS[election.id]?.[c.id] ?? {
          alliance: 0,
          candidate: 0,
          faction: 0,
          organization: 0
        };
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

test('Should default nominationShape to organization_list_and_independents when the data states none', () => {
  const election = getTestDataRoot().elections![0];
  expect(election.data.nominationShape).toBeUndefined();
  expect(election.nominationShape).toBe('organization_list_and_independents');
  election.data.nominationShape = null;
  expect(election.nominationShape).toBe('organization_list_and_independents');
});

test('Should return the nominationShape the data states', () => {
  const election = getTestDataRoot().elections![0];
  const shapes = [
    'organization_only',
    'candidate_only',
    'organization_list',
    'organization_list_and_independents'
  ] as const;
  for (const shape of shapes) {
    election.data.nominationShape = shape;
    expect(election.nominationShape).toBe(shape);
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

describe('getApplicableConstituencies', () => {
  const election = root.elections![0];
  const constituencies = election.constituencyGroups[0].constituencies;
  test('Should return every applicable constituency in the order given', () => {
    const notThere = { id: 'NOT_THERE' } as Constituency;
    expect(election.getApplicableConstituencies([constituencies[1], notThere, constituencies[0]])).toEqual([
      constituencies[1],
      constituencies[0]
    ]);
  });
  test('Should return an empty array if no constituency is applicable', () => {
    expect(election.getApplicableConstituencies([{ id: 'NOT_THERE' } as Constituency])).toEqual([]);
    expect(election.getApplicableConstituencies([])).toEqual([]);
  });
  test('Should match constituencies of every group of the election', () => {
    const fromSecondGroup = election.constituencyGroups[1].constituencies[0];
    expect(election.getApplicableConstituencies([constituencies[0], fromSecondGroup])).toEqual([
      constituencies[0],
      fromSecondGroup
    ]);
  });
});

/**
 * A root whose `mixed` election has a group of regions and a group of municipalities, each municipality the child of a region, and whose `paired` election has the regions and an unrelated group of districts of the same size.
 */
function hierarchicalRoot(): DataRoot {
  const root = new DataRoot();
  root.provideElectionData([
    { id: 'mixed', name: 'Mixed', constituencyGroupIds: ['regions', 'municipalities'] },
    { id: 'paired', name: 'Paired', constituencyGroupIds: ['regions', 'districts'] },
    { id: 'regional', name: 'Regional', constituencyGroupIds: ['regions'] }
  ]);
  root.provideConstituencyData({
    groups: [
      { id: 'regions', constituencyIds: ['region-1', 'region-2'] },
      { id: 'municipalities', constituencyIds: ['municipality-1a', 'municipality-1b', 'municipality-2a'] },
      { id: 'districts', constituencyIds: ['district-x', 'district-y'] }
    ],
    constituencies: [
      { id: 'region-1', name: 'Region 1' },
      { id: 'region-2', name: 'Region 2' },
      { id: 'municipality-1a', name: 'Municipality 1a', parentId: 'region-1' },
      { id: 'municipality-1b', name: 'Municipality 1b', parentId: 'region-1' },
      { id: 'municipality-2a', name: 'Municipality 2a', parentId: 'region-2' },
      { id: 'district-x', name: 'District X' },
      { id: 'district-y', name: 'District Y' }
    ]
  });
  return root;
}

describe('getMostSpecificConstituency', () => {
  const root = hierarchicalRoot();
  function constituenciesOf(...ids: Array<string>): Array<Constituency> {
    return ids.map((id) => root.getConstituency(id));
  }

  test.each([
    ['first', ['region-1', 'municipality-1a']],
    ['last', ['municipality-1a', 'region-1']]
  ])('Should return the municipality given together with its parent region, the region given %s', (_, ids) => {
    const constituencies = constituenciesOf(...ids);
    expect(() => root.getElection('mixed').getApplicableConstituency(constituencies)).toThrow();
    expect(root.getElection('mixed').getMostSpecificConstituency(constituencies)?.id).toBe('municipality-1a');
  });

  test('Should return the one applicable constituency', () => {
    expect(
      root.getElection('regional').getMostSpecificConstituency(constituenciesOf('municipality-1a', 'region-2'))?.id
    ).toBe('region-2');
  });

  test('Should return the constituency of the smallest group among constituencies not related by parentage', () => {
    expect(
      root.getElection('mixed').getMostSpecificConstituency(constituenciesOf('municipality-2a', 'region-1'))?.id
    ).toBe('region-1');
  });

  test.each([
    [['district-x', 'region-1'], 'district-x'],
    [['region-1', 'district-x'], 'region-1'],
    [['region-2', 'region-1'], 'region-2']
  ])('Should return the first of %j, whose groups are of one size', (ids, expected) => {
    expect(root.getElection('paired').getMostSpecificConstituency(constituenciesOf(...ids))?.id).toBe(expected);
  });

  test('Should return undefined if no constituency is applicable', () => {
    expect(
      root.getElection('regional').getMostSpecificConstituency(constituenciesOf('municipality-1a', 'district-x'))
    ).toBeUndefined();
    expect(root.getElection('regional').getMostSpecificConstituency([])).toBeUndefined();
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
    expect(questions?.map((q) => q.id)).toEqual(ids);
  });
});
