import { type Answer, type Answers } from '@openvaa/data';
import { deepFreeze, type Frozen } from '$lib/utils/freeze';
import { logDebugError } from '$lib/utils/logger';
import { localStorageWritable } from '../utils/storageStore';
import type { TrackingService } from '../app/tracking';
import type { AnswerStore } from './answerStore.type';

/**
 * Create an extended store saved in `localStorage` for holding the voter's `Answer`s. The answers can be read in the ordinary way, but setting and deleting them can only be done using the dedicated methods.
 * The returned `Answers` are frozen to prevent accidental modifications.
 */
export function answerStore({ startEvent }: { startEvent: TrackingService['startEvent'] }): AnswerStore {
  // Create the internal store for holding the answers. Only the subsribe method will be exposed, allowing reading the contents with $answerStore
  const { update, set, subscribe } = localStorageWritable(
    'VoterContext-answerStore',
    Object.freeze({}) as Frozen<Answers>
  );

  function setAnswer(questionId: string, value?: Answer['value']): void {
    update((answers) => {
      const updated = structuredClone(answers) as Answers;
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
    set(Object.freeze({}));
    startEvent('answer_resetAll');
    logDebugError('answerStore.reset()');
  }

  return {
    deleteAnswer,
    reset,
    setAnswer,
    subscribe
  };
}
