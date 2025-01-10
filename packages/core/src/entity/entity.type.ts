import { HasAnswers } from '../matching/hasAnswers.type';

/**
 * `Entity`s are the targets that VAAs match with the voter. The actual `Entity` objects are defined in the `@openvaa/data` module.
 */
export type Entity = HasAnswers;

/**
 * The `MaybeWrappedEntity` type is used to enable universal handling of wrapped or naked `Entity`s.
 */
export type MaybeWrappedEntity<TEntity extends Entity = Entity> =
  | TEntity
  | WrappedEntity<TEntity>
  | MatchedEntity<TEntity>;

/**
 * An `Entity` be wrapped in another object, e.g., when nominated.
 */
export interface WrappedEntity<TEntity extends Entity = Entity> {
  entity: TEntity;
}

/**
 * An `Entity` or `WrappedEntity` contained in a match object.
 */
export interface MatchedEntity<TEntity extends Entity = Entity> {
  target: TEntity | WrappedEntity<TEntity>;
}

/**
 * A utility type for extracting the `Entity` type from a `MaybeWrappedEntity`.
 */
export type ExtractEntity<TEntity extends MaybeWrappedEntity> =
  TEntity extends MatchedEntity<infer TMatched>
    ? TMatched extends WrappedEntity<infer TNaked>
      ? TNaked
      : TMatched
    : TEntity extends WrappedEntity<infer TWrapped>
      ? TWrapped
      : TEntity;
