/**
 * Shared voter navigation helpers for E2E tests.
 *
 * These handle the full voter journey from Home to the first question,
 * clicking through any optional intermediate pages (main intro, questions
 * intro with/without category selection, category intros).
 *
 * The app's default behavior shows these intermediate pages. data.setup.ts
 * disables them, but parallel settings-mutating specs may re-enable them
 * at any time. These helpers are resilient to that.
 */

import { buildRoute } from './buildRoute';
import { SupabaseAdminClient } from './supabaseAdminClient';
import { testIds } from './testIds';
import type { Locator, Page } from '@playwright/test';

/**
 * Cached UUID lookups for the e2e seed's elections + leaf-constituencies.
 * Resolved once per process — the seed is reset at most once per test run.
 */
let uuidCache: { electionUuids: Array<string>; constituencyUuids: Array<string> } | undefined;

async function resolveSeedUuids(): Promise<{ electionUuids: Array<string>; constituencyUuids: Array<string> }> {
  if (uuidCache) return uuidCache;
  const client = new SupabaseAdminClient();
  const e1 = await client.findData('elections', { externalId: { $eq: 'test-election-1' } });
  const e2 = await client.findData('elections', { externalId: { $eq: 'test-election-2' } });
  // Pick the first leaf-constituency in each group (e2 belongs to the
  // Municipalities group; alpha is the Region for election-1). With perfect
  // hierarchy alpha is auto-implied from e2, but providing both keeps the
  // bypass URL valid even if a variant breaks the hierarchy.
  const cAlpha = await client.findData('constituencies', { externalId: { $eq: 'test-constituency-alpha' } });
  const cE2 = await client.findData('constituencies', { externalId: { $eq: 'test-constituency-e2' } });
  uuidCache = {
    electionUuids: [e1.data?.[0]?.id, e2.data?.[0]?.id].filter((id): id is string => Boolean(id)),
    constituencyUuids: [cAlpha.data?.[0]?.id, cE2.data?.[0]?.id].filter((id): id is string => Boolean(id))
  };
  return uuidCache;
}

/**
 * Stop points the unified passer recognises.
 *  - `first-question`  — terminal: answer option is visible (default).
 *  - `questions-intro` — stop on the questions intro page (start CTA visible).
 *  - `category-intro`  — stop on the first category intro page.
 */
type StopAt = 'first-question' | 'questions-intro' | 'category-intro';

/**
 * Click a navigation-triggering checkpoint button (intro start, questions
 * start, category start) and wait for the click to actually take effect
 * before returning — either the URL changes OR the clicked element detaches
 * from the DOM.
 *
 * Why: without this post-click settle, the outer loop's next iteration can
 * see a transitional DOM state in which the just-clicked button is still
 * visible (mid-SvelteKit-transition) AND the next page's anchors are not yet
 * mounted. The loop then re-enters the same branch and tries to click the
 * already-detaching button — which hangs in Playwright's actionability check
 * for the full test timeout (90 s) instead of throwing fast.
 *
 * Failure mode this fixes (observed in voter-detail.spec.ts:79 against
 * answeredVoterPage fixture, voterNavigation.ts:164 stack):
 *
 *     Error: locator.click: Test timeout of 90000ms exceeded.
 *     waiting for getByTestId('voter-intro-start')
 *
 * The element WAS visible at probe time (`isVisible()` returned true), the
 * click is dispatched but actionability stalls because SvelteKit detached
 * the button mid-action. With this helper, the click has a tight 3 s
 * timeout and the post-click settle short-circuits the loop iteration.
 */
async function advanceClick(page: Page, target: Locator): Promise<void> {
  const urlBefore = page.url();
  try {
    await target.click({ timeout: 3000 });
  } catch {
    // Click failed (element detached / not actionable in 3 s). The post-click
    // settle below still attempts to confirm whether the action took effect —
    // a click that throws actionability mid-flight often still triggers
    // navigation if SvelteKit had already begun the route transition.
  }
  // Settle: confirm the click took effect. Either the URL changes OR the
  // clicked target leaves the DOM. Whichever wins, the next loop iteration
  // sees a clean post-navigation page state.
  await Promise.race([
    page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3000 }).catch(() => null),
    target.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => null)
  ]);
}

/**
 * Advance the voter through the journey, race-checking every cycle for any
 * possible next checkpoint and acting on whichever appears first.
 *
 * Replaces the sequential `passThroughElections → passThroughConstituencies
 * → clickThroughIntroPages` chain so missing intermediate pages don't each
 * cost a 4 s individual wait — a single race-wait surfaces whichever
 * checkpoint is actually present and the loop dispatches the right action
 * for it.
 *
 * Resilient to:
 *   - intermediate pages disabled in app settings (no-op skip)
 *   - SvelteKit `goto()` silently failing post-continue (hard-nav fallback)
 *   - elements detaching mid-click due to concurrent settings mutation
 *     (retry on next iteration)
 *   - SvelteKit route-transition DOM where a just-clicked button is briefly
 *     still visible after its navigation has begun: every navigation-
 *     triggering click goes through `advanceClick()` which post-click waits
 *     for URL change or target-hidden before returning, so the next loop
 *     iteration cannot re-enter the same branch on a stale-but-visible DOM.
 *
 * @param page - Playwright Page
 * @param stopAt - the checkpoint to stop at; default `first-question`.
 * @param opts.maxSteps - safety cap on the loop (default 10; the journey
 *   has at most 5 real hops so 10 is generous headroom).
 * @param opts.perStepTimeout - max wait per race cycle in ms (default 5000).
 */
async function advanceVoterFlow(
  page: Page,
  stopAt: StopAt = 'first-question',
  opts: { maxSteps?: number; perStepTimeout?: number } = {}
): Promise<void> {
  const maxSteps = opts.maxSteps ?? 10;
  const perStepTimeout = opts.perStepTimeout ?? 5000;

  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  const electionsCont = page.getByTestId(testIds.voter.elections.continue);
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  const constituenciesCont = page.getByTestId(testIds.voter.constituencies.continue);
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();

  // Race-wait locator: any visible checkpoint advances the loop. `.first()`
  // disambiguates if the page renders multiple at once (shouldn't happen in
  // normal flow but harmless).
  const anyCheckpoint = introStart
    .or(electionsList)
    .or(constituenciesList)
    .or(questionsStart)
    .or(categoryStart)
    .or(answerOption)
    .first();

  for (let step = 0; step < maxSteps; step++) {
    await anyCheckpoint.waitFor({ state: 'visible', timeout: perStepTimeout });

    // Probe each checkpoint in priority order: closest-to-terminal first so
    // an already-visible answer option short-circuits the loop without
    // spending any extra time on the earlier checkpoints.
    if (await answerOption.isVisible()) return;

    if (await categoryStart.isVisible()) {
      if (stopAt === 'category-intro') return;
      await advanceClick(page, categoryStart);
      continue;
    }

    if (await questionsStart.isVisible()) {
      if (stopAt === 'questions-intro') return;
      await advanceClick(page, questionsStart);
      continue;
    }

    if (await constituenciesList.isVisible()) {
      // Pick the first option in each combobox; the base e2e seed has a
      // perfect hierarchy (one selector per election, region auto-implied).
      const comboboxes = constituenciesList.getByRole('combobox');
      const count = await comboboxes.count();
      for (let i = 0; i < count; i++) {
        const combo = comboboxes.nth(i);
        await combo.click();
        const listbox = page.getByRole('listbox');
        await listbox.waitFor({ state: 'visible', timeout: 5000 });
        await listbox.getByRole('option').first().click();
      }
      await constituenciesCont.waitFor({ state: 'visible' });
      const urlBefore = page.url();
      try {
        await constituenciesCont.click({ timeout: 3000 });
      } catch {
        continue;
      }
      try {
        await page.waitForURL(
          (url) => url.toString() !== urlBefore && !url.toString().includes('/constituencies'),
          { timeout: 3000 }
        );
      } catch {
        await navigateDirectlyToQuestions(page);
      }
      continue;
    }

    if (await electionsList.isVisible()) {
      // Accept the default selection (all elections pre-checked).
      await electionsCont.waitFor({ state: 'visible' });
      const urlBefore = page.url();
      try {
        await electionsCont.click({ timeout: 3000 });
      } catch {
        continue;
      }
      try {
        await page.waitForURL(
          (url) => url.toString() !== urlBefore && !url.toString().includes('/elections'),
          { timeout: 3000 }
        );
      } catch {
        await navigateDirectlyToQuestions(page);
      }
      continue;
    }

    if (await introStart.isVisible()) {
      await advanceClick(page, introStart);
      continue;
    }
  }

  // Loop exhausted — fall through to an explicit terminal wait so the caller
  // gets a meaningful Playwright timeout error pointing at the expected
  // checkpoint rather than a generic loop-out.
  if (stopAt === 'first-question') {
    await answerOption.waitFor({ state: 'visible', timeout: perStepTimeout });
  } else if (stopAt === 'questions-intro') {
    await questionsStart.waitFor({ state: 'visible', timeout: perStepTimeout });
  } else {
    await categoryStart.waitFor({ state: 'visible', timeout: perStepTimeout });
  }
}

/**
 * Hard-navigation fallback used when SvelteKit goto() silently fails to
 * advance from /elections or /constituencies. Looks up the seed UUIDs once
 * and sends the page straight to /questions with both election + constituency
 * IDs in the search params.
 */
async function navigateDirectlyToQuestions(page: Page): Promise<void> {
  const { electionUuids, constituencyUuids } = await resolveSeedUuids();
  const baseUrl = page.url().replace(/\/(elections|constituencies).*$/, '');
  const eqs = electionUuids.map((id) => `electionId=${encodeURIComponent(id)}`).join('&');
  const cqs = constituencyUuids.map((id) => `constituencyId=${encodeURIComponent(id)}`).join('&');
  const sep = eqs && cqs ? '&' : '';
  await page.goto(`${baseUrl}/questions?${eqs}${sep}${cqs}`);
}

/**
 * Navigate from Home through all intermediate pages to the first question.
 *
 * Handles: Home → Intro → (Elections?) → (Constituencies?) → (Questions Intro?)
 *          → (Category Intro?) → First Question.
 *
 * After returning, the page is on an actual question page (URL matches
 * /questions/[id]) with answer options visible.
 */
export async function navigateToFirstQuestion(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();
  await advanceVoterFlow(page, 'first-question');
  // Ensure the URL has settled on a real question page — the questions intro
  // page can redirect /questions → /questions/__first__ via onMount; this
  // wait prevents the caller's downstream waitForURL from racing the redirect.
  await page.waitForURL(/\/questions\//, { timeout: 10000 });
}

/**
 * Walk Home → Intro → /elections → /constituencies and stop on the questions
 * intro page (the page with the category checkboxes + "Answer N Questions"
 * counter). Use this when the test wants to inspect the intro page itself
 * rather than the first question.
 */
export async function walkToQuestionsIntro(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();
  await advanceVoterFlow(page, 'questions-intro');
}

/**
 * Walk from Home all the way to a specific question by sort_order, skipping
 * every preceding question via the nextButton (Skip CTA). Composes
 * `walkToQuestionsIntro(page)` + clicks `voter.questions.startButton` (to
 * advance from the intro to the first question at sort 0) + loops
 * `voter.questions.nextButton.click()` × `sortOrder` times so the voter
 * lands on the question at the given sort_order without answering any
 * previous question.
 *
 * Used by Phase 75 Plan 01 (`voter-question-rendering-boolean.spec.ts`,
 * QSPEC-01) and Plan 02a (`voter-question-rendering-categorical.spec.ts`,
 * QSPEC-02) to reach the categorical question at sort 17 and the boolean
 * question at sort 18 without relying on the `answeredVoterPage` fixture.
 * The fixture's Likert `.nth(4)` click pattern is out of range for the
 * boolean (2 choices) and the categorical (3 choices) per Phase 75
 * RESEARCH Pitfall 6.
 *
 * NOTE: a future Phase 78 / CLEAN-05 follow-up (operator-locked Path B in
 * `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`)
 * will introduce a `--likert-only` seed modifier that deprecates this
 * manual walk.
 *
 * @param page - Playwright Page
 * @param sortOrder - the number of Skip-Next clicks to perform after the
 *   start CTA.
 */
export async function walkToQuestion(page: Page, sortOrder: number): Promise<void> {
  await walkToQuestionsIntro(page);
  await page.getByTestId(testIds.voter.questions.startButton).click();
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  for (let i = 0; i < sortOrder; i++) {
    await nextButton.waitFor({ state: 'visible', timeout: 10000 });
    await nextButton.click();
  }
}

/**
 * Wait for the next question's answer options, clicking through any
 * category intro page that may appear between questions.
 */
export async function waitForNextQuestion(page: Page, answerIndex: number): Promise<void> {
  const nextAnswer = page.getByTestId(testIds.voter.questions.answerOption).nth(answerIndex);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  await nextAnswer.or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });
  if (await categoryStart.isVisible()) {
    await categoryStart.click();
    await nextAnswer.waitFor({ state: 'visible', timeout: 10000 });
  }
}

/**
 * Click through any intermediate pages (questions intro, category intro)
 * until the first question's answer options are visible.
 *
 * Retained for callers that already passed elections + constituencies on
 * their own and only need the tail of the journey (Q-intro / category-intro
 * → first answer). New code should prefer `navigateToFirstQuestion` which
 * runs the unified flow end-to-end via `advanceVoterFlow`.
 */
export async function clickThroughIntroPages(page: Page): Promise<void> {
  await advanceVoterFlow(page, 'first-question');
}
