import { type Readable, readable } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * The value of this store is `true` if the user prefers dark mode. In order for it to work, the `window` object must be available.
 * NB. For a more comprehensive mediaQuery solution, see  https://github.com/fedorovvvv/svelte-media-queries
 * @default false
 */
export const darkMode: Readable<boolean> = readable(false, (set) => {
  if (!browser || !window) return;
  const query = window.matchMedia('(prefers-color-scheme: dark)');
  function updateDarkMode(query: MediaQueryList | MediaQueryListEvent) {
    return set(query.matches);
  }
  // Set initial value
  updateDarkMode(query);
  // Listen for changes
  query.addEventListener('change', updateDarkMode);
  // Remove the listener when there are no subscribers to the store
  return () => query.removeEventListener('change', updateDarkMode);
});
