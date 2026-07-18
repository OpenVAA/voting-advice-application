import { expect, test } from 'vitest';
import { COORDINATE, MISSING_VALUE, MultipleChoiceCategoricalQuestion, QUESTION_TYPE } from '../../../internal';
import { getTestData, getTestDataRoot } from '../../../testUtils';
import type { Choice } from '../../../internal';

const root = getTestDataRoot();
const questionData = getTestData().questions.questions;
const objData = questionData.find((q) => q.type === QUESTION_TYPE.MultipleChoiceCategorical);
if (!objData) throw new Error('Test setup error: Test data does not contain a MultipleChoiceCategorical question');

const quatenaryChoices: Array<Choice<undefined>> = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' },
  { id: 'd', label: 'D' }
];
const binaryChoices: Array<Choice<undefined>> = [
  { id: '1', label: 'A' },
  { id: '2', label: 'B' }
];

test('Should be matchable', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  expect(obj).toBeInstanceOf(MultipleChoiceCategoricalQuestion);
  expect(obj.isMatchable).toBe(true);
});

test('Should have one binary subdimension per choice (no 2-choice shortcut, D-06)', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  obj.data.allowDuplicates = false;
  obj.data.ordered = false;

  obj.data.choices = quatenaryChoices;
  expect(obj.normalizedDimensions).toBe(4);

  // Unlike SingleChoiceCategoricalQuestion, a 2-choice multi-select still yields 2 dimensions:
  // both choices can be selected simultaneously, so no single-dimension collapse is possible.
  obj.data.choices = binaryChoices;
  expect(obj.normalizedDimensions).toBe(2);
});

test('Should normalize selected choices to Max and unselected to Min in choices order', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  obj.data.allowDuplicates = false;
  obj.data.ordered = false;
  obj.data.choices = quatenaryChoices;

  const normalized = obj.normalizeValue(['a', 'c']);
  expect(normalized).toEqual([COORDINATE.Max, COORDINATE.Min, COORDINATE.Max, COORDINATE.Min]);

  // Every non-missing coordinate is exactly Max or Min (binary subdimensions per D-06).
  for (const coord of normalized as Array<number>) {
    expect(coord === COORDINATE.Max || coord === COORDINATE.Min).toBe(true);
  }
});

test('Should normalize a missing value to an all-MISSING_VALUE subdimension array', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  obj.data.allowDuplicates = false;
  obj.data.ordered = false;
  obj.data.choices = quatenaryChoices;

  expect(obj.normalizeValue(MISSING_VALUE)).toEqual([MISSING_VALUE, MISSING_VALUE, MISSING_VALUE, MISSING_VALUE]);
});

test('Should normalize an empty selection ([]) to an all-MISSING_VALUE subdimension array (D-07)', () => {
  const obj = root.getQuestion(objData.id) as MultipleChoiceCategoricalQuestion;
  obj.data.allowDuplicates = false;
  obj.data.ordered = false;
  obj.data.choices = quatenaryChoices;

  // Zero selections = unanswered per D-07.
  expect(obj.normalizeValue([])).toEqual([MISSING_VALUE, MISSING_VALUE, MISSING_VALUE, MISSING_VALUE]);
});
