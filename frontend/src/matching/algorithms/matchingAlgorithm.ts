import { DistanceMetric, HasMatchableAnswers, Match, MatchableQuestion, MatchingSpace, 
    MatchingSpacePosition, MatchingSpaceProjector, measureDistance, MissingValueBias, 
    MissingValueDistanceMethod, SignedNormalizedCoordinate } from "..";

/**
 * The generic interface for matching algorithms
 */
export interface MatchingAlgorithm {
    match: (referenceEntity: HasMatchableAnswers, entities: readonly HasMatchableAnswers[],
        options?: MatchingOptions) => Match[]
}

/**
 * Constructor options passed to a matching algorithm
 */
export interface MatchingAlgorithmOptions {
    distanceMetric: DistanceMetric;
    missingValueMethod: MissingValueDistanceMethod;
    missingValueBias?: MissingValueBias;
    projector?: MatchingSpaceProjector;
}

/**
 * Options passed to the match method of a MatchingAlgorithm
 */
export interface MatchingOptions {
    questionList?: readonly MatchableQuestion[];
}

/**
 * Options passed to the project method of a MatchingAlgorithm
 */
export type ProjectionOptions = {
    referenceEntity: HasMatchableAnswers, 
} | {
    questionList: readonly MatchableQuestion[],
}

/**
 * Base class for mathing algorithms. With different constructor options
 * most basic matching types can be implemented.
 * 
 * The matching logic is as follows:
 * 1. Project all the answers into a normalized MatchingSpace where all
 *    dimensions range from [-.5, .5] (defined by NORMALIZED_DISTANCE_EXTENT)
 * 2. Possibly reproject the positions to a low-dimensional space
 * 3. Measure distances in this space using measureDistance
 */
export class MatchingAlgorithmBase implements MatchingAlgorithm {
    distanceMetric: DistanceMetric;
    missingValueBias?: MissingValueBias;
    missingValueMethod: MissingValueDistanceMethod;
    projector?: MatchingSpaceProjector;

    constructor(
        {distanceMetric, missingValueMethod, missingValueBias, projector}: MatchingAlgorithmOptions
    ) {
        this.distanceMetric = distanceMetric;
        this.missingValueMethod = missingValueMethod;
        this.missingValueBias = missingValueBias;
        this.projector = projector;
    }

    /**
     * Generates an array of matches between the referenceEntity and other entities.
     * @param referenceEntity The entity to match against, usually the voter
     * @param entities The entities to match with, usually the candidates
     * @param options Matching options, see the interface
     * @returns Array of Match objects
     */
    match(
        referenceEntity: HasMatchableAnswers, 
        entities: readonly HasMatchableAnswers[],
        options: MatchingOptions = {}
    ): Match[] {
        if (entities.length === 0) throw new Error("Entities must not be empty");
        // NB. we add the referenceEntity to the entities to project as well as in the options
        let positions = this.projectToNormalizedSpace([referenceEntity, ...entities], referenceEntity);
        // Possibly project to a low-dimensional space
        if (this.projector) positions = this.projector.project(positions);
        // We need the referencePosition and space for distance measurement
        const referencePosition = positions.shift();
        // Calculate matches
        const measurementOptions = {
            metric: this.distanceMetric,
            missingValueMethod: this.missingValueMethod,
            missingValueBias: this.missingValueBias
        };
        const matches: Match[] = [];
        for (let i = 0; i < entities.length; i++) {
            const distance = measureDistance(referencePosition, positions[i], measurementOptions);
            matches.push(new Match(distance, entities[i]));
        }
        return matches;
    }

    projectToNormalizedSpace(entities: readonly HasMatchableAnswers[], questionList: readonly MatchableQuestion[]
    ): MatchingSpacePosition[];

    projectToNormalizedSpace(entities: readonly HasMatchableAnswers[], referenceEntity: HasMatchableAnswers
    ): MatchingSpacePosition[]

    /**
     * Project entities into a normalized MatchingSpace, where distances can be calculated.
     * @param entities The entities to project
     * @param questionListOrEntity A question list or a reference entity whose answers are
     *     used to define the question list
     * @returns An array of positions in the normalized MatchingSpace
     */
    projectToNormalizedSpace(
        entities: readonly HasMatchableAnswers[],
        questionListOrEntity: readonly MatchableQuestion[] | HasMatchableAnswers
    ): MatchingSpacePosition[] {
        if (entities.length === 0) throw new Error("Entities must not be empty");
        // Define question list
        const questionList = "getMatchableAnswers" in questionListOrEntity ? 
                             questionListOrEntity.getMatchableAnswers().map(o => o.question) :
                             questionListOrEntity;
        if (questionList.length === 0) 
            throw new Error("A non-empty questionList or referenceEntity has to be provided!");
        // Create MatchingSpace
        const dimensionWeights: number[] = [];
        for (const question of questionList) {
            const dims = question.normalizedDimensions;
            dimensionWeights.push(...Array(dims).map(() => 1 / dims));
        }
        const space = new MatchingSpace(dimensionWeights);
        // Create positions
        const positions: MatchingSpacePosition[] = [];
        for (const entity of entities) {
            const coords: SignedNormalizedCoordinate[] = [];
            for (const question of questionList) {
                const value = question.normalizeValue(entity.getMatchableAnswer(question).value);
                // We need this check for preference order questions, which return a list of subdimension distances
                if (Array.isArray(value))
                    coords.push(...value);
                else
                    coords.push(value);
            }
            positions.push(new MatchingSpacePosition(coords, space));
        }
        return positions;
    }
}