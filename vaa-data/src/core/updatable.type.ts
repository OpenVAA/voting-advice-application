/**
 * Defines the minimum requirements for objects that can propagage `onUpdate` calls to their parents.
 */
export interface CanUpdate {
  onUpdate: (propagate: boolean) => void;
}

/**
 * An update handler function for `Updatabale.onUpdate` events. It is passed the updated object.
 */
export type UpdateHandler<TObject extends CanUpdate> = (object: TObject) => void;
