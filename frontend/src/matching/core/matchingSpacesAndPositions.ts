import { SignedNormalizedPosition } from "..";


/**
 * A space wherein the matching distances are measured.
 */
export class MatchingSpace {
    constructor (public weights: number[]) {
        if (weights.length === 0) throw new Error("Weights cannot be empty!");
    }

    get dimensions(): number {
        return this.weights.length;
    }

    get maxDistance(): number {
        return this.weights.reduce((s, i) => s + i, 0);
    }
}

/**
 * A position in a MatchingSpace
 */
export class MatchingSpacePosition {
    constructor (
        public coordinates: SignedNormalizedPosition,
        public readonly space?: MatchingSpace
    ) {
        if (space && space.dimensions !== coordinates.length)
            throw new Error(`The dimensions of coordinates ${coordinates.length} and space ${space.dimensions} do not match!`);
    }

    get dimensions(): number {
        return this.coordinates.length;
    }
}