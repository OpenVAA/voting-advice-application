/**
 * @file aboutPage fixture (voter — secondary).
 *
 * Function-fixture exposing the About-page org-matching disclosure reader consumed by the org-matching perm spec. Mirrors the `feedbackDialog.fixture.ts` testid-anchored reader-factory shape and routes every locator through `testIds` (A3 — no raw locators). Composed into the voter `views.ts` root.
 *
 * Surface:
 *  - goToPage(locale?)              — navigate to /about and assert it loaded.
 *  - expectPageVisible(visible?)    — canonical voter-page load-anchor pair.
 *  - expectOrgMatchingDisclosure(mode) — assert the org-matching disclosure block renders for an active org-matching mode, or is ABSENT when `mode='none'` (the disclosure renders only when `matching.organizationMatching !== 'none'`). The disclosure TEXT is locale-dependent (interpolates the matching method), so the reader asserts the disclosure block's PRESENCE/ABSENCE per mode rather than a specific string.
 *
 * **Rigidity contract**:
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 *  - All locators are testid-anchored via `testIds` (locale-resilient).
 *
 * Surface bound to:
 *  - about/+page.svelte content root (`testIds.voter.about.content`).
 *  - about/+page.svelte org-matching disclosure block (`testIds.voter.about.organizationMatching`, rendered only when `matching.organizationMatching !== 'none'`).
 */

import { expect } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/** Org-matching disclosure mode (mirrors `matching.organizationMatching`). */
export type OrgMatchingMode = 'none' | 'answersOnly' | 'impute';

export function createAboutPage(page: Page) {
  /**
   * Assert the About page content is (not) visible via its content anchor.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.about.content)).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Navigate to the voter About page (locale-aware) and assert it loaded.
     */
    async goToPage(locale = 'en'): Promise<void> {
      // buildRoute returns a leading-slash path with NO locale segment; base locale 'en' is served from '/' (Paraglide), non-base locales prefixed.
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'About', locale }) || '/');
      await expectPageVisible(true);
    },

    expectPageVisible,

    /**
     * Assert the org-matching disclosure block per `mode`:
     *  - 'none'                  → the disclosure block is ABSENT (hidden).
     *  - 'answersOnly' | 'impute'→ the disclosure block is VISIBLE.
     */
    async expectOrgMatchingDisclosure(mode: OrgMatchingMode): Promise<void> {
      const disclosure = page.getByTestId(testIds.voter.about.organizationMatching);
      if (mode === 'none') {
        await expect(disclosure).toBeHidden();
      } else {
        await expect(disclosure).toBeVisible();
      }
    }
  };
}

export type AboutPageFixture = ReturnType<typeof createAboutPage>;
