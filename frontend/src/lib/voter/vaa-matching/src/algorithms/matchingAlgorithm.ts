import type {HasMatchableAnswers} from '../entity';
import {measureDistance, DistanceMetric} from '../distance';
import {Match, SubMatch} from '../match';
import {MISSING_VALUE, type MissingValueImputationOptions} from '../missingValue';
import {
  createSubspace,
  MatchingSpace,
  MatchingSpacePosition,
  type MatchingSpaceCoordinate
} from '../space';
import type {MatchableQuestion, MatchableQuestionGroup} from '../question';
import type {MatchingSpaceProjector} from './matchingSpaceProjector';
import type {MatchingAlgorithmOptions, MatchingOptions} from './matchingAlgorithm.type';

/**
 * Base class for matching algorithms. With different constructor options
 * most basic matching types can be implemented.
 *
 * The matching logic is as follows:
 * 1. Project all the answers into a normalized MatchingSpace where all
 *    dimensions range from [-.5, .5] (the range is defined by
 *    NORMALIZED_DISTANCE_EXTENT and centered around zero)
 * 2. Possibly reproject the positions to a low-dimensional space
 * 3. Measure distances in this space using measureDistance
 */
export class MatchingAlgorithm {
  /** The distance metric to use. */
  distanceMetric: DistanceMetric;
  /** Options passed to imputeMissingValues */
  missingValueOptions: MissingValueImputationOptions;
  /** A possible projector that will convert the results from one
   *  matching space to another, usually lower-dimensional, one. */
  projector?: MatchingSpaceProjector;

  /**
   * Create a new MatchingAlgorithm.
   *
   * @param distanceMetric The metric to use for distance calculations, e.g. DistanceMetric.Manhattan.
   * @param missingValueOptions The options to use for imputing missing values
   * @param projector An optional projector that will project the results from one matching space to another,
   *   usually lower-dimensional one
   */
  constructor({distanceMetric, missingValueOptions, projector}: MatchingAlgorithmOptions) {
    this.distanceMetric = distanceMetric;
    this.missingValueOptions = missingValueOptions;
    this.projector = projector;
  }

  /**
   * Calculate matches between the referenceEntity and the other entities.
   *
   * @param questions The questions to include in the matching. Note that only those of the questions that the referenceEntity has answered will be included in the matching.
   * @param referenceEntity The entity to match against, e.g. voter
   * @param entities The entities to match with, e.g. candidates
   * @options Matching options, see. `MatchingOptions`.
   * @returns An array of Match objects
   */
  match<E extends HasMatchableAnswers, G extends MatchableQuestionGroup = MatchableQuestionGroup>(
    questions: MatchableQuestion[],
    referenceEntity: HasMatchableAnswers,
    entities: readonly E[],
    options: MatchingOptions<G> = {}
  ): Match<E, G>[] {
    if (questions.length === 0) throw new Error('Questions must not be empty');
    if (entities.length === 0) throw new Error('Entities must not be empty');
    // Check that questions contain no duplicate ids
    const ids = new Set<MatchableQuestion['id']>();
    for (const q of questions) {
      if (ids.has(q.id)) throw new Error(`Duplicate question id: ${q.id}`);
      ids.add(q.id);
    }
    // Filter questions so that only those that the referenceEntity has answers for are included
    questions = questions.filter((q) => {
      const v = referenceEntity.answers[q.id]?.value;
      return v !== undefined && v !== MISSING_VALUE;
    });
    if (questions.length === 0)
      throw new Error('ReferenceEntity has no answers matching the questions');
    // NB. we add the referenceEntity to the entities to project as well as in the options
    let positions = this.projectToNormalizedSpace(questions, [referenceEntity, ...entities]);
    // Possibly project to a low-dimensional space
    if (this.projector) positions = this.projector.project(positions);
    // We need the referencePosition and space for distance measurement
    const referencePosition = positions.shift();
    if (!referencePosition) throw new Error('Reference position is undefined!');
    // Create possible matching subspaces for, e.g., category matches
    let subspaces: MatchingSpace[] = [];
    if (options.questionGroups) {
      subspaces = options.questionGroups.map((g) =>
        createSubspace(questions, g.matchableQuestions)
      );
    }
    // Calculate matches
    const measurementOptions = {
      metric: this.distanceMetric,
      missingValueOptions: this.missingValueOptions
    };
    const matches: Match<E, G>[] = [];
    for (let i = 0; i < entities.length; i++) {
      if (options.questionGroups) {
        const distances = measureDistance(
          referencePosition,
          positions[i],
          measurementOptions,
          subspaces
        );
        const submatches = distances.subspaces.map((dist, k) => {
          if (options.questionGroups?.[k] == null)
            throw new Error(
              "Distances returned by measureDistance don't match the number of questionGroups!"
            );
          return new SubMatch(dist, options.questionGroups[k]);
        });
        matches.push(new Match(distances.global, entities[i], submatches));
      } else {
        const distance = measureDistance(referencePosition, positions[i], measurementOptions);
        matches.push(new Match(distance, entities[i]));
      }
    }
    // Sort by ascending distance
    matches.sort((a, b) => a.distance - b.distance);
    return matches;
  }

  /**
   * Project entities into a normalized MatchingSpace, where distances can be calculated.
   *
   * @param questions The list of questions to use for distance calculations
   * @param entities The entities to project
   * @returns An array of positions in the normalized MatchingSpace
   */
  projectToNormalizedSpace(
    questions: readonly MatchableQuestion[],
    entities: readonly HasMatchableAnswers[]
  ): MatchingSpacePosition[] {
    if (questions.length === 0) throw new Error('Questions must not be empty');
    if (entities.length === 0) throw new Error('Entities must not be empty');
    // Create MatchingSpace
    const dimensionWeights: number[] = [];
    for (const question of questions) {
      const dims = question.normalizedDimensions ?? 1;
      dimensionWeights.push(...Array.from({length: dims}, () => 1 / dims));
    }
    const space = new MatchingSpace(dimensionWeights);
    // Create positions
    const positions: MatchingSpacePosition[] = [];
    for (const entity of entities) {
      const coords: MatchingSpaceCoordinate[] = [];
      for (const question of questions) {
        const value = question.normalizeValue(entity.answers[question.id]?.value ?? MISSING_VALUE);
        // We need this check for preference order questions, which return a list of subdimension distances
        if (Array.isArray(value)) coords.push(...value);
        else coords.push(value);
      }
      positions.push(new MatchingSpacePosition(coords, space));
    }
    return positions;
  }
}
