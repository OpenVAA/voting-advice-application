import type {CanUpdate, Id} from './internal';

export type Collectable = CanUpdate;

export type Collection<TObject extends Collectable = Collectable> = Array<TObject>;

export type MappedCollection<TObject extends Collectable = Collectable> = Map<Id, TObject>;

/**
 * Collections are used to contain the children of `Updatable`s. They are initialised to `undefined` to distinguish between an empty collection and an unitialized one. Some collections will be internally stored as `Map`s for easier id lookups. When returned by accessors, however, they will be converted to normal `Collection`s, i.e., `Array`s.
 */
export type MaybeCollection<TType extends Collectable = Collectable> =
  | Collection<TType>
  | MappedCollection<TType>
  | undefined;
