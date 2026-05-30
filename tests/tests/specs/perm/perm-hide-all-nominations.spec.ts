/**
 * perm-hide-all-nominations — Phase 91 Plan 02 (TIR6:90-93, A5).
 *
 * `entities.showAllNominations=false` causes the SvelteKit server-side
 * +layout.ts at apps/frontend/src/routes/(voters)/nominations/+layout.ts:
 * 19-27 to issue a 307 redirect to Home (`/en`). Asserting on the URL
 * post-redirect uses `await expect(page).toHaveURL(/\/en\/?$/)` per
 * Pitfall 5 — Playwright waits for the navigation event to complete.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:90-93.
 */

import { expect, test } from '@playwright/test';

test.describe('perm-hide-all-nominations', () => {
  test('showAllNominations=false: /en/nominations 307-redirects to /en', async ({ page }) => {
    await page.goto('/en/nominations');
    await expect(page).toHaveURL(/\/en\/?$/);
  });
});
