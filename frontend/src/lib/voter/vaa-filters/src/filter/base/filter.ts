import {getEntity, type MaybeWrapped, hasAnswers, type ExtractEntity} from '../../entity';
import {MISSING_VALUE, type MaybeMissing} from '../../missingValue';
import {ruleIsActive, matchRules, copyRules, type Rules, type Rule} from '../rules';
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

  constructor(public readonly options: FilterOptions) {}

  /////////////////////////////////////////////////////////////////////////////////
  // VALUE HANDLING
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Ge the value from an entity.
   * @param entity A non-wrapped entity.
   * @returns The value to filter on or `MISSING_VALUE`
   */
  getValue(entity: ExtractEntity<T>): MaybeMissing<V> {
    let value: unknown;
    if ('question' in this.options) {
      if (!hasAnswers(entity)) throw new Error('Entity does not have answers.');
      value = entity.getAnswerValue(this.options.question);
    } else if ('property' in this.options) {
      value = entity[this.options.property as keyof typeof entity];
      if (this.options.subProperty && typeof value === 'object' && value !== null)
        value = value[this.options.subProperty as keyof typeof value];
    } else {
      throw new Error('No value could be gotten with the filter.');
    }
    return value == null ? MISSING_VALUE : this.castValue(value);
  }

  /**
   * Cast a non-missing value to the correct data type.
   */
  castValue(value: unknown): V {
    switch (this.options.type) {
      case 'string':
        return `${value}` as V;
      case 'number':
        return Number(value) as V;
      case 'boolean':
        return Boolean(value) as V;
      default:
        throw new Error(`Unsupported value type: ${this.options['type']}`);
    }
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RESULTS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Apply the filter to the inputs.
   * @input A list of entities.
   * @returns Filtered targets
   */
  apply(targets: T[]) {
    // We perform the testing on the raw entities even if they are wrapped.
    return targets.filter((t) => this.test(getEntity(t)));
  }

  /**
   * Test an entity against the filter.
   * @param entity A non-wrapped entity.
   * @returns true if the entity passes the filter.
   */
  test(entity: ExtractEntity<T>) {
    return this.testValue(this.getValue(entity));
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
    this._onChange.forEach((f) => f(this));
  }

  /////////////////////////////////////////////////////////////////////////////////
  // METHODS TO OVERRIDE
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Test one value against this filter. Implement this method in subclasses.
   * @param value A possibly missing value
   * @returns true if the value passes the filter.
   */
  abstract testValue(value: MaybeMissing<V>): boolean;
}
