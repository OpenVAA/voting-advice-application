import { expect, test } from 'vitest';
import { DataRoot, FILTER_NONE_APPLICABLE, isFilterNoneApplicable, MultipleTextQuestion } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';
import type { AnyQuestionVariantData, Constituency, Election, QuestionCategoryData } from '../../../internal';

/**
 * NB. We test the methods handling answer values separately for each question type in their own test files.
 */
const root = getTestDataRoot();
const questionData = getTestData().questions.questions;

test('Should have category', () => {
  questionData.forEach(({ id, categoryId }) => {
    const obj = root.getQuestion(id);
    expect(obj.category.id).toBe(categoryId);
  });
});

test('Should format answer', () => {
  // We use a TextQuestion here bc Question is abstract
  const question = new MultipleTextQuestion({
    root,
    data: {
      id: 'id',
      type: 'multipleText',
      name: 'name',
      categoryId: 'categoryId'
    }
  });
  expect(question.formatAnswer({ answer: { value: ['Hello, World!'] } })).toBe('Hello, World!');
  expect(question.formatAnswer({ answer: { value: ['Hello, World!'] }, map: (v: string) => `PREFIX ${v}` })).toBe(
    'PREFIX Hello, World!'
  );
});

test('Should test applicability of category as well', () => {
  const root = new DataRoot();
  const categories = [{ id: 'category-1', name: 'x', electionIds: ['election-1'] }];
  const questions: Array<AnyQuestionVariantData> = [
    { id: 'question-1', type: 'text', name: 'x', categoryId: 'category-1', constituencyIds: ['constituency-1'] }
  ];
  root.provideQuestionData({ categories, questions });
  const question = root.getQuestion('question-1');
  expect(
    question.appliesTo({
      constituencies: { id: 'constituency-1' } as Constituency
    })
  ).toBe(true);
  expect(
    question.appliesTo({
      constituencies: { id: 'constituency-1' } as Constituency,
      elections: { id: 'election-1' } as Election
    })
  ).toBe(true);
  expect(
    question.appliesTo({
      elections: { id: 'election-2' } as Election // Different election
    })
  ).toBe(false);
});

test('Should test applicability with dontInherit option', () => {
  const root = new DataRoot();
  const categories = [{ id: 'category-1', name: 'x', electionIds: ['election-1'] }];
  const questions: Array<AnyQuestionVariantData> = [
    { id: 'question-1', type: 'text', name: 'x', categoryId: 'category-1', constituencyIds: ['constituency-1'] }
  ];
  root.provideQuestionData({ categories, questions });
  const question = root.getQuestion('question-1');

  // Without dontInherit, should check both question and category
  expect(
    question.appliesTo({
      elections: { id: 'election-2' } as Election
    })
  ).toBe(false);

  // With dontInherit, should only check question's own filters (which has no election filter)
  expect(
    question.appliesTo(
      {
        elections: { id: 'election-2' } as Election
      },
      { dontInherit: true }
    )
  ).toBe(true);
});

test('Should get effective elections', () => {
  const root = new DataRoot();
  root.provideElectionData([
    { id: 'election-1', name: 'Election 1', constituencyGroupIds: [] },
    { id: 'election-2', name: 'Election 2', constituencyGroupIds: [] },
    { id: 'election-3', name: 'Election 3', constituencyGroupIds: [] }
  ]);

  // Case 1: Question has no elections, category has elections
  const categories1 = [{ id: 'category-1', name: 'x', electionIds: ['election-1', 'election-2'] }];
  const questions1: Array<AnyQuestionVariantData> = [
    { id: 'question-1', type: 'text', name: 'x', categoryId: 'category-1' }
  ];
  root.provideQuestionData({ categories: categories1, questions: questions1 });
  const question1 = root.getQuestion('question-1');
  expect(isFilterNoneApplicable(question1.effectiveElections)).toBe(false);
  expect((question1.effectiveElections as Array<Election>).map((e) => e.id)).toEqual(['election-1', 'election-2']);

  // Case 2: Question has elections, category has no elections
  const categories2 = [{ id: 'category-2', name: 'x' }];
  const questions2: Array<AnyQuestionVariantData> = [
    { id: 'question-2', type: 'text', name: 'x', categoryId: 'category-2', electionIds: ['election-2', 'election-3'] }
  ];
  root.provideQuestionData({ categories: categories2, questions: questions2 });
  const question2 = root.getQuestion('question-2');
  expect(isFilterNoneApplicable(question2.effectiveElections)).toBe(false);
  expect((question2.effectiveElections as Array<Election>).map((e) => e.id)).toEqual(['election-2', 'election-3']);

  // Case 3: Both have elections - should return intersection
  const categories3 = [{ id: 'category-3', name: 'x', electionIds: ['election-1', 'election-2'] }];
  const questions3: Array<AnyQuestionVariantData> = [
    { id: 'question-3', type: 'text', name: 'x', categoryId: 'category-3', electionIds: ['election-2', 'election-3'] }
  ];
  root.provideQuestionData({ categories: categories3, questions: questions3 });
  const question3 = root.getQuestion('question-3');
  expect(isFilterNoneApplicable(question3.effectiveElections)).toBe(false);
  expect((question3.effectiveElections as Array<Election>).map((e) => e.id)).toEqual(['election-2']);

  // Case 4: Neither has elections
  const categories4 = [{ id: 'category-4', name: 'x' }];
  const questions4: Array<AnyQuestionVariantData> = [
    { id: 'question-4', type: 'text', name: 'x', categoryId: 'category-4' }
  ];
  root.provideQuestionData({ categories: categories4, questions: questions4 });
  const question4 = root.getQuestion('question-4');
  expect(question4.effectiveElections).toEqual([]);

  // Case 5: Conflicting elections - no intersection
  const categories5 = [{ id: 'category-5', name: 'x', electionIds: ['election-1'] }];
  const questions5: Array<AnyQuestionVariantData> = [
    { id: 'question-5', type: 'text', name: 'x', categoryId: 'category-5', electionIds: ['election-3'] }
  ];
  root.provideQuestionData({ categories: categories5, questions: questions5 });
  const question5 = root.getQuestion('question-5');
  expect(isFilterNoneApplicable(question5.effectiveElections)).toBe(true);
  expect(question5.effectiveElections).toBe(FILTER_NONE_APPLICABLE);
});

test('Should get effective election rounds', () => {
  const root = new DataRoot();

  // Case 1: Question has no rounds, category has rounds
  const categories1 = [{ id: 'category-1', name: 'x', electionRounds: [1, 2] }];
  const questions1: Array<AnyQuestionVariantData> = [
    { id: 'question-1', type: 'text', name: 'x', categoryId: 'category-1' }
  ];
  root.provideQuestionData({ categories: categories1, questions: questions1 });
  const question1 = root.getQuestion('question-1');
  expect(question1.effectiveElectionRounds).toEqual([1, 2]);

  // Case 2: Question has rounds, category has no rounds
  const categories2 = [{ id: 'category-2', name: 'x' }];
  const questions2: Array<AnyQuestionVariantData> = [
    { id: 'question-2', type: 'text', name: 'x', categoryId: 'category-2', electionRounds: [2, 3] }
  ];
  root.provideQuestionData({ categories: categories2, questions: questions2 });
  const question2 = root.getQuestion('question-2');
  expect(question2.effectiveElectionRounds).toEqual([2, 3]);

  // Case 3: Both have rounds - should return intersection
  const categories3 = [{ id: 'category-3', name: 'x', electionRounds: [1, 2] }];
  const questions3: Array<AnyQuestionVariantData> = [
    { id: 'question-3', type: 'text', name: 'x', categoryId: 'category-3', electionRounds: [2, 3] }
  ];
  root.provideQuestionData({ categories: categories3, questions: questions3 });
  const question3 = root.getQuestion('question-3');
  expect(question3.effectiveElectionRounds).toEqual([2]);

  // Case 4: Neither has rounds
  const categories4 = [{ id: 'category-4', name: 'x' }];
  const questions4: Array<AnyQuestionVariantData> = [
    { id: 'question-4', type: 'text', name: 'x', categoryId: 'category-4' }
  ];
  root.provideQuestionData({ categories: categories4, questions: questions4 });
  const question4 = root.getQuestion('question-4');
  expect(question4.effectiveElectionRounds).toEqual([]);

  // Case 5: Conflicting rounds - no intersection
  const categories5 = [{ id: 'category-5', name: 'x', electionRounds: [1] }];
  const questions5: Array<AnyQuestionVariantData> = [
    { id: 'question-5', type: 'text', name: 'x', categoryId: 'category-5', electionRounds: [3] }
  ];
  root.provideQuestionData({ categories: categories5, questions: questions5 });
  const question5 = root.getQuestion('question-5');
  expect(isFilterNoneApplicable(question5.effectiveElectionRounds)).toBe(true);
  expect(question5.effectiveElectionRounds).toBe(FILTER_NONE_APPLICABLE);
});

test('Should get effective entity types', () => {
  const root = new DataRoot();

  // Case 1: Question has no entityType, category has entityType
  const categories1 = [{ id: 'category-1', name: 'x', entityType: ['candidate'] }] as Array<QuestionCategoryData>;
  const questions1: Array<AnyQuestionVariantData> = [
    { id: 'question-1', type: 'text', name: 'x', categoryId: 'category-1' }
  ];
  root.provideQuestionData({ categories: categories1, questions: questions1 });
  const question1 = root.getQuestion('question-1');
  expect(question1.effectiveEntityType).toEqual(['candidate']);

  // Case 2: Question has entityType, category has no entityType
  const categories2 = [{ id: 'category-2', name: 'x' }] as Array<QuestionCategoryData>;
  const questions2: Array<AnyQuestionVariantData> = [
    { id: 'question-2', type: 'text', name: 'x', categoryId: 'category-2', entityType: ['faction'] }
  ];
  root.provideQuestionData({ categories: categories2, questions: questions2 });
  const question2 = root.getQuestion('question-2');
  expect(question2.effectiveEntityType).toEqual(['faction']);

  // Case 3: Both have entityType - should return intersection
  const categories3 = [
    { id: 'category-3', name: 'x', entityType: ['candidate', 'faction'] }
  ] as Array<QuestionCategoryData>;
  const questions3: Array<AnyQuestionVariantData> = [
    { id: 'question-3', type: 'text', name: 'x', categoryId: 'category-3', entityType: ['faction', 'organization'] }
  ];
  root.provideQuestionData({ categories: categories3, questions: questions3 });
  const question3 = root.getQuestion('question-3');
  expect(question3.effectiveEntityType).toEqual(['faction']);

  // Case 4: Neither has entityType
  const categories4 = [{ id: 'category-4', name: 'x' }] as Array<QuestionCategoryData>;
  const questions4: Array<AnyQuestionVariantData> = [
    { id: 'question-4', type: 'text', name: 'x', categoryId: 'category-4' }
  ];
  root.provideQuestionData({ categories: categories4, questions: questions4 });
  const question4 = root.getQuestion('question-4');
  expect(question4.effectiveEntityType).toEqual([]);

  // Case 5: Conflicting entityType - no intersection
  const categories5 = [{ id: 'category-5', name: 'x', entityType: ['candidate'] }] as Array<QuestionCategoryData>;
  const questions5: Array<AnyQuestionVariantData> = [
    { id: 'question-5', type: 'text', name: 'x', categoryId: 'category-5', entityType: ['organization'] }
  ];
  root.provideQuestionData({ categories: categories5, questions: questions5 });
  const question5 = root.getQuestion('question-5');
  expect(isFilterNoneApplicable(question5.effectiveEntityType)).toBe(true);
  expect(question5.effectiveEntityType).toBe(FILTER_NONE_APPLICABLE);
});

test('Should get effective constituencies', () => {
  const root = new DataRoot();
  root.provideConstituencyData({
    groups: [],
    constituencies: [
      { id: 'constituency-1', name: 'Constituency 1' },
      { id: 'constituency-2', name: 'Constituency 2' },
      { id: 'constituency-3', name: 'Constituency 3' }
    ]
  });

  // Case 1: Question has no constituencies, category has constituencies
  const categories1 = [
    { id: 'category-1', name: 'x', constituencyIds: ['constituency-1', 'constituency-2'] }
  ] as Array<QuestionCategoryData>;
  const questions1: Array<AnyQuestionVariantData> = [
    { id: 'question-1', type: 'text', name: 'x', categoryId: 'category-1' }
  ];
  root.provideQuestionData({ categories: categories1, questions: questions1 });
  const question1 = root.getQuestion('question-1');
  expect((question1.effectiveConstituencies as Array<Constituency>).map((c) => c.id)).toEqual([
    'constituency-1',
    'constituency-2'
  ]);

  // Case 2: Question has constituencies, category has no constituencies
  const categories2 = [{ id: 'category-2', name: 'x' }];
  const questions2: Array<AnyQuestionVariantData> = [
    {
      id: 'question-2',
      type: 'text',
      name: 'x',
      categoryId: 'category-2',
      constituencyIds: ['constituency-2', 'constituency-3']
    }
  ];
  root.provideQuestionData({ categories: categories2, questions: questions2 });
  const question2 = root.getQuestion('question-2');
  expect((question2.effectiveConstituencies as Array<Constituency>).map((c) => c.id)).toEqual([
    'constituency-2',
    'constituency-3'
  ]);

  // Case 3: Both have constituencies - should return intersection
  const categories3 = [{ id: 'category-3', name: 'x', constituencyIds: ['constituency-1', 'constituency-2'] }];
  const questions3: Array<AnyQuestionVariantData> = [
    {
      id: 'question-3',
      type: 'text',
      name: 'x',
      categoryId: 'category-3',
      constituencyIds: ['constituency-2', 'constituency-3']
    }
  ];
  root.provideQuestionData({ categories: categories3, questions: questions3 });
  const question3 = root.getQuestion('question-3');
  expect((question3.effectiveConstituencies as Array<Constituency>).map((c) => c.id)).toEqual(['constituency-2']);

  // Case 4: Neither has constituencies
  const categories4 = [{ id: 'category-4', name: 'x' }];
  const questions4: Array<AnyQuestionVariantData> = [
    { id: 'question-4', type: 'text', name: 'x', categoryId: 'category-4' }
  ];
  root.provideQuestionData({ categories: categories4, questions: questions4 });
  const question4 = root.getQuestion('question-4');
  expect(question4.effectiveConstituencies).toEqual([]);

  // Case 5: Conflicting constituencies - no intersection
  const categories5 = [{ id: 'category-5', name: 'x', constituencyIds: ['constituency-1'] }];
  const questions5: Array<AnyQuestionVariantData> = [
    { id: 'question-5', type: 'text', name: 'x', categoryId: 'category-5', constituencyIds: ['constituency-3'] }
  ];
  root.provideQuestionData({ categories: categories5, questions: questions5 });
  const question5 = root.getQuestion('question-5');
  expect(isFilterNoneApplicable(question5.effectiveConstituencies)).toBe(true);
  expect(question5.effectiveConstituencies).toBe(FILTER_NONE_APPLICABLE);
});
