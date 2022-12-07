import { MISSING_VALUE, NORMALIZED_DISTANCE_EXTENT, imputeMissingValues, MatchingSpacePosition, 
    UnsignedNormalizedDistance } from "..";

/**
 * Available distance measurement metrics
 */
export enum DistanceMetric {
    Manhattan,
    Directional,
    // MendezHybrid,
    // Euclidean,
    // Mahalonobis
}

/**
 * The penalty applied to missing values
 * Neutral imputes the neutral, i.e., middle answer
 * RelativeMaximum imputes the furthest possible answer from the reference, 
 *     i.e., voter answer
 * AbsoluteMaximum treats both the reference value and the missing one as
 *     being at the opposite ends of the range
 */
export enum MissingValueDistanceMethod {
    Neutral,
    RelativeMaximum,
    AbsoluteMaximum
}

/**
 * The direction into which the missing value is biased when the reference
 * value is neutral. I.e. if we use the RelativeMaximum method and the 
 * reference value is neutral (3 on a 5-pt Likert scale) and the bias is
 * Positive, we impute the maximum value (5) for the missing value.
 */
export enum MissingValueBias {
    Positive,
    Negative
}

/**
 * Options passed to measureDistance.
 */
export interface DistanceMeasurementOptions {
    metric: DistanceMetric;
    missingValueMethod: MissingValueDistanceMethod;
    missingValueBias?: MissingValueBias;
}

/**
 * Measure the distance between to positions in a MatchingSpace.
 * @param a The reference position to measure against (cannot be missing)
 * @param b The other position
 * @param options Options, see the interface DistanceMeasurementOptions
 * @returns An unsigned normalized distance, e.g. [0, 1]
 */
export function measureDistance(
    a: MatchingSpacePosition, 
    b: MatchingSpacePosition, 
    options: DistanceMeasurementOptions
): UnsignedNormalizedDistance {
    if (a.length === 0) throw new Error(`a doesn't have any elements!`);
    if (a.length !== b.length) throw new Error(`a and b have different number of elements!`);
    const space = a.space;
    if (space && space.length !== a.length) throw new Error(`a and space have different number of dimensions!`);
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        // We might have to alter these values, if there are missing ones, hence the vars
        let valA = a[i], 
            valB = b[i];
        // First, handle missing values
        if (valA === MISSING_VALUE) throw new Error("The first position cannot contain missing values!");
        if (valB === MISSING_VALUE) {
            [valA, valB] = imputeMissingValues(valA, options);
        }
        // Calculate distance
        let dist: number;
        switch (options.metric) {
            case DistanceMetric.Manhattan:
                dist = Math.abs(valA - valB);
                break;
            case DistanceMetric.Directional:
                const maxAbsDist = NORMALIZED_DISTANCE_EXTENT / 2;
                dist = (1 - valA / maxAbsDist * valB / maxAbsDist) * NORMALIZED_DISTANCE_EXTENT;
                break;
            default:
                throw new Error(`Unknown distance metric: ${options.metric}`);
        }
        // Apply possible weights
        if (space)
            dist *= space.weights[i];
        // Add to total
        sum += dist;
    }
    // Normalize total distance
    return sum / (space ? space.maxDistance : a.length);
}

