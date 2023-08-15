/*
 * The base class for all DataObjects with Ids and names, i.e.
 * the vast majority of them.
 */

import {DataObject, type DataObjectData} from './dataObject';
import type {DataRoot} from './dataRoot';
import type {HasId} from '../data.types';

/**
 * Basic options for all NamedDataObjects.
 */
export interface NamedDataObjectData extends DataObjectData, HasId {
  name?: string;
  text?: string;
  shortName?: string;
}

/**
 * Base class for all data objects Ids and names, i.e.
 * the vast majority of them.
 */
export abstract class NamedDataObject extends DataObject {
  constructor(public data: NamedDataObjectData, public parent: DataObject | DataRoot) {
    super(data, parent);
  }

  get name() {
    return this.data.name ?? this.data.text ?? '';
  }

  get shortName() {
    return this.data.shortName ?? this.name;
  }
}
