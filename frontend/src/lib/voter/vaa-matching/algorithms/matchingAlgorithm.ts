import type {HasMatchableAnswers} from '../core/hasMatchableAnswers';
import {MatchingSpace} from '../core/matchingSpace';
import {MatchingSpacePosition} from '../core/matchingSpacePosition';
import type {MatchingSpaceCoordinate} from '../core/matchingSpacePosition';
import {createSubspace} from './createSubspace';
import type {MissingValueImputationOptions} from './imputeMissingValues';
import {Match, SubMatch} from './match';
import type {MatchingSpaceProjector} from './matchingSpaceProjector';
import {measureDistance, DistanceMetric} from './measureDistance';
import type {MatchableQuestion} from '../questions/matchableQuestion';
import type {HasMatchableQuestions} from '../questions/hasMatchableQuestions';

/**
 * The generic interface for matching algorithms
 */
export interface MatchingAlgorithm {
  /**
   * Calculate matches between the referenceEntity and the other entities.
   *
   * @param referenceEntity The entity to match against, e.g. voter
   * @param entities The entities to match with, e.g. candidates
   * @param options Matching options
   * @returns An array of Match objects
   */
  match: (
    referenceEntity: HasMatchableAnswers,
    entities: readonly HasMatchableAnswers[],
    options?: MatchingOptions
  ) => Match[];
}

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
export interface MatchingOptions {
  /** A list of question subgroups or categories in which distances are also
   * measured. Note that if these subgroups have no overlap with the the
   * `referenceEntity`'s question (or `questionList`) passed to `match`,
   * the `SubMatches` for them will have a score of zero but no error will
   * be thrown. */
  subQuestionGroups?: HasMatchableQuestions[];
}

/**
 * Options passed to the project method of a MatchingAlgorithm
 */
export type ProjectionOptions =
  | {
      /** The entity whose answers will be used to define the list
       *  of questions used in the projection. */
      referenceEntity: HasMatchableAnswers;
    }
  | {
      /** A list of questions that will be used in the projection. */
      questionList: readonly MatchableQuestion[];
    };

/**
 * Base class for mathing algorithms. With different constructor options
 * most basic matching types can be implemented.
 *
 * The matching logic is as follows:
 * 1. Project all the answers into a normalized MatchingSpace where all
 *    dimensions range from [-.5, .5] (the range is defined by
 *    NORMALIZED_DISTANCE_EXTENT and centered around zero)
 * 2. Possibly reproject the positions to a low-dimensional space
 * 3. Measure distances in this space using measureDistance
 */
export class MatchingAlgorithmBase implements MatchingAlgorithm {
  /** The distance metric to use. */
  distanceMetric: DistanceMetric;
  /** Options passed to imputeMissingValues */
  missingValueOptions: MissingValueImputationOptions;
  /** A possible projector that will convert the results from one
   *  matching space to another, usually lower-dimensional, one. */
  projector?: MatchingSpaceProjector;

  constructor({distanceMetric, missingValueOptions, projector}: MatchingAlgorithmOptions) {
    this.distanceMetric = distanceMetric;
    this.missingValueOptions = missingValueOptions;
    this.projector = projector;
  }

  /**
   * Calculate matches between the referenceEntity and the other entities.
   *
   * @param referenceEntity The entity to match against, e.g. voter
   * @param entities The entities to match with, e.g. candidates
   * @options Matching options, see. `MatchingOptions`.
   * @returns An array of Match objects
   */
  match(
    referenceEntity: HasMatchableAnswers,
    entities: readonly HasMatchableAnswers[],
    options: MatchingOptions = {}
  ): Match[] {
    if (entities.length === 0) throw new Error('Entities must not be empty');
    // NB. we add the referenceEntity to the entities to project as well as in the options
    let positions = this.projectToNormalizedSpace([referenceEntity, ...entities], referenceEntity);
    // Possibly project to a low-dimensional space
    if (this.projector) positions = this.projector.project(positions);
    // We need the referencePosition and space for distance measurement
    const referencePosition = positions.shift();
    if (!referencePosition) {
      throw new Error('Error! Reference position is undefined!');
    }
    // Create possible matching subspaces for, e.g., category matches
    let subspaces: MatchingSpace[] = [];
    if (options.subQuestionGroups) {
      const allQuestions = referenceEntity.matchableAnswers.map((a) => a.question);
      subspaces = options.subQuestionGroups.map((g) =>
        createSubspace(allQuestions, g.matchableQuestions)
      );
    }
    // Calculate matches
    const measurementOptions = {
      metric: this.distanceMetric,
      missingValueOptions: this.missingValueOptions
    };
    const matches: Match[] = [];
    for (let i = 0; i < entities.length; i++) {
      if (options.subQuestionGroups) {
        const distances = measureDistance(
          referencePosition,
          positions[i],
          measurementOptions,
          subspaces
        );
        const submatches = distances.subspaces.map((dist, k) => {
          if (options.subQuestionGroups?.[k] == null)
            throw new Error(
              "Distances returned by measureDistance don't match the number of subQuestionGroups!"
            );
          return new SubMatch(dist, options.subQuestionGroups[k]);
        });
        matches.push(new Match(distances.global, entities[i], submatches));
      } else {
        const distance = measureDistance(referencePosition, positions[i], measurementOptions);
        matches.push(new Match(distance, entities[i]));
      }
    }
    return matches;
  }

  projectToNormalizedSpace(
    entities: readonly HasMatchableAnswers[],
    questionList: readonly MatchableQuestion[]
  ): MatchingSpacePosition[];

  projectToNormalizedSpace(
    entities: readonly HasMatchableAnswers[],
    referenceEntity: HasMatchableAnswers
  ): MatchingSpacePosition[];

  /**
   * Project entities into a normalized MatchingSpace, where distances can be calculated.
   *
   * @param entities The entities to project
   * @param questionListOrEntity A question list or a reference entity whose answers are
   * used to define the question list
   * @returns An array of positions in the normalized MatchingSpace
   */
  projectToNormalizedSpace(
    entities: readonly HasMatchableAnswers[],
    questionListOrEntity: readonly MatchableQuestion[] | HasMatchableAnswers
  ): MatchingSpacePosition[] {
    if (entities.length === 0) throw new Error('Entities must not be empty');
    // Define question list
    const questionList =
      'matchableAnswers' in questionListOrEntity
        ? questionListOrEntity.matchableAnswers.map((o) => o.question)
        : questionListOrEntity;
    if (questionList.length === 0)
      throw new Error('A non-empty questionList or referenceEntity has to be provided!');
    // Create MatchingSpace
    const dimensionWeights: number[] = [];
    for (const question of questionList) {
      const dims = question.normalizedDimensions ?? 1;
      dimensionWeights.push(...Array.from({length: dims}, () => 1 / dims));
    }
    const space = new MatchingSpace(dimensionWeights);
    // Create positions
    const positions: MatchingSpacePosition[] = [];
    for (const entity of entities) {
      const coords: MatchingSpaceCoordinate[] = [];
      for (const question of questionList) {
        const value = question.normalizeValue(entity.getMatchableAnswerValue(question));
        // We need this check for preference order questions, which return a list of subdimension distances
        if (Array.isArray(value)) coords.push(...value);
        else coords.push(value);
      }
      positions.push(new MatchingSpacePosition(coords, space));
    }
    return positions;
  }
}
