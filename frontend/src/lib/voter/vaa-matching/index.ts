/**
 * Utility exports for items users of the matching functions might need so that their
 * imports are not broken if internal structure is changed.
 */
import {createSubspace} from './algorithms/createSubspace';
import {
  imputeMissingValues,
  MissingValueBias,
  MissingValueDistanceMethod
} from './algorithms/imputeMissingValues';
import type {MissingValueImputationOptions} from './algorithms/imputeMissingValues';
import {Match, MatchBase, SubMatch} from './algorithms/match';
import {MatchingAlgorithmBase} from './algorithms/matchingAlgorithm';
import type {MatchingAlgorithm, MatchingOptions} from './algorithms/matchingAlgorithm';
import type {MatchingSpaceProjector} from './algorithms/matchingSpaceProjector';
import {DistanceMetric, measureDistance} from './algorithms/measureDistance';
import {
  assertUnsignedNormalized,
  assertSignedNormalized,
  NORMALIZED_DISTANCE_EXTENT
} from './core/distances';
import type {UnsignedNormalizedDistance, SignedNormalizedDistance} from './core/distances';
import type {HasMatchableAnswers, MatchableAnswer} from './core/hasMatchableAnswers';
import {MISSING_VALUE} from './core/matchableValue';
import type {MatchableValue, MissingValue, NonmissingValue} from './core/matchableValue';
import {MatchingSpace} from './core/matchingSpace';
import {MatchingSpacePosition} from './core/matchingSpacePosition';
import type {MatchingSpaceCoordinate} from './core/matchingSpacePosition';
import type {HasMatchableQuestions} from './questions/hasMatchableQuestions';
import type {MatchableQuestion} from './questions/matchableQuestion';
import {MultipleChoiceQuestion} from './questions/multipleChoiceQuestion';

export {
  assertSignedNormalized,
  assertUnsignedNormalized,
  createSubspace,
  DistanceMetric,
  HasMatchableAnswers,
  HasMatchableQuestions,
  imputeMissingValues,
  Match,
  MatchableAnswer,
  MatchableQuestion,
  MatchableValue,
  MatchBase,
  MatchingAlgorithm,
  MatchingAlgorithmBase,
  MatchingOptions,
  MatchingSpace,
  MatchingSpaceCoordinate,
  MatchingSpacePosition,
  MatchingSpaceProjector,
  measureDistance,
  MISSING_VALUE,
  MissingValue,
  MissingValueBias,
  MissingValueDistanceMethod,
  MissingValueImputationOptions,
  MultipleChoiceQuestion,
  NonmissingValue,
  NORMALIZED_DISTANCE_EXTENT,
  SignedNormalizedDistance,
  SubMatch,
  UnsignedNormalizedDistance
};
