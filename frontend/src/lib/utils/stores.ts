import {derived, writable} from 'svelte/store';
import type {Readable, Writable} from 'svelte/store';
import {browser} from '$app/environment';
import type {VoterAnswer} from '$types/index';
import {logDebugError} from './logger';
import type {QuestionProps} from '$lib/components/questions';
import type {CandidateProps, RankingProps} from '$lib/components/candidates';
import type {Match} from '$lib/vaa-matching';
import {matchCandidates} from '$lib/utils/matching';

// Store values in local storage to prevent them from disappearing in refresh
// Here we check if item already exists on a refresh event
function getItemFromLocalStorage(key: string): unknown {
  let item = null;
  if (browser && localStorage) {
    const itemInLocalStorage = localStorage.getItem(key);
    item = itemInLocalStorage ? JSON.parse(itemInLocalStorage) : null;
  }
  return item;
}

function subscribeToLocalStorage<T>(item: Writable<T>, key: string): void {
  if (browser && localStorage) {
    item.subscribe((value) => localStorage.setItem(key, JSON.stringify(value)));
  }
}

function createStoreValueAndSubscribeToLocalStorage<T>(key: string, defaultValue: T): Writable<T> {
  const storedValue = getItemFromLocalStorage(key);
  // TODO: Check that the storedValue matches the defaultValue's type
  const storeValue = writable(storedValue === null ? defaultValue : storedValue) as Writable<T>;
  subscribeToLocalStorage(storeValue, key);
  return storeValue;
}

// Create the actual Svelte store values
// TODO: Use proper types for these when these have been defined
export const currentQuestionIndex = createStoreValueAndSubscribeToLocalStorage(
  'currentQuestion',
  0
);
export const answeredQuestions = createStoreValueAndSubscribeToLocalStorage(
  'answeredQuestions',
  [] as VoterAnswer[]
);

/**
 * Reset the local storage values
 */
export function resetLocalStorage(): void {
  if (browser && localStorage) {
    localStorage.removeItem('currentQuestion');
    localStorage.removeItem('answeredQuestions');
    currentQuestionIndex.set(0);
    answeredQuestions.set([]);
    logDebugError('Local storage has been reset');
  }
}

// Stores that are not locally stored
export const allQuestions = writable<QuestionProps[]>([]);
export const allCandidates = writable<CandidateProps[]>([]);
export const candidateMatches = writable<Match[]>([]);

// Currently, it's quite silly that we need to separate matches and candidates, but when the
// vaa-data model integration is complete, the proper Candidate object will be
// contained in the Match objects themselves.
export const candidateRankings: Readable<{match: RankingProps; candidate: CandidateProps}[]> =
  derived(
    [allQuestions, answeredQuestions, allCandidates],
    ([$allQuestions, $answeredQuestions, $allCandidates]) => {
      if (
        $answeredQuestions.length === 0 ||
        $allCandidates.length === 0 ||
        $allQuestions.length === 0
      ) {
        return [];
      }
      const matches = matchCandidates($allQuestions, $answeredQuestions, $allCandidates);
      const rankings = [];
      for (const match of matches) {
        const candidate = $allCandidates.find(
          (c) => 'id' in match.entity && c.id === match.entity.id
        );
        if (candidate) {
          rankings.push({match: match as RankingProps, candidate});
        }
      }
      return rankings;
    },
    []
  );
