/**
 * perm-hide-all-nominations — Phase 91 Plan 02 (TIR6:90-93, A5).
 *
 * `entities.showAllNominations=false` causes the SvelteKit server-side
 * +layout.ts at apps/frontend/src/routes/(voters)/nominations/+layout.ts:
 * 19-27 to issue a 307 redirect to Home (`buildRoute({ route: 'Home', locale })`).
 * Asserting on the URL post-redirect waits for the navigation event to complete
 * (Pitfall 5). The matcher is locale-agnostic: the base locale (`en`) is served
 * WITHOUT a `/en/` prefix (Paraglide urlPatterns), so Home resolves to `/`, not
 * `/en`. The matcher tolerates an optional locale segment at the site root.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:90-93.
 */

import { expect, test } from '@playwright/test';

test.describe('perm-hide-all-nominations', () => {
  test('showAllNominations=false: nominations 307-redirects to Home', async ({ page }) => {
    await page.goto('/en/nominations');
    // Home root, optionally prefixed by a `/<locale>` segment. Base locale (en)
    // is prefixless, so this resolves to `/`.
    await expect(page).toHaveURL(/\/(?:[a-z]{2}\/?)?$/);
  });
});
