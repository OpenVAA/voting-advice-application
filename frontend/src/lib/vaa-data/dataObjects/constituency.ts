/*
 * The class for a constituency.
 */

import {ConstituencyCategory} from './constituencyCategory';
import {NamedDataObject} from './namedDataObject';
import type {NamedDataObjectData} from './namedDataObject';
import {DataObjectCollection} from './dataObjectCollection';

export interface ConstituencyData extends NamedDataObjectData {
  name: string;
  children?: ConstituencyData[];
}

/**
 * A constituency is typically a geographical area but may also be something
 * else, such as an ethnic group. Constituencies can be nested allowing for
 * easy implementation of, e.g. a hierarchy of states, regions and
 * municipalities, which can be used in the frontend so that the user can
 * select an item from any of the three levels to get their applicable
 * state.
 */
export class Constituency extends NamedDataObject {
  children = new DataObjectCollection<Constituency>([]);

  constructor(public data: ConstituencyData, public parent: ConstituencyCategory | Constituency) {
    super(data, parent);
    this.initialize();
  }

  get category(): ConstituencyCategory {
    return this.findAncestor((o) => o instanceof ConstituencyCategory);
  }

  initialize(): void {
    if (this.data.children?.length) {
      this.children = new DataObjectCollection(
        this.data.children.map((d) => new Constituency(d, this))
      );
    }
  }
}
