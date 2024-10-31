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
export interface WrappedEntity<T extends FilterableEntity = FilterableEntity> {
  [WRAPPED_ENTITY_KEY]: T;
}

/**
 * Either a wrapped or a naked entity.
 */
export type MaybeWrapped<T extends FilterableEntity = FilterableEntity> = T | WrappedEntity<T>;

/**
 * Extract the naked entity from a possibly wrapped entity.
 */
export type ExtractEntity<T extends MaybeWrapped> = T extends WrappedEntity<infer E> ? E : T;

/**
 * Return the entity for a wrapped entity or the entity itself if it's not wrapped.
 * @param target A possibly wrapped entity.
 * @returns The entity.
 */
export function getEntity<T extends MaybeWrapped>(target: T) {
  return (WRAPPED_ENTITY_KEY in target ? target[WRAPPED_ENTITY_KEY] : target) as ExtractEntity<T>;
}
