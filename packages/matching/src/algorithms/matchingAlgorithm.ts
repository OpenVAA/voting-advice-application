import { type HasAnswers, type Id, type MatchableQuestion, MISSING_VALUE } from '@openvaa/core';
import { type DistanceMetric, measureDistance } from '../distance';
import { Match, SubMatch } from '../match';
import { createSubspace, MatchingSpace, Position } from '../space';
import type { MissingValueImputationOptions } from '../missingValue';
import type { MatchableQuestionGroup } from '../question';
import type { MatchingAlgorithmOptions, MatchingOptions } from './matchingAlgorithm.type';
import type { MatchingSpaceProjector } from './matchingSpaceProjector';

/**
 * Base class for matching algorithms. With different constructor options most basic matching types can be implemented.
 * The matching logic is as follows:
 * 1. Project all the answers into a normalized `MatchingSpace` where all dimensions conform with `Coordinate`.
 * 2. Possibly reproject the positions to a low-dimensional space
 * 3. Measure distances in this space using `measureDistance`
 */
export class MatchingAlgorithm {
  /** The distance metric to use. */
  distanceMetric: DistanceMetric;
  /** Options passed to imputeMissingValue */
  missingValueOptions: MissingValueImputationOptions;
  /** A possible projector that will convert the results from one matching space to another, usually lower-dimensional, one. */
  projector?: MatchingSpaceProjector;

  /**
   * Create a new MatchingAlgorithm.
   * @param distanceMetric The metric to use for distance calculations, e.g. `DistanceMetric.Manhattan`.
   * @param missingValueOptions The options to use for imputing missing values
   * @param projector An optional projector that will project the results from one matching space to another, usually lower-dimensional one
   */
  constructor({ distanceMetric, missingValueOptions, projector }: MatchingAlgorithmOptions) {
    this.distanceMetric = distanceMetric;
    this.missingValueOptions = missingValueOptions;
    this.projector = projector;
  }

  /**
   * Calculate matches between the reference and the other targets.
   * @param questions The questions to include in the matching. Note that only those of the questions that the reference has answered will be included in the matching.
   * @param reference The entity to match against, e.g. voter
   * @param targets The targets to match with, e.g. candidates
   * @options Matching options, see. `MatchingOptions`.
   * @returns An array of Match objects
   */
  match<TTarget extends HasAnswers, TGroup extends MatchableQuestionGroup = MatchableQuestionGroup>({
    questions,
    reference,
    targets,
    options
  }: {
    questions: ReadonlyArray<MatchableQuestion>;
    reference: HasAnswers;
    targets: ReadonlyArray<TTarget>;
    options?: MatchingOptions<TGroup>;
  }): Array<Match<TTarget, TGroup>> {
    if (questions.length === 0) throw new Error('Questions must not be empty');
    if (targets.length === 0) throw new Error('Targets must not be empty');
    options ??= {};
    // Check that questions contain no duplicate ids
    const ids = new Set<MatchableQuestion['id']>();
    for (const q of questions) {
      if (ids.has(q.id)) throw new Error(`Duplicate question id: ${q.id}`);
      ids.add(q.id);
    }
    // Filter questions so that only those that the reference has answers for are included
    questions = questions.filter((q) => {
      const v = reference.answers[q.id]?.value;
      return v !== undefined && v !== MISSING_VALUE;
    });
    if (questions.length === 0) throw new Error('Reference has no answers matching the questions');
    let positions = this.projectToNormalizedSpace({
      questions,
      questionWeights: options.questionWeights,
      targets: [reference, ...targets] // Add the reference to the targets to project
    });
    // Possibly project to a low-dimensional space
    if (this.projector) positions = this.projector.project(positions);
    // We need the referencePosition and space for distance measurement
    const referencePosition = positions.shift();
    if (!referencePosition) throw new Error('Reference position is undefined!');
    // Create possible matching subspaces for, e.g., category matches
    let subspaces = new Array<MatchingSpace>();
    if (options.questionGroups) {
      subspaces = options.questionGroups.map((g) => createSubspace({ questions, subset: g.questions }));
    }
    // Calculate matches
    const measurementOptions = {
      metric: this.distanceMetric,
      missingValueOptions: {
        ...this.missingValueOptions
      }
    };
    const matches = new Array<Match<TTarget, TGroup>>();
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (options.questionGroups) {
        const distances = measureDistance({
          reference: referencePosition,
          target: positions[i],
          options: measurementOptions,
          subspaces
        });
        const subMatches = distances.subspaces.map((distance, k) => {
          const questionGroup = options.questionGroups?.[k];
          if (questionGroup == null)
            throw new Error("Distances returned by measureDistance don't match the number of questionGroups!");
          return new SubMatch({ distance, questionGroup });
        });
        matches.push(new Match({ distance: distances.global, target, subMatches }));
      } else {
        const distance = measureDistance({
          reference: referencePosition,
          target: positions[i],
          options: measurementOptions
        });
        matches.push(new Match({ distance, target }));
      }
    }
    // Sort by ascending distance
    matches.sort((a, b) => a.distance - b.distance);
    return matches;
  }

  /**
   * Project targets into a normalized `MatchingSpace`, where distances can be calculated.
   * @param questions The list of questions to use for distance calculations
   * @param targets The targets to project
   * @returns An array of positions in the normalized `MatchingSpace`
   */
  projectToNormalizedSpace({
    questions,
    targets,
    questionWeights
  }: {
    questions: ReadonlyArray<MatchableQuestion>;
    targets: ReadonlyArray<HasAnswers>;
    questionWeights?: Record<Id, number>;
  }): Array<Position> {
    if (questions.length === 0) throw new Error('Questions must not be empty');
    if (targets.length === 0) throw new Error('Targets must not be empty');
    // Create MatchingSpace
    const space = MatchingSpace.fromQuestions({ questions, questionWeights });
    // Create positions
    const positions = new Array<Position>(targets.length);
    for (let i = 0; i < targets.length; i++) {
      const coordinates = questions.map((question) =>
        question.normalizeValue(targets[i].answers[question.id]?.value ?? MISSING_VALUE)
      );
      positions[i] = new Position({ coordinates, space });
    }
    return positions;
  }
}
