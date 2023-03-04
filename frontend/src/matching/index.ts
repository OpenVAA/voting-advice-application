/**
 * Utility exports for items users of the matching functions might need so that their
 * imports are not broken if internal structure is changed.
 */

import {imputeMissingValues, MissingValueBias, MissingValueDistanceMethod} from "./algorithms/imputeMissingValues";
import {Match} from "./algorithms/match";
import {MatchingAlgorithmBase} from "./algorithms/matchingAlgorithm";
import type { MatchingAlgorithm } from "./algorithms/matchingAlgorithm";
import type {MatchingSpaceProjector} from "./algorithms/matchingSpaceProjector";
import {DistanceMetric, measureDistance} from "./algorithms/measureDistance";
import {assertUnsignedNormalized, assertSignedNormalized, NORMALIZED_DISTANCE_EXTENT} from "./core/distances";
import type { UnsignedNormalizedDistance, SignedNormalizedDistance } from "./core/distances";
import type {HasMatchableAnswers, MatchableAnswer} from "./core/hasMatchableAnswers";
import {MISSING_VALUE} from "./core/matchableValue";
import type { MatchableValue, MissingValue, NonmissingValue } from "./core/matchableValue";
import {MatchingSpace} from "./core/matchingSpace";
import {MatchingSpacePosition} from "./core/matchingSpacePosition";
import type { MatchingSpaceCoordinate } from "./core/matchingSpacePosition";
import {MatchableQuestion} from "./questions/matchableQuestion";
import {MultipleChoiceQuestion} from "./questions/multipleChoiceQuestion";

export {
    imputeMissingValues,
    MissingValueBias,
    MissingValueDistanceMethod,
    Match,
    MatchingAlgorithmBase,
    MatchingAlgorithm,
    MatchingSpaceProjector,
    DistanceMetric,
    measureDistance,
    assertUnsignedNormalized,
    assertSignedNormalized,
    NORMALIZED_DISTANCE_EXTENT,
    UnsignedNormalizedDistance,
    SignedNormalizedDistance,
    HasMatchableAnswers,
    MatchableAnswer,
    MISSING_VALUE,
    MatchableValue,
    MissingValue,
    NonmissingValue,
    MatchingSpace,
    MatchingSpacePosition,
    MatchingSpaceCoordinate,
    MatchableQuestion,
    MultipleChoiceQuestion
}