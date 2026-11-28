import { DataRoot, MultipleChoiceCategoricalQuestion, NumberQuestion } from '@openvaa/data';
import { describe, expect, test } from 'vitest';
import { ChoiceQuestionFilter, NumberQuestionFilter } from '../src';
import type { Answer, AnswerDict, HasAnswers } from '@openvaa/core';
import type { Choice } from '@openvaa/data';

const LOCALE = 'en';
const QUESTION_ID = 'question';
const root = new DataRoot();

class AnsweringEntity implements HasAnswers {
  answers: AnswerDict = {};
  constructor(answers: Record<string, Answer['value']>) {
    Object.entries(answers).forEach(([id, value]) => (this.answers[id] = { value }));
  }
}

/** One entity per value, each answering the filterable question with it. */
function population(values: Array<Answer['value']>): Array<AnsweringEntity> {
  return values.map((value) => new AnsweringEntity({ [QUESTION_ID]: value }));
}

const CHOICES: Array<Choice> = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' }
];

function numberFilter(): NumberQuestionFilter<AnsweringEntity> {
  const question = new NumberQuestion({
    root,
    data: { id: QUESTION_ID, type: 'number', name: '', categoryId: '' }
  });
  return new NumberQuestionFilter<AnsweringEntity>({ question });
}

function multiChoiceFilter(): ChoiceQuestionFilter<AnsweringEntity> {
  const question = new MultipleChoiceCategoricalQuestion({
    root,
    data: { id: QUESTION_ID, choices: CHOICES, name: '', categoryId: '', type: 'multipleChoiceCategorical' }
  });
  return new ChoiceQuestionFilter<AnsweringEntity>({ question }, LOCALE);
}

describe('Filter.countDistinctValues: single-value filters', () => {
  test('Two different answers count as two distinct values', () => {
    expect(numberFilter().countDistinctValues(population([42, 99]))).toBe(2);
  });

  test('The same answer from everybody counts as one', () => {
    expect(numberFilter().countDistinctValues(population([42, 42, 42]))).toBe(1);
  });

  test('Nobody answering counts as one value', () => {
    expect(numberFilter().countDistinctValues(population([undefined, undefined, undefined]))).toBe(1);
  });

  test('A missing answer counts as a distinct value', () => {
    expect(numberFilter().countDistinctValues(population([42, 42, undefined]))).toBe(2);
  });

  test('Missing is one shared value, not one per non-answerer', () => {
    expect(numberFilter().countDistinctValues(population([42, undefined, undefined, undefined]))).toBe(2);
  });

  test('A target whose value cannot be read counts as missing, without throwing', () => {
    const targets = [new AnsweringEntity({ [QUESTION_ID]: 42 }), {} as AnsweringEntity, {} as AnsweringEntity];
    expect(numberFilter().countDistinctValues(targets)).toBe(2);
  });

  test('Zero targets produce zero distinct values', () => {
    expect(numberFilter().countDistinctValues([])).toBe(0);
  });
});

describe('Filter.countDistinctValues: multi-value filters', () => {
  test('An answer is its whole set, so everybody choosing the same two choices counts as one', () => {
    const targets = population([
      ['a', 'b'],
      ['a', 'b']
    ]);
    expect(multiChoiceFilter().countDistinctValues(targets)).toBe(1);
  });

  test('A differing answer set counts as a second distinct value', () => {
    expect(multiChoiceFilter().countDistinctValues(population([['a', 'b'], ['a', 'b'], ['c']]))).toBe(2);
  });

  test('Value order and duplicates inside an answer set do not create distinct values', () => {
    const targets = population([
      ['a', 'b'],
      ['b', 'a'],
      ['a', 'b', 'a']
    ]);
    expect(multiChoiceFilter().countDistinctValues(targets)).toBe(1);
  });

  test('"Did not answer" and "answered with nothing" are two different values', () => {
    expect(multiChoiceFilter().countDistinctValues(population([[], undefined]))).toBe(2);
  });
});
