import crypto from 'crypto';
import { expect, test } from 'vitest';
import { MISSING_VALUE, MultipleChoiceCategoricalQuestion, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;

// We use a concrete subclass for easier testing.
const objData = questionData.find((q) => q.type === QUESTION_TYPE.MultipleChoiceCategorical);
if (!objData) throw new Error('Test setup error: Test data does not contain a MultipleChoiceCategorical question');

test('Should return choices based on ordered and allowDuplicates properties', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  expect(obj).toBeInstanceOf(MultipleChoiceCategoricalQuestion);
  const choiceIds = obj.choices.map((c) => c.id);

  obj.data.allowDuplicates = false;
  obj.data.ordered = false;
  expect(obj.getChoices([...choiceIds].reverse()), 'To return choices in the order supplied').toEqual(
    obj.choices.reverse()
  );
  expect(obj.getChoices([...choiceIds, ...choiceIds]), 'To remove duplicates').toEqual(obj.choices);

  obj.data.ordered = true;
  expect(obj.getChoices([...choiceIds].reverse()), 'To return choices in the original order').toEqual(obj.choices);

  obj.data.allowDuplicates = true;
  expect(obj.allowDuplicates, 'To ordered override allowDuplicates').toBe(false);

  obj.data.ordered = false;
  expect(obj.getChoices([...choiceIds, ...choiceIds]), 'To allow duplicates').toEqual([...obj.choices, ...obj.choices]);
});

test('Should assert value', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  expect(obj).toBeInstanceOf(MultipleChoiceCategoricalQuestion);
  const choiceIds = obj.choices.map((c) => c.id);

  obj.data.allowDuplicates = false;
  obj.data.ordered = false;
  expect(obj.ensureValue(choiceIds)).toEqual(choiceIds);
  expect(obj.ensureValue([...choiceIds, crypto.randomUUID()])).toEqual(MISSING_VALUE);
  expect(obj.ensureValue([...choiceIds, ...choiceIds]), 'To disallow duplicates').toEqual(MISSING_VALUE);

  obj.data.allowDuplicates = true;
  expect(obj.ensureValue([...choiceIds, ...choiceIds]), 'To allow duplicates').toEqual([...choiceIds, ...choiceIds]);
});
