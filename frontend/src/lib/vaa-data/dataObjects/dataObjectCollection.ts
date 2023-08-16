/*
 * Container for arrays of NamedDataObjects with some utility methods.
 */

import type {HasId, Id} from '../data.types';
import {filterItems, type QueryFilter} from '../filter';
import {sortItems} from '../sort';
import type {DataObject} from './dataObject';

/**
 * For convenience we can pass a regular filter predicate to
 * DataObjectList.filter
 */
export type FilterFunc = Parameters<typeof Array.prototype.filter>;

/**
 * A tuple of an object's property and an array of such objects.
 * Used for grouping items such as QuestionCategories by their
 * relevant Election.
 */
export type PropertyAndArrayTuple<K extends keyof T, T> = [T[K], T[]];

/**
 * Class for lists of NamedDataObjects with some utility methods.
 */
export class DataObjectCollection<T extends DataObject> {
  // It's a bit of a hack that we use a different kind of store than in
  // the base class, but we want more convenient access to id'd items
  protected _items: Record<Id, T> = {};
  protected _loaded = false;

  constructor(items: T[]) {
    this._items = Object.fromEntries(this.setItemsCallback(items).map((item) => [item.id, item]));
    if (items.length > 0) {
      this._loaded = true;
    }
  }

  get items() {
    return Object.values(this._items);
  }

  /**
   * Get the items sorted by a default sorter: see sortItems
   */
  get sorted() {
    return sortItems(this.items);
  }

  /**
   * Override this method in subclasses to do something to the items
   * when the list is set.
   * @param items Items that are passed to set items
   * @returns The items to be stored in _items
   */
  protected setItemsCallback(items: T[]): T[] {
    return items;
  }

  get length() {
    return this.items.length;
  }

  get nonEmpty() {
    return this.items.length > 0;
  }

  /**
   * Whether this has been extended or initialized with a non-empty list of
   * items. The collection may be empty even if it is loaded.
   */
  get loaded() {
    return this._loaded;
  }

  /**
   * Utility for getting the items as an id dict.
   * @returns The items as a dictionary keyed by their id
   *
   * TO DO: Check if we should return a copy
   */
  get asDict(): Record<Id, T> {
    return this._items;
  }

  /**
   * Get the ids of the items on the list.
   */
  get ids() {
    return Object.keys(this._items);
  }

  /**
   * Utility for getting a single DataObject by its id.
   * @param id The id of the DataObject to get
   * @returns The DataObject or undefined if not found
   */
  byId(id: Id): T | undefined {
    return this._items[id];
  }

  /**
   * Filter the DataObjects in the list.
   * @param filter Optional filter or filter function
   * @returns The contained DataObjects as an array
   */
  filter(filter?: QueryFilter | FilterFunc) {
    return filter
      ? Array.isArray(filter)
        ? this.items.filter(...filter)
        : filterItems(this.items, filter)
      : this.items;
  }

  /**
   * Filter the DataObjects in the list and return as a new list object.
   * @param filter Optional filter for items
   * @returns The contained DataObjects as a new DataObjectCollection
   */
  filterAsList(filter?: QueryFilter | FilterFunc) {
    return filter ? new DataObjectCollection<T>(this.filter(filter)) : this;
  }

  /**
   * Map over the contained DataObjects and create a new DataObjectList.
   * @param func The function to apply to each value
   * @returns A new DataObjectList with values mapped by the function
   */
  mapAsList<U extends DataObject & HasId>(func: (t: T) => U | U[]) {
    return new DataObjectCollection(this.items.map((t) => func(t)).flat());
  }

  /**
   * Add items to the list. NB. We override this to make it more
   * efficient.
   * @param items The items to add
   * @returns The DataObjectCollection for convenience
   */
  extend(items: T[]) {
    this.extendCallback(items).forEach((item) => (this._items[item.id] = item));
    this._loaded = true;
    return this;
  }

  /**
   * Override this method in subclasses to add checks when extending
   * the _items array. By default we disallow overwriting existing items.
   * @param items Items passed to extend
   * @returns Items that were not filtered out
   */
  protected extendCallback(items: T[]): T[] {
    return items.filter((item) => !(item.id in this._items));
  }

  /**
   * Outputs the items in the list in groups separated by prop. Note
   * that duplicates will be returned if some items have an array in
   * prop.
   * @param prop The property to group by.
   * @param allowDuplicates Whether to allow duplicate items. If they
   * are disallowed, each item will only be listed in the group
   * corresponding to the value of prop in it.
   * @returns An array of tuples with the object specified by prop
   * and the relevant items.
   */
  groupedBy<K extends keyof T>(
    prop: K,
    allowDuplicates = true,
    filter?: QueryFilter
  ): PropertyAndArrayTuple<K, T>[] {
    const groups: Map<T[K], T[]> = new Map();
    for (const item of this.filter(filter)) {
      const key = item[prop];
      for (const subKey of Array.isArray(key) ? key : [key]) {
        if (groups.has(subKey)) {
          groups.get(subKey)?.push(item);
        } else {
          groups.set(subKey, [item]);
        }
        if (!allowDuplicates) {
          continue;
        }
      }
    }
    return [...groups.entries()];
  }
}
