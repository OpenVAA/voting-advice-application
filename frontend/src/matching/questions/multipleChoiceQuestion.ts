import { MISSING_VALUE, NORMALIZED_DISTANCE_EXTENT,
    MatchableQuestion, MatchableValue, NonmissingValue, SignedNormalizedCoordinate } from "..";

/**
 * A value option in a matchable multiple choice question
 */
 export interface MultipleChoiceOption {
    value: NonmissingValue;
}

/**
 * Consructor options for MultipleChoiceQuestion
 */
export interface MultipleChoiceQuestionOptions {
    values: readonly MultipleChoiceOption[];
}

/**
 * A class for multiple choice questions, including Likert-scale ones
 */
export class MultipleChoiceQuestion extends MatchableQuestion {
    public readonly values: readonly MultipleChoiceOption[];

    // TODO: We might want to remove this for easier multi-class inheritance
    constructor(
        {values}: MultipleChoiceQuestionOptions
    ) {
        super();
        this.values = values;
    }

    get neutralValue(): NonmissingValue {
        return this.minValue + this.valueRange / 2;
    }

    get maxValue(): NonmissingValue {
        return this.values[this.values.length - 1].value;
    }

    get minValue(): NonmissingValue {
        return this.values[0].value;
    }

    get valueRange(): number {
        return this.maxValue - this.minValue;
    }

    /**
     * Used to convert a question's values into normalized distances for used
     * in matching.
     * @param value A question's native value
     * @returns The value in the signed normalized range (e.g. [-.5, .5])
     */
    normalizeValue(value: MatchableValue): SignedNormalizedCoordinate {
        if (value === MISSING_VALUE) 
            return value;
        return NORMALIZED_DISTANCE_EXTENT * ((value - this.minValue) / this.valueRange - 0.5);
    }

    /**
     * Utitility for creating Likert scale questions.
     * @param scale The number of options for the Likert scale
     * @returns A MultipleChoiceQuestion object
     */
    static fromLikertScale(scale: number): MultipleChoiceQuestion {
        const values: MultipleChoiceOption[] = Array.from({length: scale}, (_, i) => ({value: i + 1}));
        return new MultipleChoiceQuestion({values});
    }
}
