/**
 * Voter navigation (skip/delete/back) E2E tests (E2E-06).
 *
 * Asserts the contracts:
 * - When a voter answers N ≥ `minimumAnswers` (default 5 per
 *   `packages/app-shared/src/settings/dynamicSettings.ts:42`) opinion
 *   questions, the results-CTA renders in the "results" state
 *   (`t('results.title.results')` per
 *   `apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte:87`).
 * - Deleting answers until the count drops below `minimumAnswers` toggles
 *   the CTA text to the "browse" state (`t('results.title.browse')`).
 * - Re-answering enough questions toggles the CTA back to "results".
 * - Browser-back navigation after these state transitions does not corrupt
 *   the voter's answer state — navigating back to a question that was
 *   answered before the back-nav still reports it as answered (the delete
 *   button is rendered, which is gated by `answers.answers[id]?.value != null`
 *   per the voter question page).
 *
 * Serial describe + shared page: mirrors the `voter-journey.spec.ts` shape.
 * The inline answer-loop in `beforeAll` mirrors `voter.fixture.ts:52-94`
 * because Playwright `serial` mode forbids per-test fixture acquisition
 * across tests. Voter has NO auth — no `storageState` is needed.
 *
 * ## DATA_RACE classification — surfaced to Plan 07
 *
 * This spec inherits the Phase-73-locked DATA_RACE for the voter answer-
 * loop: the e2e seed has 40 heterogeneous questions but the fixture-shape
 * answer loop hard-codes 16 Likert answers (Q1–Q16) and breaks on the
 * Q25/40 categorical question (only 3 choices, `answerOption.nth(4)` is
 * invisible). Root cause + repro recorded at
 * `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`
 * (Path B + `--likert-only` modifier; scoped to Phase 78 CLEAN-05). Once
 * CLEAN-05 lands and the fixture answers 16 Likert questions cleanly,
 * this spec moves from DATA_RACE → PASS_LOCKED.
 */

import { expect, test } from '../../fixtures';
import { testIds } from '../../utils/testIds';
import { navigateToFirstQuestion, waitForNextQuestion } from '../../utils/voterNavigation';
import type { Page } from '@playwright/test';

// Matches voter.fixture.ts defaults — 16 ≥ minimumAnswers (5 default).
const VOTER_ANSWER_COUNT = 16;
// "Fully agree" Likert position (4-index, 0–4 range).
const VOTER_ANSWER_INDEX = 4;
// Number of answers to delete to drop below `minimumAnswers` (16 → 4 < 5).
const DELETE_COUNT = 12;

/**
 * Module-level helper — DETERM-03 no-conditional-in-test compliance.
 *
 * Delete the answer on the CURRENT question page. The QuestionActions
 * delete button (`testIds.shared.questionDelete = 'question-delete'`,
 * registered at `tests/tests/utils/testIds.ts:148`) renders only when the
 * current question is already answered (gated by `answered={...}` at
 * `apps/frontend/src/lib/components/questions/QuestionActions.svelte:99-107`).
 * `handleDelete` calls `answers.deleteAnswer(question.id)` without URL
 * change, so navigation stays on the same question after the click.
 */
async function deleteCurrentAnswer(page: Page): Promise<void> {
  // reason: the delete button has no aria role/name distinguishing it from
  // other QuestionActions buttons (next/previous); the testid registered at
  // testIds.shared.questionDelete is the contract per CONTEXT D-11.
  const deleteButton = page.getByTestId(testIds.shared.questionDelete);
  await deleteButton.waitFor({ state: 'visible', timeout: 10000 });
  await deleteButton.click();
}

/**
 * Module-level helper — DETERM-03 no-conditional-in-test compliance.
 *
 * Click the previous-question button and wait for the URL to change.
 * Mirrors the helper shape from voter-journey.spec.ts:155-160.
 */
async function navigateToPreviousQuestion(page: Page): Promise<void> {
  // reason: the previous button has no stable aria-name across locales
  // (text is t('questions.previous') or t('common.back') for Q1); the
  // testid registered at testIds.voter.questions.previousButton is the
  // contract per CONTEXT D-11.
  const previousButton = page.getByTestId(testIds.voter.questions.previousButton);
  await previousButton.waitFor({ state: 'visible', timeout: 10000 });
  const urlBefore = page.url();
  await previousButton.click();
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
}

/**
 * Module-level helper — DETERM-03 no-conditional-in-test compliance.
 *
 * Click the next-question button and wait for the URL to settle on a
 * question page (`/questions/<id>`). The next button's behavior depends
 * on whether the current question is answered: for an unanswered question
 * with `separateSkip=true` it triggers the skip action and advances by 1
 * (see QuestionActions.svelte:67-74 + voter question page `onNext` /
 * `onSkip` callbacks). Both paths converge on a URL change.
 */
async function navigateToNextQuestion(page: Page): Promise<void> {
  // reason: next button testid is the contract per CONTEXT D-11.
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  await nextButton.waitFor({ state: 'visible', timeout: 10000 });
  const urlBefore = page.url();
  await nextButton.click();
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
}

/**
 * Module-level helper — DETERM-03 no-conditional-in-test compliance.
 *
 * Delete the answer on the current question, then advance to the next
 * question UNLESS this is the last iteration. The terminal-iteration
 * branch is in helper scope, NOT a test body, per DETERM-03.
 */
async function deleteAndMaybeAdvance(page: Page, isLast: boolean): Promise<void> {
  await deleteCurrentAnswer(page);
  if (!isLast) await navigateToNextQuestion(page);
}

/**
 * Module-level helper — DETERM-03 no-conditional-in-test compliance.
 *
 * Click an answer option on the current question. Mirrors the inline shape
 * from voter.fixture.ts:58-71. The Likert input auto-advances after a
 * 350ms delay (see DELAY.md in apps/frontend/src/lib/utils/timing.ts).
 */
async function answerCurrentQuestion(page: Page, answerIndex: number): Promise<void> {
  // reason: answer options are <input type="radio"> rendered without
  // distinguishing aria-names (only aria-label = rating value); the testid
  // is the contract per CONTEXT D-11.
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(answerIndex);
  await answerOption.waitFor({ state: 'visible', timeout: 10000 });
  const urlBefore = page.url();
  await answerOption.click();
  await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
}

/**
 * Drive the voter through Home → Intro → Questions, answering
 * `count` opinion questions with the given Likert index. Mirrors
 * voter.fixture.ts:52-110 but operates on the caller-supplied page so
 * the `serial` describe can share state across tests.
 *
 * Phase 86 DETERM-12: post-loop fallback updated from a single Skip-Next
 * click to a 3-iteration Skip-Next loop (mirrors voter.fixture.ts:96-110
 * Phase 77 P02 fix). The e2e seed has sort-17 (categorical, 3 options)
 * + sort-18 (boolean) optional opinion questions after the 16 Likert
 * answers — the single Skip landed voter on sort 18 and the URL never
 * changed to /results. See 86-RESEARCH.md §3.3 H1.
 */
async function answerNQuestions(page: Page, count: number, answerIndex: number): Promise<void> {
  await navigateToFirstQuestion(page);
  for (let i = 0; i < count; i++) {
    // reason: see answerCurrentQuestion comment above; testid is the contract.
    const answerOption = page.getByTestId(testIds.voter.questions.answerOption).nth(answerIndex);
    await answerOption.waitFor({ state: 'visible' });
    const urlBefore = page.url();
    await answerOption.click();
    // 10s budget matches voter.fixture.ts:71 (was 5s) — full-suite render
    // pressure post-Plan-64-01.
    await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
    if (i < count - 1) await waitForNextQuestion(page, answerIndex);
  }
  // Phase 86 DETERM-12 (mirrors voter.fixture.ts:96-110 Phase 77 P02 fix):
  // post-loop fallback walks past optional sort-17 (categorical) + sort-18
  // (boolean) questions via Skip-Next iteration. Without this, the single
  // nextButton.click() lands on the boolean question and waitForURL
  // (/\/results/) times out. The maxSteps=3 cap covers sort 17 + sort 18 +
  // 1 headroom step. /results breaks the loop early.
  for (let skip = 0; skip < 3; skip++) {
    if (page.url().includes('/results')) break;
    const urlBefore = page.url();
    // reason: next button has no stable aria-name (varies by state); testid
    // is the contract per CONTEXT D-11.
    await page.getByTestId(testIds.voter.questions.nextButton).click();
    // 30s budget matches voter.fixture.ts:113 — SSR + reactivity settle.
    await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10000 });
  }
  // reason: voter-results-list testid is the canonical anchor for results
  // page readiness (used throughout voter specs); no aria/role equivalent.
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 10000 });
}

test.describe('voter navigation: skip/delete/back (E2E-06)', { tag: ['@voter'] }, () => {
  test.describe.configure({ mode: 'serial' });

  let sharedPage: Page;

  test.beforeAll(async ({ browser }) => {
    sharedPage = await browser.newPage();
    await answerNQuestions(sharedPage, VOTER_ANSWER_COUNT, VOTER_ANSWER_INDEX);
  });

  test.afterAll(async () => {
    await sharedPage.close();
  });

  test('results-CTA toggles per minimumAnswers threshold', async () => {
    // Increase timeout: we walk back through 12 answers via the previous
    // button + delete-on-each-page.
    test.setTimeout(120000);

    // reason: voter-nav-results testId is established by VoterNav.svelte:88;
    // semantic role is `link` but the underlying anchor's accessible name
    // varies between t('results.title.results') and t('results.title.browse')
    // — testid is the stable contract per CONTEXT D-11 + Open Question 3
    // resolution (text-toggle, not disabled-attribute).
    const resultsNav = sharedPage.getByTestId(testIds.voter.nav.resultsLink);

    // 16 answered ≥ minimumAnswers (5) → "results" state.
    await expect(resultsNav).toHaveText(/results/i);

    // Navigate to the last-answered question via the results page back-link;
    // simpler approach: navigate Home → Intro → Questions auto-resolves to
    // the first unanswered question. From the results page, the previous
    // button on the question page walks back through the answered set.
    //
    // Strategy: go to /questions (auto-resolves), then walk backward via
    // previous button + delete-on-each-page until we've deleted 12 answers.
    // The previous button is rendered on every question page (per
    // QuestionActions.svelte:108-118); on Q1 it goes back to /intro
    // (handleJump newIndex < 0 branch).
    //
    // First go to /questions which redirects to the latest unanswered
    // question OR /results when fully answered. Use the deterministic
    // /questions/__first__ form to reliably land on Q1.
    await sharedPage.goto(`${new URL(sharedPage.url()).origin}/en/questions/__first__`);
    // reason: question delete button only renders when the question is
    // already answered; testid is the contract per CONTEXT D-11.
    const deleteButton = sharedPage.getByTestId(testIds.shared.questionDelete);
    await deleteButton.waitFor({ state: 'visible', timeout: 10000 });

    // Walk forward from Q1 — at each visited question, delete its answer
    // (handleDelete just sets the answer to null without URL change), then
    // advance to the next question via the next button. Loop is in the test
    // body — loops are not conditionals per DETERM-03. The terminal-iteration
    // check (skip the final advance) lives inside `deleteAndMaybeAdvance`,
    // which is a module-level helper (DETERM-03 compliant).
    for (let i = 0; i < DELETE_COUNT; i++) {
      await deleteAndMaybeAdvance(sharedPage, i === DELETE_COUNT - 1);
    }

    // 4 answered < minimumAnswers (5) → "browse" state.
    await expect(resultsNav).toHaveText(/browse/i);

    // Re-answer the current question (which is unanswered after the delete
    // loop) to cross the threshold back upward.
    await answerCurrentQuestion(sharedPage, VOTER_ANSWER_INDEX);

    // 5 answered ≥ minimumAnswers (5) → back to "results" state.
    await expect(resultsNav).toHaveText(/results/i);
  });

  test('browser-back preserves answer state across navigation', async () => {
    test.setTimeout(60000);

    // From the end of Test 1, we're on a question page with some answers.
    // Go back twice via browser history; assert that an answered question
    // is still answered (delete button rendered, which is gated by
    // `answered={answers.answers[question!.id]?.value != null}` per
    // apps/frontend/src/routes/(voters)/(located)/questions/[questionId]/+page.svelte:210).
    await sharedPage.goBack();
    await sharedPage.goBack();

    // Navigate back via previous button to a known-answered question.
    // The most-recently-answered question is the one we landed on after
    // Test 1's answerCurrentQuestion calls.
    await navigateToPreviousQuestion(sharedPage);

    // Assert the answer state survives — the delete button is only rendered
    // when the question is answered. Use a short wait to allow the page to
    // settle from the back-nav before asserting.
    // reason: delete button testid is the contract per CONTEXT D-11.
    const deleteButton = sharedPage.getByTestId(testIds.shared.questionDelete);
    await expect(deleteButton).toBeVisible({ timeout: 10000 });
  });
});
