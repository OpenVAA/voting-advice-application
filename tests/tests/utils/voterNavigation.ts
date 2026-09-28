/**
 * Shared voter navigation helpers for E2E tests.
 *
 * These handle the full voter journey from Home to the first question, clicking through any optional intermediate pages (main intro, questions intro with/without category selection, category intros).
 *
 * The app's default behavior shows these intermediate pages. data.setup.ts disables them, but parallel settings-mutating specs may re-enable them at any time. These helpers are resilient to that.
 */

import { expect } from '@playwright/test';
import { testIds } from './testIds';
import { createVoterHomePage } from '../fixtures/voter/voterHomePage.fixture';
import { TIMEOUTS } from '../helpers';
import type { Locator, Page } from '@playwright/test';

/**
 * Click a navigation-triggering button or link of the stage walk and wait briefly for the click to take effect: the URL changes, or the clicked element detaches.
 *
 * The click has a tight 3 s budget and both waits swallow their timeout, because this is a step of a resilient walker, not an assertion. A click that does not take effect (the element detached mid-click, or it landed before the handler was attached) leaves the walk on the same stage, and `walkVoterStages` resolves the stage again and repeats the action. Detection is by route AND rendered anchor, so a button still mounted after its navigation has begun is never taken for the current page.
 *
 * The walk's guarantee is terminal: it returns only on a stage it resolved, and every spec built on it opens with its own hard assertion. For a hop whose next assertion is not a hard landing assertion, use `helpers/navigation.ts` `expectClientNavigation` instead.
 */
async function advanceClick(page: Page, target: Locator): Promise<void> {
  const urlBefore = page.url();
  try {
    // reason: deliberately TIGHTER than TIMEOUTS.click — a 3s fast-fail click so a detached/non-actionable button throws quickly instead of stalling for the full 90s test ceiling (see the docstring above). Not bucket-mappable.
    await target.click({ timeout: 3000 });
  } catch {
    // Click failed (element detached / not actionable in 3 s). The post-click settle below still attempts to confirm whether the action took effect — a click that throws actionability mid-flight often still triggers navigation if SvelteKit had already begun the route transition.
  }
  // Settle: confirm the click took effect. Either the URL changes OR the clicked target leaves the DOM. Whichever wins, the next loop iteration sees a clean post-navigation page state.
  // reason: tight 3s post-click settle race (URL-change OR target-hidden) — paired with the fast-fail click above; deliberately below TIMEOUTS.page so a no-op click short-circuits the loop iteration fast. Not bucket-mappable.
  await Promise.race([
    page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 }).catch(() => null),
    target.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => null)
  ]);
}

/**
 * The voter-flow pages the walkers recognise, each identified by its route AND a rendered anchor.
 *  - `home`, `intro`, `elections`, `constituencies`: the pages before the questions.
 *  - `questions-intro`: the questions intro page, with its start button.
 *  - `category-intro`: a category intro page, with its start link.
 *  - `question`: a question page, with a choice or a number slider.
 */
export type VoterStage =
  | 'home'
  | 'intro'
  | 'elections'
  | 'constituencies'
  | 'questions-intro'
  | 'category-intro'
  | 'question';

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
 * Budget for resolving the current stage or finishing a stage's action. It equals the per-test ceiling, so in practice the test's own timeout ends a walk that never reaches a recognised page; no walker decides that a page was skipped because it rendered late.
 */
const STAGE_BUDGET = TIMEOUTS.testMax;

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
}

/** True when `error` is a Playwright timeout, the only error a stage action retries on. */
function isTimeout(error: unknown): boolean {
  return /Timeout .* exceeded/.test(String(error));
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
 * Follow the category intro's start link once its href has resolved to a question route. The href is derived after hydration from the selected question blocks, so clicking earlier would follow a placeholder or be intercepted mid-navigation.
 */
async function continueFromCategoryIntro(page: Page): Promise<void> {
  const link = page.getByTestId(testIds.voter.questions.categoryStart);
  await expect(link).toHaveAttribute('href', /\/questions\/(?!category\/)[^/]+/, { timeout: STAGE_BUDGET });
  const href = await link.getAttribute('href');
  if (href) await page.goto(href);
}

/**
 * Take the action that leaves `stage`: the start button, the Continue button, or the category start link. An action that does not take effect, such as a click that lands before the handler is attached, throws a timeout or leaves the URL unchanged; the walk then resolves the stage again and repeats the action.
 */
async function leaveStage(page: Page, stage: VoterStage): Promise<void> {
  try {
    switch (stage) {
      case 'home':
      case 'intro':
      case 'elections':
      case 'questions-intro': {
        const target =
          stage === 'elections' ? page.getByTestId(testIds.voter.elections.continue) : stageAnchor(page, stage);
        await advanceClick(page, target);
        break;
      }
      case 'constituencies':
        await continueFromConstituencies(page);
        break;
      case 'category-intro':
        await continueFromCategoryIntro(page);
        break;
      case 'question':
        throw new Error('a question page has no leave action in the stage walk');
    }
  } catch (error) {
    if (!isTimeout(error)) throw error;
  }
  await page.waitForURL(leftStage(stage), { timeout: TIMEOUTS.page }).catch((error) => {
    if (!isTimeout(error)) throw error;
  });
}

/**
 * Walk the voter flow from whichever page is showing until it reaches one of `until`, acting on each page as it renders.
 *
 * Every page before the questions is optional: a seed can disable the intro or the questions intro, and a single election or constituency skips its selector. The walk therefore never branches on whether a page appeared within some window. It resolves the page that IS showing, acts on it, and resolves again. A page that renders late is simply acted on late.
 *
 * Fails loudly when the walk passes the question stage without reaching `until`, for example a `category-intro` walk on a seed with category intros disabled.
 *
 * @param page - Playwright Page.
 * @param until - the stages to stop on.
 * @returns the stage the walk stopped on.
 */
export async function walkVoterStages(page: Page, until: ReadonlyArray<VoterStage>): Promise<VoterStage> {
  for (;;) {
    const stage = await resolveVoterStage(page);
    if (until.includes(stage)) return stage;
    if (stage === 'question') {
      throw new Error(`voter walk: reached a question page at ${page.url()} without passing [${until.join(', ')}]`);
    }
    await leaveStage(page, stage);
  }
}

/**
 * Stop points of `advanceVoterFlow`.
 *  - `first-question`  — terminal: a question page (default).
 *  - `questions-intro` — the questions intro page (start CTA visible).
 *  - `category-intro`  — the first category intro page.
 */
type StopAt = 'first-question' | 'questions-intro' | 'category-intro';

/**
 * Advance the voter through the journey to `stopAt`. See `walkVoterStages`.
 *
 * @param page - Playwright Page
 * @param stopAt - the checkpoint to stop at; default `first-question`.
 */
async function advanceVoterFlow(page: Page, stopAt: StopAt = 'first-question'): Promise<void> {
  await walkVoterStages(page, [stopAt === 'first-question' ? 'question' : stopAt]);
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
  await advanceVoterFlow(page, 'first-question');
  // The walk stops on a question route whose choice or slider is visible. Callers of this helper answer by choice, so require the choices themselves.
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
  await answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element });
}
