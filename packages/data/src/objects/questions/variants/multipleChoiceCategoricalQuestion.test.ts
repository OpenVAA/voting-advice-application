import { expect, test } from 'vitest';
import { MultipleChoiceCategoricalQuestion, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.MultipleChoiceCategorical);
if (!objData) throw new Error('Test setup error: Test data does not contain a MultipleChoiceCategorical question');

test('Should not yet be matchable', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  expect(obj).toBeInstanceOf(MultipleChoiceCategoricalQuestion);
  const choiceIds = obj.choices.map((c) => c.id);

  // Matching is not yet implemented for this question type.
  expect(obj.isMatchable).toBe(false);
  expect(() => obj.normalizeValue(choiceIds)).toThrow();

  // We don't check value ensuring because it's already tested in the superclass
});
