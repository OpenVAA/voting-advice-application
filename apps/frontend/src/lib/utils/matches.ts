import { unwrapEntity } from './entities';
import { compareMaybeWrappedEntities } from './sorting';
import type { Id } from '@openvaa/core';
import type { CandidateNomination, EntityType, OrganizationNomination, QuestionCategory } from '@openvaa/data';
import type { Match } from '@openvaa/matching';
import type { MatchTree } from '$lib/contexts/voter/matchState.svelte';

/**
 * Find a `Nomination` by its id in the match tree.
 * @param matches - The `MatchTree`
 * @param entityType - The type of the nominated entity.
 * @param nominationId - The id of the `Nomination` to find.
 * @returns The `MaybeWrappedEntityVariant` for the `Nomination`, its peers and the `Id` of the `Election`, or `undefined` if not found.
 */
export function findNomination({
  entityType,
  matches,
  nominationId
}: {
  entityType: EntityType;
  matches: MatchTree;
  nominationId: Id;
}):
  | {
      match: MaybeWrappedEntityVariant;
      peers: Array<MaybeWrappedEntityVariant>;
      electionId: Id;
    }
  | undefined {
  for (const [electionId, election] of Object.entries(matches)) {
    if (!election[entityType]) continue;
    for (const match of election[entityType]) {
      const { nomination } = unwrapEntity(match);
      if (nomination && nomination.id === nominationId) {
        return {
          match: match,
          peers: election[entityType],
          electionId
        };
      }
    }
  }
  return undefined;
}

/**
 * Find the matches of an `OrganizationNomination`'s `CandidateNomination`s or an `AllianceNomination`'s `OrganizationNomination`s in the match tree.
 * @param matches - The possible `MatchTree`.
 * @param children - The child nominations whose matches to find.
 * @param entityType - The entity type of the children.
 * @returns The children's matches, sorted. Children without a match are omitted. Without `matches`, the children themselves, sorted.
 */
export function findChildMatches<TNomination extends CandidateNomination | OrganizationNomination>({
  matches,
  children,
  entityType
}: {
  matches?: MatchTree;
  children: Array<TNomination>;
  entityType: EntityType;
}): Array<TNomination | Match<TNomination, QuestionCategory>> {
  if (!matches) return children.sort(compareMaybeWrappedEntities);
  const childMatches = children
    .map(({ id }) => findNomination({ matches, entityType, nominationId: id })?.match)
    .filter((n) => n != null)
    .sort(compareMaybeWrappedEntities);
  return childMatches as Array<Match<TNomination, QuestionCategory>>;
}
