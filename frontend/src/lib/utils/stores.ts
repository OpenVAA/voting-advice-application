import {derived, readable, writable} from 'svelte/store';
import type {Readable, Writable} from 'svelte/store';
import {browser} from '$app/environment';
import {page} from '$app/stores';
import type {VoterAnswers} from '$lib/types';
import localSettings from '$lib/config/settings.json';
import {logDebugError} from '$lib/utils/logger';
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
export const answeredQuestions = createStoreValueAndSubscribeToLocalStorage(
  'answeredQuestions',
  {} as VoterAnswers
);

/**
 * Reset the local storage values
 */
export function resetLocalStorage(): void {
  if (browser && localStorage) {
    localStorage.removeItem('answeredQuestions');
    answeredQuestions.set({});
    logDebugError('Local storage has been reset');
  }
}

/**
 * A store that is true, when the results are available
 */
export const resultsAvailable: Readable<boolean> = derived(
  [page, answeredQuestions],
  ([$page, $answeredQuestions]) =>
    // TODO: Use a setting to set the minimum number of answers required
    $page.data.questions.length > 0 && Object.values($answeredQuestions).length > 0,
  false
);

// Currently, it's quite silly that we need to separate matches and candidates, but when the
// vaa-data model integration is complete, the proper Candidate object will be
// contained in the Match objects themselves.
export const candidateRankings: Readable<RankingProps<CandidateProps>[]> = derived(
  [page, answeredQuestions],
  ([$page, $answeredQuestions]) => {
    if (
      Object.values($answeredQuestions).length === 0 ||
      $page.data.candidates.length === 0 ||
      $page.data.questions.length === 0
    ) {
      return [];
    }
    return matchCandidates($page.data.questions, $answeredQuestions, $page.data.candidates);
  },
  []
);

/**
 * This store tells which application we're using. For other app types,
 * set this to the current type in the layout containing the app.
 */
export const appType: Writable<AppType> = writable('voter');

/**
 * The possible types of the application
 */
export type AppType = 'candidate' | 'voter';

/**
 * Contains the current app settings. This currently includes only the local settings, but in the future this can include the effective settings incorporating any choices made by the user of the app.
 */
export const settings: Readable<typeof localSettings> = readable(localSettings);
