/**
 * Universal voter-question advancement helpers for E2E tests.
 *
 * These helpers exist for specs whose contract is "drive the voter past every
 * opinion question and land on /results" WITHOUT caring which answer value is
 * recorded. Use them instead of hand-rolled `answerOption.nth(N).click()` loops
 * when:
 *
 *   - the question set may contain mixed types (Likert-5, boolean, categorical)
 *     and the spec must not hard-code an index (boolean only has 2 choices, so
 *     `.nth(2)` throws once a boolean shows up in the seed),
 *   - the spec is asserting non-question behavior (election filter on results,
 *     constituency-derived election selection, a11y of the results page, etc.)
 *     and the answer values are incidental.
 *
 * If the spec DOES depend on a specific answer value (matching ordering,
 * directional vs Manhattan distance, etc.), DO NOT use these helpers — use
 * the voter.fixture.ts `voterAnswerIndex` pattern instead so the chosen Likert
 * value is explicit and reviewable.
 *
 * Cross-references:
 *   - tests/utils/missingNominations.ts — for dismissing the located-layout
 *     missing-nominations modal that may open mid-flow.
 *   - tests/fixtures/voter.fixture.ts — the matching-aware fixture whose
 *     per-step Likert-index pattern these helpers are deliberately NOT a
 *     replacement for.
 */
import { testIds } from './testIds';
import type { Page } from '@playwright/test';

/**
 * Defaults applied by `answerQuestion` and `answerUntilResults` when no
 * caller-supplied option override is provided.
 */
const DEFAULT_STEP_TIMEOUT_MS = 10_000;
const DEFAULT_URL_SETTLE_MS = 5_000;
const DEFAULT_MAX_QUESTIONS = 30;

/**
 * Single-step advancement past whichever voter-question element is currently
 * visible. Three branches, probed in priority order:
 *
 *   1. `voter-questions-category-start` — category-intro page rendered between
 *      categories when `app_settings.questions.categoryIntros.show=true`.
 *      Click it to advance to the first question of the next category.
 *   2. `question-choice` — the active question's choice list (radio buttons).
 *      Click the first available choice. Works uniformly across
 *      `singleChoiceOrdinal` (5 choices), `singleChoiceCategorical` (N
 *      choices), and `boolean` (synthesized 2-choice "no/yes" pseudo-list per
 *      `OpinionQuestionInput.svelte:100-111`). Auto-advance fires ~350ms after
 *      the click — we race the resulting URL change against the per-step
 *      settle timeout.
 *   3. `question-next` — the explicit Skip/Next button. Reached on optional
 *      questions where clicking a choice does not auto-advance, or on the
 *      final question where the button doubles as a "view results" CTA.
 *
 * The branch is chosen by waiting for ANY of the three to become visible,
 * then probing each in priority order (deterministic dispatch — avoids the
 * race-mask conditionals that `playwright/no-conditional-in-test` flags
 * elsewhere because this helper itself runs OUTSIDE any test body).
 *
 * @returns `{ advanced, landedOnResults }`:
 *   - `advanced` — the URL changed between probe entry and exit. `false`
 *     means the helper saw a visible target but auto-advance did not fire
 *     within `urlSettleMs`; the caller should fall through and let
 *     `answerUntilResults` retry on the next iteration.
 *   - `landedOnResults` — the new URL matches `/results`. Used by
 *     `answerUntilResults` to break out of its loop.
 */
export async function answerQuestion(
  page: Page,
  opts: { stepTimeoutMs?: number; urlSettleMs?: number } = {}
): Promise<{ advanced: boolean; landedOnResults: boolean }> {
  const stepTimeoutMs = opts.stepTimeoutMs ?? DEFAULT_STEP_TIMEOUT_MS;
  const urlSettleMs = opts.urlSettleMs ?? DEFAULT_URL_SETTLE_MS;

  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  // Race-wait: whichever of the three checkpoints appears first wins. Using
  // `.or()` collapses to a single matcher that resolves on first-visible
  // (Playwright `Locator.or` semantics).
  await answerOption.or(nextButton).or(categoryStart).first().waitFor({ state: 'visible', timeout: stepTimeoutMs });

  const urlBefore = page.url();

  // Priority 1 — category-intro page (no answer-option present).
  if (await categoryStart.isVisible().catch(() => false)) {
    await categoryStart.click({ timeout: 3_000 }).catch(() => null);
  } else if (await answerOption.isVisible().catch(() => false)) {
    // Priority 2 — active question.
    await answerOption.click({ timeout: 3_000 }).catch(() => null);
  } else {
    // Priority 3 — explicit Next/Skip (last-question or optional-question state).
    await nextButton.click({ timeout: 3_000 }).catch(() => null);
  }

  // Wait for the URL to settle either on a new question or on /results.
  // `.catch(() => null)` swallows the timeout — the caller's loop will
  // reprobe on the next iteration if nothing advanced.
  await page.waitForURL((u) => u.toString() !== urlBefore, { timeout: urlSettleMs }).catch(() => null);

  const advanced = page.url() !== urlBefore;
  const landedOnResults = /\/results(\/|$|\?)/.test(page.url());
  return { advanced, landedOnResults };
}

/**
 * Drive the voter from any question/category-intro page to /results.
 *
 * Iteratively calls `answerQuestion` until either:
 *   - the URL matches `/results` (success), OR
 *   - `maxQuestions` iterations have been spent (defensive cap;
 *     `DEFAULT_MAX_QUESTIONS` covers the base e2e seed's ~16 ordinal + 3
 *     non-ordinal tail comfortably, plus per-category intros).
 *
 * No-advance iterations are tolerated up to a small budget (`maxStalledSteps`)
 * — the underlying `answerQuestion` may briefly see a transitional DOM where
 * none of the three branch targets are actionable (e.g. mid-SvelteKit-
 * transition between question and category-intro). After the stall budget is
 * exhausted, the helper throws a descriptive error rather than spinning.
 *
 * @returns the number of `answerQuestion` calls performed (≥ 0). Useful for
 *   spec-level sanity assertions like `expect(answered).toBeGreaterThanOrEqual(N)`.
 */
export async function answerUntilResults(
  page: Page,
  opts: {
    maxQuestions?: number;
    maxStalledSteps?: number;
    stepTimeoutMs?: number;
    urlSettleMs?: number;
  } = {}
): Promise<{ answered: number }> {
  const maxQuestions = opts.maxQuestions ?? DEFAULT_MAX_QUESTIONS;
  const maxStalledSteps = opts.maxStalledSteps ?? 4;

  let answered = 0;
  let consecutiveStalls = 0;

  while (answered < maxQuestions) {
    if (/\/results(\/|$|\?)/.test(page.url())) return { answered };

    const { advanced, landedOnResults } = await answerQuestion(page, {
      stepTimeoutMs: opts.stepTimeoutMs,
      urlSettleMs: opts.urlSettleMs
    });
    answered++;

    if (landedOnResults) return { answered };

    if (!advanced) {
      consecutiveStalls++;
      if (consecutiveStalls >= maxStalledSteps) {
        throw new Error(
          `[answerUntilResults] no advancement for ${consecutiveStalls} consecutive iterations ` +
            `at URL ${page.url()}; total iterations: ${answered}. ` +
            'Either the question flow is stuck (no answer-option / next / category-start visible) ' +
            `or the per-step URL-settle window (${opts.urlSettleMs ?? DEFAULT_URL_SETTLE_MS}ms) is too tight ` +
            'for full-suite render pressure.'
        );
      }
    } else {
      consecutiveStalls = 0;
    }
  }

  throw new Error(
    `[answerUntilResults] reached maxQuestions=${maxQuestions} without landing on /results. ` +
      `Final URL: ${page.url()}. Bump the cap if the seed legitimately has more questions, ` +
      'otherwise inspect the trace for an unexpected mid-flow detour.'
  );
}
