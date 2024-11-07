import type { CanUpdate, UpdateHandler } from '../internal';

/**
 * A base class for `DataRoot` and `DataObject` classes that implements update subsriptions and `onUpdate` event propagation to an object's ancestors.
 */
export abstract class Updatable implements CanUpdate {
  /**
   * We use a private property so that we can provide a getter in `DataObject` that access the value in `DataRoot`.
   */
  protected _debug: boolean | undefined;
  /**
   * The number of pending transactions.
   */
  protected numTransactions = 0;
  /**
   * The handlers invoked by `onUpdate`.
   */
  subscriptions = new Array<UpdateHandler<typeof this>>();

  /**
   * Set to true to show debug messages in the console.
   */
  get debug(): boolean | undefined {
    return this._debug;
  }

  /**
   * Set to true to show debug messages in the console.
   */
  set debug(value: boolean | undefined) {
    this._debug = value;
  }

  /**
   * Subscribe to the `onUpdate` event.
   * @param handler - The event handler, which is passed the updated object.
   * @returns An unsubscribe function.
   */
  subscribe(handler: UpdateHandler<typeof this>): () => number {
    this.subscriptions.push(handler);
    return () => this.unsubscribe(handler);
  }

  /**
   * Unsubscribe the specified `UpdateHandler`.
   * @param handler - The event handler to unsubscribe.
   * @returns The number of remaining subscriptions after unsubscribing.
   */
  unsubscribe(handler: UpdateHandler<typeof this>): number {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
    return this.subscriptions.length;
  }

  /**
   * Wrap any transactions that should trigger a reactive update of this object in this method. It will trigger the `onUpdate` method at the end of the transaction, including any nested ones.
   * @param transaction - The function to perform.
   */
  update(transaction: () => void): void {
    this.numTransactions++;
    this.log(`update(): starting transaction ${this.numTransactions}`);
    try {
      transaction();
      this.log(`update(): finished transaction ${this.numTransactions}`);
      this.numTransactions--;
      if (this.numTransactions === 0) this.onUpdate();
    } catch (e) {
      // Don't wait for the transaction if it failed, nor trigger an update
      this.log(`update(): [warning] failed transaction ${this.numTransactions}`, e);
      this.numTransactions--;
      throw e;
    }
  }

  /**
   * Call to explicitly trigger the subscribed `UpdateHandler`s with this object. In most cases, it's best to use `update(transaction)` instead.
   */
  onUpdate(): void {
    this.log('onUpdate()');
    this.subscriptions.forEach((handler) => handler(this));
  }

  /**
   * Show a debug message and optional other data if the `debug` flag is set.
   * @param message - The debug message to show.
   * @param rest - Any other objects to print in the console.
   */
  protected log(message: string, ...rest: Array<unknown>): void {
    if (this.debug && typeof console !== 'undefined' && typeof console.info === 'function')
      console.info(`[@openvaa/data/debug] ${this.constructor.name}: ${message}`, ...rest);
  }
}
