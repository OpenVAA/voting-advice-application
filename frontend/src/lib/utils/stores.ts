import {derived, get, writable} from 'svelte/store';
import type {Readable, Writable} from 'svelte/store';
import {browser} from '$app/environment';
import {page} from '$app/stores';
import localSettings from '$lib/config/settings.json';
import {logDebugError} from '$lib/utils/logger';
import {wrap} from '$lib/utils/entities';
import {match, matchParties} from '$lib/utils/matching';
import {sortCandidates, sortParties} from './sort';

/**
 * Contains the currently effective app settings.
 * NB! Settings are overwritten by root key.
 */
export const settings: Readable<AppSettings> = derived(
  [page],
  ([$page]) =>
    ($page?.data?.appSettings
      ? Object.assign(localSettings, $page.data.appSettings)
      : localSettings) as AppSettings
);

type LocallyStoredValue<T> = {
  version: number;
  data: T;
};

/**
 * Save a value to local storage to prevent them from disappearing on page refresh.
 * The function will automatically append the app version to the data so that it may be deprecated.
 * @param key The key to store the value under.
 * @param value The value to store.
 */
function saveItemToLocalStorage<T = JSONData>(key: string, value: T): void {
  const toStore: LocallyStoredValue<T> = {
    version: get(settings).appVersion.version,
    data: value
  };
  localStorage.setItem(key, JSON.stringify(toStore));
}

/**
 * Get a value stored in local storage to prevent them from disappearing on page refresh.
 * The function will automatically check whether the stored data version is up to date.
 */
function getItemFromLocalStorage<T = JSONData>(key: string): T | undefined {
  let item: T | undefined;
  if (browser && localStorage) {
    const itemInLocalStorage = localStorage.getItem(key);
    if (itemInLocalStorage) {
      const stored = JSON.parse(itemInLocalStorage) as LocallyStoredValue<T>;
      // Check that stored data is versioned and the version is greater than or equal to the required version
      if (
        stored &&
        typeof stored === 'object' &&
        stored.version != null &&
        stored.version >= get(settings).appVersion.requireUserDataVersion
      ) {
        item = stored.data;
      } else {
        localStorage.removeItem(key);
      }
    }
  }
  return item;
}

function subscribeToLocalStorage<T = JSONData>(item: Writable<T>, key: string): void {
  if (browser && localStorage) {
    item.subscribe((value) => saveItemToLocalStorage(key, value));
  }
}

function createStoreValueAndSubscribeToLocalStorage<T = JSONData>(
  key: string,
  defaultValue: T
): Writable<T> {
  const storedValue = getItemFromLocalStorage<T>(key);
  // TODO: Check that the storedValue matches the defaultValue's type
  const storeValue = writable(storedValue == null ? defaultValue : storedValue) as Writable<T>;
  subscribeToLocalStorage(storeValue, key);
  return storeValue;
}

/**
 * A store for the voter's answers which is maintained in local storage.
 */
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
 * Reset the locally stored voter answers
 */
export function resetVoterAnswers(): void {
  if (browser && localStorage) {
    localStorage.removeItem('answeredQuestions');
    answeredQuestions.set({});
    logDebugError('Local storage has been reset');
  }
}

/**
 * A store for the voter's usage preferences which is maintained in local storage.
 */
export const userPreferences = createStoreValueAndSubscribeToLocalStorage(
  'userPreferences',
  {} as UserPreferences
);

/**
 * Set the user's data consent together with the date of giving or denying the consent.
 * @param consent The value for the consent
 */
export function setDataConsent(consent: boolean) {
  userPreferences.update((d) => ({...d, dataCollection: {consent, date: new Date()}}));
}

/**
 * Utility store for the election as part of `PageData`.
 */
export const election: Readable<ElectionProps | undefined> = derived(
  page,
  ($page) => $page.data.election
);

/**
 * Utility store for candidates as part of `PageData`.
 */
export const candidates: Readable<Promise<CandidateProps[]>> = derived(
  page,
  ($page) => $page.data.candidates?.then((d) => d.sort(sortCandidates)) ?? Promise.resolve([]),
  Promise.resolve([])
);

/**
 * Utility store for parties as part of `PageData`.
 */
export const parties: Readable<Promise<PartyProps[]>> = derived(
  page,
  ($page) => $page.data.parties?.then((d) => d.sort(sortParties)) ?? Promise.resolve([]),
  Promise.resolve([])
);

/**
 * Utility store for infoQuestions as part of `PageData`.
 */
export const infoQuestions: Readable<QuestionProps[]> = derived(
  page,
  ($page) => $page.data.infoQuestions,
  []
);

/**
 * Utility store for opinionQuestions as part of `PageData`.
 */
export const opinionQuestions: Readable<QuestionProps[]> = derived(
  page,
  ($page) => $page.data.questions,
  []
);

/**
 * Utility store for an dictionary of all info and opinion questions as part of `PageData`.
 */
export const allQuestions: Readable<Record<string, QuestionProps>> = derived(
  [infoQuestions, opinionQuestions],
  ([$infoQuestions, $opinionQuestions]) =>
    Object.fromEntries([...$infoQuestions, ...$opinionQuestions].map((q) => [q.id, q])),
  {}
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
 * A store that is true, when the results (and questions) are available
 */
export const resultsAvailable: Readable<boolean> = derived(
  [answeredQuestions, opinionQuestions, settings],
  ([$answeredQuestions, $opinionQuestions, $settings]) => {
    if (!($opinionQuestions.length && Object.keys($answeredQuestions).length)) return false;
    // We need to filtering because some of the user's answers might be to questions subsequently removed or hidden
    return (
      $opinionQuestions.filter((q) => $answeredQuestions[q.id] != null).length >=
      Math.min($opinionQuestions.length, $settings.matching?.minimumAnswers ?? 1)
    );
  },
  false
);

/**
 * A store that holds the candidate rankings. For ease of use, these will be wrapped entities with no `score` properties, if results are not yet available.
 */
export const candidateRankings: Readable<
  Promise<RankingProps<CandidateProps>[] | WrappedEntity<CandidateProps>[]>
> = derived(
  [candidates, opinionQuestions, answeredQuestions, resultsAvailable, settings],
  async ([$candidates, $opinionQuestions, $answeredQuestions, $resultsAvailable, $settings]) => {
    const candidates = await $candidates;
    return $resultsAvailable
      ? match($opinionQuestions, $answeredQuestions, candidates, {
          subMatches: $settings.results.cardContents.candidate.includes('submatches')
        })
      : candidates.map(wrap);
  },
  Promise.resolve([])
);

/**
 * A store that holds the party rankings. For ease of use, these will be wrapped entities with no `score` properties, if results are not yet available.
 */
export const partyRankings: Readable<
  Promise<RankingProps<PartyProps>[] | WrappedEntity<PartyProps>[]>
> = derived(
  [candidates, parties, opinionQuestions, answeredQuestions, resultsAvailable, settings],
  async ([
    $candidates,
    $parties,
    $opinionQuestions,
    $answeredQuestions,
    $resultsAvailable,
    $settings
  ]) => {
    const candidates = await $candidates;
    const parties = await $parties;
    return $resultsAvailable && $settings.matching.partyMatching !== 'none'
      ? matchParties($opinionQuestions, $answeredQuestions, candidates, parties, {
          subMatches: $settings.results.cardContents.party.includes('submatches'),
          matchingType: $settings.matching.partyMatching
        })
      : parties.map(wrap);
  },
  Promise.resolve([])
);
