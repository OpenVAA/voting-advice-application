/**
 * Shared voter navigation helpers for E2E tests.
 *
 * These handle the full voter journey from Home to the first question, clicking through any optional intermediate pages (main intro, questions intro with/without category selection, category intros).
 *
 * The app's default behavior shows these intermediate pages. data.setup.ts disables them, but parallel settings-mutating specs may re-enable them at any time. These helpers are resilient to that.
 */

import { errors, expect, test } from '@playwright/test';
import { testIds } from './testIds';
import { FIRST_QUESTION_ID } from '../../../apps/frontend/src/lib/routes/route';
import { createVoterHomePage } from '../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS, waitForHydration } from '../helpers';
import type { Locator, Page } from '@playwright/test';

/**
 * The voter-flow pages the walkers recognise, each identified by its route AND a rendered anchor.
 *  - `home`, `intro`, `elections`, `constituencies`: the pages before the questions.
 *  - `questions-intro`: the questions intro page, with its start button.
 *  - `category-intro`: a category intro page, with its start link.
 *  - `question`: a question page, with a choice or a number slider.
 */
export type VoterStage =
  'home' | 'intro' | 'elections' | 'constituencies' | 'questions-intro' | 'category-intro' | 'question';

/** Every stage, in walk order. */
const ALL_STAGES: ReadonlyArray<VoterStage> = [
  'home',
  'intro',
  'elections',
  'constituencies',
  'questions-intro',
  'category-intro',
  'question'
];

/** An optional two-letter locale segment: the base locale is served from `/`, the others from `/<locale>`. */
const LOCALE = '(?:/[a-z]{2})?';

/** The pathname of each stage's route. The query string is not part of the match. */
const STAGE_PATH: Record<VoterStage, RegExp> = {
  home: new RegExp(`^${LOCALE}/?$`),
  intro: new RegExp(`^${LOCALE}/intro/?$`),
  elections: new RegExp(`^${LOCALE}/elections/?$`),
  constituencies: new RegExp(`^${LOCALE}/constituencies/?$`),
  'questions-intro': new RegExp(`^${LOCALE}/questions/?$`),
  'category-intro': new RegExp(`^${LOCALE}/questions/category/[^/]+/?$`),
  question: new RegExp(`^${LOCALE}/questions/(?!category/)[^/]+/?$`)
};

/**
 * Budget for one stage of the walk: resolving the page that is showing, or finishing that page's action. It is a third of the per-test ceiling, so 30 s locally and 60 s on GitHub Actions.
 *
 * It stays below the ceiling so that a walk stuck on one page fails with its own message, naming the stage and the URL, before the test's timeout ends the run. No walker uses it to decide that a page was skipped: a page is acted on whenever it renders.
 */
export const STAGE_BUDGET = TIMEOUTS.testMax / 3;

function stageAnchor(page: Page, stage: VoterStage): Locator {
  switch (stage) {
    case 'home':
      return page.getByTestId(testIds.voter.home.startButton);
    case 'intro':
      return page.getByTestId(testIds.voter.intro.startButton);
    case 'elections':
      return page.getByTestId(testIds.voter.elections.list);
    case 'constituencies':
      return page.getByTestId(testIds.voter.constituencies.list);
    case 'questions-intro':
      return page.getByTestId(testIds.voter.questions.startButton);
    case 'category-intro':
      return page.getByTestId(testIds.voter.questions.categoryStart);
    case 'question':
      return page
        .getByTestId(testIds.voter.questions.answerOption)
        .first()
        .or(page.getByTestId(testIds.voter.questions.numberSlider).first())
        .first();
  }
}

/**
 * Wait until the page shows one of `stages` and return it.
 *
 * A stage counts only when the URL is on its route AND its anchor is visible, so the outgoing page's content, still mounted for a moment after the URL has changed, never counts as the next page. The check repeats until a stage matches; it takes no branch on elapsed time.
 *
 * The elections, constituencies and question anchors render only after hydration, because they read the data root that the root layout provides from an effect. So those stages also mean the page is interactive.
 *
 * @param page - Playwright Page.
 * @param stages - the stages to accept; default every stage.
 */
export async function resolveVoterStage(
  page: Page,
  stages: ReadonlyArray<VoterStage> = ALL_STAGES
): Promise<VoterStage> {
  return test.step(`resolve the voter stage: one of [${stages.join(', ')}]`, async () => {
    let found: VoterStage | undefined;
    await expect(
      async () => {
        const path = new URL(page.url()).pathname;
        for (const stage of stages) {
          if (STAGE_PATH[stage].test(path) && (await stageAnchor(page, stage).isVisible())) {
            found = stage;
            return;
          }
        }
        throw new Error(`the voter flow shows none of [${stages.join(', ')}] at ${page.url()}`);
      },
      `the voter flow reaches one of [${stages.join(', ')}]`
    ).toPass({ timeout: STAGE_BUDGET });
    return found as VoterStage;
  });
}

/** The first line of an error's message, for a one-line diagnosis. */
function firstLine(error: unknown): string {
  return String(error instanceof Error ? error.message : error).split('\n')[0];
}

/**
 * True when `error` is a Playwright timeout, which a stage action reports with the stage and the URL. That is an action or wait that threw `TimeoutError`, or a web-first assertion that ran out of time, whose matcher result then carries the timeout.
 */
function isTimeout(error: unknown): boolean {
  if (error instanceof errors.TimeoutError) return true;
  const matcherResult = (error as { matcherResult?: { timeout?: number } } | null)?.matcherResult;
  return matcherResult?.timeout !== undefined;
}

/** True once the URL is off `stage`'s route. */
function leftStage(stage: VoterStage): (url: URL) => boolean {
  return (url) => !STAGE_PATH[stage].test(url.pathname);
}

/**
 * Pick the first option in each constituency combobox, then continue. The base e2e seed has one selector per election, with the region implied.
 */
async function continueFromConstituencies(page: Page): Promise<void> {
  const list = page.getByTestId(testIds.voter.constituencies.list);
  const comboboxes = list.getByRole('combobox');
  const count = await comboboxes.count();
  for (let i = 0; i < count; i++) {
    await comboboxes.nth(i).click({ timeout: TIMEOUTS.click });
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: TIMEOUTS.page });
    await listbox.getByRole('option').first().click({ timeout: TIMEOUTS.click });
  }
  await page.getByTestId(testIds.voter.constituencies.continue).click({ timeout: STAGE_BUDGET });
}

/**
 * A category start href that points at a question: a question route that is neither a category route nor the first-question placeholder.
 */
const RESOLVED_QUESTION_HREF = new RegExp(`/questions/(?!category/|${FIRST_QUESTION_ID}(?:[/?#]|$))[^/?#]+`);

/**
 * Follow the category intro's start link, by navigating to its href once that href points at one of this category's questions.
 *
 * The href is derived after hydration from the selected question blocks. Until they resolve, it holds the first-question placeholder, which renders the app's first question rather than this category's, so following it early would re-enter a question. A plain click is also unsafe: the link re-renders when its href resolves, which detaches it mid-click, and during navigation the document root intercepts pointer events.
 *
 * @param page - Playwright Page, on a category intro page.
 */
export async function followCategoryStart(page: Page): Promise<void> {
  const link = page.getByTestId(testIds.voter.questions.categoryStart);
  await expect(link, 'the category intro start link points at one of its questions').toHaveAttribute(
    'href',
    RESOLVED_QUESTION_HREF,
    { timeout: STAGE_BUDGET }
  );
  const href = await link.getAttribute('href');
  if (!href) throw new Error(`voter walk: the category intro start link lost its href at ${page.url()}`);
  await page.goto(href);
}

/**
 * Take the action that leaves `stage` — the start button, the Continue button, or the category start link — and wait until the URL is off the stage's route. The caller has waited for the page to hydrate, so the action is taken once. An action or a wait that times out throws an error naming the stage and the URL; any other error is thrown as it is.
 */
async function leaveStage(page: Page, stage: VoterStage): Promise<void> {
  try {
    switch (stage) {
      case 'home':
      case 'intro':
      case 'questions-intro':
        await stageAnchor(page, stage).click({ timeout: STAGE_BUDGET });
        break;
      case 'elections':
        await page.getByTestId(testIds.voter.elections.continue).click({ timeout: STAGE_BUDGET });
        break;
      case 'constituencies':
        await continueFromConstituencies(page);
        break;
      case 'category-intro':
        await followCategoryStart(page);
        break;
      case 'question':
        throw new Error('a question page has no leave action in the stage walk');
    }
    await page.waitForURL(leftStage(stage), { timeout: STAGE_BUDGET });
  } catch (error) {
    if (!isTimeout(error)) throw error;
    throw new Error(
      `voter walk: the action of the ${stage} page at ${page.url()} did not leave it: ${firstLine(error)}`,
      {
        cause: error
      }
    );
  }
}

/**
 * Walk the voter flow from whichever page is showing until it reaches one of `until`, acting on each page as it renders.
 *
 * Every page before the questions is optional: a seed can disable the intro or the questions intro, and a single election or constituency skips its selector, and parallel settings specs can toggle the optional pages. The walk therefore never branches on whether a page appeared within some window. It resolves the page that IS showing, waits for that page's document to hydrate, acts on it once, and resolves again. A page that renders late is simply acted on late.
 *
 * Fails loudly when:
 *  - the walk passes the question stage without reaching `until`, for example a `category-intro` walk on a seed with category intros disabled;
 *  - a page's action does not leave it within `STAGE_BUDGET`, for example a disabled start button or a modal over the Continue button; the message names the stage and the URL;
 *  - the page the walk resolves after an action is the one it just left.
 *
 * @param page - Playwright Page.
 * @param until - the stages to stop on.
 * @returns the stage the walk stopped on.
 */
export async function walkVoterStages(page: Page, until: ReadonlyArray<VoterStage>): Promise<VoterStage> {
  let previousKey: string | undefined;
  for (;;) {
    const stage = await resolveVoterStage(page);
    if (until.includes(stage)) return stage;
    if (stage === 'question') {
      throw new Error(`voter walk: reached a question page at ${page.url()} without passing [${until.join(', ')}]`);
    }
    const key = `${stage} ${new URL(page.url()).pathname}`;
    if (key === previousKey) {
      throw new Error(`voter walk: the ${stage} page at ${page.url()} is showing again after its action left it`);
    }
    previousKey = key;
    await waitForHydration(page, { timeout: STAGE_BUDGET });
    await leaveStage(page, stage);
  }
}

/**
 * Navigate from Home through all intermediate pages to the first question.
 *
 * Handles: Home → Intro → (Elections?) → (Constituencies?) → (Questions Intro?)
 *          → (Category Intro?) → First Question.
 *
 * After returning, the page is on a question route with answer options visible.
 */
export async function navigateToFirstQuestion(page: Page): Promise<void> {
  // Home-route nav + start click go through the voterHomePage fixture (goToPage hard-asserts the voter-home load anchor before clickStart). The fixture is instantiated directly from the raw `page` since this is a util helper, not a Playwright-fixture consumer.
  const voterHomePage = createVoterHomePage(page);
  await voterHomePage.goToPage('en');
  await voterHomePage.clickStart();
  await walkVoterStages(page, ['question']);
  // The walk stops on a question route whose choice or slider is visible. Callers of this helper answer by choice, so require the choices themselves.
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
  await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
}
