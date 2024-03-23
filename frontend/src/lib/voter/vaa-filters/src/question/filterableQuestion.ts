import type {Choice} from './choice';

/**
 * Any filterable question.
 */
export interface FilterableQuestion {
  readonly type: keyof FilterableValue;
}

/**
 * The answer values of filterable questions.
 */
export interface FilterableValue {
  text: string;
  number: number;
  singleChoiceOrdinal: Choice['key'];
  singleChoiceCategorical: Choice['key'];
}

/**
 * A question whose answers are string values.
 */
export interface TextQuestion {
  type: 'text';
}

/**
 * A question whose answers are number values.
 */
export interface NumericQuestion {
  type: 'number';
}

/**
 * A question whose answers are choices with a key and a label.
 */
export interface SingleChoiceQuestion {
  type: 'singleChoiceOrdinal' | 'singleChoiceCategorical';
  values: Choice[];
}
