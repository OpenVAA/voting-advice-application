/*
 * These are some of the raw data types that `DataProvider` returns.
 * For ObjectData types, see separate files where the relevant object
 * classes are defined as well.
 */

/**
 * An value allowed in JSON.
 */
export type SerializableValue =
  | string
  | number
  | boolean
  | null
  | SerializableValue[]
  | {[key: string]: SerializableValue};

/**
 * Allowed Ids are strings and might possibly have other constraints,
 * although we can't enforce them at the type...
 */
export type Id = string;

/**
 * NB. Theoretically we could defined a const ID_KEY and use it instead
 * of 'id' here and elsewhere, but that seems a bit overkill.
 */
export interface HasId {
  id: Id;
}

/**
 * Used for rich text coming from the database.
 */
export type RichText = string;

/**
 * Used for image urls coming from the database.
 */
export type ImageUrl = string;

/**
 * Used for link urls coming from the database.
 */
export type LinkUrl = string;
