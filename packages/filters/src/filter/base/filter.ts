import { getEntity, hasAnswers, type MaybeWrappedEntity } from '@openvaa/core';
import { castValue } from './castValue';
import { type MaybeMissing, MISSING_VALUE } from '../../missingValue';
import { copyRules, matchRules, type Rule, ruleIsActive, type Rules } from '../rules';
import type { FilterOptions } from './filter.type';

/**
 * The abstract base class for all filters.
 */
export abstract class Filter<TTarget extends MaybeWrappedEntity, TValue> {
  /**
   * All rules related to this filter should be stored here.
   */
  protected _rules: Rules = {};
  /**
   * A list of event handlers that is called when the filter's results change. To use the changed results, access `filter.results`.
   */
  private _onChange: Set<(filter: unknown) => void> = new Set();
  /**
   * Used to supress `onChange` events temporarily.
   */
  protected suspendOnChange = false;

  constructor(public readonly options: FilterOptions<TTarget>) {}

  /////////////////////////////////////////////////////////////////////////////////
  // NAME
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Get the optional name for use when displaying the filter. Has no effect on it's functionality.
   */
  get name(): string {
    return this.options.name ?? '';
  }

  /**
   * Set the optional name for use when displaying the filter. Has no effect on it's functionality.
   */
  set name(value: string | undefined) {
    this.options.name = value;
  }

  /////////////////////////////////////////////////////////////////////////////////
  // VALUE HANDLING
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Ge the value from an entity.
   * @param target The target entity.
   * @returns The value to filter on or `MISSING_VALUE` or an array of these if `this.options.multipleValues` is true.
   */
  getValue(target: TTarget): MaybeMissing<TValue> | Array<MaybeMissing<TValue>> {
    const entity = (this.options.entityGetter ?? getEntity)(target);
    let value: unknown;
    if (this.options.question) {
      if (!hasAnswers(entity)) throw new Error('Entity does not have answers.');
      value = entity.answers[this.options.question.id]?.value;
    } else if (this.options.property != null) {
      value = entity[this.options.property as keyof typeof entity];
      if (this.options.subProperty && typeof value === 'object' && value !== null)
        value = value[this.options.subProperty as keyof typeof value];
    } else {
      throw new Error('No value could be gotten with the filter.');
    }
    return this.options.multipleValues
      ? value == null
        ? [MISSING_VALUE]
        : castValue<TValue>(value, this.options.type, true)
      : value == null
        ? MISSING_VALUE
        : castValue<TValue>(value, this.options.type);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RESULTS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Apply the filter to the inputs.
   * @param targets A list of entities.
   * @returns Filtered targets
   */
  apply<TType extends TTarget>(targets: Array<TType>): Array<TTarget> {
    return targets.filter((t) => this.test(t));
  }

  /**
   * Test an entity against the filter.
   * @param target The target entity.
   * @returns true if the entity passes the filter.
   */
  test(target: TTarget): boolean {
    return this.options.multipleValues
      ? this.testValues(this.getValue(target) as Array<MaybeMissing<TValue>>)
      : this.testValue(this.getValue(target) as MaybeMissing<TValue>);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RULES
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * True if the rules differ from the default _rules, i.e. the filter is active.
   */
  get active(): boolean {
    return Object.keys(this._rules).length > 0 && Object.values(this._rules).some((r) => ruleIsActive(r));
  }

  /**
   * Get a copy of the current rules.
   */
  get rules(): unknown {
    return copyRules(this._rules);
  }

  /**
   * Reset all rules
   */
  reset(): void {
    if (Object.keys(this._rules).length === 0) return;
    this._rules = {};
    this.doOnChange();
  }

  /**
   * Add a rule to the filter.
   * @param name The rule key
   * @param value The rule value
   */
  setRule(name: keyof typeof this._rules, value: Rule): void {
    // If there's no change, don't trigger an update
    const current = this._rules[name];
    if (matchRules(current, value)) return;
    this._rules[name] = value;
    this.doOnChange();
  }

  /////////////////////////////////////////////////////////////////////////////////
  // EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Add or remove an event handlers that is called when the filter's results change. To use the changed results, access `filter.results`.
   * @param handler The event handler
   * @add Add the event handler if true, remove it otherwise
   */
  onChange(handler: (filter: unknown) => void, add = true): void {
    if (add) {
      this._onChange.add(handler);
    } else {
      this._onChange.delete(handler);
    }
  }

  /**
   * This method is called each time the filter's rules and thus results change.
   * NB. The results will only be recalculated when they are fetched or `apply()` is called.
   */
  protected doOnChange(): void {
    if (this.suspendOnChange) return;
    this._onChange.forEach((f) => f(this));
  }

  /**
   * Wrap a function call with this to temporarily bypass `onChange` events.
   * @param f The function to call without triggering `onChange`
   */
  withoutOnChange(f: () => void): void {
    this.suspendOnChange = true;
    f();
    this.suspendOnChange = false;
  }

  /////////////////////////////////////////////////////////////////////////////////
  // METHODS TO OVERRIDE
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Test one value against this filter. Implement this method in subclasses. This throws by default and will only be called if `this.options.multipleValues` is `false`.
   * @param value A possibly missing value
   * @returns true if the value passes the filter.
   */
  testValue(value: MaybeMissing<TValue>): boolean {
    throw new Error(`Single values are not supported by this filter: ${value}`);
  }

  /**
   * Test multiple values against this filter. Implement this method in subclasses. This throws by default and will only be called if `this.options.multipleValues` is `true`.
   * @param values An array of possibly missing values
   * @returns true if the value passes the filter.
   */
  testValues(values: Array<MaybeMissing<TValue>>): boolean {
    throw new Error(`Multiple values are not supported by this filter: ${values.join(', ')}`);
  }
}
