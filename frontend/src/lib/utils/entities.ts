/** Return the entity type for the entity */
export function getEntityType(entity: LegacyEntityProps | undefined): Exclude<LegacyEntityType, 'all'> | undefined {
  if (entity == null) return undefined;
  return isCandidate(entity) ? 'candidate' : isParty(entity) ? 'party' : undefined;
}

/** Check whether `entity` is a `LegacyCandidateProps`. NB. This will be no longer necessary when the `@openvaa/data` model is implemented. */
export function isCandidate(entity: LegacyEntityProps | undefined): entity is LegacyCandidateProps {
  return entity != null && 'firstName' in entity;
}

/** Check whether `entity` is a `LegacyPartyProps`. NB. This will be no longer necessary when the `@openvaa/data` model is implemented. */
export function isParty(entity: LegacyEntityProps | undefined): entity is LegacyPartyProps {
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

/** Parse a possibly ranked `entity` into `LegacyEntityProps` and possible `RankingProps`. */
export function parseMaybeRanked(entity: MaybeRanked): {
  entity: LegacyEntityProps;
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
export function wrap<TEntity extends LegacyEntityProps>(entity: TEntity): WrappedEntity<TEntity> {
  return { entity };
}
