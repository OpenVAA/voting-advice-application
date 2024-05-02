/**
 * Matches an entity type
 */
export function match(param: EntityType) {
  return ['candidate', 'party'].includes(param);
}
