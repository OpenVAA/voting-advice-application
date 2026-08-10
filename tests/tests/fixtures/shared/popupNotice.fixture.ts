/**
 * @file popupNotice fixture (shared — EPERM-09).
 *
 * Shared function-fixture for the results-page feedback + survey popups
 * (FeedbackPopup.svelte / SurveyPopup.svelte). Authored standalone under
 * tests/tests/fixtures/shared/ (NOT extended into a composition root) so it is
 * consumed via a direct `createPopupNotice(page)` import — mirroring the
 * standalone `feedbackDialog.fixture.ts` shape.
 *
 * Surface:
 *  - feedbackPopup / surveyPopup : Locator — testid-bound roots.
 *  - expectVisible(kind)         — assert the named popup is visible.
 *  - dismiss(kind)               — close the named popup (assert it goes hidden).
 *  - dismissAndReload(kind)      — dismiss → `page.reload()` → assert the popup
 *      does NOT reappear (dismiss-persistence across reload).
 *
 * `kind` is `'feedback' | 'survey'` — the two popups carry distinct root
 * test-ids so dismiss-persistence is asserted independently per popup.
 *
 * **Rigidity contract**:
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 *  - The popup ROOT locators are testid-anchored via `testIds` (locale-resilient).
 *
 * **Locale caveat (WR-05)**: the `dismiss()` close-button lookup is NOT fully
 * locale-resilient. The Alert "✕" control's only accessible name is the
 * translated `t('common.close')` (Alert.svelte), so the role-name regex below
 * matches the ENGLISH "Close"/"Dismiss"/"Cancel" labels only. Under non-English
 * UI locales (`/fi`, `/sv`, …) the accessible name changes and the match would
 * miss. The E2E suite runs the default English locale, so this holds today; a
 * follow-up should add a stable `data-testid` to the Alert close control (a
 * production change, out of scope for this fix pass) and anchor `dismiss()` to it.
 *
 * Surface bound to:
 *  - FeedbackPopup.svelte Alert root (`testIds.shared.feedbackPopup`).
 *  - SurveyPopup.svelte Alert root (`testIds.shared.surveyPopup`).
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/** Which popup to act on. */
export type PopupKind = 'feedback' | 'survey';

export interface PopupNoticeFixture {
  /** Locator for the feedback popup root (testid-anchored). */
  readonly feedbackPopup: Locator;
  /** Locator for the survey popup root (testid-anchored). */
  readonly surveyPopup: Locator;
  /** Assertion: the named popup is visible. */
  expectVisible(kind: PopupKind): Promise<void>;
  /** Dismiss the named popup and assert it becomes hidden. */
  dismiss(kind: PopupKind): Promise<void>;
  /**
   * Dismiss the named popup, reload the page, and assert it does NOT reappear
   * (dismiss-persistence across reload).
   */
  dismissAndReload(kind: PopupKind): Promise<void>;
}

/**
 * Create a popup-notice reader/handle bound to `page`.
 *
 * The dismiss affordance is the popup's own close control. Alert-style popups
 * expose a close button via `role=button` within the popup root; the handle
 * clicks the first such control inside the popup, then asserts the desired
 * post-state with a hard assertion.
 */
export function createPopupNotice(page: Page): PopupNoticeFixture {
  const feedbackPopup = page.getByTestId(testIds.shared.feedbackPopup);
  const surveyPopup = page.getByTestId(testIds.shared.surveyPopup);

  function popupFor(kind: PopupKind): Locator {
    return kind === 'feedback' ? feedbackPopup : surveyPopup;
  }

  async function expectVisible(kind: PopupKind): Promise<void> {
    await expect(popupFor(kind)).toBeVisible();
  }

  async function dismiss(kind: PopupKind): Promise<void> {
    const popup = popupFor(kind);
    // The Alert popup root carries its own close control. Click the close
    // button scoped INSIDE the popup root (getByRole is permitted by the
    // locator guard; raw .locator()/getByText() are not).
    await popup
      .getByRole('button', { name: /close|dismiss|cancel/i })
      .first()
      .click();
    await expect(popup).toBeHidden();
  }

  return {
    feedbackPopup,
    surveyPopup,
    expectVisible,
    dismiss,

    async dismissAndReload(kind: PopupKind): Promise<void> {
      await dismiss(kind);
      await page.reload();
      // Dismiss-persistence: the popup must NOT reappear after reload.
      await expect(popupFor(kind)).toBeHidden();
    }
  };
}
