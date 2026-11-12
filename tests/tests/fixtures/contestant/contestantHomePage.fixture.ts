/**
 * @file contestantHomePage fixture.
 *
 * Function-fixture for the home of an entity of the Contestant App: the entity's task list, the preview entry under it, one reason sentence and the main action.
 *
 * Surface:
 *  - expectStatusMessage(text?)         — visibility + optional text-content match on contestant-home-status.
 *  - clickTask('profile' | 'opinions' | 'preview') — dispatch to the contestant-home-{profile,questions, preview} button. Note: 'opinions' maps to contestant-home-questions (the UI label is "Opinions" but the testid is `contestant-home-questions`).
 *  - clickContinue()                    — click contestant-home-continue (variant="main" primary action).
 *
 * The task list. Each step below reads a state attribute, never a label, and every one of its assertions is hard:
 *  - expectTaskList({ nomination, profile, questions }) — the list says it is ready, and each row says its status; a task given as `null` has no row.
 *  - expectTaskCount(task, count)       — the figure of the row's badge, its mark for an incomplete task with nothing to count, or no badge.
 *  - expectPreview('open' | 'closed')   — what the preview entry says of itself, and whether it can be operated.
 *  - expectReason(reason)               — the sentence that says why an entry is closed, by its reason, or no such sentence.
 *  - expectNextStep(step)               — where the main action leads.
 *  - expectClosedEntryDescribed(entry)  — a closed entry cannot be operated and is described by the reason sentence.
 *  - expectGreeting(name)               — the page's first-level heading holds the name.
 *
 * The page's width, measured through the steps of `shared/pageGeometry.fixture.ts`:
 *  - expectFitsViewport()               — the page is no wider than its viewport.
 *  - expectGreetingFits()               — the first-level heading lies inside the viewport's width and shows its whole text.
 *
 * **Rigidity contract:** NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions. This fixture is one of three that DOES use `expect.soft` — 2 call sites, both in `expectStatusMessage`, so a status message that is not shown and one with the wrong text are reported together. It is outside `SOFT_ASSERTION_BUDGETS`, which is deliberately scoped to `voter-journey.spec.ts`; see the note above that table in `playwright.config.ts`.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Page } from '@playwright/test';

/** An entry of the home that `clickTask` presses, by the word a spec uses for it. */
export type ContestantHomeTask = 'profile' | 'opinions' | 'preview';

/** A task of the home's task list, as the row's `data-task` names it. */
export type ContestantHomeListTask = 'nomination' | 'profile' | 'questions';

/** What a row of a ready task list says of its task, in `data-status`. */
export type ContestantHomeTaskStatus = 'complete' | 'incomplete' | 'blocked';

/** The status of each task of the list. A task given as `null` is expected to have no row. */
export type ContestantHomeTaskStatuses = Readonly<Record<ContestantHomeListTask, ContestantHomeTaskStatus | null>>;

/** Why an entry of the home is closed, as the reason sentence's `data-reason` names it. */
export type ContestantHomeClosedReason = 'noNomination' | 'previewNotReady';

/** Where the main action leads, as its `data-next-step` names it. */
export type ContestantHomeNextStep = ContestantHomeListTask | 'preview';

/** An entry of the home that can be closed: a task row's button, or the preview entry. */
export type ContestantHomeClosableEntry = 'profile' | 'questions' | 'preview';

/** The tasks of the list, in the order their rows are read. */
const LIST_TASKS: ReadonlyArray<ContestantHomeListTask> = Object.freeze(['nomination', 'profile', 'questions']);

/** The test id of each task row's button and of the preview entry. */
const ENTRY_TESTIDS: Readonly<Record<ContestantHomeListTask | 'preview', string>> = Object.freeze({
  nomination: testIds.contestant.home.nomination,
  profile: testIds.contestant.home.profile,
  questions: testIds.contestant.home.questions,
  preview: testIds.contestant.home.preview
});

/**
 * Maps the SETTINGS-keyword task identifiers to the underlying testids on `contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/+page.svelte`.
 * 'opinions' → contestant-home-questions per the source-of-truth attribute in the same file.
 */
const TASK_TESTIDS: Readonly<Record<ContestantHomeTask, string>> = Object.freeze({
  profile: 'contestant-home-profile',
  opinions: testIds.contestant.home.questions,
  preview: 'contestant-home-preview'
});

export function createContestantHomePage(page: Page) {
  const ids = testIds.contestant.home;
  const taskList = page.getByTestId(ids.tasks);
  const closedReason = page.getByTestId(ids.closedReason);
  const mainAction = page.getByTestId(ids.continue);
  const geometry = createPageGeometry(page);

  /** The row of one task of the list: the row that holds the task's own button. */
  function taskRow(task: ContestantHomeListTask) {
    return taskList.getByTestId(ids.task).filter({ has: page.getByTestId(ENTRY_TESTIDS[task]) });
  }

  return {
    /**
     * Assert the contestant-home-status paragraph is visible. When `text` is supplied, additionally assert the rendered content matches.
     * Folds in the prior expectCompletedMessage() use case (callers pass a "completed"-matching RegExp).
     */
    async expectStatusMessage(text?: RegExp): Promise<void> {
      const status = page.getByTestId(testIds.contestant.home.statusMessage);
      await expect.soft(status).toBeVisible();
      if (text !== undefined) {
        await expect.soft(status).toContainText(text);
      }
    },

    /**
     * Click the profile's or the opinions' row, or the preview entry. Dispatches via TASK_TESTIDS.
     */
    async clickTask(task: ContestantHomeTask): Promise<void> {
      await page.getByTestId(TASK_TESTIDS[task]).click();
    },

    /**
     * Click the contestant-home-continue (variant="main") primary action.
     */
    async clickContinue(): Promise<void> {
      await page.getByTestId('contestant-home-continue').click();
    },

    /**
     * Assert the status of each task of the home's task list. The list is first awaited until it says it is ready, so no status is read from a list whose statuses are not decided yet.
     * @param statuses - The status each task's row says, or `null` for a task that has no row.
     */
    async expectTaskList(statuses: ContestantHomeTaskStatuses): Promise<void> {
      await expect(taskList).toHaveAttribute('data-task-state', 'ready', { timeout: TIMEOUTS.slowPage });
      for (const task of LIST_TASKS) {
        const status = statuses[task];
        if (status === null) {
          await expect(taskRow(task)).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
        } else {
          await expect(taskRow(task)).toHaveAttribute('data-task', task, { timeout: TIMEOUTS.slowPage });
          await expect(taskRow(task)).toHaveAttribute('data-status', status, { timeout: TIMEOUTS.slowPage });
        }
      }
    },

    /**
     * Assert what the badge of a task's row shows.
     * @param task - The task whose row is read.
     * @param count - The figure the badge shows, `'!'` for the mark of an incomplete task with nothing to count, or `null` for a row with no badge.
     */
    async expectTaskCount(task: ContestantHomeListTask, count: number | '!' | null): Promise<void> {
      await expect(taskRow(task)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const badge = taskRow(task).getByTestId(ids.taskBadge);
      if (count === null) {
        await expect(badge).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
      } else {
        await expect(badge).toHaveText(String(count), { timeout: TIMEOUTS.slowPage });
      }
    },

    /**
     * Assert whether the preview entry says it is open or closed, and that it can be operated when open and cannot when closed.
     * @param state - What the entry's `data-preview` says.
     */
    async expectPreview(state: 'open' | 'closed'): Promise<void> {
      const preview = page.getByTestId(ids.preview);
      await expect(preview).toHaveAttribute('data-preview', state, { timeout: TIMEOUTS.slowPage });
      if (state === 'closed') {
        await expect(preview).toBeDisabled({ timeout: TIMEOUTS.slowPage });
      } else {
        await expect(preview).toBeEnabled({ timeout: TIMEOUTS.slowPage });
      }
    },

    /**
     * Assert the sentence that says why an entry is closed.
     * @param reason - The reason the sentence names in `data-reason`, or `null` for a home that shows no such sentence.
     */
    async expectReason(reason: ContestantHomeClosedReason | null): Promise<void> {
      if (reason === null) {
        await expect(closedReason).toHaveCount(0, { timeout: TIMEOUTS.slowPage });
        return;
      }
      await expect(closedReason).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(closedReason).toHaveAttribute('data-reason', reason, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert where the main action leads.
     * @param step - The task, or the preview, the main action's `data-next-step` names.
     */
    async expectNextStep(step: ContestantHomeNextStep): Promise<void> {
      await expect(mainAction).toHaveAttribute('data-next-step', step, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that a closed entry cannot be operated and that its accessible description is the text of the reason sentence the page shows.
     * @param entry - The task whose row's button is read, or the preview entry.
     */
    async expectClosedEntryDescribed(entry: ContestantHomeClosableEntry): Promise<void> {
      await expect(closedReason).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const sentence = ((await closedReason.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      expect(sentence, 'the reason sentence holds text').not.toBe('');
      const button = page.getByTestId(ENTRY_TESTIDS[entry]);
      await expect(button).toBeDisabled({ timeout: TIMEOUTS.slowPage });
      await expect(button).toHaveAccessibleDescription(sentence, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the page's first-level heading holds a name.
     * @param name - The name the heading greets the user by.
     */
    async expectGreeting(name: string): Promise<void> {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(name, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the page is no wider than its viewport.
     */
    async expectFitsViewport(): Promise<void> {
      await geometry.expectNoHorizontalOverflow();
    },

    /**
     * Assert that the page's first-level heading fits: its box lies between the viewport's left and right edges, and its text does not reach beyond its own box. A name too long for one line is then wrapped, not cut off and not run out of the heading.
     */
    async expectGreetingFits(): Promise<void> {
      const heading = page.getByRole('heading', { level: 1 });
      await geometry.expectWithinViewportWidth(heading, "the home's first-level heading");
      await geometry.expectShowsWholeText(heading, "the home's first-level heading");
    }
  };
}

export type ContestantHomePageFixture = ReturnType<typeof createContestantHomePage>;
