import type { Id } from '@openvaa/core';
import type { DistanceMetric } from '../distance';
import type { MissingValueImputationOptions } from '../missingValue';
import type { MatchableQuestionGroup } from '../question';
import type { MatchingSpaceProjector } from './matchingSpaceProjector';

/**
 * Constructor options passed to a matching algorithm
 */
export interface MatchingAlgorithmOptions {
  /** The distance metric to use. */
  distanceMetric: DistanceMetric;
  /** Options passed to imputeMissingValue */
  missingValueOptions: MissingValueImputationOptions;
  /** A possible projector that will convert the results from one matching space to another, usually lower-dimensional, one. */
  projector?: MatchingSpaceProjector;
}

/**
 * Options passed to the match method of a MatchingAlgorithm
 */
export interface MatchingOptions<TGroup extends MatchableQuestionGroup> {
  /**
   * A list of question subgroups or categories in which distances are also measured.
   * Note that if these subgroups have no overlap with the the `referenceEntity`'s question (or `questionList`) passed to `match`, the `SubMatches` distance for them will have a score of `COORDINATE.Extent / 2` but no error will be thrown.
   * Note also that any weights assigned to the questions in the full set will be disregarded for these subgroups.
   */
  questionGroups?: Array<TGroup>;
  /**
   * A full or partial record of question weights by id for calculating the overall distance. If not specified at all or a given question, the weights default to 1.
   * Note that the weights are not applied to the subgroups matches.
   */
  questionWeights?: Record<Id, number>;
}
