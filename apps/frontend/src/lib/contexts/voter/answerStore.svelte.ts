import { deepFreeze } from '$lib/utils/freeze';
import { logDebugError } from '$lib/utils/logger';
import { localStorageState } from '../utils/persistedState.svelte';
import type { Answer, Answers } from '@openvaa/data';
import type { Frozen } from '$lib/utils/freeze';
import type { TrackingService } from '../app/tracking';
import type { AnswerStore } from './answerStore.type';

/**
 * A Svelte 5 class implementation of the voter's `Answer` store (v2.13
 * context-as-class migration, CLASS-05). The persistence + version bridge is
 * INHERITED from `localStorageState`/`PersistedStateImpl` unchanged (§22) — this
 * class does NOT own a `#version`; the `{ version, data }` payload + expiry live
 * in `persistedState.svelte.ts` (already shipped, Phase 96), so the spike-022
 * silent-spin caveat is already mitigated upstream and is NOT re-implemented here.
 *
 * The answers can be read via the reactive `answers` getter, but setting and
 * deleting them can only be done using the dedicated methods. The returned
 * `Answers` are deep-frozen to prevent accidental modifications.
 *
 * `setAnswer`/`deleteAnswer`/`reset` are ARROW-FUNCTION FIELDS (§18) so they
 * survive being destructured/passed by consumers as detached callbacks (they
 * cross the context boundary). `answers` is a prototype getter read in-place
 * (§17 — answerStore is NOT spread by any consumer, so a prototype getter is
 * safe).
 */
class AnswerStoreImpl implements AnswerStore {
  // The persistence + version bridge is inherited from `localStorageState`
  // unchanged (§22): the `{ version, data }` payload + expiry live in
  // `persistedState.svelte.ts`, not here.
  #store = localStorageState('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);
  #startEvent: TrackingService['startEvent'];

  constructor(startEvent: TrackingService['startEvent']) {
    this.#startEvent = startEvent;
  }

  get answers(): Frozen<Answers> {
    return this.#store.current;
  }

  setAnswer = (questionId: string, value?: Answer['value']): void => {
    this.#store.update((answers) => {
      // Use JSON round-trip instead of structuredClone because Svelte 5's
      // $state proxy objects cannot be structurally cloned
      const updated = JSON.parse(JSON.stringify(answers)) as Answers;
      if (value === undefined) {
        delete updated[questionId];
        this.#startEvent('answer_delete', { questionId });
      } else {
        updated[questionId] = { value };
        this.#startEvent('answer', {
          questionId,
          value: typeof value === 'number' || typeof value === 'boolean' ? value : `${value}`
        });
      }
      logDebugError(`answerStore.setAnswer(${questionId}, ${value})`);
      return deepFreeze(updated);
    });
  };

  deleteAnswer = (questionId: string): void => this.setAnswer(questionId);

  reset = (): void => {
    this.#store.set(Object.freeze({}));
    this.#startEvent('answer_resetAll');
    logDebugError('answerStore.reset()');
  };
}

/**
 * Create an extended reactive store saved in `localStorage` for holding the voter's `Answer`s. The answers can be read via the `answers` getter, but setting and deleting them can only be done using the dedicated methods.
 * The returned `Answers` are frozen to prevent accidental modifications.
 */
export function answerStore({ startEvent }: { startEvent: TrackingService['startEvent'] }): AnswerStore {
  return new AnswerStoreImpl(startEvent);
}
