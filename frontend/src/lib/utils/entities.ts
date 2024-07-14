/** Return the entity type for the entity */
export function getEntityType(
  entity: EntityProps | undefined
): Exclude<EntityType, 'all'> | undefined {
  if (entity == null) return undefined;
  return isCandidate(entity) ? 'candidate' : isParty(entity) ? 'party' : undefined;
}

/** Check whether `entity` is a `CandidateProps`. NB. This will be no longer necessary when the `vaa-data` model is implemented. */
export function isCandidate(entity: EntityProps | undefined): entity is CandidateProps {
  return entity != null && 'firstName' in entity;
}

/** Check whether `entity` is a `PartyProps`. NB. This will be no longer necessary when the `vaa-data` model is implemented. */
export function isParty(entity: EntityProps | undefined): entity is PartyProps {
  return entity != null && !('firstName' in entity);
}

/** Check whether a possibly ranked `entity` is a `RankingProps`. */
export function isWrapped(entity: MaybeRanked): entity is WrappedEntity {
  return entity != null && 'entity' in entity;
}

/** Check whether a possibly ranked `entity` is a `RankingProps`. */
export function isRanked(entity: MaybeRanked): entity is RankingProps {
  return isWrapped(entity) && 'score' in entity && entity.score != null;
}

/** Parse a possibly ranked `entity` into `EntityProps` and possible `RankingProps`. */
export function parseMaybeRanked(entity: MaybeRanked): {
  entity: EntityProps;
  ranking: RankingProps | undefined;
} {
  return isWrapped(entity)
    ? {
        entity: entity.entity,
        ranking: isRanked(entity) ? entity : undefined
      }
    : {
        entity,
        ranking: undefined
      };
}

/** Wrap an entity for easier use in contexts where rankings are expected */
export function wrap<T extends EntityProps>(entity: T): WrappedEntity<T> {
  return { entity };
}
