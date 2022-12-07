import { NORMALIZED_DISTANCE_EXTENT, HasMatchableAnswers, UnsignedNormalizedDistance } from "..";

/**
 * The base class for a matching result
 */
export class Match {
    protected static multiplier = 100;
    protected static unitString = "%"; // "&#8201;%";

    constructor (
        public distance: UnsignedNormalizedDistance,
        public entity: HasMatchableAnswers
    ) {}

    get matchFraction(): number {
        return (NORMALIZED_DISTANCE_EXTENT - this.distance) / NORMALIZED_DISTANCE_EXTENT;
    }

    /**
     * Convert to an understandable form.
     */
    toString(): string {
        const constructor =  <typeof Match>this.constructor;
        return `${Math.round(this.matchFraction * constructor.multiplier)}${constructor.unitString}`;
    }
}