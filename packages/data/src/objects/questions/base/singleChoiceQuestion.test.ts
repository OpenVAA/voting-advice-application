import crypto from 'crypto';
import { expect, test } from 'vitest';
import { MISSING_VALUE, QUESTION_TYPE, SingleChoiceCategoricalQuestion } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;

// We use a concrete subclass for easier testing.
const objData = questionData.find((q) => q.type === QUESTION_TYPE.SingleChoiceCategorical);
if (!objData) throw new Error('Test setup error: Test data does not contain a SingleChoiceCategorical question');

test('Should assert value', () => {
  const obj = root.getQuestion(objData.id) as SingleChoiceCategoricalQuestion;
  expect(obj).toBeInstanceOf(SingleChoiceCategoricalQuestion);
  const validChoiceId = obj.choices[0].id;
  expect(validChoiceId).toBeDefined();
  expect(obj.ensureValue(validChoiceId)).toEqual(validChoiceId);
  expect(obj.ensureValue(crypto.randomUUID())).toEqual(MISSING_VALUE);
});
