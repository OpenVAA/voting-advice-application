import { MaybeWrappedEntity } from '@openvaa/core';
import { isMissing, type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import { Filter, type FilterOptionsBase, type PropertyFilterOptions, type QuestionFilterOptions } from '../base';

/**
 * A base class for number filters.
 * NB. This could be refactored to inherit from a common parent of this and EnumeratedFilter and allow value counts.
 */
export abstract class NumberFilter<TTarget extends MaybeWrappedEntity> extends Filter<TTarget, number> {
  protected _rules: {
    min?: number;
    max?: number;
    excludeMissing?: boolean;
  } = {};

  /**
   * Create a number filter.
   * @param options The filter options
   */
  constructor(
    options: Omit<FilterOptionsBase<TTarget>, 'type' | 'multipleValues'> &
      (PropertyFilterOptions | QuestionFilterOptions)
  ) {
    super({ ...options, type: 'number', multipleValues: false });
  }

  /**
   * Parse all the values from the targets to find min and max values.
   */

  /**
   * Parse all the values from the targets to find min and max values.
   * @input A list of entities.
   * @returns The possible min and max values as well as the number of missing values.
   */
  parseValues(targets: Array<TTarget>): {
    min?: number;
    max?: number;
    missingValues: number;
  } {
    const allValues = targets.map((t) => this.getValue(t));
    const values = allValues.filter((v) => !isMissing(v));
    const missingValues = allValues.filter((v) => isMissing(v)).length;
    return {
      min: values.length ? Math.min(...values) : undefined,
      max: values.length ? Math.max(...values) : undefined,
      missingValues
    };
  }

  get exludeMissing(): boolean {
    return !!this._rules.excludeMissing;
  }

  get min(): number | undefined {
    return this._rules.min;
  }

  get max(): number | undefined {
    return this._rules.max;
  }

  /**
   * Set whether missing values are exluded.
   */
  set excludeMissing(value: boolean | undefined) {
    this.setRule('excludeMissing', value);
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

  testValue(value: MaybeMissing<number>): boolean {
    if (value === MISSING_VALUE) return !this._rules.excludeMissing;
    if (this._rules.min != null && (value as number) < this._rules.min) return false;
    if (this._rules.max != null && (value as number) > this._rules.max) return false;
    return true;
  }
}
