import crypto from 'crypto';
import { expect, test } from 'vitest';
import { QUESTION_TYPE, SingleChoiceOrdinalQuestion } from '../../../internal';
import { getTestData, getTestDataRoot, LIKERT_5_CHOICES } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;

// We use a concrete subclass for easier testing.
const objData = questionData.find((q) => q.type === QUESTION_TYPE.SingleChoiceOrdinal);
if (!objData) throw new Error('Test setup error: Test data does not contain a SingleChoiceOrdinal question');

test('Should return choices and their indices', () => {
  const obj = root.getQuestion(objData.id) as SingleChoiceOrdinalQuestion;
  expect(obj).toBeInstanceOf(SingleChoiceOrdinalQuestion);
  objData.choices.forEach(({ id }, index) => {
    expect(obj.getChoice(id)?.id).toBe(id);
    expect(obj.getChoiceIndex(id)).toBe(index);
  });
  expect(obj.getChoice(crypto.randomUUID()), 'To return undefined for an invalid choice id').toBeUndefined();
});

test('Should throw if choices are invalid', () => {
  const baseData = {
    id: crypto.randomUUID(),
    type: QUESTION_TYPE.SingleChoiceOrdinal,
    name: 'Test Question',
    categoryId: 'questionCategory-1'
  };
  const choices = LIKERT_5_CHOICES;

  expect(
    () =>
      new SingleChoiceOrdinalQuestion({
        data: {
          ...baseData,
          choices: [choices[0]]
        },
        root
      }),
    'Too few choices'
  ).toThrow();

  expect(
    () =>
      new SingleChoiceOrdinalQuestion({
        data: {
          ...baseData,
          choices: [...choices, ...choices]
        },
        root
      }),
    'Duplicate choices'
  ).toThrow();
});
