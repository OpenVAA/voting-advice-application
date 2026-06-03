/**
 * Voter Skip-Next iteration walker (category-intro + question-next aware).
 *
 * Walks the voter through up to `maxSteps` Skip-Next iterations,
 * auto-detecting EITHER a category-intro page (only
 * `voter-questions-category-start` rendered) OR a regular question page
 * (Skip / `question-next` available). Breaks early on landing on the
 * terminal URL pattern (default `/results`).
 *
 * The default `maxSteps` of 6 walks past the non-Likert opinion questions
 * in the e2e dataset (singleChoiceCategorical at sort 17, boolean at sort
 * 18, number at sort 19; source
 * `packages/dev-seed/src/templates/e2e.ts:666`) plus headroom; reducing it
 * risks stalling on the first non-Likert opinion question.
 *
 * Scope: Skip-Next-only — the helper does NOT take an `answer` callback.
 */

import { testIds } from '../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Walk the voter through up to `maxSteps` Skip-Next iterations,
 * auto-detecting category-intro vs regular-question pages each step.
 * Breaks early on landing on the terminal URL pattern.
 *
 * Implementation:
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
