import { MaybeWrappedEntity } from '@openvaa/core';
import { combineResults, LOGIC_OP, type LogicOp } from './combineResults';
import type { Filter } from '../filter';

/**
 * Use to combine a group of filters and subscribe to changes in their combined results using the `onChange` callback.
 */
export class FilterGroup<TEntity extends MaybeWrappedEntity> {
  /**
   * The logic operator used to combine the results.
   */
  private _logicOp: LogicOp;
  /**
   * A list of event handlers that is called when the filter's results change. To use the changed results, access `filter.results`.
   */
  private _onChange: Set<(filter: typeof this) => void> = new Set();
  /**
   * Set temporarily to `true` when updating multiple filters to prevent multiple `onChange` callbacks
   */
  protected suspendOnChange = false;

  constructor(
    /**
     * The already initialised filters to combine.
     */
    public filters: Array<Filter<TEntity, unknown>>,
    /**
     * And or Or logic operator to use in combination. @default LogicOp.And
     */
    logicOperator: LogicOp = LOGIC_OP.And
  ) {
    this._logicOp = logicOperator;
    filters.forEach((f) => f.onChange(() => this.doOnChange()));
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RESULTS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Apply the filters to the inputs. If the group has no active filters (or any filters at all), returns the original list.
   * @input A list of entities.
   * @returns Filtered targets
   */
  apply<TTarget extends TEntity>(targets: Array<TTarget>) {
    if (!this.active) return targets;
    return combineResults(
      this.filters.map((f) => f.apply(targets)),
      this._logicOp
    ) as Array<TTarget>;
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RULES
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * True if any of the filters is active.
   */
  get active() {
    return this.filters.some((f) => f.active);
  }

  /**
   * Get the logic operator.
   */
  get logicOperator() {
    return this._logicOp;
  }

  /**
   * Get the logic operator.
   */
  set logicOperator(value: LogicOp) {
    const oldValue = this._logicOp;
    this._logicOp = value;
    if (oldValue !== value) this.doOnChange();
  }

  /**
   * Reset all filters
   */
  reset() {
    this.withoutOnChange(() => {
      this.filters.forEach((f) => f.reset());
      this.logicOperator = LOGIC_OP.And;
    });
    this.doOnChange();
  }

  /////////////////////////////////////////////////////////////////////////////////
  // EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Called when any of the filters' results change.
   */
  doOnChange() {
    if (this.suspendOnChange) return;
    this._onChange.forEach((f) => f(this));
  }

  /**
   * Add or remove an event handlers that is called when the results change. To use the changed results, access `filterGroup.results`.
   * @param handler The event handler
   * @add Add the event handler if true, remove it otherwise
   */
  onChange(handler: (filterGroup: typeof this) => void, add = true) {
    if (add) {
      this._onChange.add(handler);
    } else {
      this._onChange.delete(handler);
    }
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
}
