/**
 * perm-hide-hero — Phase 91 Plan 02 (TIR6:24-32, A2).
 *
 * Authenticated candidate (via candidateSessionMinter / D-91-PD-06) lands
 * on /en/candidate/questions/[questionId]. The candidate-questions-hero
 * <figure> remains in the DOM, but its inner img/span content is suppressed
 * by `!hideHero` gate at +page.svelte:266. With `hideHero=true` the figure
 * renders empty (no img/span children).
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:24-32.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { TESTS_DIR } from '../../utils/testsDir';

const PREFIX = 'e2e-perm-hide-hero-';
const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');

test.describe('perm-hide-hero', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('hideHero=true: candidate-questions-hero figure has no img/span children', async ({
    page
  }) => {
    await page.goto(`/en/candidate/questions/${PREFIX}qu-opin-l5-1`);
    const hero = page.getByTestId('candidate-questions-hero');
    await expect(hero).toBeVisible();
    await expect(hero.locator('img, span')).toHaveCount(0);
  });
});
