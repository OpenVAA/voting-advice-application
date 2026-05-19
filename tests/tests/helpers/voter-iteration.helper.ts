/**
 * Voter Skip-Next iteration walker (category-intro + question-next aware).
 *
 * Extracted from the inline Skip-Next loop in `voter.fixture.ts:123-135`
 * (Phase 86.1-01 + post-fix). Walks the voter through up to `maxSteps`
 * Skip-Next iterations, auto-detecting EITHER a category-intro page
 * (only `voter-questions-category-start` rendered) OR a regular
 * question page (Skip / `question-next` available). Breaks early on
 * landing on the terminal URL pattern (default `/results`).
 *
 * Lineage (per 86.2-PATTERNS.md §"voter-iteration.helper.ts — Lineage block"):
 *   - Phase 77 P02 — bumped Skip-Next from 1 → 3 iterations
 *     (sort-17/18 coverage; matches voter-matching.spec.ts:174 +
 *     voter-journey.spec.ts:64 Skip-Next fallback pattern).
 *   - Phase 86.1-01 (DETERM-12/13/14) — bumped 3 → 6 iterations to
 *     accommodate sort-19 number question + 3 steps of headroom for
 *     future non-Likert opinion questions added at sort ≤ 24.
 *   - Phase 86.1 post-fix — added category-intro branch
 *     (`categoryStart` vs `nextButton` race) for parallel
 *     `voter-app-settings` `categoryIntros.show=true` mid-test
 *     mutation defense.
 *   - Sort-17/18/19 source:
 *     `packages/dev-seed/src/templates/e2e.ts:666` (number question).
 *
 * Pitfall #3 — Changing the default `maxSteps` from 6 silently
 *   regresses `tests/tests/fixtures/voter.fixture.ts:answeredVoterPage`.
 *   The fixture relies on the 6-cap to walk past:
 *     - sort 17 singleChoiceCategorical (test-question-directional-1)
 *     - sort 18 boolean (test-question-boolean-1)
 *     - sort 19 number (test-question-number-1)
 *     - 3 steps of headroom for future non-Likert opinion questions.
 *   If you reduce the default, the fixture stalls on the first non-
 *   Likert opinion question and times out the 30s URL-change wait.
 *
 * Scope (per 86.2-RESEARCH.md §"Helper #6"):
 *   Skip-Next-only. The helper does NOT take an `answer` callback —
 *   extending to answer-mode (the mid-fixture answer loop at
 *   `voter.fixture.ts:59-78`) is v2.11+ hygiene. The
 *   `results-sections.spec.ts:263-298` answer-loop is its OWN inline
 *   pattern and stays inline in 86.2.
 */

import { testIds } from '../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Walk the voter through up to `maxSteps` Skip-Next iterations,
 * auto-detecting category-intro vs regular-question pages each step.
 * Breaks early on landing on the terminal URL pattern.
 *
 * Body mirrors voter.fixture.ts:123-135 verbatim:
 *   1. Locate `nextButton` + `categoryStart` test-ids.
 *   2. For each step (up to `maxSteps`):
 *      a. Break if URL matches `terminalUrlPattern`.
 *      b. Wait for EITHER button to be visible.
 *      c. Pick `categoryStart` if visible (intro page), else `nextButton`.
 *      d. Click with `clickTimeoutMs: 3_000` + `.catch(() => null)`.
 *      e. Wait for URL change with `perStepTimeoutMs` + `.catch(() => null)`.
 *
 * @param page - Playwright Page.
 * @param opts.maxSteps - max Skip-Next iterations; default `6`
 *   (Pitfall #3 — do NOT lower this default).
 * @param opts.perStepTimeoutMs - per-step URL-change budget in ms;
 *   default `10_000`.
 * @param opts.terminalUrlPattern - URL pattern that terminates the
 *   walk early; default `/\/results/`.
 */
export async function walkVoterIteration(
  page: Page,
  opts: {
    maxSteps?: number;
    perStepTimeoutMs?: number;
    terminalUrlPattern?: RegExp;
  } = {}
): Promise<void> {
  const maxSteps = opts.maxSteps ?? 6;
  const perStepTimeoutMs = opts.perStepTimeoutMs ?? 10_000;
  const terminal = opts.terminalUrlPattern ?? /\/results/;
  const nextBtn = page.getByTestId(testIds.voter.questions.nextButton);
  const categoryStartBtn = page.getByTestId(testIds.voter.questions.categoryStart);
  for (let step = 0; step < maxSteps; step++) {
    if (terminal.test(page.url())) break;
    const urlBefore = page.url();
    await nextBtn.or(categoryStartBtn).first().waitFor({ state: 'visible', timeout: perStepTimeoutMs });
    const intro = await categoryStartBtn.isVisible().catch(() => false);
    const target = intro ? categoryStartBtn : nextBtn;
    await target.click({ timeout: 3_000 }).catch(() => null);
    await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: perStepTimeoutMs }).catch(() => null);
  }
}
