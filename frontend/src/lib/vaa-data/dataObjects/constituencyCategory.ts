/*
 * Contains the classes for constituency categories. There are two types
 * of these: ConstituencyCategory, which is a normal constituency
 * category, and ConstituencyCategoryFragment, which is a virtual category
 * including all the descendants of a specific Constituency contained in
 * a proper ConstituencyCategory.
 */

import type {Id, RichText} from '../data.types';
import {Constituency, type ConstituencyData} from './constituency';
import {NamedDataObject, type NamedDataObjectData} from './namedDataObject';
import {DataObjectCollection} from './dataObjectCollection';
import type {DataRoot} from './dataRoot';

////////////////////////////////////////////////////////////////
// BASE CLASS
////////////////////////////////////////////////////////////////

/**
 * The base constructor data for ConstituencyCategory and
 * ConstituencyCategoryFragment.
 */
export interface ConstituencyCategoryBaseData extends NamedDataObjectData {
  name: string;
  info?: RichText;
}

/**
 * The abstract base class for constituency categories is shared between
 * the proper ConstituencyCategory class and the ConstituencyCategoryFragment
 * class, which is used to refer to subsets of ConstituencyCategory objects.
 */
export abstract class ConstituencyCategoryBase extends NamedDataObject {
  abstract constituencies: DataObjectCollection<Constituency>;

  constructor(public data: ConstituencyCategoryBaseData, public parent: DataRoot | Constituency) {
    super(data, parent);
  }

  get info() {
    return this.data.info ?? '';
  }
}

////////////////////////////////////////////////////////////////
// PROPER CATEGORY
////////////////////////////////////////////////////////////////

/**
 * The data format ConstituencyCategories.
 */
export interface ConstituencyCategoryData extends ConstituencyCategoryBaseData {
  /**
   * In contrast to other DataObjects, we do not pass the Constituencies
   * as ids because, the categories and their children need to be instantiated
   * simultaneously (otherwise we would run into problems with the category
   * fragments, below). Moreover, the ConstituencyCategories make little sense
   * without their Constituencies.
   */
  constituencyData: ConstituencyData[];
}

/**
 * The class for proper ConstituencyCategory objects.
 */
export class ConstituencyCategory extends ConstituencyCategoryBase {
  constituencies = new DataObjectCollection<Constituency>([]);

  constructor(public data: ConstituencyCategoryData, public parent: DataRoot) {
    super(data, parent);
    this.initialize();
  }

  initialize(): void {
    if (this.data.constituencyData.length) {
      this.constituencies = new DataObjectCollection(
        this.data.constituencyData.map((d) => new Constituency(d, this))
      );
    } else {
      throw new Error('ConstituencyCategory must have at least one constituency');
    }
  }
}

////////////////////////////////////////////////////////////////
// CATEGORY FRAGMENT
////////////////////////////////////////////////////////////////

export interface ConstituencyCategoryFragmentData extends ConstituencyCategoryBaseData {
  parentConstituencyId: Id;
}

/**
 * A ConstituencyCategoryFragment is a virtual category including all the
 * descendants of a Constituency contained in a ConstituencyCategory. This is
 * useful when multiple elections share one same consituency hierarchy (most
 * likely a geographical one) but apply to different levels of it, e.g.
 * combined regional and municipal elections. In such a case, we do not want
 * to ask the voter to separately select a constituency for both, but just
 * their municipality from which we can infer the region. Thus, we want the
 * the municipalities to be proper descendants of the regions.
 */
export class ConstituencyCategoryFragment extends ConstituencyCategoryBase {
  constructor(public data: ConstituencyCategoryFragmentData, public parent: Constituency) {
    super(data, parent);
  }

  get parentConstituencyId() {
    return this.data.parentConstituencyId;
  }

  get constituencies() {
    // NB. A bit confusingly, this fragment is not included in the parent's children.
    return this.parent.children;
  }
}

////////////////////////////////////////////////////////////////
// UTILITY INTERFACE
////////////////////////////////////////////////////////////////

export type AnyConstituencyCategoryData =
  | ConstituencyCategoryData
  | ConstituencyCategoryFragmentData;
