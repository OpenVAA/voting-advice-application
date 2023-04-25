import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import {browser} from '$app/environment';

// Store values in local storage to prevent them from disappearing in refresh
// Here we check if item already exists on a refresh event
function getItemFromLocalStorage(key: string): unknown {
  let item = null;
  if (browser && localStorage) {
    const itemInLocalStorage = localStorage.getItem(key);
    item = itemInLocalStorage ? JSON.parse(itemInLocalStorage) : '';
  }
  return item;
}

function subscribeToLocalStorage(item: Writable<unknown>, key: string): void {
  if (browser && localStorage) {
    item.subscribe((value) => localStorage.setItem(key, JSON.stringify(value)));
  }
}

function createStoreValueAndSubscribeToLocalStorage(
  key: string,
  defaultValue: unknown
): Writable<unknown> {
  const storeValue = writable(getItemFromLocalStorage(key) || defaultValue);
  subscribeToLocalStorage(storeValue, key);
  return storeValue;
}

// Create the actual Svelte store values
export const currentQuestionId = createStoreValueAndSubscribeToLocalStorage('currentQuestionId', 1);
export const answeredQuestions = createStoreValueAndSubscribeToLocalStorage('answeredQuestions', 1);
export const candidateRankings = createStoreValueAndSubscribeToLocalStorage('candidateRankings', 1);
