import type {HasId} from './data.type';

/**
 * Basic options for all DataObjects. Their data must extend this. The DataObjectData-DataObject paradigm works in such a way that the JSON-serializable DataObjectData object is returned by the DataProvider and converted in the frontend to a more expressive DataObject object. To avoid unnecessary copying of data, the data object is wrapped inside the DataObject in its data property, and easy accessors are provided to access all of its contents as well as providing default values and other useful methods.
 */
export interface DataObjectData extends HasId {
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
  /**
   * A synonym for name used mostly in questions.
   */
  text?: string;
  /**
   * Ascending order when returned in arrays.
   */
  order?: number;
}

/**
 * We implement this in DataObjects with T as their own DataObjectData subtype to make sure that we have accessors for all of the properties in the object's data except those used to initialize the object's children. The type requires that all required and optional properties of the data are present in the object with the exception of those containing DataObjectData subtypes.
 */
export type DataAccessor<T extends DataObjectData> = {
  [K in keyof T as T[K] extends DataObjectData | DataObjectData[] | undefined ? never : K]-?: T[K];
};
