import { MaybeWrappedEntity } from '@openvaa/core';
import { intersect } from './intersect';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import { Filter } from '../base/filter';

/**
 * The abstract base class for filters with enumerated values that can be listed, such as questions with enumerated choices.
 */
export abstract class EnumeratedFilter<
  TEntity extends MaybeWrappedEntity,
  TValue,
  TObject extends object = object
> extends Filter<TEntity, TValue> {
  protected _rules: {
    exclude?: Array<MaybeMissing<TValue>>;
    include?: Array<MaybeMissing<TValue>>;
  } = {};

  /////////////////////////////////////////////////////////////////////////////////
  // VALUE HANDLING
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Parse all the values from the targets into a map that contains the value counts as well.
   * @input A list of entities.
   * @returns An array of the values, their counts and possible other properties.
   */
  parseValues(targets: Array<TEntity>): Array<ReturnType<typeof this.processValueForDisplay>> {
    const values = new Map<MaybeMissing<TValue>, number>();
    targets.forEach((t) => {
      const valueOrArray = this.getValue(t);
      let valueArray: Array<MaybeMissing<TValue>>;
      if (this.options.multipleValues) {
        if (!Array.isArray(valueOrArray)) throw new Error(`Filter expected multiple values, but got ${valueOrArray}`);
        valueArray = valueOrArray;
      } else {
        valueArray = [valueOrArray];
      }
      valueArray.forEach((v) => {
        const count = values.get(v) ?? 0;
        values.set(v, count + 1);
      });
    });
    return this.sortValues([...values.keys()]).map((v) => this.processValueForDisplay(v, values.get(v) ?? 0));
  }

  /**
   * Sort the values and return them.
   */
  sortValues(values: Array<MaybeMissing<TValue>>): Array<MaybeMissing<TValue>> {
    return values.sort((a, b) => {
      if (a === MISSING_VALUE) {
        if (b === MISSING_VALUE) return 0;
        return 1;
      }
      if (b === MISSING_VALUE) return -1;
      return this.compareValues(a as TValue, b as TValue);
    });
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RULES
  /////////////////////////////////////////////////////////////////////////////////

  get exclude(): Array<MaybeMissing<TValue>> {
    return this._rules.exclude ?? [];
  }

  get include(): Array<MaybeMissing<TValue>> {
    return this._rules.include ?? [];
  }

  set exclude(values: Array<MaybeMissing<TValue>> | undefined) {
    this.setRule('exclude', values);
  }

  set include(values: Array<MaybeMissing<TValue>> | undefined) {
    this.setRule('include', values);
  }

  testValue(value: MaybeMissing<TValue>): boolean {
    if (this.options.multipleValues) throw new Error(`Single values are not supported by this filter: ${value}`);
    if (this._rules.exclude?.includes(value)) return false;
    if (this._rules.include?.length && !this._rules.include.includes(value)) return false;
    return true;
  }

  testValues(values: Array<MaybeMissing<TValue>>): boolean {
    if (!this.options.multipleValues)
      throw new Error(`Multiple values are not supported by this filter: ${values.join(', ')}`);
    const { exclude, include } = this._rules;
    if (exclude?.length && intersect(exclude, values)) return false;
    if (include?.length && !intersect(include, values)) return false;
    return true;
  }

  /////////////////////////////////////////////////////////////////////////////////
  // METHODS TO OVERRIDE
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Compare to values for sorting. Note that missing values are always sorted to the end and handled before this method is called.
   */
  abstract compareValues(a: TValue, b: TValue): number;

  /**
   * Process a value and its count for display.
   * @returns An object containing the value, its count, whether it is missing, and the associated object, e.g. a Choice or a Party.
   */
  abstract processValueForDisplay(
    value: MaybeMissing<TValue>,
    count: number
  ): {
    value: MaybeMissing<TValue>;
    count: number;
    object?: TObject;
  };
}
