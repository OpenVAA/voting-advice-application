/**
 * Allowed Ids are strings and might possibly have other constraints.
 */
export type Id = string;

/**
 * Any object that has an `Id`.
 */
export interface HasId {
  id: Id;
}