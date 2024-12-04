import {
  type AnyEntityVariantData,
  type AnyNominationVariantPublicData,
  ENTITY_TYPE,
  type EntityType
} from '@openvaa/data';
import type { Id } from '@openvaa/core';

/**
 * Filter the entities to those that are included in the possibly nested nominations.
 * @param entities - The array of `EntityData` to filter
 * @param nominations - The array of `NominationData` to filter by
 * @returns The filtered array of `EntityData`
 */

export function filterEntitiesByNomination({
  entities,
  nominations
}: {
  entities: Array<AnyEntityVariantData>;
  nominations: Array<AnyNominationVariantPublicData>;
}): Array<AnyEntityVariantData> {
  const nominatedEntities = parseEntitiesFromNominations(nominations);
  const entityMap: Partial<Record<EntityType, Set<Id>>> = {};
  for (const [entityType, entityId] of nominatedEntities) {
    entityMap[entityType] ??= new Set();
    entityMap[entityType].add(entityId);
  }
  return entities.filter(({ type, id }) => entityMap[type]?.has(id));
}

/**
 * Recursively parse the nomination tree and collect all entities in an array.
 */
export function parseEntitiesFromNominations(
  nominations: Array<EntityDef>,
  nestedType?: EntityType
): Array<[type: EntityType, id: Id]> {
  const entities = new Array<[EntityType, Id]>();
  for (const { entityType, entityId, candidates, factions, organizations } of nominations) {
    const type = nestedType ?? entityType;
    if (!type) throw new Error(`Nomination for entity ${entityId} does not have an entityType.`);
    if (entityId) entities.push([type, entityId]); // Implicit entities do not have an entityId.
    if (candidates) entities.push(...parseEntitiesFromNominations(candidates, ENTITY_TYPE.Candidate));
    if (factions) entities.push(...parseEntitiesFromNominations(factions, ENTITY_TYPE.Faction));
    if (organizations) entities.push(...parseEntitiesFromNominations(organizations, ENTITY_TYPE.Organization));
  }
  return entities;
}

type EntityDef = {
  entityType?: EntityType;
} & NestedEntity;

type NestedEntity = {
  entityId?: Id | null;
  candidates?: Array<NestedEntity> | null;
  factions?: Array<NestedEntity> | null;
  organizations?: Array<NestedEntity> | null;
};
