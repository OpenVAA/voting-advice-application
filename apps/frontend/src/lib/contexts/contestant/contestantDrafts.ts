import { removePersistedByPrefix } from '../utils/persistedState.svelte';

/**
 * The stem of the `localStorage` keys under which the Contestant App persists unsaved answers, one key for each signed-in user and entity.
 */
export const EDITED_ANSWERS_KEY_STEM = 'contestantContext-userData-editedAnswers';

/**
 * Remove every draft of the Contestant App from `localStorage`: the unsaved answers of every user and entity. Every sign-out the browser makes calls it, in either app. Does nothing outside the browser.
 *
 * A handle the Contestant App holds in this document for a removed draft stores it again on its next edit, so that app drops its handles before calling this. A handle in another document follows the removal.
 */
export function discardContestantDrafts(): void {
  removePersistedByPrefix('localStorage', `${EDITED_ANSWERS_KEY_STEM}-`);
}
