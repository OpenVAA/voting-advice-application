/**
 * @file contestantTermsOfUsePage fixture.
 *
 * Function-fixture for the terms-of-use acceptance view (`apps/frontend/src/lib/contestant/gates/TermsOfUseGate.svelte`), which the protected layout renders in place of the page for a signed-in user who has no acceptance for the project.
 *
 * Surface:
 *  - accept()                — toggle the terms-checkbox (no submit click).
 *  - getSubmit(): Locator    — return the terms-of-use-submit Locator.
 *  - acceptAndAdvance()      — composed: accept() + getSubmit().click().
 *  - open()                  — navigate to the app root and wait for the view.
 *  - expectShown()           — the view is shown, wherever the user is.
 *  - expectNoHorizontalOverflow() — the document is no wider than its viewport.
 *  - expectCheckboxInsideViewport() — the whole terms-checkbox lies inside the viewport.
 *  - tick()                  — check the terms-checkbox and nothing else.
 *  - expectContinueEnabled() — the terms-of-use-submit button is enabled.
 *  - expectLeft()            — the view is no longer shown, as after an accepted Continue.
 *
 * The box by which the user opts out of the collection of usage data (`terms-tracking-opt-out`), which the view renders after the form only while there is a consent choice to make:
 *  - expectTrackingOptOutUnticked()       — the box is visible and unticked.
 *  - expectNoTrackingOptOut()             — the box is not rendered.
 *  - tickTrackingOptOut()                 — check the box.
 *  - toggleTrackingOptOutByKeyboard()     — reach the box with Tab from the terms-checkbox and press Space.
 *  - isTrackingOptOutTicked(): boolean    — whether the box is ticked.
 *  - expectTrackingOptOutInsideViewport() — the whole box lies inside the viewport.
 *  - expectUsageDataInTerms()             — open the terms text and assert the heading of its usage-data section.
 *
 * Spec flow at the call site asserts the disabled-state transition:
 *   expect(termsPage.getSubmit()).toBeDisabled() await termsPage.accept() await expect(termsPage.getSubmit()).toBeEnabled() await termsPage.getSubmit().click()
 *
 * `acceptAndAdvance()` is for specs that don't need the disabled-state transition check.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
import { buildEntityLessRoute } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import type { Locator, Page } from '@playwright/test';

/** The English title of the terms' usage-data section (`privacy.usageData.title`), read from the message source rather than copied, so a copy edit cannot leave the step asserting a stale string. */
const USAGE_DATA_TITLE: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/privacy.json'), 'utf8')
).privacy.usageData.title;

export function createContestantTermsOfUsePage(page: Page) {
  return {
    /**
     * Toggle the terms-checkbox. Does NOT click submit — the spec must follow this with `getSubmit().click()` (or call `acceptAndAdvance` for the composed shortcut).
     */
    async accept(): Promise<void> {
      await page.getByTestId(testIds.contestant.terms.checkbox).click();
    },

    /**
     * Return the terms-of-use-submit Locator. Spec callers use this for disabled-state assertions and for the click itself.
     */
    getSubmit(): Locator {
      return page.getByTestId(testIds.contestant.terms.submit);
    },

    /**
     * Composed convenience: tick the checkbox + click the submit button.
     * Use only when the spec does not need to assert the disabled→enabled state transition.
     */
    async acceptAndAdvance(): Promise<void> {
      await this.accept();
      // Submit is `disabled` until the checkbox toggle propagates. Bare `.click()` auto-waits for actionability against the 90s per-test timeout — a stuck-disabled button produces a 346× click-retry dump.
      // Assert enabled first so a genuine stuck-disabled state fails fast at the (bounded) expect timeout with a clear message. Mirrors the documented disabled→enabled spec flow above.
      await expect(this.getSubmit()).toBeEnabled();
      await this.getSubmit().click();
    },

    /**
     * Navigate to the app root and wait until the view's Continue button is visible. A signed-in user who has not accepted the terms of use is shown the view there.
     */
    async open(): Promise<void> {
      await page.goto(buildEntityLessRoute({ route: 'ContestantAppHome', locale: 'en' }));
      await expect(page.getByTestId(testIds.contestant.terms.submit)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the view is shown: its Continue button is visible. The step opens nothing, so it is for the view a rerun load or a navigation has led to.
     */
    async expectShown(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.terms.submit)).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the document is no wider than its viewport. A failure names the elements that do not fit.
     */
    async expectNoHorizontalOverflow(): Promise<void> {
      await createPageGeometry(page).expectNoHorizontalOverflow();
    },

    /**
     * Assert the whole terms-checkbox lies inside the viewport. A box that is rendered but lies beside the viewport is visible to a visibility check and fails this one.
     */
    async expectCheckboxInsideViewport(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.terms.checkbox)).toBeInViewport({ ratio: 1 });
    },

    /**
     * Check the terms-checkbox, and press nothing else. The timeout is explicit so that a box that cannot be reached fails as an action timeout on this step.
     */
    async tick(): Promise<void> {
      await page.getByTestId(testIds.contestant.terms.checkbox).check({ timeout: TIMEOUTS.page });
    },

    /**
     * Assert the view's Continue button is enabled.
     */
    async expectContinueEnabled(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.terms.submit)).toBeEnabled();
    },

    /**
     * Assert that the view is no longer shown: its Continue button is gone. After an accepted Continue the rerun load removes the view, so this is the step that waits for the acceptance to take effect.
     */
    async expectLeft(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.terms.submit)).toBeHidden({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert that the opt-out box is visible and unticked.
     */
    async expectTrackingOptOutUnticked(): Promise<void> {
      const box = page.getByTestId(testIds.contestant.terms.trackingOptOut);
      await expect(box).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await expect(box).not.toBeChecked();
    },

    /**
     * Assert that the opt-out box is not rendered.
     */
    async expectNoTrackingOptOut(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.terms.trackingOptOut)).toHaveCount(0);
    },

    /**
     * Check the opt-out box. The timeout is explicit so that a box that cannot be reached fails as an action timeout on this step.
     */
    async tickTrackingOptOut(): Promise<void> {
      await page.getByTestId(testIds.contestant.terms.trackingOptOut).check({ timeout: TIMEOUTS.page });
    },

    /**
     * Reach the opt-out box by keyboard and toggle it: focus the terms-checkbox, press Tab, assert that the opt-out box now has the focus, and press Space. The box is the next stop in the tab order after the terms-checkbox, so this also holds that order.
     */
    async toggleTrackingOptOutByKeyboard(): Promise<void> {
      await page.getByTestId(testIds.contestant.terms.checkbox).focus();
      await page.keyboard.press('Tab');
      await expect(page.getByTestId(testIds.contestant.terms.trackingOptOut)).toBeFocused();
      await page.keyboard.press('Space');
    },

    /**
     * Whether the opt-out box is ticked. The box must be rendered.
     */
    async isTrackingOptOutTicked(): Promise<boolean> {
      return page.getByTestId(testIds.contestant.terms.trackingOptOut).isChecked();
    },

    /**
     * Assert that the whole opt-out box lies inside the viewport once it is scrolled to, as `expectCheckboxInsideViewport` does for the terms-checkbox. The box sits below the terms-checkbox, under the fold of a short phone screen, so it is scrolled into view first: what is asserted is that no part of it lies beside the viewport, where no scrolling reaches it.
     */
    async expectTrackingOptOutInsideViewport(): Promise<void> {
      const box = page.getByTestId(testIds.contestant.terms.trackingOptOut);
      await box.scrollIntoViewIfNeeded({ timeout: TIMEOUTS.page });
      await expect(box).toBeInViewport({ ratio: 1 });
    },

    /**
     * Open the terms text, which the view keeps in a collapsed section, and assert that it holds the heading of the usage-data section. The section is opened through the toggle the section's component renders, the checkbox named "Expand or collapse this section", which is the only one on the view.
     */
    async expectUsageDataInTerms(): Promise<void> {
      const toggle = page.getByRole('checkbox', { name: /expand or collapse/i });
      await expect(toggle).toBeVisible({ timeout: TIMEOUTS.slowPage });
      await toggle.check();
      await expect(page.getByRole('heading', { level: 2, name: USAGE_DATA_TITLE })).toBeVisible({
        timeout: TIMEOUTS.slowPage
      });
    }
  };
}

export type ContestantTermsOfUsePageFixture = ReturnType<typeof createContestantTermsOfUsePage>;
