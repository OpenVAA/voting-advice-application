/** Check whether `entity` is a `CandidateProps`. NB. This will be no longer necessary when the `vaa-data` model is implemented. */
export function isCandidate(entity: EntityProps | undefined): entity is CandidateProps {
  return entity != null && 'firstName' in entity;
}

/** Check whether `entity` is a `PartyProps`. NB. This will be no longer necessary when the `vaa-data` model is implemented. */
export function isParty(entity: EntityProps | undefined): entity is PartyProps {
  return entity != null && !('firstName' in entity);
}
