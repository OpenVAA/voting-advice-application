/**
 * Represents a condensed argument extracted from source comments.
 * @interface Argument
 */
export interface Argument {
    /** The condensed argument text */
    argument: string;
    /** Original comments that were used to form this argument */
    sourceComments: string[];
    /** Indices of the source comments in the original comment array */
    sourceIndices: number[];
    /** The topic this argument relates to */
    topic: string;
}
