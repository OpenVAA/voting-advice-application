import type { DataObjectData } from '../internal';

/**
 * Sort `DataObject`s in ascending order based on the `order` property, defualting to `Infinity`. Can be passed to `Array.prototype.sort()`.
 */
export function order<TData extends DataObjectData>(a: TData, b: TData): number {
  return (a.order ?? Infinity) - (b.order ?? Infinity);
}
