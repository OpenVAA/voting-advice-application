import type { Id } from '@openvaa/core';
import type { AnyNominationVariant, EntityType } from '@openvaa/data';
import type { Readable, Writable } from 'svelte/store';
import type { VoterContext } from '../voter';

export type GameContext = VoterContext & {
  /**
   * The data for Match Target Game where the user is supposed to get a target entity matched first.
   */
  matchTarget: MatchTargetGame;
};

export type MatchTargetGame = {
  /**
   * The `EntityType` of the game mode target entity.
   */
  targetNominationType: Writable<EntityType | undefined>;
  /**
   * The `Id` of the game mode target entity.
   */
  targetNominationId: Writable<Id | undefined>;
  /**
   * The game mode target entity.
   */
  targetNomination: Readable<AnyNominationVariant | undefined>;
  /**
   * The up-to-date result of the game.
   */
  result: Readable<MatchTargetResult | undefined>;
  /**
   * Reset the game state.
   */
  reset: () => void;
};

export type MatchTargetResult = {
  /**
   * The grade of the task.
   */
  grade: Grade;
  /**
   * The rank of the target in the results with tied ranks collapsed (starting from 1).
   */
  rank: number;
  /**
   * All entities with the same score, including the target.
   */
  rankMembers: Array<EntityVariantMatch>;
  /**
   * The `Match` object of the target.
   */
  match: EntityVariantMatch;
};

/**
 * The grade of the task.
 * NB. These must match the subkeys in the `gameMode.results` translations.
 */
export type Grade = 'perfect' | 'good' | 'fair';
