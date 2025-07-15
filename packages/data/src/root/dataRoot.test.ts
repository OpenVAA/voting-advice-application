import { describe, expect, test } from 'vitest';
import {
  DataRoot,
  DateQuestion,
  ENTITY_TYPE,
  MultipleChoiceCategoricalQuestion,
  NumberQuestion,
  QUESTION_CATEGORY_TYPE
} from '../internal';
import { ENTITY_NOMINATIONS, getTestData, getTestDataRoot, NOMINATION_COUNTS } from '../testUtils';
import type { AnyNominationVariant, EntityType } from '../internal';

/**
 * Some of `DataRoot`’s methods are in effect tested by `getDataRoot` or the object classes and will not be repeated here, e.g.:
 * - getEntity
 * - getNomination
 * - data provision methods
 * - text formatters
 */

const root = getTestDataRoot();

/** For accessing the protected children property */
class MockDataRoot extends DataRoot {
  get childrenObject() {
    return this.children;
  }
}
const mockRoot = new MockDataRoot({ data: getTestData() });

test('Should have array and id-based getters for all child collections', () => {
  for (const collection of Object.keys(mockRoot.childrenObject)) {
    expect(Array.isArray(mockRoot[collection]), `To have a collection array getter for ${collection}`).toBe(true);
    const singular = collection.endsWith('ies') ? `${collection.slice(0, -3)}y` : `${collection.slice(0, -1)}`;
    const byIdGetter = `get${singular.charAt(0).toUpperCase()}${singular.slice(1)}`;
    expect(typeof mockRoot[byIdGetter], `To have id based object getter for ${collection}`).toBe('function');
  }
});

test('GetNomination should work', () => {
  // This test is a bit circular but we don't have any other easy way of getting the nomination ids
  const allNominations = Object.entries(mockRoot.childrenObject)
    .filter(([k]) => k.endsWith('Nominations'))
    .flatMap(([, v]) => [...v.values()]) as Array<AnyNominationVariant>;
  for (const { id, entityType } of allNominations) {
    expect(mockRoot.getNomination(entityType, id).id).toBe(id);
  }
});

test('GetNominationsForEntity should return the correct number of nominations', () => {
  for (const type in ENTITY_NOMINATIONS) {
    for (const [id, numNominations] of Object.entries(ENTITY_NOMINATIONS[type])) {
      const count = root.getNominationsForEntity({ type: type as EntityType, id })?.length;
      expect(count, `Nomination count for ${type} ${id}`).toBe(numNominations);
    }
  }
});

test('GetNominationsForConstituency should work', () => {
  for (const [electionId, eCounts] of Object.entries(NOMINATION_COUNTS)) {
    for (const [constituencyId, cCounts] of Object.entries(eCounts)) {
      for (const [type, count] of Object.entries(cCounts)) {
        expect(
          root.getNominationsForConstituency({
            electionId,
            // NOMINATION_COUNTS holds the counts for round 1
            electionRound: 1,
            constituencyId,
            type: type as EntityType
          })?.length,
          `To have the correct number of nominations for entity type ${type} in election ${electionId} and constituency ${constituencyId}`
        ).toEqual(count);
      }
    }
  }
});

describe('FindQuestions', () => {
  test('Should find questions', () => {
    const questions = root.findQuestions({
      type: QUESTION_CATEGORY_TYPE.Info, // Filter in those whose cateqgory is of type 'info'
      entityType: ENTITY_TYPE.Organization // Filter out those with entityType: 'candidate'
    });
    const ids = [1, 2, 6, 7].map((i) => `question-${i}`);
    expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));
  });
  test('Should exclude those where filter is different', () => {
    const questions = root.findQuestions({
      type: QUESTION_CATEGORY_TYPE.Opinion,
      constituencies: root.getConstituency('constituency-1-2') // question-10 has constituency filter 'constituency-1-1'
    });
    const ids = [8, 9, 11, 12, 13].map((i) => `question-${i}`);
    expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));
  });
  test('Should include questions where filter is not defined', () => {
    const questions = root.findQuestions({
      type: QUESTION_CATEGORY_TYPE.Opinion,
      entityType: ENTITY_TYPE.Candidate // No opinion question has an entityType filter
    });
    const ids = [8, 9, 10, 11, 12, 13].map((i) => `question-${i}`);
    expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));
  });
  test('Should apply filters to categories', () => {
    const questions = root.findQuestions({
      type: QUESTION_CATEGORY_TYPE.Info,
      entityType: ENTITY_TYPE.Candidate // questionCategory-2 has an Organization entityType filter
    });
    const ids = [1, 2, 3, 4, 5].map((i) => `question-${i}`);
    expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));
  });
});

describe('formatAnswer', () => {
  // Get a copy, bc we set the locale
  const root = getTestDataRoot();
  root.locale = 'en-US';

  test('Should format number answer correctly', () => {
    const question = new NumberQuestion({
      data: {
        type: 'number',
        name: 'Percentage',
        categoryId: 'X',
        id: 'question-number',
        format: {
          style: 'percent'
        }
      },
      root
    });
    expect(
      root.formatAnswer({
        question,
        answer: { value: 0.5 }
      })
    ).toBe('50%');
  });

  test('Should format date answer correctly', () => {
    const question = new DateQuestion({
      data: {
        type: 'date',
        name: 'Date',
        categoryId: 'X',
        id: 'question-date',
        format: {
          year: '2-digit',
          month: 'long',
          day: '2-digit'
        }
      },
      root
    });
    expect(
      root.formatAnswer({
        question,
        answer: { value: new Date(2023, 9, 5) }
      })
    ).toBe('October 05, 23');
  });

  test('Should format multiple choice answer correctly', () => {
    const question = new MultipleChoiceCategoricalQuestion({
      data: {
        type: 'multipleChoiceCategorical',
        name: 'Multi',
        categoryId: 'X',
        id: 'question-multi',
        choices: [
          { id: 'choice-1', label: 'Choice 1' },
          { id: 'choice-2', label: '  Choice 2' },
          { id: 'choice-3', label: '  Choice 3  ' }
        ]
      },
      root
    });
    expect(
      root.formatAnswer({
        question,
        answer: { value: ['choice-3', 'choice-1', 'choice-2'] }
      })
    ).toBe('Choice 3, Choice 1, Choice 2');
  });
});

describe('formatAnswer', () => {
  // Get a copy, bc we set the locale
  const root = getTestDataRoot();
  root.locale = 'en-US';

  test('Should format number answer correctly', () => {
    const question = new NumberQuestion({
      data: {
        type: 'number',
        name: 'Percentage',
        categoryId: 'X',
        id: 'question-number',
        format: {
          style: 'percent'
        }
      },
      root
    });
    expect(
      root.formatAnswer({
        question,
        answer: { value: 0.5 }
      })
    ).toBe('50%');
  });

  test('Should format date answer correctly', () => {
    const question = new DateQuestion({
      data: {
        type: 'date',
        name: 'Date',
        categoryId: 'X',
        id: 'question-date',
        format: {
          year: '2-digit',
          month: 'long',
          day: '2-digit'
        }
      },
      root
    });
    expect(
      root.formatAnswer({
        question,
        answer: { value: new Date(2023, 9, 5) }
      })
    ).toBe('October 05, 23');
  });

  test('Should format multiple choice answer correctly', () => {
    const question = new MultipleChoiceCategoricalQuestion({
      data: {
        type: 'multipleChoiceCategorical',
        name: 'Multi',
        categoryId: 'X',
        id: 'question-multi',
        choices: [
          { id: 'choice-1', label: 'Choice 1' },
          { id: 'choice-2', label: '  Choice 2' },
          { id: 'choice-3', label: '  Choice 3  ' }
        ]
      },
      root
    });
    expect(
      root.formatAnswer({
        question,
        answer: { value: ['choice-3', 'choice-1', 'choice-2'] }
      })
    ).toBe('Choice 3, Choice 1, Choice 2');
  });
});

describe('getCombinedElections', () => {
  test('Should returned combined elections for elections 2 and 3', () => {
    const parentElection = root.getElection('election-2');
    const childElection = root.getElection('election-3');
    const unrelatedElection = root.getElection('election-1');
    const expected = [
      unrelatedElection,
      {
        type: 'combined',
        elections: [parentElection, childElection],
        constituencyGroup: childElection.constituencyGroups[0]
      }
    ];
    const combined = root.getCombinedElections();
    expect(combined).toEqual(expected);
  });
  test('Should chain three combined elections', () => {
    // Make a copy, because we will edit the data
    const root = getTestDataRoot();
    const grandParentElection = root.getElection('election-1');
    // Remove 'constituencyGroup-2' from 'election-1' so that it can chain all the way through
    grandParentElection.data.constituencyGroupIds = ['constituencyGroup-1'];
    const parentElection = root.getElection('election-2');
    const childElection = root.getElection('election-3');
    const expected = [
      {
        type: 'combined',
        elections: [grandParentElection, parentElection, childElection],
        constituencyGroup: childElection.constituencyGroups[0]
      }
    ];
    const combined = root.getCombinedElections();
    expect(combined).toEqual(expected);
  });
});

describe('getApplicableElections', () => {
  const grandParentElection = root.getElection('election-1');
  const parentElection = root.getElection('election-2');
  const childElection = root.getElection('election-3');
  test('Should return same election', () => {
    const constituency = grandParentElection.constituencyGroups[0].constituencies[0];
    expect(constituency).toBeDefined();
    expect(root.getApplicableElections(constituency)).toEqual([grandParentElection]);
  });
  test('Should return self and parent election', () => {
    const constituency = parentElection.constituencyGroups[0].constituencies[0];
    expect(constituency).toBeDefined();
    const elections = root.getApplicableElections(constituency);
    expect(elections).toEqual(expect.arrayContaining([grandParentElection, parentElection]));
    expect(elections).toHaveLength(2);
  });
  test('Should return self, parent and gransparent election', () => {
    const constituency = childElection.constituencyGroups[0].constituencies[0];
    expect(constituency).toBeDefined();
    const elections = root.getApplicableElections(constituency);
    expect(elections).toEqual(expect.arrayContaining([grandParentElection, parentElection, childElection]));
    expect(elections).toHaveLength(3);
  });
  test('Should not return unrelated elections', () => {
    // parentElection.constituencyGroups[1] is not part of any other hierarchy
    const constituency = grandParentElection.constituencyGroups[1].constituencies[0];
    expect(constituency).toBeDefined();
    const elections = root.getApplicableElections(constituency);
    expect(elections).toEqual([grandParentElection]);
  });
});
