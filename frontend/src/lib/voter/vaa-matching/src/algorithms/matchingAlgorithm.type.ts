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
  /** Options passed to imputeMissingValues */
  missingValueOptions: MissingValueImputationOptions;
  /** A possible projector that will convert the results from one
   *  matching space to another, usually lower-dimensional, one. */
  projector?: MatchingSpaceProjector;
}

/**
 * Options passed to the match method of a MatchingAlgorithm
 */
export interface MatchingOptions<T extends MatchableQuestionGroup> {
  /** A list of question subgroups or categories in which distances are also
   * measured. Note that if these subgroups have no overlap with the the
   * `referenceEntity`'s question (or `questionList`) passed to `match`,
   * the `SubMatches` for them will have a score of zero but no error will
   * be thrown. */
  questionGroups?: Array<T>;
}
