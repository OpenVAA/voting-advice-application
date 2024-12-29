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

/** Check whether a possibly ranked `entity` is a `LegacyRankingProps`. */
export function isWrapped(entity: LegacyMaybeRanked): entity is LegacyWrappedEntity {
  return entity != null && 'target' in entity;
}

/** Check whether a possibly ranked `entity` is a `LegacyRankingProps`. */
export function isRanked(entity: LegacyMaybeRanked): entity is LegacyRankingProps {
  return isWrapped(entity) && 'score' in entity && entity.score != null;
}

/** Parse a possibly ranked `entity` into `LegacyEntityProps` and possible `LegacyRankingProps`. */
export function parseMaybeRanked(entity: LegacyMaybeRanked): {
  entity: LegacyEntityProps;
  ranking: LegacyRankingProps | undefined;
} {
  return isWrapped(entity)
    ? {
        entity: entity.target,
        ranking: isRanked(entity) ? entity : undefined
      }
    : {
        entity,
        ranking: undefined
      };
}

/** Wrap an entity for easier use in contexts where rankings are expected */
export function wrap<TEntity extends LegacyEntityProps>(target: TEntity): LegacyWrappedEntity<TEntity> {
  return { target };
}
