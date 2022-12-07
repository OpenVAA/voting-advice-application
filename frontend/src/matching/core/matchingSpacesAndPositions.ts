import { SignedNormalizedPosition } from "..";

/**
 * For dimensionality calculation
 */
export interface HasLength {
    length: number;
}

/**
 * Assert that all of the objects have the same number of dimensions
 * @param objects Positions or vectors
 */
export function assertSameDimensions(...objects: HasLength[]): void {
    const dims = objects[0].length;
    for (let i = 1; i < objects.length; i++) {
        if (objects[i].length !== dims) throw new Error(`Objects have different number of dimensions!`);
    }
}

/**
 * A space wherein the matching distances are measured.
 */
export class MatchingSpace {
    constructor (public weights: number[]) {
        if (weights.length === 0) throw new Error("Weights cannot be empty!");
    }

    get length(): number {
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
        if (space) 
            assertSameDimensions(coordinates, space);
    }

    get length(): number {
        return this.coordinates.length;
    }
}