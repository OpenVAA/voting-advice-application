// Defines a store getting the user's dark mode preference
// For a more comprehensive mediaQuery solution, see
// https://github.com/fedorovvvv/svelte-media-queries

import {browser} from '$app/environment';
import {readable, type Readable} from 'svelte/store';

/**
 * The value of this store is `true` if the user prefers dark mode.
 * In order to work, the `window` object must be available.
 *
 * @default false
 */
export const darkMode: Readable<boolean> = readable(false, (set) => {
  if (!browser || !window) return;
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  const updateDarkMode = (query: MediaQueryList | MediaQueryListEvent) => set(query.matches);
  // Set initial value
  updateDarkMode(query);
  // Listen for changes
  query.addEventListener('change', updateDarkMode);
  // Remove the listener when there are no subscribers to the store
  return () => query.removeEventListener('change', updateDarkMode);
});
