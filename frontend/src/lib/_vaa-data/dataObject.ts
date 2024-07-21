/*
 * The base class for all DataObjects.
 */

import type {DataAccessor, DataObjectData, CanUpdate} from './internal';
import {DataRoot, Updatable} from './internal';

/**
 * Base class for all data objects. Note that we implement Required<DataObjectData>
 * to make sure that wehave accessors for all of the properties in the object's data.
 */
export abstract class DataObject extends Updatable implements DataAccessor<DataObjectData> {
  constructor(
    public data: DataObjectData,
    public parent: CanUpdate
  ) {
    super(parent);
  }

  get order(): number {
    return this.data.order ?? 0;
  }

  get root(): DataRoot {
    const root = this.findAncestor((o) => o instanceof DataRoot);
    if (root) return root;
    throw new Error('DataRoot not found for object!');
  }

  /**
   * Find the first ancestor of this element that passes the test.
   * @param The Class of the ancestor to find
   */
  findAncestor<TObject extends HasParent>(
    test: (obj: HasParent) => obj is TObject
  ): TObject | undefined {
    let current: HasParent | null = this.parent;
    do {
      if (test(current)) return current;
      current = current.parent;
    } while (current);
    return undefined;
  }
}

type HasParent = Pick<CanUpdate, 'parent'>;
