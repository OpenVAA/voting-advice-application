/*
 * The base class for all DataObjects.
 */

import type {HasId} from '../data.types';
import type {DataRoot} from './dataRoot';

/**
 * Basic options for all DataObjects. Their data must extend this.
 * The DataObjectData-DataObject paradigm works in such a way that
 * the JSON-serializable DataObjectData object is returned by the
 * DataProvider and converted in the frontend to a more expressive
 * DataObject object. To avoid unnecessary copying of data, the
 * data object is wrapped inside the DataObject in its data
 * property, and easy accessors are provided to access all of its
 * contents as well as providing default values and other useful
 * methods.
 */
export interface DataObjectData extends HasId {
  order?: number;
}

/**
 * Base class for all data objects.
 */
export abstract class DataObject implements HasId {
  constructor(public data: DataObjectData, public parent: DataObject | DataRoot) {}

  get id() {
    return this.data.id;
  }

  get order() {
    return this.data.order ?? 0;
  }

  get root(): DataRoot {
    let current = this.parent;
    // NB. We can't use current instanceof DataRoot, bc such a circular non-type import
    // will break Vite.
    while ('parent' in current) {
      if (!current.parent) {
        throw new Error(
          `Cannot get root of ${this.constructor.name} because ${current.constructor.name} has no parent.`
        );
      }
      current = current.parent;
    }
    return current as DataRoot;
  }

  /**
   * Find the first ancestor of this element that passes the test.
   * @param The Class of the ancestor to find
   */
  findAncestor<T extends DataObject | DataRoot>(test: (obj: T) => boolean): T {
    let current = this.parent;
    // NB. We can't use current instanceof DataRoot, bc such a circular non-type import
    // will break Vite.
    do {
      if (test(current as T)) {
        break;
      }
      if ('parent' in current) {
        current = current.parent;
      } else {
        throw new Error(
          `Cannot get ancestor of ${this.constructor.name} because ${current.constructor.name} has no parent.`
        );
      }
    } while (current);
    return current as T;
  }
}
