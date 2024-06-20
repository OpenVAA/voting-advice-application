/*
 * The base class for all DataObjects.
 */

import type {HasId} from './data.type';
import type {DataAccessor, DataObjectData} from './dataObject.type';
import type {DataRoot} from './dataRoot';

/**
 * Base class for all data objects. Note that we implement Required<DataObjectData>
 * to make sure that wehave accessors for all of the properties in the object's data.
 */
export abstract class DataObject implements HasId, DataAccessor<DataObjectData> {
  constructor(
    public data: DataObjectData,
    public parent: DataObject | DataRoot
  ) {}

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name ?? this.data.text ?? '';
  }

  get text() {
    return this.data.text ?? '';
  }

  get shortName() {
    return this.data.shortName ?? this.name;
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
  findAncestor<T extends DataObject | DataRoot>(test: (obj: DataObject | DataRoot) => obj is T): T {
    let current = this.parent;
    do {
      if (test(current)) {
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
