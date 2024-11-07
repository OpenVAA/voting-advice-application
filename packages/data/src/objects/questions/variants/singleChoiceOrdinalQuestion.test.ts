import crypto from 'crypto';
import { expect, test } from 'vitest';
import { COORDINATE, MISSING_VALUE, QUESTION_TYPE, SingleChoiceOrdinalQuestion } from '../../../internal';
import { getTestData, getTestDataRoot, LIKERT_5_CHOICES } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.SingleChoiceOrdinal);
if (!objData) throw new Error('Test setup error: Test data does not contain a SingleChoiceOrdinal question');
if (objData.choices.length < 3)
  throw new Error('Test setup error: Test data does not contain a SingleChoiceOrdinal question with enough choices');

test('Should normalize value', () => {
  const obj = root.getQuestion(objData.id) as SingleChoiceOrdinalQuestion;
  expect(obj).toBeInstanceOf(SingleChoiceOrdinalQuestion);

  const choiceIds = obj.choices.map((c) => c.id);
  const choiceValues = obj.choices.map((c) => c.normalizableValue);
  const minValue = Math.min(...choiceValues);
  const maxValue = Math.max(...choiceValues);
  const minIndex = choiceValues.indexOf(minValue);
  const maxIndex = choiceValues.indexOf(maxValue);

  // Find an index that's neither min or max
  let otherId = '';
  choiceIds.forEach((id, i) => {
    if (i !== minIndex && i !== maxIndex) otherId = id;
  });

  expect(obj.normalizeValue(choiceIds[minIndex])).toEqual(COORDINATE.Min);
  expect(obj.normalizeValue(choiceIds[maxIndex])).toEqual(COORDINATE.Max);
  expect(obj.normalizeValue(otherId)).toBeGreaterThan(COORDINATE.Min);
  expect(obj.normalizeValue(otherId)).toBeLessThan(COORDINATE.Max);
  expect(obj.normalizeValue(crypto.randomUUID())).toBe(MISSING_VALUE);
});

test('Should throw if value range is invalid', () => {
  const data = {
    id: crypto.randomUUID(),
    type: QUESTION_TYPE.SingleChoiceOrdinal,
    name: 'Test Question',
    categoryId: 'questionCategory-1',
    choices: LIKERT_5_CHOICES.map((props) => ({
      ...props,
      normalizableValue: 1
    }))
  };
  expect(() => new SingleChoiceOrdinalQuestion({ data, root }), 'Choices with zero range').toThrow();
});
