import { writable } from 'svelte/store';

/**
 * Store for persistent video selections.
 */
export const videoPreferences = writable({
  muted: false,
  textTracksHidden: false,
  transcriptVisible: false,
  /**
   * Whether the user has hidden the whole player. This is only used for videos without a transcript, for which `transcriptVisible` serves the same purpose. NB. Unlike the other preferences, this one is applied by the `LayoutContext` and not the `Video` component itself.
   */
  videoHidden: false
});
