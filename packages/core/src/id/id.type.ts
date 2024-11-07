/**
 * Allowed Ids are nonempty strings, which cannot contain whitespace.
 * Use `checkId` to validate an `Id`, because we cannot define these extended constraints using TypeScript.
 */
export type Id = string;

/**
 * Any object that has an `Id`.
 */
export interface HasId {
  id: Id;
}
