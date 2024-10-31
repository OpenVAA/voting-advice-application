import {expect, test} from 'vitest';
import {getTestData, getTestDataRoot} from '../../../testUtils';

/**
 * NB. We test the methods handling answer values separately for each question type in their own test files.
 */
const root = getTestDataRoot();
const questionData = getTestData().questions.questions;

test('Should have category', () => {
  questionData.forEach(({id, categoryId}) => {
    const obj = root.getQuestion(id);
    expect(obj.category.id).toBe(categoryId);
  });
});
