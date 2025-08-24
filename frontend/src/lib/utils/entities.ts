import { type AnyEntityVariant, isNomination, type NominationVariant } from '@openvaa/data';
import { isMatch } from '@openvaa/matching';
import type { MaybeWrappedEntity } from '@openvaa/core';
import type { Match } from '@openvaa/matching';

/**
 * Parse a `MaybeWrappedEntity` into `Entity` and possible `Match` and `Nomination`.
 */
export function unwrapEntity<TEntity extends AnyEntityVariant>(
  maybeWrapped: MaybeWrappedEntity<TEntity>
): UnwrappedEntity<TEntity> {
  const out: Partial<UnwrappedEntity<TEntity>> = {};
  if (isMatch<TEntity | NominationVariant[TEntity['type']]>(maybeWrapped)) {
    out.match = maybeWrapped;
    maybeWrapped = maybeWrapped.target as TEntity;
  }
  if (isNomination(maybeWrapped)) {
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
