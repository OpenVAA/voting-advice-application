import type {CanUpdate, MaybeCollection, UpdateHandler} from './internal';

/**
 * A base class for `DataRoot` and `DataObject` classes that implements update subsriptions and `onUpdate` event propagation to an object's ancestors.
 */
export abstract class Updatable implements CanUpdate {
  /**
   * All child collections of the object should be placed here. Be sure to provide getters for the collections that return copies of the original collections.
   */
  protected children: Record<string, MaybeCollection> = {};
  protected numTransactions = 0;
  protected subscriptions = new Array<UpdateHandler<typeof this>>();

  constructor(readonly parent: CanUpdate | null) {}

  subscribe(handler: UpdateHandler<typeof this>): () => number {
    this.subscriptions.push(handler);
    return () => this.unsubscribe(handler);
  }

  unsubscribe(handler: UpdateHandler<typeof this>): number {
    this.subscriptions = this.subscriptions.filter((h) => h !== handler);
    return this.subscriptions.length;
  }

  /**
   * Wrap any transactions that should trigger a reactive update of this object in this method. It will trigger the `onUpdate` method at the end of the transaction, including any nested ones.
   * @param transaction The function to perform.
   * @param propagate Whether to propagate the update to the ancestors of this object. Defaults to `false`.
   */
  update(transaction: () => void, propagate = false): void {
    this.numTransactions++;
    console.info(
      `[debug] ${this.constructor.name}.update(): Starting transaction ${this.numTransactions}`
    );
    try {
      transaction();
      console.info(
        `[debug] ${this.constructor.name}.update(): Finished transaction ${this.numTransactions}`
      );
      this.numTransactions--;
      if (this.numTransactions === 0) this.onUpdate(propagate);
    } catch (e) {
      // Don't wait for the transaction if it failed, nor trigger an update
      console.info(
        `[debug] ${this.constructor.name}.update(): FAILED transaction ${this.numTransactions}`,
        e
      );
      this.numTransactions--;
    }
  }

  onUpdate(propagate: boolean): void {
    console.info(`[debug] ${this.constructor.name}.onUpdate()`);
    this.subscriptions.forEach((handler) => handler(this));
    if (propagate) this.parent?.onUpdate(true);
  }

  /**
   * Reset this object. This should be called when the data provided to this object is no longer valid, e.g., when the root locale is changed.
   */
  reset(): void {
    console.info(`[debug] ${this.constructor.name}.reset()`);
    this.update(() => {
      // TODO: Figure out if we need this
      // // Reset descendants
      // Object.values(this.children)
      //   .filter((coll) => coll)
      //   .forEach((coll) => (coll instanceof Map ? [...coll.values()] : coll!)
      //     .filter((o) => o instanceof Updatable)
      //     .forEach((o) => o.reset())
      //   );
      this.children = {};
    });
  }
}
