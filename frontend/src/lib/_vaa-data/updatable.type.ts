/**
 * Defines the minimum requirements for objects that can propagage `onUpdate` calls to their parents.
 */
export interface CanUpdate {
  onUpdate: (propagate: boolean) => void;
  parent: CanUpdate | null;
}

export type UpdateHandler<TObject extends CanUpdate> = (object: TObject) => void;
