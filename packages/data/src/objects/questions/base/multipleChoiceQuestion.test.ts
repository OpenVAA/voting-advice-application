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
  const choices = obj.choices;
  const choiceIds = obj.choices.map((c) => c.id);
  const duplicateChoicesInDataOrder = choices.flatMap((c) => [c, c]);
  const duplicateChoiceIds = [...choiceIds, ...choiceIds];
  const reversedChoices = [...choices].reverse();
  const reversedChoiceIds = [...choiceIds].reverse();

  obj.data.allowDuplicates = false;
  obj.data.ordered = false;

  expect(obj.getChoices(reversedChoiceIds), 'To return choices in the original order').toEqual(choices);
  expect(obj.getChoices(duplicateChoiceIds), 'To remove duplicates').toEqual(choices);

  obj.data.allowDuplicates = true;
  expect(
    obj.getChoices(duplicateChoiceIds),
    'To allow duplicates if allowDuplicates = true and return them in the order they’re in the question data'
  ).toEqual(duplicateChoicesInDataOrder);

  obj.data.ordered = true;
  expect(obj.getChoices(duplicateChoiceIds), 'To ordered = true to override allowDuplicates').toEqual(choices);
  expect(obj.getChoices(reversedChoiceIds), 'To return choices in the order supplied if ordered = true').toEqual(
    reversedChoices
  );
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
