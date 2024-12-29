import crypto from 'crypto';
import { describe, expect, test } from 'vitest';
import {
  AnyQuestionVariant,
  ENTITY_TYPE,
  FilterValue,
  Id,
  QuestionAndCategoryBase,
  QuestionAndCategoryBaseData,
  QuestionCategory
} from '../../../internal';
import { contentsMatch, getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const categoryData = getTestData().questions.categories;

test('Should have all questions and categories', () => {
  questionData.forEach(({ type, id }) => {
    const obj = root.getQuestion(id);
    expect(obj.id).toBe(id);
    expect(obj.type).toBe(type);
  });
  categoryData.forEach(({ id }) => {
    const obj = root.getQuestionCategory(id);
    expect(obj.id).toBe(id);
  });
});

test('Should have filterable properties', () => {
  questionData.forEach((data) => {
    const obj = root.getQuestion(data.id);
    testFilterableProps(obj, data);
  });
  categoryData.forEach((data) => {
    const obj = root.getQuestionCategory(data.id);
    testFilterableProps(obj, data);
  });
});

describe('AppliesTo should work', () => {
  class MockQuestionAndCategory extends QuestionAndCategoryBase<QuestionAndCategoryBaseData> {}
  const election = root.elections?.[0];
  const election2 = root.elections?.[1];
  const constituency = root.constituencies?.[0];
  const constituency2 = root.constituencies?.[1];
  const entityType = ENTITY_TYPE.Candidate;
  const entityType2 = ENTITY_TYPE.Organization;
  if ([election, election2, constituency, constituency2].some((o) => o == null))
    throw new Error('Test setup error: Test data must have at least two elections and two constituencies');

  test('Object has no filterable restrictions', () => {
    const obj = new MockQuestionAndCategory({ data: { id: crypto.randomUUID() }, root });
    expect(obj.appliesTo({ elections: election! })).toBe(true);
    expect(obj.appliesTo({ elections: [election!, election2!] })).toBe(true);
    expect(obj.appliesTo({ constituencies: constituency })).toBe(true);
    expect(obj.appliesTo({ entityType: entityType })).toBe(true);
    expect(obj.appliesTo({ electionRounds: 1 })).toBe(true);
    expect(obj.appliesTo({ elections: election, constituencies: constituency, entityType: entityType })).toBe(true);
  });

  test('Object has empty arrays for filterable restrictions', () => {
    const obj = new MockQuestionAndCategory({
      data: {
        id: crypto.randomUUID(),
        electionIds: [],
        electionRounds: [],
        constituencyIds: [],
        entityType: []
      },
      root
    });
    expect(obj.appliesTo({ elections: election! })).toBe(true);
    expect(obj.appliesTo({ elections: [election!, election2!] })).toBe(true);
    expect(obj.appliesTo({ constituencies: constituency })).toBe(true);
    expect(obj.appliesTo({ entityType: entityType })).toBe(true);
    expect(obj.appliesTo({ electionRounds: 1 })).toBe(true);
    expect(obj.appliesTo({ elections: election, constituencies: constituency, entityType: entityType })).toBe(true);
  });

  test('Object has filterable restrictions', () => {
    const obj = new MockQuestionAndCategory({
      data: {
        id: crypto.randomUUID(),
        electionIds: election!.id,
        electionRounds: 1,
        constituencyIds: [constituency!.id, crypto.randomUUID()],
        entityType: [entityType]
      },
      root
    });
    expect(obj.appliesTo({ elections: election! })).toBe(true);
    expect(obj.appliesTo({ elections: election2! })).toBe(false);
    expect(obj.appliesTo({ elections: [election!, election2!] })).toBe(true);
    expect(obj.appliesTo({ constituencies: constituency })).toBe(true);
    expect(obj.appliesTo({ constituencies: constituency2 })).toBe(false);
    expect(obj.appliesTo({ entityType: entityType })).toBe(true);
    expect(obj.appliesTo({ entityType: entityType2 })).toBe(false);
    expect(obj.appliesTo({ electionRounds: 1 })).toBe(true);
    expect(obj.appliesTo({ electionRounds: 2 })).toBe(false);
    expect(obj.appliesTo({ elections: election, constituencies: constituency, entityType: entityType })).toBe(true);
    expect(obj.appliesTo({ elections: election, constituencies: constituency2, entityType: entityType })).toBe(false);
  });
});

/**
 * Check that the filterable props in the object and data match
 * @param obj - The object to check
 * @param data - The object data
 */
function testFilterableProps(
  obj: AnyQuestionVariant | QuestionCategory,
  {
    electionIds,
    electionRounds,
    constituencyIds
  }: {
    electionIds?: FilterValue<Id> | null;
    electionRounds?: FilterValue<number> | null;
    constituencyIds?: FilterValue<Id> | null;
  }
): void {
  if (electionIds) {
    electionIds = [electionIds].flat();
    expect(
      contentsMatch(
        obj.elections.map((o) => o.id),
        electionIds
      ),
      'To have elections'
    ).toBe(true);
  }
  if (constituencyIds) {
    constituencyIds = [constituencyIds].flat();
    expect(
      contentsMatch(
        obj.constituencies.map((o) => o.id),
        constituencyIds
      ),
      'To have constituencies'
    ).toBe(true);
  }
  if (electionRounds) {
    electionRounds = [electionRounds].flat();
    const objRounds = obj.electionRounds ? [obj.electionRounds].flat() : [];
    expect(contentsMatch(objRounds, electionRounds), 'To have electionRounds').toBe(true);
  }
}
