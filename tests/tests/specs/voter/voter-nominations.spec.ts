/**
 * voter-nominations (rider) — the unscoped all-nominations route renders its entity list on the base dataset.
 *
 * Read-only LEAF spec on `data-setup-base` (`e2e/base`). The `/nominations` route is UNSCOPED (`(voters)/nominations/+layout.ts`): it is gated only by `entities.showAllNominations` (true in e2e/base) and loads locale-only question/nomination data — no election/constituency selection is required.
 * So a DIRECT `page.goto` reaches it for a fresh leaf context (the raw-goto idiom mirrors `perm-hide-all-nominations.spec.ts`).
 *
 * This is a DEDICATED spec per — NOT a voter-journey step. The old commented journey step (since removed) used soft assertions; this spec carries HARD assertions only.
 *
 * Seed is ASSERT-ONLY: no dev-seed or product files are modified.
 *
 * ## Rigidity contract (project E2E Hard Rule)
 *
 * Every assertion is HARD — no `expect.soft`, no try/catch around `expect()`, no `.catch` fallback, no skip/flaky annotation. A failing OR did-not-run test blocks completion.
 */

import { expect, test } from '../../fixtures/voter/views';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';

test.describe('voter-nominations (UNBLK-04)', () => {
  test('all-nominations route renders the entity list with at least one nomination card', async ({ page }) => {
    // Raw goto — the route is unscoped and showAllNominations=true in e2e/base, so there is NO redirect (contrast perm-hide-all-nominations, which flips the flag to force a 307 → Home bounce).
    await page.goto('/en/nominations');

    // The all-nominations fetch is the heaviest part of this route (every nomination across all elections/constituencies), so anchor on the list with the slow-page budget.
    const list = page.getByTestId(testIds.voter.nominations.list);
    await expect(list).toBeVisible({ timeout: TIMEOUTS.slowPage });

    // At least one nomination entity card renders inside the list. Kept as a conservative >= 1 assertion (not an exact count) because the all-nominations roster spans the full seed and its size is scope-dependent — the same rationale the removed journey step cited. Still HARD.
    const cards = list.getByTestId(testIds.voter.results.card);
    await expect(cards.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
    expect(await cards.count()).toBeGreaterThan(0);
  });
});
