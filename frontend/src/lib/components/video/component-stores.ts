import { writable } from 'svelte/store';

/**
 * Store for persistent video selections.
 */
export const videoPreferences = writable({
  muted: false,
  textTracksHidden: false,
  transcriptVisible: false
});
