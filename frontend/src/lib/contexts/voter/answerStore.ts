import { deepFreeze, type Frozen } from '$lib/utils/freeze';
import { logDebugError } from '$lib/utils/logger';
import { localStorageWritable } from '../utils/storageStore';
import type { TrackingService } from '../app/tracking';
import type { AnswerStore, VoterAnswer, VoterAnswers } from './answerStore.type';

/**
 * Create an extended store saved in `localStorage` for holding the **Voter's** `VoterAnswer`s. The answers can be read in the ordinary way, but setting and deleting them can only be done using the dedicated methods.
 * The returned `VoterAnswers` are frozen to prevent accidental modifications.
 * NB. For saving a Candidate’s answers, use the `userDataStore`.
 */
export function answerStore({ startEvent }: { startEvent: TrackingService['startEvent'] }): AnswerStore {
  // Create the internal store for holding the answers. Only the subsribe method will be exposed, allowing reading the contents with $answerStore
  const { update, set, subscribe } = localStorageWritable(
    'VoterContext-answerStore',
    Object.freeze({}) as Frozen<VoterAnswers>
  );

  /**
   * Internal method for setting an answer.
   */
  function editAnswer({
    questionId,
    value,
    weight,
    action
  }: {
    questionId: string;
    action: 'setAnswerOrWeight' | 'deleteAnswer' | 'deleteWeight';
    value?: VoterAnswer['value'];
    weight?: number;
  }): void {
    update((answers) => {
      const updated = structuredClone(answers) as VoterAnswers;
      switch (action) {
        case 'deleteAnswer':
          delete updated[questionId];
          startEvent('answer_delete', { questionId });
          break;
        case 'deleteWeight':
          if (updated[questionId]?.weight != null) {
            delete updated[questionId]?.weight;
            startEvent('answer_resetWeight', { questionId });
          }
          break;
        case 'setAnswerOrWeight':
          if (value != null) {
            if (updated[questionId] == null) updated[questionId] = { value };
            else updated[questionId].value = value;
            if (weight != null) updated[questionId].weight = weight;
            startEvent('answer', {
              questionId,
              value: typeof value === 'number' || typeof value === 'boolean' ? value : `${value}`,
              weight: weight ?? null,
              hadPreviousAnswer: answers[questionId]?.value != null
            });
          } else if (weight != null) {
            if (updated[questionId] == null) updated[questionId] = { weight };
            else updated[questionId].weight = weight;
            startEvent('answer_setWeight', { questionId, weight });
          } else {
            throw new Error('Invalid value or weight');
          }
          break;
        default:
          throw new Error(`Invalid action: ${action}`);
      }
      logDebugError(`answerStore.editAnswer(${questionId}, ${action}, ${value}, ${weight})`);
      return deepFreeze(updated);
    });
  }

  function setAnswer(questionId: string, value: VoterAnswer['value'], options?: { weight?: number }): void {
    editAnswer({ questionId, action: 'setAnswerOrWeight', value, weight: options?.weight });
  }

  function setWeight(questionId: string, weight: number): void {
    editAnswer({ questionId, action: 'setAnswerOrWeight', weight });
  }

  function deleteAnswer(questionId: string): void {
    editAnswer({ questionId, action: 'deleteAnswer' });
  }

  function resetWeight(questionId: string): void {
    editAnswer({ questionId, action: 'deleteWeight' });
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
    setWeight,
    resetWeight,
    subscribe
  };
}
