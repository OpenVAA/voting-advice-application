/**
 * In-memory module-scoped UI-preference state for the video player.
 *
 * Holds the user's `muted`, `textTracksHidden` and `transcriptVisible` choices
 * for the lifetime of the page session. These are NOT persisted to any storage,
 * so they do not survive a page reload — they reset to their defaults on each
 * fresh load.
 *
 * Exposes a `{ current, set, update }` rune handle (the project-standard
 * Svelte 5 replacement for the old `svelte/store` mutable-store primitive).
 */
let prefs = $state({
  muted: false,
  textTracksHidden: false,
  transcriptVisible: false
});

export const videoPreferences = {
  get current(): typeof prefs {
    return prefs;
  },
  set(v: typeof prefs): void {
    prefs = v;
  },
  update(fn: (p: typeof prefs) => typeof prefs): void {
    prefs = fn(prefs);
  }
};
