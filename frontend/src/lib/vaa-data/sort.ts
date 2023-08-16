/**
 * Simple sorting utilities for DataObjects.
 */

import type {Filterable} from './filter';

export enum SorterValue {
  Asc = 'Asc',
  Desc = 'Desc'
}

export type SorterItem<T> = {
  key: keyof T;
  direction?: SorterValue;
};

export const DEFAULT_SORTER = {
  key: 'order'
} as const;

/**
 * Apply simple ordering on the data.
 *
 * @param items The objects or data to order
 * @param sorters Array of keys with optional directions to sort by
 * @returns Sorted items
 */
export function sortItems<T extends Filterable>(
  items: T[],
  sorters: SorterItem<T>[] = [DEFAULT_SORTER]
): T[] {
  for (const {key, direction} of sorters) {
    items = items.sort((a, b) => {
      // a[key] > b[key] is false also if a[key] is undefined
      const res = b[key] == null || a[key] > b[key] ? 1 : 0;
      return direction != null && direction === SorterValue.Desc ? -res : res;
    });
  }
  return items;
}
