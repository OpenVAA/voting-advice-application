/**
 * SPIKE 003 — voterAnswerStore as a fully idiomatic Svelte 5 rune store.
 *
 * Replaces `apps/frontend/src/lib/contexts/voter/answerStore.svelte.ts`
 * which currently bridges `$state → toStore() → fromStore()` — three layers
 * just to expose `$state` reactively. This version drops all bridges:
 *
 *   - `runeLocalStorage` (in this spike) provides `$state` + imperative
 *     persistence, no `toStore`/`Writable<T>`.
 *   - Consumers read via `store.answers` (rune-tracking getter), no `fromStore`.
 *
 * Tracking-startEvent is intentionally omitted in the spike (orthogonal
 * concern); the production migration would re-add it via a hook param.
 */

import { deepFreeze } from '$lib/utils/freeze';
import { logDebugError } from '$lib/utils/logger';
import { runeLocalStorage } from './runePersistedState.svelte';
import type { Answer, Answers } from '@openvaa/data';
import type { Frozen } from '$lib/utils/freeze';

export interface VoterAnswerRuneStore {
  readonly answers: Frozen<Answers>;
  setAnswer: (questionId: string, value?: Answer['value']) => void;
  deleteAnswer: (questionId: string) => void;
  reset: () => void;
}

export function voterAnswerRuneStore(opts: { storageKey?: string } = {}): VoterAnswerRuneStore {
  const key = opts.storageKey ?? 'runes-test-VoterAnswerRuneStore';
  const store = runeLocalStorage<Frozen<Answers>>(key, Object.freeze({}) as Frozen<Answers>);

  function setAnswer(questionId: string, value?: Answer['value']): void {
    store.update((answers) => {
      // JSON round-trip rather than structuredClone — Svelte 5 $state proxies
      // are not structurally cloneable. Mirrors production answerStore.svelte.ts:23.
      const updated = JSON.parse(JSON.stringify(answers)) as Answers;
      if (value === undefined) {
        delete updated[questionId];
      } else {
        updated[questionId] = { value };
      }
      logDebugError(`voterAnswerRuneStore.setAnswer(${questionId}, ${value})`);
      return deepFreeze(updated);
    });
  }

  function deleteAnswer(questionId: string): void {
    setAnswer(questionId);
  }

  function reset(): void {
    store.set(Object.freeze({}));
    logDebugError('voterAnswerRuneStore.reset()');
  }

  return {
    get answers() {
      return store.current;
    },
    deleteAnswer,
    reset,
    setAnswer
  };
}
