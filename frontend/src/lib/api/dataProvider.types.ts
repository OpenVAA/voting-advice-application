/*
 * These are some of the raw data types that `DataProvider` returns.
 * For ObjectData types, see separate files where the relevant object
 * classes are defined as well.
 *
 * TO DO: The name of the file is not very informative and should be changed.
 */

/**
 * Allowed Ids are strings and might possibly have other constraints,
 * although we can't enforce them at the type...
 */
export type Id = string;

/**
 * Used for rich text coming from the database.
 */
export type RichText = string;

/**
 * All data object types should extend this.
 */
export interface HasId {
  id: Id;
}

export interface AppLabels {
  [key: string]: string | RichText | AppLabels;
}
