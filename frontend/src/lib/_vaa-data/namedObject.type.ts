import type {DataObjectData, HasId} from './internal';

/**
 * Basic options for all DataObjects with ids and a name accessor.
 */
export interface NamedObjectData extends DataObjectData, HasId {
  // From DataObjectData
  // - order?: number;
  // From HasId
  // - id: Id;
  /**
   * The name of the object
   */
  name?: string;
  /**
   * Optional short name, defaults to name
   */
  shortName?: string;
}
