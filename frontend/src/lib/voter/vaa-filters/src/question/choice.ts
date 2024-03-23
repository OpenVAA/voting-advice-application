/**
 * The names and types of a Choice object's properties.
 */

export const KEY_PROP = 'key';
export const LABEL_PROP = 'label';
export const KEY_TYPE = 'number';
/**
 * A choice in a single or multiple choice question.
 */

export interface Choice {
  /**
   * This must match `KEY_TYPE`
   */
  [KEY_PROP]: number;
  [LABEL_PROP]: string;
}
