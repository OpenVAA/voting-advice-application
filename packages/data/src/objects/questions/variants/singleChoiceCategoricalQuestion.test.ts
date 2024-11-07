import { expect, test } from 'vitest';
import { Choice, COORDINATE, MISSING_VALUE, QUESTION_TYPE, SingleChoiceCategoricalQuestion } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.SingleChoiceCategorical);
if (!objData) throw new Error('Test setup error: Test data does not contain a SingleChoiceCategorical question');

test('Should have the correct number of dimensions and normalize value', () => {
  const obj = root.getQuestion(objData.id) as SingleChoiceCategoricalQuestion;
  expect(obj).toBeInstanceOf(SingleChoiceCategoricalQuestion);

  const binaryChoices: Array<Choice<undefined>> = [
    { id: '1', label: 'A' },
    { id: '2', label: 'B' }
  ];
  const quatenaryChoices: Array<Choice<undefined>> = [
    { id: '1', label: 'A' },
    { id: '2', label: 'B' },
    { id: '3', label: 'C' },
    { id: '4', label: 'D' }
  ];

  obj.data.choices = binaryChoices;
  expect(obj.normalizedDimensions).toBe(1);
  expect(obj.normalizeValue(binaryChoices[0].id), 'To use just one dimension for normalized values').toBe(
    COORDINATE.Min
  );
  expect(obj.normalizeValue(binaryChoices[1].id)).toBe(COORDINATE.Max);
  expect(obj.normalizeValue('MISSING')).toBe(MISSING_VALUE);

  obj.data.choices = quatenaryChoices;
  expect(obj.normalizedDimensions).toBe(4);
  expect(obj.normalizeValue(quatenaryChoices[0].id), 'To spread normalized values to multiple dimesions').toEqual([
    COORDINATE.Max,
    COORDINATE.Min,
    COORDINATE.Min,
    COORDINATE.Min
  ]);
  expect(obj.normalizeValue('MISSING')).toEqual([MISSING_VALUE, MISSING_VALUE, MISSING_VALUE, MISSING_VALUE]);
});
