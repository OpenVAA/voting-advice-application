import type {DataObject, Id} from '$lib/_vaa-data';
import {type Readable, readable} from 'svelte/store';

export function createDataObjectStore<TObject extends DataObject>(
  idStore: Readable<Id | undefined>,
  getter: (id: Id) => TObject | undefined
): Readable<TObject | undefined> {
  return readable<TObject | undefined>(undefined, (set) => {
    // The unsubscribe function for the DataObject itself
    let objectUnsubscribe: (() => unknown) | undefined = undefined;
    // The unsubscribe function for the idStore
    const unsubscribe = idStore.subscribe((id) => {
      console.info(`[debug] dataObjectStore: store update due to id change: ${id}.`);
      const newObject: TObject | undefined = id != null ? getter(id) : undefined;
      // Unsubscribe updates to this store from the previous DataObject, if any
      objectUnsubscribe?.();
      // Subscribe to updates to the new DataObject
      if (newObject)
        objectUnsubscribe = newObject.subscribe((o) => {
          console.info(
            `[debug] dataObjectStore: store update due to object change: ${newObject.constructor.name}.`
          );
          set(o);
        });
      set(newObject);
    });
    return unsubscribe;
  });
}
