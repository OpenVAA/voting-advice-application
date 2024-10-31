import {getEntity, type MaybeWrapped, isEntityWithAnswers, type ExtractEntity} from '../../entity';
import {MISSING_VALUE, type MaybeMissing} from '../../missingValue';
import {ruleIsActive, matchRules, copyRules, type Rules, type Rule} from '../rules';
import {castValue} from './castValue';
import type {FilterOptions} from './filter.type';

/**
 * The abstract base class for all filters.
 */
export abstract class Filter<T extends MaybeWrapped, V> {
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

  constructor(public readonly options: FilterOptions) {}

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
   * @param entity A non-wrapped entity.
   * @returns The value to filter on or `MISSING_VALUE` or an array of these if `this.options.multipleValues` is true.
   */
  getValue(entity: ExtractEntity<T>): MaybeMissing<V> | MaybeMissing<V>[] {
    let value: unknown;
    if (this.options.question) {
      if (!isEntityWithAnswers(entity)) throw new Error('Entity does not have answers.');
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
        : castValue<V>(value, this.options.type, true)
      : value == null
        ? MISSING_VALUE
        : castValue<V>(value, this.options.type);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RESULTS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Apply the filter to the inputs.
   * @input A list of entities.
   * @returns Filtered targets
   */
  apply<U extends T>(targets: U[]) {
    // We perform the testing on the raw entities even if they are wrapped.
    return targets.filter((t) => this.test(getEntity(t)));
  }

  /**
   * Test an entity against the filter.
   * @param entity A non-wrapped entity.
   * @returns true if the entity passes the filter.
   */
  test(entity: ExtractEntity<T>) {
    return this.options.multipleValues
      ? this.testValues(this.getValue(entity) as MaybeMissing<V>[])
      : this.testValue(this.getValue(entity) as MaybeMissing<V>);
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RULES
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * True if the rules differ from the default _rules, i.e. the filter is active.
   */
  get active() {
    return (
      Object.keys(this._rules).length > 0 && Object.values(this._rules).some((r) => ruleIsActive(r))
    );
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
  reset() {
    if (Object.keys(this._rules).length === 0) return;
    this._rules = {};
    this.doOnChange();
  }

  /**
   * Add a rule to the filter.
   * @param name The rule key
   * @param value The rule value
   */
  setRule(name: keyof typeof this._rules, value: Rule) {
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
  onChange(handler: (filter: unknown) => void, add = true) {
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
  protected doOnChange() {
    if (this.suspendOnChange) return;
    this._onChange.forEach((f) => f(this));
  }

  /**
   * Wrap a function call with this to temporarily bypass `onChange` events.
   * @param f The function to call without triggering `onChange`
   */
  withoutOnChange(f: () => void) {
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
  testValue(value: MaybeMissing<V>): boolean {
    throw new Error(`Single values are not supported by this filter: ${value}`);
  }

  /**
   * Test multiple values against this filter. Implement this method in subclasses. This throws by default and will only be called if `this.options.multipleValues` is `true`.
   * @param values An array of possibly missing values
   * @returns true if the value passes the filter.
   */
  testValues(values: MaybeMissing<V>[]): boolean {
    throw new Error(`Multiple values are not supported by this filter: ${values.join(', ')}`);
  }
}
