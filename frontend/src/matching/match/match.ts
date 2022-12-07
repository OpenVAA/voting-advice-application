import { HasMatchableAnswers, UnsignedNormalizedDistance } from "..";

/**
 * The base class for a matching result
 */
export class Match {
    public multiplier = 100;
    public unitString = "&#8201;%";

    constructor (
        public distance: UnsignedNormalizedDistance,
        public entity: HasMatchableAnswers
    ) {}

    /**
     * Convert to an understandable form.
     */
    toString(): string {
        return `${Math.round(this.distance * this.multiplier)}${this.unitString}`;
    }
}