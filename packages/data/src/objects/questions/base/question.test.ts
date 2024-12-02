import { expect, test } from 'vitest';
import { AnyQuestionVariantData, Constituency, DataRoot, Election, MultipleTextQuestion } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

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
