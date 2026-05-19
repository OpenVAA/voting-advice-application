import { browser } from '$app/environment';

/**
 * Factory function that creates a reactive dark mode state.
 * Must be called inside `initComponentContext()` (not at module level) to ensure SSR safety.
 *
 * @returns An object with a reactive `current` getter that is `true` if the user prefers dark mode.
 */
export function createDarkMode(): { readonly current: boolean } {
  let dark = $state(false);

  if (browser && window) {
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    dark = query.matches;

    // Listen for changes -- no cleanup needed as this lives for app lifetime
    query.addEventListener('change', (e) => {
      dark = e.matches;
    });
  }

  return {
    get current() {
      return dark;
    }
  };
}
