import { expect, test } from 'vitest';
import { ENTITY_TYPE, Id } from '../../../internal';
import { contentsMatch, getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const categoryData = getTestData().questions.categories;
const questionData = getTestData().questions.questions;

test('Should have all questions', () => {
  const questionsByCategory: Record<Id, Array<Id>> = {};
  questionData.forEach(({ id, categoryId }) => {
    questionsByCategory[categoryId] ??= [];
    questionsByCategory[categoryId].push(id);
  });
  categoryData.forEach(({ id }) => {
    const obj = root.getQuestionCategory(id);
    expect(
      contentsMatch(
        obj!.questions.map((q) => q.id),
        questionsByCategory[id]
      ),
      'To have the same questions'
    ).toBe(true);
  });
});

test('GetApplicableQuestions should return applicable questions', () => {
  const category = root.getQuestionCategory('questionCategory-1');
  expect(category).toBeDefined();
  const questions = category.getApplicableQuestions({ entityType: ENTITY_TYPE.Organization });
  // Questions 1-5 belong to category 1 but 3-5 are only for candidates
  const ids = [1, 2].map((i) => `question-${i}`);
  expect(questions?.map((q) => q.id)).toEqual(expect.arrayContaining(ids));
});
