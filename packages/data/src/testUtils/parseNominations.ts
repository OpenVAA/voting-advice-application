import crypto from 'crypto';
import {
  AnyNominationVariantData,
  AnyNominationVariantPublicData,
  ENTITY_TYPE,
  EntityType,
  Id,
  NestedNomination,
  NominationVariantData
} from '../internal';

/**
 * Counts all nomination types in the array, including nested nominations.
 * @param nominations - Array of nomination variant data.
 * @returns An object with counts of the nominations for each entity type.
 */
export function getNominationCounts(nominations: Array<Partial<AnyNominationVariantData>>): Record<EntityType, number> {
  const counts = {
    alliance: 0,
    candidate: 0,
    faction: 0,
    organization: 0
  };
  const parsedNominations = parseNestedNominations(nominations);
  for (const n of parsedNominations) counts[n.entityType] += 1;
  return counts;
}

/**
 * Expands recursively all nested nominations in the array and returns them along the original nominations. Nominations without and explicit `entityId` are given a random `entityPseudoId` which can is used to disambiguate duplicates. Nested nominations also have a `parent` property linking to the original nomination.

 * @param nominations - Array of nomination variant data.
 * @param inherited - Used to add inherited data in recursion.
 * @returns An array of expanded nomination variant data.
 */
export function parseNestedNominations(
  nominations: Array<AnyNominationVariantPublicData | NestedNomination<AnyNominationVariantPublicData>>,
  inherited?: {
    electionId: Id;
    electionRound?: number | null;
    constituencyId: Id;
    entityType: EntityType;
    parent?: ExtendedNominationData;
  }
): Array<ExtendedNominationData> {
  const out = new Array<ExtendedNominationData>();
  for (const n of nominations) {
    const data = {
      ...inherited,
      ...n,
      entityPseudoId: n.entityId ? undefined : crypto.randomUUID()
    } as ExtendedNominationData;
    out.push(data);
    const { electionId, electionRound, constituencyId } = data;
    if ('organizations' in n && n.organizations)
      out.push(
        ...parseNestedNominations(n.organizations, {
          entityType: ENTITY_TYPE.Organization,
          parent: data,
          electionId,
          electionRound,
          constituencyId
        })
      );
    if ('factions' in n && n.factions)
      out.push(
        ...parseNestedNominations(n.factions, {
          entityType: ENTITY_TYPE.Faction,
          parent: data,
          electionId,
          electionRound,
          constituencyId
        })
      );
    if ('candidates' in n && n.candidates)
      out.push(
        ...parseNestedNominations(n.candidates, {
          entityType: ENTITY_TYPE.Candidate,
          parent: data,
          electionId,
          electionRound,
          constituencyId
        })
      );
  }
  return out;
}

export type ExtendedNominationData<TTentity extends EntityType = EntityType> = NominationVariantData[TTentity] & {
  entityPseudoId?: string;
  parent?: ExtendedNominationData;
};
