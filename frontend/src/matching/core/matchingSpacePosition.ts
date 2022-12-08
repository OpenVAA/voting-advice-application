import { MISSING_VALUE, MatchingSpace, SignedNormalizedDistance } from "..";


/**
 * A coordinate in a space defined by SignedNormalizedDistances that may be missing
 */
export type MatchingSpaceCoordinate = SignedNormalizedDistance | typeof MISSING_VALUE;

/**
 * A position in a MatchingSpace
 */
export class MatchingSpacePosition {
    constructor (
        public coordinates: MatchingSpaceCoordinate[],
        public readonly space?: MatchingSpace
    ) {
        if (space && space.dimensions !== coordinates.length)
            throw new Error(`The dimensions of coordinates ${coordinates.length} and space ${space.dimensions} do not match!`);
    }

    get dimensions(): number {
        return this.coordinates.length;
    }
}