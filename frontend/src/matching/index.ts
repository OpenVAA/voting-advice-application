/**
 * Utility exports for items users of the matching functions might need so that their
 * imports are not broken if internal structure is changed.
 */

export {imputeMissingValues, MissingValueBias, MissingValueDistanceMethod} from "./algorithms/imputeMissingValues";
export {Match} from "./algorithms/match";
export {MatchingAlgorithm, MatchingAlgorithmBase} from "./algorithms/matchingAlgorithm";
export {MatchingSpaceProjector} from "./algorithms/matchingSpaceProjector";
export {DistanceMetric, measureDistance} from "./algorithms/measureDistance";
export {assertUnsignedNormalized, assertSignedNormalized, NORMALIZED_DISTANCE_EXTENT,
    UnsignedNormalizedDistance, SignedNormalizedDistance} from "./core/distances";
export {HasMatchableAnswers, MatchableAnswer} from "./core/hasMatchableAnswers";
export {MatchableValue, MissingValue, MISSING_VALUE, NonmissingValue} from "./core/matchableValue";
export {MatchingSpace} from "./core/matchingSpace";
export {MatchingSpaceCoordinate, MatchingSpacePosition} from "./core/matchingSpacePosition";
export {MatchableQuestion} from "./questions/matchableQuestion";
export {MultipleChoiceQuestion} from "./questions/multipleChoiceQuestion";
