/**
 * The Contestant App's drafts in `localStorage`: the stem of their keys and the one function that removes them.
 *
 * `$app/environment` answers the `browser` each case sets, the browser's by default, because the storage helpers do nothing outside it.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { discardContestantDrafts, EDITED_ANSWERS_KEY_STEM } from './contestantDrafts';

const { environment } = vi.hoisted(() => ({ environment: { browser: true } }));

vi.mock('$app/environment', () => ({
  get browser() {
    return environment.browser;
  },
  dev: true,
  building: false,
  version: 'test'
}));

/** The keys `localStorage` holds, sorted. */
function storedKeys(): Array<string> {
  return Object.keys(localStorage).sort();
}

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  environment.browser = true;
});

describe('the Contestant App’s drafts', () => {
  it('are stored under keys that start with the stem', () => {
    expect(EDITED_ANSWERS_KEY_STEM).toBe('contestantContext-userData-editedAnswers');
  });

  it('discardContestantDrafts removes the draft of every user and entity, and no other key', () => {
    localStorage.setItem(`${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`, 'draft of user 1');
    localStorage.setItem(`${EDITED_ANSWERS_KEY_STEM}-user-1-organization-org-1`, 'draft of user 1');
    localStorage.setItem(`${EDITED_ANSWERS_KEY_STEM}-user-2-candidate-cand-2`, 'draft of user 2');
    localStorage.setItem('appContext-userPreferences', 'kept');
    localStorage.setItem('VoterContext-answerStore', 'kept');
    localStorage.setItem(`other-${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`, 'kept');

    discardContestantDrafts();

    expect(storedKeys()).toEqual(
      [
        'appContext-userPreferences',
        'VoterContext-answerStore',
        `other-${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`
      ].sort()
    );
  });

  it('discardContestantDrafts leaves sessionStorage as it is', () => {
    sessionStorage.setItem(`${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`, 'kept');

    discardContestantDrafts();

    expect(sessionStorage.getItem(`${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`)).toBe('kept');
  });

  it('discardContestantDrafts removes nothing outside the browser', () => {
    localStorage.setItem(`${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`, 'draft');
    environment.browser = false;

    discardContestantDrafts();

    expect(storedKeys()).toEqual([`${EDITED_ANSWERS_KEY_STEM}-user-1-candidate-cand-1`]);
  });
});
