import { fromStore } from 'svelte/store';
import { deepFreeze } from '$lib/utils/freeze';
import { logDebugError } from '$lib/utils/logger';
import { localStorageWritable } from '../utils/persistedState.svelte';
import type { Answer, Answers } from '@openvaa/data';
import type { Frozen } from '$lib/utils/freeze';
import type { TrackingService } from '../app/tracking';
import type { AnswerStore } from './answerStore.type';

/**
 * Create an extended reactive store saved in `localStorage` for holding the voter's `Answer`s. The answers can be read via the `answers` getter, but setting and deleting them can only be done using the dedicated methods.
 * The returned `Answers` are frozen to prevent accidental modifications.
 */
export function answerStore({ startEvent }: { startEvent: TrackingService['startEvent'] }): AnswerStore {
  // Create the internal store for holding the answers
  const store = localStorageWritable('VoterContext-answerStore', Object.freeze({}) as Frozen<Answers>);
  const storeState = fromStore(store);

  function setAnswer(questionId: string, value?: Answer['value']): void {
    store.update((answers) => {
      // Use JSON round-trip instead of structuredClone because Svelte 5's
      // $state proxy objects cannot be structurally cloned
      const updated = JSON.parse(JSON.stringify(answers)) as Answers;
      if (value === undefined) {
        delete updated[questionId];
        startEvent('answer_delete', { questionId });
      } else {
        updated[questionId] = { value };
        startEvent('answer', {
          questionId,
          value: typeof value === 'number' || typeof value === 'boolean' ? value : `${value}`
        });
      }
      logDebugError(`answerStore.setAnswer(${questionId}, ${value})`);
      return deepFreeze(updated);
    });
  }

  function deleteAnswer(questionId: string): void {
    setAnswer(questionId);
  }

  function reset(): void {
    store.set(Object.freeze({}));
    startEvent('answer_resetAll');
    logDebugError('answerStore.reset()');
  }

  return {
    get answers() {
      return storeState.current;
    },
    deleteAnswer,
    reset,
    setAnswer
  };
}
