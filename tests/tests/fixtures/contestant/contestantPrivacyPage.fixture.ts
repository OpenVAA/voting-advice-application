/**
 * @file contestantPrivacyPage fixture.
 *
 * Function-fixture for the Contestant App's privacy page (`apps/frontend/src/routes/contestant/privacy/+page.svelte`). Besides the terms text, the page shows the consent control for usage data (`DataConsent`, inline) under the same condition under which the terms-of-use view offers its opt-out box, so a contestant can change the choice made when accepting the terms.
 *
 * Surface:
 *  - open()                   — navigate to the page, wait for its Home button and for the page to settle, so its controls are hydrated.
 *  - expectConsentControl()   — the control's two buttons are visible: the one that grants and the one that refuses.
 *  - refuse()                 — press the refusing button, and assert that it is then disabled, as the control marks the current choice.
 *
 * The control's buttons carry no test id; they are found by their accessible names, the English labels of `privacy.dataConsentLabel.granted` and `privacy.dataConsentLabel.denied`, as the voter specs find the same buttons.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { settleNetworkIdle, TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/** The accessible name of the control's button that grants consent. */
const GRANTED_BUTTON = /agree to share my data/i;

/** The accessible name of the control's button that refuses consent. */
const DENIED_BUTTON = /don.t want to share my data/i;

export function createContestantPrivacyPage(page: Page) {
  return {
    /**
     * Navigate to the privacy page and wait until its Home button is visible and the network has settled, so that the consent control is hydrated before it is pressed.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppPrivacy', locale: 'en' }));
      await expect(page.getByTestId(testIds.contestant.privacy.home)).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await settleNetworkIdle(page, { timeoutMs: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the consent control is shown: both of its buttons are visible.
     */
    async expectConsentControl(): Promise<void> {
      await expect(page.getByRole('button', { name: GRANTED_BUTTON })).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(page.getByRole('button', { name: DENIED_BUTTON })).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Press the refusing button and assert that it is disabled afterwards: the control disables the button of the choice that is stored.
     */
    async refuse(): Promise<void> {
      const denied = page.getByRole('button', { name: DENIED_BUTTON });
      await denied.click();
      await expect(denied).toBeDisabled({ timeout: TIMEOUTS.slowPage });
    }
  };
}

export type ContestantPrivacyPageFixture = ReturnType<typeof createContestantPrivacyPage>;
