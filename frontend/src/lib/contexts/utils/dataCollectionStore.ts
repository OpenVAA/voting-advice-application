import { removeDuplicates } from '$lib/utils/removeDuplicates';
import { parsimoniusDerived } from './parsimoniusDerived';
import type { Id } from '@openvaa/core';
import type { DataObject, DataRoot } from '@openvaa/data';
import type { Readable } from 'svelte/store';

/**
 * Creates a derived store that holds an array of `DataObject`s whose `Id`s are returned by `idStore`.
 * @param dataRoot - A store holding the `DataRoot`.
 * @param idStore - A store holding the `Id`s of the `DataObject`s.
 * @param getter - A function that returns the `DataObject` for a given `Id`.
 * @param noDuplicates - If `true`, removes duplicates. Default is `false`.
 * @returns A readable store.
 */
export function dataCollectionStore<TObject extends DataObject>({
  dataRoot,
  idStore,
  getter,
  noDuplicates = false
}: {
  dataRoot: Readable<DataRoot>;
  idStore: Readable<Array<Id> | undefined>;
  getter: (id: Id, dataRoot: DataRoot) => TObject | undefined;
  noDuplicates?: boolean;
}): Readable<Array<TObject>> {
  return parsimoniusDerived([dataRoot, idStore], ([dataRoot, idStore]) => {
    if (!idStore) return [];
    const objects = idStore.map((id) => getter(id, dataRoot)).filter((o) => o != null);
    return noDuplicates ? removeDuplicates(objects) : objects;
  });
}
