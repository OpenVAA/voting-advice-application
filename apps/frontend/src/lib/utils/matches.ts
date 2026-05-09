import { ENTITY_TYPE } from '@openvaa/data';
import { unwrapEntity } from './entities';
import { compareMaybeWrappedEntities } from './sorting';
import type { Id } from '@openvaa/core';
import type {
  AllianceNomination,
  CandidateNomination,
  EntityType,
  OrganizationNomination,
  QuestionCategory
} from '@openvaa/data';
import type { Match } from '@openvaa/matching';
import type { MatchTree } from '$lib/contexts/voter/matchStore.svelte';

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
 * A utility function to find the `CandidateNomination` for an `OrganizationNomination` in the match tree.
 * @param matches - The possible `MatchTree`.
 * @param nomination - The `OrganizationNomination` whose children to find.
 * @returns An array of `CandidateNomination` matches or the non-matched `CandidateNomination`s if matches are not found for all of the candidates.
 */
export function findCandidateNominations({
  matches,
  nomination: { candidateNominations }
}: {
  matches?: MatchTree;
  nomination: OrganizationNomination;
}): Array<CandidateNomination | Match<CandidateNomination, QuestionCategory>> {
  if (!matches) return candidateNominations.sort(compareMaybeWrappedEntities);

  // Try to find matches for all of the candidateNominations
  const candidateMatches = candidateNominations
    .map(
      ({ id }) =>
        findNomination({
          matches,
          entityType: ENTITY_TYPE.Candidate,
          nominationId: id
        })?.match
    )
    .filter((n) => n != null)
    .sort(compareMaybeWrappedEntities);

  return candidateMatches as Array<Match<CandidateNomination, QuestionCategory>>;

  // // Use the matches only if these are found for all nominations
  // if (candidateMatches.length === candidateNominations.length)
  //   return candidateMatches as Array<Match<CandidateNomination, QuestionCategory>>;
  // return candidateNominations.sort(compareMaybeWrappedEntities);
}

/**
 * A utility function to find the `OrganizationNomination`s for an `AllianceNomination` in the match tree.
 * Mirror of {@link findCandidateNominations} one level up the parent hierarchy: an alliance's "children"
 * are its member organization-nominations.
 * @param matches - The possible `MatchTree`.
 * @param nomination - The `AllianceNomination` whose member organization-nominations to find.
 * @returns An array of `OrganizationNomination` matches; falls back to the non-matched `OrganizationNomination`s sorted by `compareMaybeWrappedEntities` if matches are not found for all member orgs.
 */
export function findOrganizationNominations({
  matches,
  nomination: { organizationNominations }
}: {
  matches?: MatchTree;
  nomination: AllianceNomination;
}): Array<OrganizationNomination | Match<OrganizationNomination, QuestionCategory>> {
  if (!matches) return organizationNominations.sort(compareMaybeWrappedEntities);

  const orgMatches = organizationNominations
    .map(
      ({ id }) =>
        findNomination({
          matches,
          entityType: ENTITY_TYPE.Organization,
          nominationId: id
        })?.match
    )
    .filter((n) => n != null)
    .sort(compareMaybeWrappedEntities);

  return orgMatches as Array<Match<OrganizationNomination, QuestionCategory>>;
}
