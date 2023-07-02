import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import {browser} from '$app/environment';
import type {Answer} from '../types/answer.type';
import type {CandidateRank} from '../types/candidateRank.type';

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
export const currentQuestion = createStoreValueAndSubscribeToLocalStorage('currentQuestion', 1);
export const answeredQuestions = createStoreValueAndSubscribeToLocalStorage(
  'answeredQuestions',
  [] as Answer[]
);
export const candidateRankings = createStoreValueAndSubscribeToLocalStorage(
  'candidateRankings',
  [] as CandidateRank[]
);
