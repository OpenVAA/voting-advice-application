/**
 * Matches an entity type
 */
export function match(param: LegacyEntityType) {
  return ['candidate', 'party'].includes(param);
}
