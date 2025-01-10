import { Entity, MaybeWrappedEntity } from './entity.type';

/**
 * Return the entity for a wrapped entity or the entity itself if it's not wrapped.
 * @param target A possibly wrapped entity.
 * @returns The entity.
 */
export function getEntity<TEntity extends Entity>(maybeWrapped: MaybeWrappedEntity<TEntity>): TEntity {
  // MatchedEntity
  if (typeof maybeWrapped === 'object' && maybeWrapped !== null && 'target' in maybeWrapped)
    maybeWrapped = maybeWrapped.target;
  // WrappedEntity
  if (typeof maybeWrapped === 'object' && maybeWrapped !== null && 'entity' in maybeWrapped)
    maybeWrapped = maybeWrapped.entity;
  // Naked Entity
  if (typeof maybeWrapped === 'object' && maybeWrapped !== null) return maybeWrapped;
  throw new Error(`Expected a wrapped or naked entity, but got ${JSON.stringify(maybeWrapped)}`);
}
