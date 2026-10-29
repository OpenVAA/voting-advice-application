/**
 * @file Composition root for the phone-width spec of the terms-of-use view (`contestant-terms-gate-phone.spec.ts`).
 *
 * Surface:
 *   - `test`   — Playwright test extended with the fixture below.
 *   - `expect` — re-exported from @playwright/test.
 *
 * Fixtures:
 *   - `termsOfUseGate` — five steps of the view's page fixture: open the view, assert that the document does not overflow sideways, assert that the checkbox lies inside the viewport, tick the checkbox, assert that Continue is enabled.
 *
 * The surface holds no step that presses Continue or signs out. The spec runs under the stored session of the user who has not accepted the terms of use, and the axe scans of the same view load the same file: an acceptance or a sign-out here would take the view away from them.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect, test as base } from '@playwright/test';
import { createContestantTermsOfUsePage } from './contestantTermsOfUsePage.fixture';
import type { ContestantTermsOfUsePageFixture } from './contestantTermsOfUsePage.fixture';

type TermsOfUseGatePhoneFixtures = {
  /** The read-only steps of the terms-of-use view: opening it, its geometry, ticking its checkbox, the state of Continue. */
  termsOfUseGate: Pick<
    ContestantTermsOfUsePageFixture,
    'open' | 'expectNoHorizontalOverflow' | 'expectCheckboxInsideViewport' | 'tick' | 'expectContinueEnabled'
  >;
};

/**
 * Playwright's `test`, extended with the `termsOfUseGate` fixture.
 */
export const test = base.extend<TermsOfUseGatePhoneFixtures>({
  termsOfUseGate: async ({ page }, use) => {
    const { open, expectNoHorizontalOverflow, expectCheckboxInsideViewport, tick, expectContinueEnabled } =
      createContestantTermsOfUsePage(page);
    await use({ open, expectNoHorizontalOverflow, expectCheckboxInsideViewport, tick, expectContinueEnabled });
  }
});

export { expect };
