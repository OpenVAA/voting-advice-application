/**
 * A space wherein the matching distances are measured.
 */
export class MatchingSpace {
    /**
     * Define a space for matching.
     * 
     * @param weights The weights used for matching, i.e. distance calculation
     * of each dimension.
     */
    constructor (public weights: number[]) {
        if (weights.length === 0) throw new Error("Weights cannot be empty!");
    }

    /**
     * Number of dimensions in this space.
     */
    get dimensions(): number {
        return this.weights.length;
    }

    /**
     * Maximum possible distance in this space. Used to calculate matching
     * distances in the space (they are fractions of the this).
     */
    get maxDistance(): number {
        return this.weights.reduce((s, i) => s + i, 0);
    }
}