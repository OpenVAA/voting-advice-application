import { DataRoot, MultipleChoiceCategoricalQuestion, NumberQuestion } from '@openvaa/data';
import { ChoiceQuestionFilter, NumberQuestionFilter } from '@openvaa/filters';
import { describe, expect, test } from 'vitest';
import { MIN_DISTINCT_ANSWERS, retainRelevantFilters } from './filterRelevance';
import type { Answer, AnswerDict, HasAnswers } from '@openvaa/core';
import type { Choice } from '@openvaa/data';
import type { Filter } from '@openvaa/filters';

const LOCALE = 'en';
const QUESTION_ID = 'question';
const root = new DataRoot();

/**
 * A minimal entity with answers, mirroring the fixture pattern in `packages/filters/tests/filter.test.ts`.
 */
class AnsweringEntity implements HasAnswers {
  answers: AnswerDict = {};
  constructor(answers: Record<string, Answer['value']>) {
    Object.entries(answers).forEach(([id, value]) => (this.answers[id] = { value }));
  }
}

/**
 * Build a population whose single filterable question carries the given answer values, one entity per value.
 */
function population(values: Array<Answer['value']>, questionId: string = QUESTION_ID): Array<AnsweringEntity> {
  return values.map((value) => new AnsweringEntity({ [questionId]: value }));
}

const CHOICES: Array<Choice> = [
  { id: 'a', label: 'A' },
  { id: 'b', label: 'B' },
  { id: 'c', label: 'C' }
];

function numberFilter(questionId: string = QUESTION_ID): Filter<MaybeWrappedEntityVariant, unknown> {
  const question = new NumberQuestion({
    root,
    data: { id: questionId, type: 'number', name: '', categoryId: '' }
  });
  return new NumberQuestionFilter({ question }) as unknown as Filter<MaybeWrappedEntityVariant, unknown>;
}

function multiChoiceFilter(questionId: string = QUESTION_ID): Filter<MaybeWrappedEntityVariant, unknown> {
  const question = new MultipleChoiceCategoricalQuestion({
    root,
    data: { id: questionId, choices: CHOICES, name: '', categoryId: '', type: 'multipleChoiceCategorical' }
  });
  return new ChoiceQuestionFilter({ question }, LOCALE) as unknown as Filter<MaybeWrappedEntityVariant, unknown>;
}

/**
 * Cast a fixture population to the target type the relevance helpers are declared against.
 */
function asTargets(entities: Array<AnsweringEntity>): Array<MaybeWrappedEntityVariant> {
  return entities as unknown as Array<MaybeWrappedEntityVariant>;
}

describe('MIN_DISTINCT_ANSWERS', () => {
  test('The threshold is two, so a population producing a single value never earns a filter', () => {
    expect(MIN_DISTINCT_ANSWERS).toBe(2);
  });
});

describe('retainRelevantFilters: single-value filters', () => {
  test('Two different answers count as two distinct values', () => {
    const filter = numberFilter();
    const targets = asTargets(population([42, 99]));
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([filter]);
  });

  test('Everybody answered the same and nobody skipped, so the filter is dropped', () => {
    const filter = numberFilter();
    const targets = asTargets(population([42, 42, 42]));
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([]);
  });

  test('Nobody answered at all, so the filter is dropped. This is the reported symptom, on the organizations and alliances tabs', () => {
    const filter = numberFilter();
    const targets = asTargets(population([undefined, undefined, undefined]));
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([]);
  });

  test('A missing answer counts as a distinct value, so a unanimous question with one skipper keeps its filter', () => {
    const filter = numberFilter();
    const targets = asTargets(population([42, 42, undefined]));
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([filter]);
  });
});

describe('retainRelevantFilters: multi-value filters', () => {
  test('An entity answer is its whole SET, so a population all choosing the same two choices counts as one', () => {
    const filter = multiChoiceFilter();
    const targets = asTargets(
      population([
        ['a', 'b'],
        ['a', 'b'],
        ['a', 'b']
      ])
    );
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([]);
  });

  test('A differing answer set counts as a second distinct value and the filter is retained', () => {
    const filter = multiChoiceFilter();
    const targets = asTargets(population([['a', 'b'], ['a', 'b'], ['c']]));
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([filter]);
  });

  test('Value order and duplicates inside an answer set do not create distinct values, so the filter is dropped', () => {
    const filter = multiChoiceFilter();
    const targets = asTargets(
      population([
        ['a', 'b'],
        ['b', 'a'],
        ['a', 'b', 'a']
      ])
    );
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([]);
  });

  test('"Did not answer" and "answered with nothing" are two different values, so the filter is retained', () => {
    const filter = multiChoiceFilter();
    const targets = asTargets(population([[], undefined]));
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([filter]);
  });
});

describe('retainRelevantFilters', () => {
  test('The relative order of the retained filters is preserved while an irrelevant one is dropped from the middle', () => {
    const first = numberFilter('qA');
    const middle = numberFilter('qB');
    const last = multiChoiceFilter('qC');
    const entities = [
      new AnsweringEntity({ qA: 42, qB: 7, qC: ['a', 'b'] }),
      new AnsweringEntity({ qA: 99, qB: 7, qC: ['c'] })
    ];
    const targets = asTargets(entities);
    expect(retainRelevantFilters({ filters: [first, middle, last], targets })).toEqual([first, last]);
  });

  test('A filter whose getValue throws for every target is dropped rather than propagating the throw', () => {
    const filter = numberFilter();
    // Targets without answers make `getValue` throw.
    const targets = asTargets([{}, {}] as Array<AnsweringEntity>);
    expect(retainRelevantFilters({ filters: [filter], targets })).toEqual([]);
  });

  test('An empty target array retains nothing, because zero targets produce zero distinct values', () => {
    const filter = numberFilter();
    expect(retainRelevantFilters({ filters: [filter], targets: [] })).toEqual([]);
  });
});
