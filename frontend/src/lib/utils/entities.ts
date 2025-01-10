import {
  AllianceNomination,
  type AnyEntityVariant,
  CandidateNomination,
  FactionNomination,
  type NominationVariant,
  OrganizationNomination
} from '@openvaa/data';
import { Match } from '@openvaa/matching';
import type { MaybeWrappedEntity } from '@openvaa/core';

/**
 * Parse a `MaybeWrappedEntity` into `Entity` and possible `Match` and `Nomination`.
 */
export function unwrapEntity<TEntity extends AnyEntityVariant>(
  maybeWrapped: MaybeWrappedEntity<TEntity>
): UnwrappedEntity<TEntity> {
  const out: Partial<UnwrappedEntity<TEntity>> = {};
  if (maybeWrapped instanceof Match) {
    out.match = maybeWrapped;
    maybeWrapped = maybeWrapped.target;
  }
  if (
    maybeWrapped instanceof AllianceNomination ||
    maybeWrapped instanceof CandidateNomination ||
    maybeWrapped instanceof FactionNomination ||
    maybeWrapped instanceof OrganizationNomination
  ) {
    out.nomination = maybeWrapped as NominationVariant[TEntity['type']];
    maybeWrapped = maybeWrapped.entity as TEntity;
  }
  out.entity = maybeWrapped as TEntity;
  return out as UnwrappedEntity<TEntity>;
}

export type UnwrappedEntity<TEntity extends AnyEntityVariant = AnyEntityVariant> = {
  entity: TEntity;
  nomination?: NominationVariant[TEntity['type']];
  match?: Match<TEntity | NominationVariant[TEntity['type']]>;
};
