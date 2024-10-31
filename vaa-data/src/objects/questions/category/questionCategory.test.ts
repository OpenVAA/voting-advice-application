import {expect, test} from 'vitest';
import {contentsMatch, getTestData, getTestDataRoot} from '../../../testUtils';
import {Id} from '../../../internal';

const root = getTestDataRoot();
const categoryData = getTestData().questions.categories;
const questionData = getTestData().questions.questions;

test('Should have all questions', () => {
  const questionsByCategory: Record<Id, Array<Id>> = {};
  questionData.forEach(({id, categoryId}) => {
    questionsByCategory[categoryId] ??= [];
    questionsByCategory[categoryId].push(id);
  });
  categoryData.forEach(({id}) => {
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
