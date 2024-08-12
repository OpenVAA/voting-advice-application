/**
 * The name of the property that contains the entity in a `WrappedEntity`.
 */
export const WRAPPED_ENTITY_KEY = 'entity';

/**
 * An entity that can be filtered.
 */
export type FilterableEntity = object & {
  [WRAPPED_ENTITY_KEY]?: never;
};

/**
 * An entity wrapped in another object, such as a ranking with the match and the entity as properties.
 */
export interface WrappedEntity<TEntity extends FilterableEntity = FilterableEntity> {
  [WRAPPED_ENTITY_KEY]: TEntity;
}

/**
 * Either a wrapped or a naked entity.
 */
export type MaybeWrapped<TEntity extends FilterableEntity = FilterableEntity> =
  | TEntity
  | WrappedEntity<TEntity>;

/**
 * Extract the naked entity from a possibly wrapped entity.
 */
export type ExtractEntity<TEntity extends MaybeWrapped> =
  TEntity extends WrappedEntity<infer E> ? E : TEntity;

/**
 * Return the entity for a wrapped entity or the entity itself if it's not wrapped.
 * @param target A possibly wrapped entity.
 * @returns The entity.
 */
export function getEntity<TEntity extends MaybeWrapped>(target: TEntity) {
  return (
    WRAPPED_ENTITY_KEY in target ? target[WRAPPED_ENTITY_KEY] : target
  ) as ExtractEntity<TEntity>;
}
