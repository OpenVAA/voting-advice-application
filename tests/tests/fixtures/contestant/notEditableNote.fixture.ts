/**
 * @file notEditableNote fixture.
 *
 * Function-fixture for the note a Contestant App page shows when something on it cannot be edited (`apps/frontend/src/lib/contestant/components/notEditableNote/NotEditableNote.svelte`): the sentence of its reason and one Contact support button. The steps read the page that is open and navigate nowhere.
 *
 * Surface:
 *  - expectNote(reason)          — the note is visible, names that reason and holds exactly one Contact support button.
 *  - expectSupportButtons(count) — the whole page holds that many Contact support buttons.
 *  - expectNoNote()              — the page holds no note.
 *  - expectSupportButtonInsideNote() — the Contact support button of the page's one note lies inside the note.
 *
 * The first three steps locate the note by the id the pages give it while answers are locked. The last locates it by that id or by the id the nominations view gives it while nominations are locked, whichever the page holds.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Page } from '@playwright/test';

/** Why the content under a note cannot be edited, as the note names it in its `data-reason` attribute. The last is the reason the nominations view gives while answers are locked and nominations are not. */
export type NotEditableReason = 'answersLocked' | 'nominationsLocked' | 'nominationsAnswersLocked';

export function createNotEditableNote(page: Page) {
  const note = page.getByTestId(testIds.contestant.common.answersLockedWarning);
  const supportButtons = page.getByTestId(testIds.contestant.common.contactSupport);
  const anyNote = note.or(page.getByTestId(testIds.contestant.nominations.lockedNote));
  const geometry = createPageGeometry(page);

  return {
    /**
     * Assert the note is visible, names `reason` and holds exactly one Contact support button.
     */
    async expectNote(reason: NotEditableReason): Promise<void> {
      await expect(note).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(note).toHaveAttribute('data-reason', reason);
      await expect(note.getByTestId(testIds.contestant.common.contactSupport)).toHaveCount(1);
      await expect(note.getByTestId(testIds.contestant.common.contactSupport)).toBeVisible();
    },

    /**
     * Assert the whole page holds `count` Contact support buttons.
     */
    async expectSupportButtons(count: number): Promise<void> {
      await expect(supportButtons).toHaveCount(count);
    },

    /**
     * Assert the page holds no note.
     */
    async expectNoNote(): Promise<void> {
      await expect(note).toHaveCount(0);
    },

    /**
     * Assert that the page holds exactly one note, under either of its ids, and that the note's Contact support button lies wholly inside the note's box.
     */
    async expectSupportButtonInsideNote(): Promise<void> {
      await expect(anyNote).toHaveCount(1, { timeout: TIMEOUTS.slowPage });
      await geometry.expectInside(
        anyNote.getByTestId(testIds.contestant.common.contactSupport),
        anyNote,
        "the note's Contact support button"
      );
    }
  };
}

export type NotEditableNoteFixture = ReturnType<typeof createNotEditableNote>;
