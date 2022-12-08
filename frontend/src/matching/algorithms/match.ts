import { NORMALIZED_DISTANCE_EXTENT, HasMatchableAnswers, UnsignedNormalizedDistance } from "..";

/**
 * The base class for a matching result
 */
export class Match {
    /** Used in converting the distance to a string representation. */
    protected static multiplier = 100;
    /** Used in converting the distance to a string representation. */
    protected static unitString = "%"; // "&#8201;%";

    /**
     * Create a new Match.
     * 
     * @param distance The match distance as an unsigned normalized distance,
     * e.g. [0, 1] (the range is defined by `NORMALIZED_DISTANCE_EXTENT`).
     * Note that 1 means a bad match and 0 a perfect one.
     * @param entity The entity to which the match belongs.
     */
    constructor (
        public distance: UnsignedNormalizedDistance,
        public entity: HasMatchableAnswers
    ) {}

    /**
     * Convert the distance to a fraction [0, 1], regardless of the value of
     * `NORMALIZED_DISTANCE_EXTENT`. Note that 0 means a bad match and 1 a perfect one.
     */
    get matchFraction(): number {
        return (NORMALIZED_DISTANCE_EXTENT - this.distance) / NORMALIZED_DISTANCE_EXTENT;
    }

    /**
     * Convert to an understandable form, e.g. a percentage string.
     * Override in subclasses.
     */
    toString(): string {
        const constructor =  <typeof Match>this.constructor;
        return `${Math.round(this.matchFraction * constructor.multiplier)}${constructor.unitString}`;
    }
}