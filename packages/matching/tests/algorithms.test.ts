import { COORDINATE, MISSING_VALUE } from '@openvaa/core';
import { describe, expect, test } from 'vitest';
import { createCandidates, createMatchesAndEntities, createVoter } from './utils';
import { MatchingAlgorithm } from '../src/algorithms';
import { DISTANCE_METRIC } from '../src/distance';
import { MISSING_VALUE_METHOD } from '../src/missingValue';
import { CategoricalQuestion, OrdinalQuestion } from '../src/question';

// For convenience
const max = COORDINATE.Max;
const min = COORDINATE.Min;
const half = COORDINATE.Extent / 2;
const full = COORDINATE.Extent;

describe('matchingAlgorithm', () => {
  test('projectToNormalizedSpace', () => {
    const likertScale = 5;
    const values = [1, 3, 5];
    const coords = values.map((v) => {
      const normalized = (v - 1) / (likertScale - 1);
      return min + normalized * (max - min);
    });
    const { questions, candidates, algorithm } = createMatchesAndEntities(
      values,
      [values, values],
      likertScale,
      DISTANCE_METRIC.Manhattan,
      MISSING_VALUE_METHOD.Neutral
    );
    expect(algorithm.projectToNormalizedSpace({ questions, targets: candidates })[0].coordinates).toEqual(coords);
    expect(
      algorithm.projectToNormalizedSpace({ questions: questions.slice(1), targets: candidates })[0].coordinates,
      'Subset of answers based on question list'
    ).toMatchObject(coords.slice(1));
  });

  test('throw if there are duplicate questions', () => {
    const likertScale = 5;
    const values = [1, 3, 5];
    const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
      values,
      [values, values],
      likertScale,
      DISTANCE_METRIC.Manhattan,
      MISSING_VALUE_METHOD.Neutral
    );
    // Add a question with the same id
    questions.push(OrdinalQuestion.fromLikert({ id: questions[0].id, scale: likertScale }));
    expect(() => algorithm.match({ questions, reference: voter, targets: candidates })).toThrow();
  });

  test('skip missing reference questions', () => {
    const likertScale = 5;
    const values = [1, 3, 5];
    const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
      [undefined, 5, 5],
      [values, values],
      likertScale,
      DISTANCE_METRIC.Manhattan,
      MISSING_VALUE_METHOD.Neutral
    );
    const expected = (half + 0) / 2; // [3-5, 5-5]
    expect(algorithm.match({ questions, reference: voter, targets: candidates })[0].distance).toBeCloseTo(expected);
  });

  describe('match with missing values', () => {
    const likertScale = 5;
    const values = [1, 3, 5];
    const valuesMissing = [MISSING_VALUE, MISSING_VALUE, MISSING_VALUE];
    test('MISSING_VALUE_METHOD.Neutral', () => {
      const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
        values,
        [valuesMissing],
        likertScale,
        DISTANCE_METRIC.Manhattan,
        MISSING_VALUE_METHOD.Neutral
      );
      const expected = (half + 0 + half) / 3; // [1-3, 3-3, 5-3]
      expect(algorithm.match({ questions, reference: voter, targets: candidates })[0].distance).toBeCloseTo(expected);
    });
    test('MISSING_VALUE_METHOD.RelativeMaximum', () => {
      const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
        values,
        [valuesMissing],
        likertScale,
        DISTANCE_METRIC.Manhattan,
        MISSING_VALUE_METHOD.RelativeMaximum
      );
      const expected = (full + half + full) / 3; // [1-5, 3-5, 5-1]
      expect(algorithm.match({ questions, reference: voter, targets: candidates })[0].distance).toBeCloseTo(expected);
    });
  });

  test('different distance metric', () => {
    const likertScale = 5;
    const voterValues = [1, 2, 3, 4, 2];
    const candValues = [1, 5, 5, 2, 3];
    const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
      voterValues,
      [candValues, candValues],
      likertScale,
      DISTANCE_METRIC.Directional,
      MISSING_VALUE_METHOD.Neutral
    );
    const expected =
      (0 + // 1-1
        0.75 * full + // 2-5
        half + // 3-5
        0.625 * full + // 4-2
        half) / // 2-3
      questions.length;
    expect(algorithm.match({ questions, reference: voter, targets: candidates })[0].distance).toBeCloseTo(expected);
  });

  test('categorical questions', () => {
    const categorical2 = new CategoricalQuestion({
      id: 'categorical2',
      values: [{ id: 'no' }, { id: 'yes' }]
    });
    const categorical4 = new CategoricalQuestion({
      id: 'categorical4',
      values: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    });
    const questions = [categorical2, categorical4];
    const voterValues = ['no', 'a'];
    const voter = createVoter(questions, voterValues);
    const disagreeValues = ['yes', 'c'];
    const missingValues = [MISSING_VALUE, MISSING_VALUE];
    const candidates = createCandidates(questions, [disagreeValues, missingValues, voterValues]);
    const algorithm = new MatchingAlgorithm({
      distanceMetric: DISTANCE_METRIC.Manhattan,
      missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
    });
    const matches = algorithm.match({ questions, reference: voter, targets: candidates });
    const expected0 = (full + (full * 2) / 4) / questions.length; // binary disagreement, 4-choice disagreement
    const expected1 = full; // all missing values
    const expected2 = 0; // perfect agreement
    expect(matches.find((m) => m.target === candidates[0])?.distance).toBeCloseTo(expected0);
    expect(matches.find((m) => m.target === candidates[1])?.distance).toBeCloseTo(expected1);
    expect(matches.find((m) => m.target === candidates[2])?.distance).toBeCloseTo(expected2);
  });

  test('mixed question types', () => {
    const likert5 = OrdinalQuestion.fromLikert({ id: 'likert5', scale: 5 });
    const likert7 = OrdinalQuestion.fromLikert({ id: 'likert7', scale: 7 });
    const categorical2 = new CategoricalQuestion({
      id: 'categorical2',
      values: [{ id: 'no' }, { id: 'yes' }]
    });
    const categorical4 = new CategoricalQuestion({
      id: 'categorical4',
      values: [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }]
    });
    const questions = [likert5, likert7, categorical2, categorical4];
    const voterValues = [likert5.values[0].id, likert7.values[5].id, 'no', 'c'];
    const voter = createVoter(questions, voterValues);
    const candAValues = [undefined, likert7.values[1].id, 'yes', 'c'];
    const candBValues = [likert5.values[3].id, likert7.values[6].id, 'no', 'a'];
    const candidates = createCandidates(questions, [candAValues, candBValues]);
    const algorithm = new MatchingAlgorithm({
      distanceMetric: DISTANCE_METRIC.Manhattan,
      missingValueOptions: { method: MISSING_VALUE_METHOD.RelativeMaximum }
    });
    const matches = algorithm.match({ questions, reference: voter, targets: candidates });
    const expectedA =
      (full + // likert5: 1-missing=>5
        ((5 - 1) / 6) * full + // likert7: 6-2
        full + // categorical2: no-yes
        0) / // categorical4: c-c
      questions.length;
    const expectedB =
      (0.75 * full + // likert5: 1-4
        ((6 - 5) / 6) * full + // likert7: 6-7
        0 + // categorical2: no-no
        (2 / 4) * full) / // categorical4: c-a
      questions.length;
    expect(matches.find((m) => m.target === candidates[0])?.distance).toBeCloseTo(expectedA);
    expect(matches.find((m) => m.target === candidates[1])?.distance).toBeCloseTo(expectedB);
  });

  describe('submatches', () => {
    test('match with subQuestionGroups', () => {
      const likertScale = 5;
      const voterValues = [1, 1, 1, 1, 3];
      const candValues = [1, 1, 5, 4, 5];
      const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
        voterValues,
        [candValues],
        likertScale,
        DISTANCE_METRIC.Manhattan,
        MISSING_VALUE_METHOD.Neutral
      );
      const fullDist = (0 + 0 + full + 0.75 * full + half) / questions.length; // 1-1, 1-1, 1-5, 1-4, 3-5
      const subsetA = { questions: questions.slice(0, 1) };
      const subsetADist = 0; // 1-1
      const subsetB = { questions: questions.slice(2, 3) };
      const subsetBDist = full; // 1-5
      const subsetC = { questions: questions.slice(0, 4) };
      const subsetCDist = (0 + 0 + full + 0.75 * full) / 4; // 1-1, 1-1, 1-5, 1-4
      const questionGroups = [subsetA, subsetB, subsetC];
      const match = algorithm.match({
        questions,
        reference: voter,
        targets: candidates,
        options: { questionGroups }
      })[0];
      expect(match.distance, 'to have global distance').toBeCloseTo(fullDist);
      expect(match.subMatches?.length, 'to have submatches for all subgroups').toBe(questionGroups.length);
      expect(match.subMatches?.[0].distance, 'to have subgroup a distance').toBeCloseTo(subsetADist);
      expect(match.subMatches?.[0].questionGroup, 'to contain reference to subgroup').toBe(subsetA);
      expect(match.subMatches?.[1].distance, 'to have subgroup b distance').toBeCloseTo(subsetBDist);
      expect(match.subMatches?.[2].distance, 'to have subgroup c distance').toBeCloseTo(subsetCDist);
    });
    test('subMatch for questions the voter has not answered should be zero', () => {
      const likertScale = 5;
      const voterValues = [undefined, 1, 1];
      const candValues = [1, 3, 5];
      const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
        voterValues,
        [candValues],
        likertScale,
        DISTANCE_METRIC.Manhattan,
        MISSING_VALUE_METHOD.RelativeMaximum
      );
      // A subset that includes only the question the voter has not answered
      const questionGroups = [{ questions: questions.slice(0, 1) }];
      const match = algorithm.match({
        questions: questions.slice(1),
        reference: voter,
        targets: candidates,
        options: { questionGroups }
      })[0];
      expect(match.subMatches?.[0].distance).toBeCloseTo(half);
      expect(match.subMatches?.[0].questionGroup).toBe(questionGroups[0]);
    });
  });

  test('question weights', () => {
    const likertScale = 5;
    const voterValues = [1, 3, 5];
    const candValues = [1, 1, 1];
    const { questions, voter, candidates, algorithm } = createMatchesAndEntities(
      voterValues,
      [candValues],
      likertScale,
      DISTANCE_METRIC.Manhattan,
      MISSING_VALUE_METHOD.Neutral
    );
    const weights = [0.54234, 4.131231, 97.1134];
    const questionWeights = Object.fromEntries(questions.map((q, i) => [q.id, weights[i]]));
    const expected =
      (weights[0] * 0 + // 1-1
        weights[1] * half + // 3-1
        weights[2] * full) / // 5-1
      weights.reduce((acc, v) => acc + v, 0);
    const match = algorithm.match({
      questions,
      reference: voter,
      targets: candidates,
      options: { questionWeights }
    })[0];
    expect(match.distance).toBeCloseTo(expected);
  });
});
