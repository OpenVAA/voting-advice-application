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
 * Allowed Ids are strings and might possibly have other constraints.
 */
export type Id = string;

/**
 * NB. Theoretically we could defined a const ID_KEY and use it instead of 'id' here and elsewhere, but that seems a bit overkill.
 */
export interface HasId {
  id: Id;
}
