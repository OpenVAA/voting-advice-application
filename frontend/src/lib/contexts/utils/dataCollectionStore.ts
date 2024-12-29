import { type Readable, readable } from 'svelte/store';
import type { Id } from '@openvaa/core';
import type { DataObject } from '@openvaa/data';

/**
 * Creates a derived store that holds an array of `DataObject`s whose `Id`s are returned by `idStore`.
 * @param idStore - A store holding the `Id`s of the `DataObject`s.
 * @param getter - A function that returns the `DataObject` for a given `Id`.
 * @returns A readable store.
 */
export function dataCollectionStore<TObject extends DataObject>(
  idStore: Readable<Array<Id> | undefined>,
  getter: (id: Id) => TObject | undefined
): Readable<Array<TObject>> {
  return readable<Array<TObject>>([], (set, update) => {
    // The unsubscribe functions for the DataObjects
    const objectUnsubscribers = new Array<() => unknown>();
    // The unsubscribe function for the idStore
    const unsubscribe = idStore.subscribe((ids) => {
      const objects = ids?.map((id) => getter(id)).filter((o) => o != null) ?? [];
      // Unsubscribe updates to this store from the previous DataObject, if any
      while (true) {
        const unsubscribe = objectUnsubscribers.pop();
        if (!unsubscribe) break;
        unsubscribe();
      }
      // Subscribe this store to updates to any of the DataObjects
      objectUnsubscribers.push(
        ...objects.map((o) =>
          o.subscribe(() => {
            update((v) => v);
          })
        )
      );
      set(objects);
    });
    return unsubscribe;
  });
}
