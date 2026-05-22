/**
 * SPIKE 005 — Scoped rune-native rewrite of candidateUserDataStore.
 *
 * Production `apps/frontend/src/lib/contexts/candidate/candidateUserDataStore.svelte.ts`
 * is ALMOST fully rune-native already — it uses `$state`, `$derived.by`, `$effect`,
 * and getter exports. The ONLY legacy bits are the edited-answers persistence
 * layer (lines 38-42, 130, 138, 144) that bridges through
 * `localStorageWritable` + `fromStore`.
 *
 * This spike isolates and replaces those four lines with the rune-native
 * `runeLocalStorage` helper, demonstrating that the production migration is a
 * mechanical swap. Save-to-DB and auth-bound methods (reloadCandidateData,
 * save) are out of scope — they would require a live candidate session.
 *
 * Composite contract preserved:
 *   - `current`     → composite of "saved" + "edited" candidate data
 *   - `hasUnsaved`  → true iff any edited answers exist
 *   - `unsavedIds`  → list of question IDs with unsaved edits
 *
 * The composite `current` is a $derived built over rune store + $state — no
 * `fromStore`, no `Writable<T>`, no `get()`.
 */

import { runeLocalStorage } from './runePersistedState.svelte';
import type { Id } from '@openvaa/core';

// Loose shapes for the spike — production uses LocalizedAnswer + CandidateUserData<true>.
// The spike only exercises the answer-merge logic so this minimal shape suffices.
type AnswerValue = string | number | boolean;
type EditedAnswers = Record<Id, { value: AnswerValue }>;

interface SavedCandidate {
  id: Id;
  firstName: string;
  lastName: string;
  answers: EditedAnswers;
}

export interface CandidateAnswerRuneStore {
  readonly current: SavedCandidate | undefined;
  readonly hasUnsaved: boolean;
  readonly unsavedIds: ReadonlyArray<Id>;
  init: (saved: SavedCandidate) => void;
  setAnswer: (questionId: Id, value: AnswerValue) => void;
  resetAnswer: (questionId: Id) => void;
  resetAll: () => void;
  reset: () => void;
}

export function candidateAnswerRuneStore(
  opts: { storageKey?: string } = {}
): CandidateAnswerRuneStore {
  const key = opts.storageKey ?? 'runes-test-CandidateAnswerRuneStore-edited';

  let saved = $state<SavedCandidate | undefined>(undefined);
  const edited = runeLocalStorage<EditedAnswers>(key, {});

  // Composite — merges saved.answers with edited overrides. Exact pattern from
  // production candidateUserDataStore.svelte.ts:56-77 (without the image/ToS
  // overrides, which are out of scope for the answer-focused spike).
  const current = $derived.by(() => {
    if (!saved) return undefined;
    const mergedAnswers = { ...saved.answers, ...edited.current };
    // JSON round-trip — same defensive clone as production (line 67).
    return JSON.parse(JSON.stringify({ ...saved, answers: mergedAnswers })) as SavedCandidate;
  });

  const unsavedIds = $derived(Object.keys(edited.current));
  const hasUnsaved = $derived(unsavedIds.length > 0);

  return {
    get current() {
      return current;
    },
    get hasUnsaved() {
      return hasUnsaved;
    },
    get unsavedIds() {
      return unsavedIds;
    },
    init(value) {
      saved = value;
    },
    setAnswer(questionId, value) {
      edited.update((a) => ({ ...a, [questionId]: { value } }));
    },
    resetAnswer(questionId) {
      edited.update((a) => {
        const next = { ...a };
        delete next[questionId];
        return next;
      });
    },
    resetAll() {
      edited.set({});
    },
    reset() {
      saved = undefined;
      edited.set({});
    }
  };
}
