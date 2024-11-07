import type { CanUpdate, HasId, Id } from '../internal';

/**
 * Used to contain `DataObject`s The basic collection type is just an array.
 */
export type Collection<TObject extends Collectable = Collectable> = Array<TObject>;

/**
 * Used to contain `DataObject`s. The mapped collection type is a `Map` where the keys are the ids of the objects.
 */
export type MappedCollection<TObject extends Collectable = Collectable> = Map<Id, TObject>;

/**
 * `Collection`s are used to contain `DataObject`s. They are initialised to `undefined` to distinguish between an empty collection and an unitialized one. Some collections will be internally stored as `Map`s for easier id lookups. When returned by accessors, however, they will be converted to normal `Collection`s, i.e., `Array`s.
 */
export type MaybeCollection<TType extends Collectable = Collectable> =
  | Collection<TType>
  | MappedCollection<TType>
  | undefined;

/**
 * Any valid child of a `Collection`.
 */
export type Collectable = CanUpdate & HasId;

/**
 * Extract the content of a `Collection` or a `MappedCollection`
 */
export type CollectionContent<TCollection extends Collection | MappedCollection> =
  TCollection extends MappedCollection<infer C> ? C : TCollection extends Collection<infer C> ? C : never;

/**
 * Convert a `MappedCollection` into a `Collection`.
 */
export type Unmapped<TCollection extends MappedCollection> =
  TCollection extends MappedCollection<infer C> ? Collection<C> : never;
