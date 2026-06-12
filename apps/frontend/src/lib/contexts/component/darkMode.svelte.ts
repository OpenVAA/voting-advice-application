import { browser } from '$app/environment';

/**
 * Reactive dark-mode state as a Svelte 5 CLASS (class-conversion proof, Spikes
 * 020-023; Group B — primitive `$state` field). The reactive core is the private
 * `#dark` `$state` field; the public `current` getter reads it.
 *
 * SSR-safe with no `$effect`: the `matchMedia` read + listener are set up in the
 * constructor behind a `browser` guard (the server keeps the `false` default), so
 * the class can be constructed in any context. The `change` listener is an
 * arrow function, capturing `this` (the `$state#Classes` discipline — Spike 020).
 *
 * `current` is a prototype getter rather than an own property because, unlike
 * `dataContext`, this handle is NOT spread — `componentContext` reads it via its
 * own `get darkMode()`, so a prototype accessor is safe here (Spike 020 finding A).
 */
class DarkMode {
  #dark = $state(false);

  constructor() {
    if (browser && window) {
      const query = window.matchMedia('(prefers-color-scheme: dark)');
      this.#dark = query.matches;

      // Listen for changes -- no cleanup needed as this lives for app lifetime.
      query.addEventListener('change', (e) => {
        this.#dark = e.matches;
      });
    }
  }

  get current(): boolean {
    return this.#dark;
  }
}

/**
 * Factory creating a reactive dark mode state. Must be called inside
 * `initComponentContext()` (not at module level) to ensure SSR safety.
 *
 * @returns An object with a reactive `current` getter that is `true` if the user prefers dark mode.
 */
export function createDarkMode(): { readonly current: boolean } {
  return new DarkMode();
}
