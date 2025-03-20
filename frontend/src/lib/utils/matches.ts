import {
  type AnyNominationVariant,
  CandidateNomination,
  ENTITY_TYPE,
  type EntityType,
  OrganizationNomination,
  QuestionCategory
} from '@openvaa/data';
import { unwrapEntity } from './entities';
import { compareMaybeWrappedEntities } from './sorting';
import type { Id } from '@openvaa/core';
import type { Match } from '@openvaa/matching';
import type { MatchTree } from '$lib/contexts/voter/matchStore';

/**
 * Find a `Nomination` by its id in the match tree.
 * @param matches - The `MatchTree`
 * @param entityType - The type of the nominated entity.
 * @param nominationId - The id of the `Nomination` to find.
 * @returns The `Match` for the `Nomination` or `undefined` if not found.
 */
export function findNomination({
  entityType,
  matches,
  nominationId
}: {
  entityType: EntityType;
  matches: MatchTree;
  nominationId: Id;
}): Match<AnyNominationVariant> | undefined {
  for (const election of Object.values(matches)) {
    if (!election[entityType]) continue;
    for (const match of election[entityType]) {
      const { nomination } = unwrapEntity(match);
      if (nomination && nomination.id === nominationId) return match as Match<AnyNominationVariant>;
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
    .map(({ id }) =>
      findNomination({
        matches,
        entityType: ENTITY_TYPE.Candidate,
        nominationId: id
      })
    )
    .filter((n) => n != null)
    .sort(compareMaybeWrappedEntities);

  return candidateMatches as Array<Match<CandidateNomination, QuestionCategory>>;

  // // Use the matches only if these are found for all nominations
  // if (candidateMatches.length === candidateNominations.length)
  //   return candidateMatches as Array<Match<CandidateNomination, QuestionCategory>>;
  // return candidateNominations.sort(compareMaybeWrappedEntities);
}
