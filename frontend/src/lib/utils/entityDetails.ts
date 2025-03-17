import { unwrapEntity } from './entities';
import { findNomination } from './matches';
import type { Id } from '@openvaa/core';
import type { AnyEntityVariant, DataRoot, EntityType } from '@openvaa/data';
import type { MatchTree } from '$lib/contexts/voter/matchStore';

/**
 * Get the relevant `entity` and `title` properties to pass to `EntityDetails` based on the inputs.
 * The `entity` returned is either a `Match`, `Nomination` or `Entity` in this order of preference.
 * @param dataRoot - The `DataRoot` object
 * @param entityType - The type of the entity
 * @param entityId - The id of the entity
 * @param matches - The optional `MatchTree`
 * @param nominationId - The optional id of the `Nomination`.
 * @throws If any object cannot be found or if the entity corresponding to the nomination does not match `entityId`.
 */
export function getEntityAndTitle({
  dataRoot,
  entityType,
  entityId,
  matches,
  nominationId
}: {
  dataRoot: DataRoot;
  entityType: EntityType;
  entityId: Id;
  matches?: MatchTree;
  nominationId?: Id;
}): {
  title: string;
  entity: MaybeWrappedEntityVariant;
} {
  let entity: MaybeWrappedEntityVariant;
  let title: string;
  if (nominationId) {
    // Find the nomination in the matches, so we get the score. Note that target may be either a Match or a Nomination
    const target = matches
      ? findNomination({ matches, entityType, nominationId })
      : dataRoot.getNomination(entityType, nominationId);
    if (!target) throw new Error(`Nomination of type ${entityType} with id ${nominationId} not found.`);
    // Make sure that the nomination matches the entity we are looking for
    const { entity: nakedEntity } = unwrapEntity<AnyEntityVariant>(target);
    title = nakedEntity.name;
    if (nakedEntity.id !== entityId)
      throw new Error(`Nomination with ${nominationId} does not match that of entity ${entityId}.`);
    entity = target;
  } else {
    entity = dataRoot.getEntity(entityType, entityId);
    title = entity.name;
  }
  return { title, entity };
}
