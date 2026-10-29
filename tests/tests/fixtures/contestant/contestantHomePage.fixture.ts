/**
 * @file contestantHomePage fixture.
 *
 * Function-fixture for the home of an entity of the Contestant App: the entity's task list, the preview entry as its last item, one reason sentence and the main action.
 *
 * Surface:
 *  - expectStatusMessage(text?)         — visibility + optional text-content match on contestant-home-status.
 *  - clickTask('profile' | 'opinions' | 'preview') — dispatch to the contestant-home-{profile,questions, preview} button. Note: 'opinions' maps to contestant-home-questions (the UI label is "Opinions" but the testid is `contestant-home-questions`).
 *  - clickContinue()                    — click contestant-home-continue (variant="main" primary action).
 *
 * The task list. Each step below reads a state attribute, never a label, and every one of its assertions is hard:
 *  - expectTaskList({ nomination, profile, questions }) — the list says it is ready, and each row says its status; a task given as `null` has no row. The list keeps a minimum width. Nothing here needs the page's script.
 *  - expectTaskCount(task, count)       — the figure of the row's badge, its mark for an incomplete task with nothing to count, or no badge.
 *  - expectPreview('open' | 'closed')   — the preview entry is the list's last item; what it says of itself, whether it can be operated, and that it leads with the lock while it is closed. The icon is drawn by the page's script.
 *  - expectReason(reason)               — the sentence that says why an entry is closed, by its reason, or no such sentence.
 *  - expectNextStep(step)               — where the main action leads.
 *  - expectClosedEntryDescribed(entry)  — a closed entry cannot be operated and is described by the reason sentence.
 *  - expectGreeting(name)               — the page's first-level heading holds the name.
 *
 * The email task of an address awaiting its confirmation link, the first row of the task list:
 *  - expectEmailTask(address)           — the list's first row is the email task, and its label names the address.
 *  - followEmailTask()                  — follow the email task to the settings page.
 *
 * Switch profile, at the top of the home of a user who edits several entities:
 *  - switchProfile()                    — once the home has hydrated, press Switch profile.
 *  - expectSwitchProfile()              — Switch profile is shown.
 *  - expectNoSwitchProfile()            — Switch profile is not rendered.
 *
 * The page's width, measured through the steps of `shared/pageGeometry.fixture.ts`:
 *  - expectFitsViewport()               — the page is no wider than its viewport.
 *  - expectGreetingFits()               — the first-level heading lies inside the viewport's width and shows its whole text.
 *  - expectHeadingFocused()             — the first-level heading has focus, as after the view the user arrived from was replaced.
 *
 * **Rigidity contract:** NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions. This fixture is one of three that DOES use `expect.soft` — 2 call sites, both in `expectStatusMessage`, so a status message that is not shown and one with the wrong text are reported together. It is outside `SOFT_ASSERTION_BUDGETS`, which is deliberately scoped to `voter-journey.spec.ts`; see the note above that table in `playwright.config.ts`.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TIMEOUTS, waitForNavigationFocusReset } from '../../helpers';
import { contestantSettingsUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Locator, Page } from '@playwright/test';

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

/**
 * Read one message of the English message source.
 * @param file - The file's name under `apps/frontend/messages/en`, without its extension; the namespace is the file's single top-level key.
 * @param key - The message's key inside the namespace.
 */
function englishMessage(file: string, key: string): string {
  const source = JSON.parse(
    fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en', `${file}.json`), 'utf8')
  ) as Record<string, Record<string, unknown>>;
  return String(source[file][key]);
}

/**
 * The path data of a material icon, read from the icon's source rather than copied, to tell which icon an entry shows.
 * @param file - The icon's file name under `svg/material`, without its extension.
 */
function materialIconPath(file: string): string {
  const source = fs.readFileSync(
    path.join(TESTS_DIR, '../../apps/frontend/src/lib/components/icon/svg/material', `${file}.ts`),
    'utf8'
  );
  const match = source.match(/ d="([^"]+)"/);
  if (!match) throw new Error(`the icon ${file} holds no path`);
  return match[1];
}

/** The lock, which every entry that cannot be entered leads with. */
const LOCK_PATH = materialIconPath('lock');

/**
 * The path data of the icon an entry leads with, or `null` while its drawing is not loaded.
 * @param entry - The entry's button.
 */
function iconPathOf(entry: Locator): Promise<string | null> {
  return entry.evaluate((element) => element.querySelector('svg path')?.getAttribute('d') ?? null);
}

/** The email task's label, read from the message source rather than copied; `{email}` stands for the address. */
const EMAIL_TASK_MESSAGE = englishMessage('contestantApp.home', 'emailTask');

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
     * Assert the status of each task of the home's task list, and that the list keeps a minimum width. The list is first awaited until it says it is ready, so no status is read from a list whose statuses are not decided yet. Every assertion holds in a browser that runs no script.
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
      const minWidth = await taskList.evaluate((list) => getComputedStyle(list).minWidth);
      expect(minWidth, 'the task list keeps a minimum width').not.toMatch(/^(auto|0px)$/);
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
     * Assert that the preview entry is the task list's last item, whether it says it is open or closed, that it can be operated when open and cannot when closed, and that it leads with the lock when closed and with another icon when open. The icon is drawn by the page's script, so the step needs it to run.
     * @param state - What the entry's `data-preview` says.
     */
    async expectPreview(state: 'open' | 'closed'): Promise<void> {
      const preview = page.getByTestId(ids.preview);
      await expect(preview).toHaveAttribute('data-preview', state, { timeout: TIMEOUTS.slowPage });
      await expect(taskList.getByRole('listitem').last().getByTestId(ids.preview)).toHaveCount(1, {
        timeout: TIMEOUTS.slowPage
      });
      if (state === 'closed') {
        await expect(preview).toBeDisabled({ timeout: TIMEOUTS.slowPage });
        await expect
          .poll(() => iconPathOf(preview), {
            message: 'the closed preview leads with the lock',
            timeout: TIMEOUTS.slowPage
          })
          .toBe(LOCK_PATH);
      } else {
        await expect(preview).toBeEnabled({ timeout: TIMEOUTS.slowPage });
        await expect
          .poll(
            async () => {
              const drawn = await iconPathOf(preview);
              return drawn !== null && drawn !== LOCK_PATH;
            },
            { message: 'the open preview leads with its own icon', timeout: TIMEOUTS.slowPage }
          )
          .toBe(true);
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
     * Assert that the first row of the task list is the email task of an address awaiting its confirmation link, and that its label names the address.
     *
     * @param address - The pending address.
     */
    async expectEmailTask(address: string): Promise<void> {
      const firstRow = taskList.getByRole('listitem').first();
      await expect(firstRow).toHaveAttribute('data-testid', ids.emailPending, { timeout: TIMEOUTS.slowPage });
      await expect(firstRow).toBeVisible();
      await expect(firstRow).toHaveText(EMAIL_TASK_MESSAGE.replace('{email}', address));
    },

    /**
     * Follow the email task and assert that the settings page, at the app's root, is reached.
     */
    async followEmailTask(): Promise<void> {
      await page.getByTestId(ids.emailPending).getByRole('button').click();
      await expect(page).toHaveURL(contestantSettingsUrlRe(), { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Wait until the home has hydrated, then press Switch profile. The wait makes the press a navigation inside the application, as a user's is once the page is interactive.
     */
    async switchProfile(): Promise<void> {
      await expect(page.getByTestId(ids.switchProfile)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await waitForNavigationFocusReset(page);
      await page.getByTestId(ids.switchProfile).click();
    },

    /**
     * Assert that Switch profile is shown.
     */
    async expectSwitchProfile(): Promise<void> {
      await expect(page.getByTestId(ids.switchProfile)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that Switch profile is not rendered. The home's status message is awaited first, so the absence is read from a rendered home.
     */
    async expectNoSwitchProfile(): Promise<void> {
      await expect(page.getByTestId(ids.statusMessage)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByTestId(ids.switchProfile)).toHaveCount(0);
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
    },

    /**
     * Assert that the page's first-level heading has focus. A keyboard or screen-reader user who passed a gate starts on the page that replaced it, not on the document body.
     */
    async expectHeadingFocused(): Promise<void> {
      await expect(page.getByRole('heading', { level: 1 })).toBeFocused({ timeout: TIMEOUTS.slowPage });
    }
  };
}

export type ContestantHomePageFixture = ReturnType<typeof createContestantHomePage>;
