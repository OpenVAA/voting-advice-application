import { getEntity, MaybeWrappedEntity } from '@openvaa/core';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import { Filter, type FilterOptionsBase, type PropertyFilterOptions, type QuestionFilterOptions } from '../base';

/**
 * A base class for numeric filters.
 * NB. This could be refactored to inherit from a common parent of this and EnumeratedFilter and allow value counts.
 */
export abstract class NumericFilter<TTarget extends MaybeWrappedEntity> extends Filter<TTarget, number> {
  protected _rules: {
    min?: number;
    max?: number;
    excludeMissing?: boolean;
  } = {};

  /**
   * Create a numeric filter.
   * @param options The filter options
   */
  constructor(
    options: Omit<FilterOptionsBase, 'type' | 'multipleValues'> & (PropertyFilterOptions | QuestionFilterOptions)
  ) {
    super({ ...options, type: 'number', multipleValues: false });
  }

  /**
   * Parse all the values from the targets to find min and max values.
   */

  /**
   * Parse all the values from the targets to find min and max values.
   * @input A list of entities.
   * @returns The min and max values.
   */
  parseValues(targets: Array<TTarget>):
    | {
        min: number;
        max: number;
      }
    | undefined {
    const values = targets
      .map((t) => this.getValue(getEntity(t)))
      .filter((v) => typeof v === 'number') as Array<number>;
    return values.length
      ? {
          min: Math.min(...values),
          max: Math.max(...values)
        }
      : undefined;
  }

  get min(): number | undefined {
    return this._rules.min;
  }

  get max(): number | undefined {
    return this._rules.max;
  }

  /**
   * Set the minimum value for the filter.
   */
  set min(value: number | undefined) {
    this.setRule('min', value);
  }

  /**
   * Set the maximum value for the filter.
   */
  set max(value: number | undefined) {
    this.setRule('max', value);
  }

  /**
   * Set whether missing values are exluded.
   */
  excludeMissing(value?: boolean): void {
    this.setRule('excludeMissing', value);
  }

  testValue(value: MaybeMissing<number>): boolean {
    if (value === MISSING_VALUE) return !this._rules.excludeMissing;
    if (this._rules.min != null && (value as number) < this._rules.min) return false;
    if (this._rules.max != null && (value as number) > this._rules.max) return false;
    return true;
  }
}
