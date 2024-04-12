import {derived, readable, writable} from 'svelte/store';
import type {Readable, Writable} from 'svelte/store';
import {browser} from '$app/environment';
import {page} from '$app/stores';
import localSettings from '$lib/config/settings.json';
import {logDebugError} from '$lib/utils/logger';
import {wrap} from '$lib/utils/entities';
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
  {} as AnswerDict
);

/**
 * Set a voter's answer value
 * @param questionId The question id
 * @param value The question value. If `undefined`, the answer will be deleted
 */
export function setVoterAnswer(questionId: string, value?: AnswerProps['value']) {
  answeredQuestions.update((d) => {
    if (value === undefined) {
      delete d[questionId];
    } else {
      d[questionId] = {value};
    }
    return d;
  });
}

/**
 * Delete a voter's answer value
 * @param questionId The question id
 */
export function deleteVoterAnswer(questionId: string) {
  setVoterAnswer(questionId);
}

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
  [answeredQuestions],
  ([$answeredQuestions]) => {
    // TODO: Use a setting to set the minimum number of answers required
    return Object.values($answeredQuestions).length > 0;
  },
  false
);

/**
 * Utility stores for candidates as part of `PageData`.
 */
export const candidates: Readable<CandidateProps[]> = derived(
  page,
  ($page) => $page.data.candidates,
  []
);

/**
 * Utility stores for parties as part of `PageData`.
 */
export const parties: Readable<PartyProps[]> = derived(page, ($page) => $page.data.parties, []);

/**
 * Utility stores for infoQuestions as part of `PageData`.
 */
export const infoQuestions: Readable<QuestionProps[]> = derived(
  page,
  ($page) => $page.data.infoQuestions,
  []
);

/**
 * Utility stores for opinionQuestions as part of `PageData`.
 */
export const opinionQuestions: Readable<QuestionProps[]> = derived(
  page,
  ($page) => $page.data.questions,
  []
);

/**
 * A store that holds the candidate rankings. For ease of use, these will be wrapped entities with no `score` properties, if results are not yet available.
 */
export const candidateRankings: Readable<
  RankingProps<CandidateProps>[] | WrappedEntity<CandidateProps>[]
> = derived(
  [candidates, opinionQuestions, answeredQuestions, resultsAvailable],
  ([$candidates, $opinionQuestions, $answeredQuestions, $resultsAvailable]) => {
    return $resultsAvailable
      ? matchCandidates($opinionQuestions, $answeredQuestions, $candidates)
      : $candidates.map(wrap);
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
