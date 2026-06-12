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
 *
 * `DarkMode` is now EXPORTED so `componentContext` composes it directly via
 * `new DarkMode()` (Phase 107 CLASS-02 — no `{ current }` handle re-export). The
 * `createDarkMode()` factory below is kept for back-compat: the Phase-102
 * appContext PoC test (`appContext.poc.svelte.test.ts`) imports it and reads
 * `.current`; it is removed only at Phase 109 when the `_poc*` consumers go.
 */
export class DarkMode {
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
 * Back-compat factory creating a reactive dark mode state. Prefer composing the
 * exported `DarkMode` class directly (`new DarkMode()`) — `componentContext` does.
 *
 * Retained until Phase 109 removes the `_poc*` PoC consumers: the Phase-102
 * appContext PoC test (`appContext.poc.svelte.test.ts`) imports `createDarkMode`
 * and reads the returned `.current` getter, so the `{ readonly current: boolean }`
 * return shape must be preserved. NOT spike-era residue — intentional-until-flatten.
 *
 * @returns An object with a reactive `current` getter that is `true` if the user prefers dark mode.
 */
export function createDarkMode(): { readonly current: boolean } {
  return new DarkMode();
}
