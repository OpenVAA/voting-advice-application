import { error } from '@sveltejs/kit';
import { getContext, hasContext, setContext } from 'svelte';
import { logDebugError } from '$lib/utils/logger';
import { matchTargetResult } from './matchTargetResult';
import { parsimoniusDerived } from '../utils/parsimoniusDerived';
import { localStorageWritable } from '../utils/storageStore';
import { getVoterContext } from '../voter';
import type { Id } from '@openvaa/core';
import type { EntityType } from '@openvaa/data';
import type { GameContext } from './gameContext.type';

const CONTEXT_KEY = Symbol();

export function getGameContext(): GameContext {
  if (!hasContext(CONTEXT_KEY)) error(500, 'getGameContext() called before initGameContext()');
  return getContext<GameContext>(CONTEXT_KEY);
}

/**
 * Initialize and return the context. This must be called before `getGameContext()` and cannot be called twice.
 * @returns The context object
 */
export function initGameContext(): GameContext {
  if (hasContext(CONTEXT_KEY)) error(500, 'initGameContext() called for a second time');

  ////////////////////////////////////////////////////////////
  // Inheritance from other Contexts
  ////////////////////////////////////////////////////////////

  const voterContext = getVoterContext();
  const { dataRoot, matches } = voterContext;

  ////////////////////////////////////////////////////////////
  // Match target game
  ////////////////////////////////////////////////////////////

  // TODO: Wrap in a single imported create function

  const targetNominationId = localStorageWritable<Id | undefined>('gameContext-targetNominationId', undefined);

  const targetNominationType = localStorageWritable<EntityType | undefined>(
    'gameContext-targetNominationType',
    undefined
  );

  const targetNomination = parsimoniusDerived(
    [dataRoot, targetNominationType, targetNominationId],
    ([dataRoot, targetNominationType, targetNominationId]) => {
      if (!targetNominationId || !targetNominationType) return undefined;
      // Ensure nominations are loaded
      if (!dataRoot.findNominations({ entityType: targetNominationType }).length) return undefined;
      try {
        return dataRoot.getNomination(targetNominationType, targetNominationId);
      } catch (e) {
        logDebugError(`[targetNomination] Error fetching nomination: ${e}`);
        return undefined;
      }
    }
  );

  const result = matchTargetResult({
    matches,
    targetNomination
  });

  function reset(): void {
    targetNominationId.set(undefined);
    targetNominationType.set(undefined);
  }

  const matchTarget = {
    targetNomination,
    targetNominationId,
    targetNominationType,
    result,
    reset
  };

  ////////////////////////////////////////////////////////////
  // Build context
  ////////////////////////////////////////////////////////////

  return setContext<GameContext>(CONTEXT_KEY, {
    ...voterContext,
    matchTarget
  });
}
