import { Match } from '@openvaa/matching';
import { parsimoniusDerived } from '$lib/contexts/utils/parsimoniusDerived';
import { unwrapEntity } from '$lib/utils/entities';
import { findNomination } from '$lib/utils/matches';
import type { AnyNominationVariant } from '@openvaa/data';
import type { Readable } from 'svelte/store';
import type { MatchTree } from '$lib/contexts/voter/matchStore';
import type { Grade, MatchTargetResult } from './gameContext.type';

/**
 * Create a store computing the game result for the target nomination game.
 * @param matches - The `MatchTree` store
 * @param targetNomination - The target `Nomination` store
 * @returns A store computing the game result or `undefined` if all data is not available.
 */
export function matchTargetResult({
  matches,
  targetNomination
}: {
  matches: Readable<MatchTree>;
  targetNomination: Readable<AnyNominationVariant | undefined>;
}): Readable<MatchTargetResult | undefined> {
  return parsimoniusDerived([matches, targetNomination], ([matches, targetNomination]) => {
    // 1. Find target in matches
    if (!matches || !targetNomination) return undefined;
    const found = findNomination({
      entityType: targetNomination.entityType,
      nominationId: targetNomination.id,
      matches
    });
    if (!found || !(found.match instanceof Match)) return undefined;

    // 2. Compute rank and check if it shared between tied peers
    const { match, peers } = found;
    const scores = peers
      .map((p) => unwrapEntity(p).match?.score)
      .filter((s) => s != null)
      .sort()
      .reverse();
    // This returns the first index of the score, which is the proper rank
    const rank = scores.indexOf(match.score) + 1;
    const rankMembers = peers.filter((p) => unwrapEntity(p).match?.score === match.score);

    // 3. Create result
    // IndexOf returned -1, which shouldn't happen...
    if (rank === 0) return undefined;
    const grade: Grade = rank === 1 ? 'perfect' : rank === 2 ? 'good' : 'fair';
    return {
      grade,
      rank,
      rankMembers,
      match
    };
  });
}
