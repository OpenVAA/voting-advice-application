import {describe, expect, test} from 'vitest';
import {createSubspace} from '../algorithms/createSubspace';
import {
  imputeMissingValues,
  MissingValueBias,
  MissingValueDistanceMethod
} from '../algorithms/imputeMissingValues';
import type {Match} from '../algorithms/match';
import {MatchingAlgorithmBase} from '../algorithms/matchingAlgorithm';
import {
  directionalDistance,
  DistanceMetric,
  manhattanDistance,
  measureDistance
} from '../algorithms/measureDistance';
import type {DistanceMeasurementOptions} from '../algorithms/measureDistance';
import {NORMALIZED_DISTANCE_EXTENT} from '../core/distances';
import type {SignedNormalizedDistance, UnsignedNormalizedDistance} from '../core/distances';
import type {HasMatchableAnswers, MatchableAnswer} from '../core/hasMatchableAnswers';
import {MISSING_VALUE} from '../core/matchableValue';
import type {MatchableValue} from '../core/matchableValue';

import {MatchingSpace} from '../core/matchingSpace';
import {MatchingSpacePosition} from '../core/matchingSpacePosition';
import type {MatchableQuestion} from '../questions/matchableQuestion';
import {MultipleChoiceQuestion} from '../questions/multipleChoiceQuestion';

// For convenience
const maxDist = NORMALIZED_DISTANCE_EXTENT;
const maxVal: SignedNormalizedDistance = NORMALIZED_DISTANCE_EXTENT / 2;
const minVal: SignedNormalizedDistance = -maxVal;

describe('single coordinate distance measurements', () => {
  test('manhattanDistance', () => {
    expect(manhattanDistance(maxVal, minVal), 'Commutatibility').toBeCloseTo(
      manhattanDistance(minVal, maxVal)
    );
    expect(manhattanDistance(maxVal, minVal)).toBeCloseTo(maxDist);
    expect(manhattanDistance(maxVal, 0)).toBeCloseTo(maxVal);
    expect(manhattanDistance(maxVal * 0.5, maxVal * 0.5)).toBeCloseTo(0);
  });
  test('directionalDistance', () => {
    expect(directionalDistance(maxVal, minVal), 'Commutatibility').toBeCloseTo(
      directionalDistance(minVal, maxVal)
    );
    expect(directionalDistance(maxVal, minVal)).toBeCloseTo(maxDist);
    expect(directionalDistance(maxVal, 0)).toBeCloseTo(0.5 * maxDist);
    expect(directionalDistance(maxVal * 0.25, 0)).toBeCloseTo(0.5 * maxDist);
    expect(directionalDistance(minVal * 0.9, 0)).toBeCloseTo(0.5 * maxDist);
    const halfAgreeVal = 0.5 * 0.5; // Calculated on a scale from -1 to 1 (disagree to agree)
    const halfAgreeDist = ((1 - halfAgreeVal) / 2) * maxDist; // Convert to distance and scale with maxDist
    expect(directionalDistance(maxVal * 0.5, maxVal * 0.5)).toBeCloseTo(halfAgreeDist);
    expect(directionalDistance(maxVal * 0.5, minVal * 0.5)).toBeCloseTo(maxDist - halfAgreeDist);
  });
});

describe('imputeMissingValues', () => {
  const refVals: SignedNormalizedDistance[] = [minVal, 0.3 * minVal, 0, 0.5 * maxVal, maxVal];
  describe('MissingValueDistanceMethod.Neutral', () => {
    const opts = {
      missingValueMethod: MissingValueDistanceMethod.Neutral,
      missingValueBias: MissingValueBias.Positive
    };
    test.each(refVals)('For %d', (refVal: SignedNormalizedDistance) => {
      expect(imputeMissingValues(refVal, opts)[0], 'Ref value unchanged').toBe(refVal);
      expect(imputeMissingValues(refVal, opts)[1], 'Imputed value always neutral').toBeCloseTo(0);
    });
  });
  describe('MissingValueDistanceMethod.Neutral / MissingValueBias.Negative', () => {
    const opts = {
      missingValueMethod: MissingValueDistanceMethod.Neutral,
      missingValueBias: MissingValueBias.Negative
    };
    test.each(refVals)('For %d', (refVal: SignedNormalizedDistance) => {
      expect(imputeMissingValues(refVal, opts)[0], 'Ref value unchanged').toBe(refVal);
      expect(imputeMissingValues(refVal, opts)[1], 'Imputed value always neutral').toBeCloseTo(0);
    });
  });
  describe('MissingValueDistanceMethod.RelativeMaximum', () => {
    const opts = {
      missingValueMethod: MissingValueDistanceMethod.RelativeMaximum,
      missingValueBias: MissingValueBias.Positive
    };
    test.each(refVals)('For %d', (refVal: SignedNormalizedDistance) => {
      expect(imputeMissingValues(refVal, opts)[0], 'Ref value unchanged').toBe(refVal);
      expect(imputeMissingValues(refVal, opts)[1], 'Imputed value reversed').toBeCloseTo(
        refVal <= 0 ? maxVal : minVal
      );
    });
    expect(imputeMissingValues(0, opts)[1], 'Pos bias for zero').toBeCloseTo(maxVal);
  });
  // Imputed vals should be the ones above reversed
  describe('MissingValueDistanceMethod.RelativeMaximum / MissingValueBias.Negative', () => {
    const opts = {
      missingValueMethod: MissingValueDistanceMethod.RelativeMaximum,
      missingValueBias: MissingValueBias.Negative
    };
    test.each(refVals)('For %d', (refVal: SignedNormalizedDistance) => {
      expect(imputeMissingValues(refVal, opts)[0], 'Ref value unchanged').toBe(refVal);
      expect(imputeMissingValues(refVal, opts)[1], 'Imputed value reversed').toBeCloseTo(
        refVal >= 0 ? minVal : maxVal
      );
    });
    expect(imputeMissingValues(0, opts)[1], 'Neg bias for zero').toBeCloseTo(minVal);
  });
  describe('MissingValueDistanceMethod.AbsoluteMaximum', () => {
    const opts = {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum,
      missingValueBias: MissingValueBias.Positive
    };
    test.each(refVals)('For %d', (refVal: SignedNormalizedDistance) => {
      expect(imputeMissingValues(refVal, opts)[0], 'Ref value at max end').toBe(
        refVal <= 0 ? minVal : maxVal
      );
      expect(imputeMissingValues(refVal, opts)[1], 'Imputed value reversed').toBeCloseTo(
        refVal <= 0 ? maxVal : minVal
      );
    });
    expect(imputeMissingValues(0, opts)[0], 'Pos bias for zero').toBeCloseTo(minVal);
    expect(imputeMissingValues(0, opts)[1], 'Pos bias for zero').toBeCloseTo(maxVal);
  });
  // These should be the ones above reversed
  describe('MissingValueDistanceMethod.AbsoluteMaximum / MissingValueBias.Negative', () => {
    const opts = {
      missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum,
      missingValueBias: MissingValueBias.Negative
    };
    test.each(refVals)('For %d', (refVal: SignedNormalizedDistance) => {
      expect(imputeMissingValues(refVal, opts)[0], 'Ref value at max end').toBe(
        refVal >= 0 ? maxVal : minVal
      );
      expect(imputeMissingValues(refVal, opts)[1], 'Imputed value reversed').toBeCloseTo(
        refVal >= 0 ? minVal : maxVal
      );
    });
    expect(imputeMissingValues(0, opts)[0], 'Neg bias for zero').toBeCloseTo(maxVal);
    expect(imputeMissingValues(0, opts)[1], 'Neg bias for zero').toBeCloseTo(minVal);
  });
});

describe('measureDistance', () => {
  const weights = [1, 2, 3];
  const ms = new MatchingSpace(weights);
  const mdOpts: DistanceMeasurementOptions[] = [
    {
      metric: DistanceMetric.Directional,
      missingValueOptions: {
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
      }
    },
    {
      metric: DistanceMetric.Manhattan,
      missingValueOptions: {
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
      }
    }
  ];
  describe('Extreme distances', () => {
    const posMin = new MatchingSpacePosition([minVal, minVal, minVal], ms);
    const posMax = new MatchingSpacePosition([maxVal, maxVal, maxVal], ms);
    const posMissing = new MatchingSpacePosition([MISSING_VALUE, MISSING_VALUE, MISSING_VALUE], ms);
    test.each(mdOpts)('Max distance for $metric', (opts: DistanceMeasurementOptions) => {
      expect(measureDistance(posMin, posMax, opts)).toBeCloseTo(maxDist);
    });
    test.each(mdOpts)(
      'Max distance with missing vals for $metric',
      (opts: DistanceMeasurementOptions) => {
        expect(measureDistance(posMin, posMissing, opts)).toBeCloseTo(maxDist);
      }
    );
    test.each(mdOpts)(
      'Min distance with min vals for $metric',
      (opts: DistanceMeasurementOptions) => {
        expect(measureDistance(posMin, posMin, opts)).toBeCloseTo(0);
      }
    );
    test.each(mdOpts)(
      'Min distance with max vals for $metric',
      (opts: DistanceMeasurementOptions) => {
        expect(measureDistance(posMax, posMax, opts)).toBeCloseTo(0);
      }
    );
  });
  test('DistanceMetric.Manhattan', () => {
    const opts: DistanceMeasurementOptions = {
      metric: DistanceMetric.Manhattan,
      missingValueOptions: {
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
      }
    };
    const posA = new MatchingSpacePosition([minVal, minVal, minVal], ms);
    const posB = new MatchingSpacePosition([minVal, 0, maxVal], ms);
    const dist =
      (weights[0] * 0 + (weights[1] * maxDist) / 2 + weights[2] * maxDist) / ms.maxDistance;
    expect(measureDistance(posA, posB, opts)).toBeCloseTo(dist);
    expect(measureDistance(posB, posA, opts), 'Commutatibility').toBeCloseTo(dist);
  });
  test('DistanceMetric.Directional', () => {
    const opts: DistanceMeasurementOptions = {
      metric: DistanceMetric.Directional,
      missingValueOptions: {
        missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
      }
    };
    const f = 0.5;
    const posA = new MatchingSpacePosition([f * minVal, minVal, minVal]);
    const posB = new MatchingSpacePosition([f * minVal, 0, maxVal]);
    const posC = new MatchingSpacePosition([f * maxVal, 0, maxVal]);
    // Calculate first with factors on a scale from -1 to 1 (disagree to agree)
    // where minVal = -1 and maxVal = 1
    let factorsAB = [f * -1 * (f * -1), -1 * 0, -1 * 1];
    // Convert to distance and scale with maxDist
    factorsAB = factorsAB.map((v) => ((1 - v) / 2) * maxDist);
    // Add up and divide by dims
    const distAB = factorsAB.reduce((a, b) => a + b, 0) / 3;
    // Ditto for A-C
    let factorsAC = [f * -1 * (f * 1), -1 * 0, -1 * 1];
    factorsAC = factorsAC.map((v) => ((1 - v) / 2) * maxDist);
    const distAC = factorsAC.reduce((a, b) => a + b, 0) / 3;

    expect(measureDistance(posA, posC, opts)).toBeCloseTo(distAC);
    expect(measureDistance(posB, posA, opts), 'Commutatibility').toBeCloseTo(distAB);
    expect(measureDistance(posC, posA, opts), 'Commutatibility').toBeCloseTo(distAC);
  });
  describe('Distances for missing values', () => {
    const f = 0.3;
    const posMin = new MatchingSpacePosition([minVal, minVal, minVal]);
    const posFract = new MatchingSpacePosition([f * minVal, f * minVal, f * maxVal]);
    const posMissing = new MatchingSpacePosition([MISSING_VALUE, MISSING_VALUE, MISSING_VALUE]);
    test('MissingValueDistanceMethod.Neutral', () => {
      const opts: DistanceMeasurementOptions = {
        metric: DistanceMetric.Manhattan,
        missingValueOptions: {
          missingValueMethod: MissingValueDistanceMethod.Neutral
        }
      };
      expect(measureDistance(posMin, posMissing, opts)).toBeCloseTo(0.5 * maxDist);
      expect(measureDistance(posFract, posMissing, opts)).toBeCloseTo(0.5 * f * maxDist);
    });
    test('MissingValueDistanceMethod.RelativeMaximum', () => {
      const opts: DistanceMeasurementOptions = {
        metric: DistanceMetric.Manhattan,
        missingValueOptions: {
          missingValueMethod: MissingValueDistanceMethod.RelativeMaximum
        }
      };
      expect(measureDistance(posMin, posMissing, opts)).toBeCloseTo(maxDist);
      expect(measureDistance(posFract, posMissing, opts)).toBeCloseTo(0.5 * (1 + f) * maxDist);
    });
    test('MissingValueDistanceMethod.AbsoluteMaximum', () => {
      const opts: DistanceMeasurementOptions = {
        metric: DistanceMetric.Manhattan,
        missingValueOptions: {
          missingValueMethod: MissingValueDistanceMethod.AbsoluteMaximum
        }
      };
      expect(measureDistance(posMin, posMissing, opts)).toBeCloseTo(maxDist);
      expect(measureDistance(posFract, posMissing, opts)).toBeCloseTo(maxDist);
    });
    test('No missing values for ref value', () => {
      const opts: DistanceMeasurementOptions = {
        metric: DistanceMetric.Manhattan,
        missingValueOptions: {
          missingValueMethod: MissingValueDistanceMethod.Neutral
        }
      };
      expect(() => measureDistance(posMissing, posMin, opts)).toThrow();
    });
  });
});

describe('matchingAlgorithm', () => {
  test('projectToNormalizedSpace', () => {
    const likertScale = 5;
    const values = [0, 0.5, 1];
    const coords = values.map((v) => v * maxDist - maxVal);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {questions, voter, candidates, algorithm, matches} = createMatchesAndEntities(
      createLikertScaleValues(likertScale, values),
      [createLikertScaleValues(likertScale, values)],
      likertScale,
      DistanceMetric.Manhattan,
      MissingValueDistanceMethod.Neutral
    );
    expect(algorithm.projectToNormalizedSpace(candidates, questions)[0].coordinates).toMatchObject(
      coords
    );
    expect(
      algorithm.projectToNormalizedSpace(candidates, questions.slice(0, 2))[0].coordinates,
      'Subset of answers based on question list'
    ).toMatchObject(coords.slice(0, 2));
  });
  describe('match with missing values', () => {
    const likertScale = 5;
    const values = [0.25, 0.5, 1];
    const valuesMissing: MatchableValue[] = [MISSING_VALUE, MISSING_VALUE, MISSING_VALUE];
    test('MissingValueDistanceMethod.Neutral', () => {
      const dist = (maxDist * (0.25 + 0 + 0.5)) / 3;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {questions, voter, candidates, algorithm, matches} = createMatchesAndEntities(
        createLikertScaleValues(likertScale, values),
        [valuesMissing],
        likertScale,
        DistanceMetric.Manhattan,
        MissingValueDistanceMethod.Neutral
      );
      expect(algorithm.match(voter, candidates)[0].distance).toBeCloseTo(dist);
    });
    test('MissingValueDistanceMethod.Neutral', () => {
      const dist = (maxDist * (0.75 + 0.5 + 1)) / 3;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {questions, voter, candidates, algorithm, matches} = createMatchesAndEntities(
        createLikertScaleValues(likertScale, values),
        [valuesMissing],
        likertScale,
        DistanceMetric.Manhattan,
        MissingValueDistanceMethod.RelativeMaximum
      );
      expect(algorithm.match(voter, candidates)[0].distance).toBeCloseTo(dist);
    });
    test('MissingValueDistanceMethod.AbsoluteMaximum', () => {
      const dist = maxDist;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {questions, voter, candidates, algorithm, matches} = createMatchesAndEntities(
        createLikertScaleValues(likertScale, values),
        [valuesMissing],
        likertScale,
        DistanceMetric.Manhattan,
        MissingValueDistanceMethod.AbsoluteMaximum
      );
      expect(algorithm.match(voter, candidates)[0].distance).toBeCloseTo(dist);
    });
  });
  const likertScales = [3, 4, 5, 10];
  describe.each(likertScales)('match with Likert %d', (likertScale: number) => {
    test('DistanceMetric.Manhattan', () => {
      const voterValues = [0.5, 1, 0];
      const candValues = [0, 0.5, 1];
      const dist = (maxDist * (0.5 + 0.5 + 1)) / 3;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {questions, voter, candidates, algorithm, matches} = createMatchesAndEntities(
        createLikertScaleValues(likertScale, voterValues),
        [createLikertScaleValues(likertScale, candValues)],
        likertScale,
        DistanceMetric.Manhattan,
        MissingValueDistanceMethod.Neutral
      );
      expect(algorithm.match(voter, candidates)[0].distance).toBeCloseTo(dist);
    });
    test('DistanceMetric.Directional', () => {
      const voterValues = [0.5, 1, 0];
      const candValues = [0, 0.5, 1];
      // Calculate first with factors on a scale from -1 to 1 (disagree to agree)
      // where minVal = -1 and maxVal = 1
      let factors = [0 * -1, 1 * 0, -1 * 1];
      // Convert to distance and scale with maxDist
      factors = factors.map((v) => ((1 - v) / 2) * maxDist);
      // Add up and divide by dims
      const dist = factors.reduce((a, b) => a + b, 0) / 3;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {questions, voter, candidates, algorithm, matches} = createMatchesAndEntities(
        createLikertScaleValues(likertScale, voterValues),
        [createLikertScaleValues(likertScale, candValues)],
        likertScale,
        DistanceMetric.Directional,
        MissingValueDistanceMethod.Neutral
      );
      expect(algorithm.match(voter, candidates)[0].distance).toBeCloseTo(dist);
    });
  });
  describe('submatches', () => {
    test('createSubspaces', () => {
      const numQuestions = 5;
      const numSubset = 3;
      const questions = createQuestions(numQuestions, 5);
      const otherQuestions = createQuestions(numQuestions, 5);
      const subsetA = questions.slice(0, numSubset);
      const subsetB = [...subsetA, ...otherQuestions.slice(2)];
      expect(
        createSubspace(questions, questions.slice()).maxDistance,
        'subset is fully included'
      ).toBeCloseTo(numQuestions);
      expect(
        createSubspace(questions, otherQuestions).maxDistance,
        'subset is fully excluded'
      ).toBeCloseTo(0);
      expect(
        createSubspace(questions, subsetA).maxDistance,
        'subset is partly included'
      ).toBeCloseTo(numSubset);
      expect(
        createSubspace(questions, subsetB).maxDistance,
        'subset is partly included and partly excluded'
      ).toBeCloseTo(numSubset);
    });
    test('match with subQuestionGroups', () => {
      const likertScale = 5;
      const voterValues = [0, 0, 0, 0, 0.5];
      const candValues = [0, 0, 1, 1, 1];
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {questions, voter, candidates, algorithm} = createMatchesAndEntities(
        createLikertScaleValues(likertScale, voterValues),
        [createLikertScaleValues(likertScale, candValues)],
        likertScale,
        DistanceMetric.Manhattan,
        MissingValueDistanceMethod.Neutral
      );
      const subsetA = {matchableQuestions: questions.slice(0, 1)};
      const subsetADist = 0;
      const subsetB = {matchableQuestions: questions.slice(2, 3)};
      const subsetBDist = maxDist;
      const subsetC = {matchableQuestions: questions.slice(0, 4)};
      const subsetCDist = maxDist * (1 - 0.5);
      const subQuestionGroups = [subsetA, subsetB, subsetC];
      const match = algorithm.match(voter, candidates, {subQuestionGroups})[0];
      expect(match.subMatches?.length).toBeCloseTo(subQuestionGroups.length);
      expect(match.subMatches?.[0].distance).toBeCloseTo(subsetADist);
      expect(match.subMatches?.[0].questionGroup).toBe(subsetA);
      expect(match.subMatches?.[1].distance).toBeCloseTo(subsetBDist);
      expect(match.subMatches?.[2].distance).toBeCloseTo(subsetCDist);
    });
  });
});

/**********************************************************************
 * Helper functions
 **********************************************************************/

/**
 * Create dummy matches for testing.
 *
 * @param voterAnswers Array of voter answers
 * @param candidateAnswers Array of Arrays of candidate answers
 * @param likertScale The likert scale, e.g. 5
 * @param distanceMetric The DistanceMetric to use
 * @param missingValueMethod The MissingValueDistanceMethod
 * @returns A dict of all generated objects
 */
function createMatchesAndEntities(
  voterAnswers: MatchableValue[],
  candidateAnswers: MatchableValue[][],
  likertScale: number,
  distanceMetric: DistanceMetric,
  missingValueMethod: MissingValueDistanceMethod
): {
  questions: MultipleChoiceQuestion[];
  voter: Candidate;
  candidates: Candidate[];
  algorithm: MatchingAlgorithmBase;
  matches: Match[];
} {
  const numQuestions = voterAnswers.length;
  // Create dummy questions
  const questions = createQuestions(numQuestions, likertScale);
  // Create a Candidate to represent the voter
  const voter = createVoter(questions, voterAnswers);
  // Create dummy candidates
  const candidates = createCandidates(questions, candidateAnswers);
  // Matching algorithm
  const algorithm = new MatchingAlgorithmBase({
    distanceMetric,
    missingValueOptions: {missingValueMethod}
  });
  // Get matches
  const matches = algorithm.match(voter, candidates);
  return {
    questions,
    voter,
    candidates,
    algorithm,
    matches
  };
}

/**
 * A dummy candidate object for matching.
 */
class Candidate implements HasMatchableAnswers {
  constructor(public answers: MatchableAnswer[]) {}

  getMatchableAnswerValue(question: MatchableQuestion): MatchableValue {
    for (const answer of this.answers) {
      if (answer.question === question) return answer.value;
    }
    return MISSING_VALUE;
  }

  get matchableAnswers(): MatchableAnswer[] {
    return this.answers;
  }
}

/**
 * Convert normalized values to Likert-scale values.
 *
 * @param likertScale The likert scale, e.g. 5
 * @param values The normalised values
 * @returns Array of values
 */
function createLikertScaleValues(
  likertScale: number,
  values: UnsignedNormalizedDistance[]
): MatchableValue[] {
  return values.map((v) => 1 + v * (likertScale - 1));
}

/**
 * Create dummy answers.
 *
 * @param questions Question list
 * @param answerValues The answer values
 * @returns Array of answers
 */
function createAnswers(
  questions: MatchableQuestion[],
  answerValues: MatchableValue[]
): MatchableAnswer[] {
  const answers: MatchableAnswer[] = [];
  for (let i = 0; i < questions.length; i++) {
    answers.push({
      question: questions[i],
      value: answerValues[i]
    });
  }
  return answers;
}

/**
 * Create dummy questions.
 *
 * @param numQuestions Number of questions to creata
 * @param likertScale The likert scale, e.g. 5
 * @returns Array of questions
 */
function createQuestions(numQuestions: number, likertScale: number): MultipleChoiceQuestion[] {
  return Array.from({length: numQuestions}, (_, i) =>
    MultipleChoiceQuestion.fromLikertScale(`qst${i}`, likertScale)
  );
}

/**
 * Create dummy candidates
 *
 * @param questions The dummy questions
 * @param candidateAnswers Array of Arrays of candidate answers
 * @returns Array of candidates
 */
function createCandidates(
  questions: MultipleChoiceQuestion[],
  candidateAnswers: MatchableValue[][]
): Candidate[] {
  return candidateAnswers.map((o) => new Candidate(createAnswers(questions, o)));
}

/**
 * Create a dummy Candidate to represent the voter
 * @param questions The dummy questions
 * @param voterAnswers Array of voter answers
 * @returns A candidate
 */
function createVoter(
  questions: MultipleChoiceQuestion[],
  voterAnswers: MatchableValue[]
): Candidate {
  return new Candidate(createAnswers(questions, voterAnswers));
}
