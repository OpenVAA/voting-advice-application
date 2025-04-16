/**
 * Represents a condensed argument extracted from an array of comments.
 * @interface Argument
 */
export interface Argument {
  /** The condensed argument */
  argument: string;

  /** The topic this argument relates to */
  topic: string;
}
