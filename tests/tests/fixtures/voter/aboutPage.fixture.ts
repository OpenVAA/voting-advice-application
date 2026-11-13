/**
 * @file aboutPage fixture (voter — secondary).
 *
 * Function-fixture exposing the About-page org-matching disclosure reader consumed by the org-matching perm spec. Mirrors the `feedbackDialog.fixture.ts` testid-anchored reader-factory shape and routes every locator through `testIds` (A3 — no raw locators). Composed into the voter `views.ts` root.
 *
 * Surface:
 *  - goToPage(locale?)              — navigate to /about and assert it loaded.
 *  - expectPageVisible(visible?)    — canonical voter-page load-anchor pair.
 *  - expectOrgMatchingDisclosure(mode) — assert the org-matching disclosure block is ABSENT when `mode='none'` (the disclosure renders only when `matching.organizationMatching !== 'none'`); for an active mode, assert the block is visible, does not show the message's key, and holds the English sentence the catalogue gives that method, read from `apps/frontend/messages/en/about.json` and reduced to its text.
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
import fs from 'fs';
import path from 'path';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import type { Page } from '@playwright/test';

/** Org-matching disclosure mode (mirrors `matching.organizationMatching`). */
export type OrgMatchingMode = 'none' | 'answersOnly' | 'impute';

/** The key of the sentence the disclosure block shows, which a message with no variant for its method answers with. */
const ORG_MATCHING_KEY = 'about.organizationMatching.content';

/** The variants of the English party-matching sentence, keyed by their selector, read from the message source rather than copied. */
const ORG_MATCHING_VARIANTS = (
  JSON.parse(fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/about.json'), 'utf8')) as {
    about: { organizationMatching: { content: Array<{ match: Record<string, string> }> } };
  }
).about.organizationMatching.content[0].match;

/**
 * The English sentence a method reaches, reduced to the text a browser shows: the variant whose selector value is the method, otherwise the catch-all.
 */
function orgMatchingSentence(mode: OrgMatchingMode): string | undefined {
  const html = ORG_MATCHING_VARIANTS[`partyMatchingMethod=${mode}`] ?? ORG_MATCHING_VARIANTS['partyMatchingMethod=*'];
  return html
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

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
     *  - 'answersOnly' | 'impute'→ the disclosure block is VISIBLE, does not show the message's key, and holds the English sentence the catalogue gives that method.
     */
    async expectOrgMatchingDisclosure(mode: OrgMatchingMode): Promise<void> {
      const disclosure = page.getByTestId(testIds.voter.about.organizationMatching);
      if (mode === 'none') {
        await expect(disclosure).toBeHidden();
        return;
      }
      await expect(disclosure).toBeVisible();
      await expect(disclosure).not.toContainText(ORG_MATCHING_KEY);
      const sentence = orgMatchingSentence(mode);
      expect(sentence, `the English catalogue has a party-matching sentence for ${mode}`).toBeDefined();
      await expect(disclosure).toContainText(sentence!);
    }
  };
}

export type AboutPageFixture = ReturnType<typeof createAboutPage>;
