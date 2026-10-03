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
import { TIMEOUTS } from '../helpers';
import type { Locator, Page } from '@playwright/test';

/**
 * Click a navigation-triggering button or link of the stage walk and wait briefly for the click to take effect: the URL changes, or the clicked element detaches.
 *
 * The click has a tight 3 s budget and both waits swallow their timeout, because this is a step of a resilient walker, not an assertion. A click that does not take effect (the element detached mid-click, or it landed before the handler was attached) leaves the walk on the same stage, and `walkVoterStages` resolves the stage again and repeats the action until its progress check gives up. Any error other than a timeout, such as a strict-mode violation, is thrown. Detection is by route AND rendered anchor, so a button still mounted after its navigation has begun is never taken for the current page.
 *
 * The walk's guarantee is terminal: it returns only on a stage it resolved, and every spec built on it opens with its own hard assertion. For a hop whose next assertion is not a hard landing assertion, use `helpers/navigation.ts` `expectClientNavigation` instead.
 *
 * @returns the first line of the click's timeout error, or `undefined` when the click went through.
 */
async function advanceClick(page: Page, target: Locator): Promise<string | undefined> {
  const urlBefore = page.url();
  let clickError: string | undefined;
  try {
    // reason: a fixed 3s fast-fail click, far below STAGE_BUDGET, so a detached or non-actionable button times out quickly and the walk resolves the stage again (see the docstring above). Not bucket-mappable.
    await target.click({ timeout: 3000 });
  } catch (error) {
    if (!isTimeout(error)) throw error;
    // The element was not actionable within 3 s. The settle below still checks whether the action took effect: a click that times out mid-flight often still navigates if SvelteKit had already begun the route transition.
    clickError = firstLine(error);
  }
  // Settle: confirm the click took effect. Either the URL changes OR the clicked target leaves the DOM. Whichever wins, the next loop iteration sees a clean post-navigation page state.
  // reason: tight 3s post-click settle race (URL-change OR target-hidden) — paired with the fast-fail click above; deliberately below TIMEOUTS.page so a no-op click short-circuits the loop iteration fast. Not bucket-mappable.
  await Promise.race([
    page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 }).catch(() => null),
    target.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => null)
  ]);
  return clickError;
}

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
 * True when `error` is a Playwright timeout, the only error a stage action retries on. That is an action or wait that threw `TimeoutError`, or a web-first assertion that ran out of time, whose matcher result then carries the timeout.
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
  await advanceClick(page, page.getByTestId(testIds.voter.constituencies.continue));
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
 * Take the action that leaves `stage`: the start button, the Continue button, or the category start link. An action that does not take effect, such as a click that lands before the handler is attached, throws a timeout or leaves the URL unchanged; the walk then resolves the stage again and repeats the action. Any error other than a timeout is thrown.
 *
 * @returns the first line of the timeout the action swallowed, or `undefined` when it raised none.
 */
async function leaveStage(page: Page, stage: VoterStage): Promise<string | undefined> {
  let actionError: string | undefined;
  try {
    switch (stage) {
      case 'home':
      case 'intro':
      case 'elections':
      case 'questions-intro': {
        const target =
          stage === 'elections' ? page.getByTestId(testIds.voter.elections.continue) : stageAnchor(page, stage);
        actionError = await advanceClick(page, target);
        break;
      }
      case 'constituencies':
        await continueFromConstituencies(page);
        break;
      case 'category-intro':
        await followCategoryStart(page);
        break;
      case 'question':
        throw new Error('a question page has no leave action in the stage walk');
    }
  } catch (error) {
    if (!isTimeout(error)) throw error;
    actionError = firstLine(error);
  }
  await page.waitForURL(leftStage(stage), { timeout: TIMEOUTS.page }).catch((error) => {
    if (!isTimeout(error)) throw error;
  });
  return actionError;
}

/**
 * Walk the voter flow from whichever page is showing until it reaches one of `until`, acting on each page as it renders.
 *
 * Every page before the questions is optional: a seed can disable the intro or the questions intro, and a single election or constituency skips its selector. The walk therefore never branches on whether a page appeared within some window. It resolves the page that IS showing, acts on it, and resolves again. A page that renders late is simply acted on late.
 *
 * Fails loudly in two cases:
 *  - the walk passes the question stage without reaching `until`, for example a `category-intro` walk on a seed with category intros disabled;
 *  - one page's action does not take effect: the same stage on the same path is still showing `STAGE_BUDGET` after the walk first acted on it. A disabled start button, or a modal over the Continue button, ends up here. The message names the stage, the URL, the number of attempts and the last swallowed error.
 *
 * @param page - Playwright Page.
 * @param until - the stages to stop on.
 * @returns the stage the walk stopped on.
 */
export async function walkVoterStages(page: Page, until: ReadonlyArray<VoterStage>): Promise<VoterStage> {
  let current: { key: string; since: number; attempts: number } | undefined;
  let lastActionError: string | undefined;
  for (;;) {
    const stage = await resolveVoterStage(page);
    if (until.includes(stage)) return stage;
    if (stage === 'question') {
      throw new Error(`voter walk: reached a question page at ${page.url()} without passing [${until.join(', ')}]`);
    }
    const key = `${stage} ${new URL(page.url()).pathname}`;
    if (current?.key !== key) {
      current = { key, since: Date.now(), attempts: 0 };
    } else if (Date.now() - current.since >= STAGE_BUDGET) {
      throw new Error(
        `voter walk: stuck on the ${stage} page at ${page.url()}. ` +
          `Its action did not take effect in ${current.attempts} attempt(s) over ${Date.now() - current.since} ms. ` +
          (lastActionError
            ? `The last attempt failed with: ${lastActionError}`
            : 'Every attempt completed without leaving the page.')
      );
    }
    current.attempts++;
    lastActionError = await leaveStage(page, stage);
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
