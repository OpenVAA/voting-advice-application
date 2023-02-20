/**
 * Utility exports for items users of the matching functions might need so that their
 * imports are not broken if internal structure is changed.
 */

export {imputeMissingValues, MissingValueBias, MissingValueDistanceMethod} from "./algorithms/imputeMissingValues";
export {Match} from "./algorithms/match";
export {MatchingAlgorithmBase} from "./algorithms/matchingAlgorithm";
export type { MatchingAlgorithm } from "./algorithms/matchingAlgorithm";
export type {MatchingSpaceProjector} from "./algorithms/matchingSpaceProjector";
export {DistanceMetric, measureDistance} from "./algorithms/measureDistance";
export {assertUnsignedNormalized, assertSignedNormalized, NORMALIZED_DISTANCE_EXTENT} from "./core/distances";
export type { UnsignedNormalizedDistance, SignedNormalizedDistance } from "./core/distances";
export type {HasMatchableAnswers, MatchableAnswer} from "./core/hasMatchableAnswers";
export {MISSING_VALUE} from "./core/matchableValue";
export type { MatchableValue, MissingValue, NonmissingValue } from "./core/matchableValue";
export {MatchingSpace} from "./core/matchingSpace";
export {MatchingSpacePosition} from "./core/matchingSpacePosition";
export type { MatchingSpaceCoordinate } from "./core/matchingSpacePosition";
export {MatchableQuestion} from "./questions/matchableQuestion";
export {MultipleChoiceQuestion} from "./questions/multipleChoiceQuestion";
