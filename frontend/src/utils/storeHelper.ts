import {writable} from 'svelte/store';
import type {Writable} from 'svelte/store';
import {browser} from '$app/environment';

/**
 * Store values in local storage to prevent them from disappearing in refresh
 * Here we check if item already exists on a refresh event
 * @param key
 */
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

/**
 * Creates a svelte Writable object and stores it in local storage to prevent values from disappearing on refresh
 * @param key
 * @param defaultValue
 */
export function createStoreValueAndSubscribeToLocalStorage(
  key: string,
  defaultValue: unknown
): Writable<unknown> {
  const storeValue = writable(getItemFromLocalStorage(key) || defaultValue);
  subscribeToLocalStorage(storeValue, key);
  return storeValue;
}
