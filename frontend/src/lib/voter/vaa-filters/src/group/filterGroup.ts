import type {MaybeWrapped} from '../entity';
import type {Filter} from '../filter';
import {LogicOp, combineResults} from './combineResults';

/**
 * Use to combine a group of filters and subscribe to changes in their combined results using the `onChange` callback.
 */
export class FilterGroup<T extends MaybeWrapped> {
  /**
   * A list of event handlers that is called when the filter's results change. To use the changed results, access `filter.results`.
   */
  private _onChange: Set<(filter: typeof this) => void> = new Set();
  /**
   * The logic operator used to combine the results.
   */
  private _logicOp: LogicOp;

  constructor(
    /**
     * The already initialised filters to combine.
     */
    public filters: Filter<T, unknown>[],
    /**
     * And or Or logic operator to use in combination. @default LogicOp.And
     */
    logicOperator: LogicOp = LogicOp.And
  ) {
    this._logicOp = logicOperator;
    filters.forEach((f) => f.onChange(() => this.doOnChange()));
  }

  /////////////////////////////////////////////////////////////////////////////////
  // RESULTS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Apply the filters to the inputs.
   * @input A list of entities.
   * @returns Filtered targets
   */
  apply(targets: T[]) {
    return combineResults(
      this.filters.map((f) => f.apply(targets)),
      this._logicOp
    );
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
    this.filters.forEach((f) => f.reset());
    this.logicOperator = LogicOp.And;
  }

  /////////////////////////////////////////////////////////////////////////////////
  // EVENT HANDLERS
  /////////////////////////////////////////////////////////////////////////////////

  /**
   * Called when any of the filters' results change. Note that we only combine results when they are accessed.
   */
  doOnChange() {
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
}
