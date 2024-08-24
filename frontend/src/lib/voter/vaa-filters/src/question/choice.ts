import type {FilterOptions} from '../filter';

// TODO: Update these when vaa-data module questions are adopted

/**
 * The property name of a multiple choice key.
 */
export const KEY_PROP = 'key';

/**
 * The type of the multiple choice key property.
 */
export const KEY_TYPE: FilterOptions['type'] = 'number';

/**
 * The property name of a multiple choice label.
 */
export const LABEL_PROP = 'label';

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
