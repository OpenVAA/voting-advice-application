/**
 * Voter questions intro E2E tests (QUESTION-03 regression gates).
 *
 * Covers the category-selection + counter reactivity behavior restored by
 * Phase 61 Plan 02:
 * - Fresh session defaults to all opinion categories checked (no "Answer 0 Questions"
 *   transient on first paint).
 * - Toggling a category checkbox updates the counter reactively on the same tick.
 *
 * These tests exist specifically to gate the Phase 58 UAT "intermittent 0-counter"
 * symptom from regressing. They depend on the default seed having
 * `questions.questionsIntro.allowCategorySelection: true` (default) and
 * `questions.questionsIntro.show: true` (default).
 *
 * Runs within the `voter-app` project (read-only voter specs, depends on
 * data-setup only).
 */

import { expect, test } from '../../fixtures';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';

test.describe('voter questions intro', { tag: ['@voter'] }, () => {
  test('fresh session defaults to all opinion categories checked + counter non-zero on first paint', async ({
    page
  }) => {
    await page.goto(buildRoute({ route: 'Questions', locale: 'en' }));

    // Primary CTA must be visible with a non-zero question count on first paint.
    const counterCta = page.getByTestId(testIds.voter.questions.startButton);
    await expect(counterCta).toBeVisible();
    // Regression gate: the counter text must NEVER render "Answer 0 Questions"
    // on a fresh load when categories exist (the QUESTION-03 symptom).
    await expect(counterCta).not.toHaveText(/Answer 0 Questions/);
    await expect(counterCta).toHaveText(/Answer \d+ Questions/);

    // All category checkboxes are checked by default.
    const checkboxes = page.getByTestId(testIds.voter.questions.categoryCheckbox);
    const count = await checkboxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test('counter updates reactively on category toggle', async ({ page }) => {
    await page.goto(buildRoute({ route: 'Questions', locale: 'en' }));

    const counterCta = page.getByTestId(testIds.voter.questions.startButton);
    await expect(counterCta).toBeVisible();
    await expect(counterCta).toHaveText(/Answer \d+ Questions/);
    const initialText = (await counterCta.innerText()).trim();
    const initialCount = Number(initialText.match(/\d+/)?.[0] ?? 0);
    expect(initialCount).toBeGreaterThan(0);

    // Uncheck the first category — counter decreases on the same tick.
    const firstCheckbox = page.getByTestId(testIds.voter.questions.categoryCheckbox).first();
    await firstCheckbox.uncheck();

    // Wait for the counter to reflect a new value different from the initial one.
    await expect(counterCta).not.toHaveText(new RegExp(`Answer ${initialCount} Questions`));
    const afterUncheckText = (await counterCta.innerText()).trim();
    const afterUncheckCount = Number(afterUncheckText.match(/\d+/)?.[0] ?? -1);
    expect(afterUncheckCount).toBeLessThan(initialCount);

    // Re-check → counter increases again.
    await firstCheckbox.check();
    await expect(counterCta).toHaveText(new RegExp(`Answer ${initialCount} Questions`));
  });
});
