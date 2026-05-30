/**
 * @file feedbackDialog fixture — Phase 91 Plan 03 (TIR6:34-61 + D-91-MJ-02).
 *
 * Shared function-fixture for the feedback dialog (Feedback.svelte +
 * FeedbackModal.svelte). Authored standalone under tests/tests/fixtures/shared/
 * per D-91-MJ-02 (NOT extended into voter-mega.fixture.ts) so the candidate
 * mega-journey can later consume the same surface without coupling to
 * voter-mega's option chain.
 *
 * Surface (RESEARCH §"Pattern 2"):
 *  - dialog: Locator              — testid-bound feedback-form anchor.
 *  - expectVisible()              — assert dialog visible.
 *  - expectHidden()               — assert dialog hidden (form testid count=0).
 *  - expectSendDisabled()         — assert submit button disabled.
 *  - expectSendEnabled()          — assert submit button enabled.
 *  - setRating(n)                 — click rating-N button.
 *  - setComment(text)             — fill the description textarea.
 *  - submit()                     — click feedback-submit.
 *  - cancel()                     — click feedback-cancel.
 *  - expectSuccess()              — assert submit button data-status='sent'
 *                                   (locale-resilient per RESEARCH Pitfall 10).
 *  - expectRatingValue(n)         — assert rating N is checked (n=1..5) or
 *                                   no rating is checked (n=null).
 *  - expectCommentValue(text)     — assert description textarea has the
 *                                   given value.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6 / 89-02 /
 * 90-D-90-06):
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 *  - All locators are testid-anchored (Pitfall 3 — locale-resilient).
 *
 * Surface bound to:
 *  - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:158
 *    (`data-testid="feedback-form"`)
 *  - Feedback.svelte:184 (`data-testid="feedback-rating-{value}"`)
 *  - Feedback.svelte:197 (`data-testid="feedback-description"`)
 *  - Feedback.svelte:235 (`data-testid="feedback-submit"` + new Phase 91
 *    Plan 03 `data-status={status}` attribute).
 *  - Feedback.svelte:247 (`data-testid="feedback-cancel"`).
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

export interface FeedbackDialogFixture {
  /** Locator for the feedback dialog form (testid-anchored). */
  readonly dialog: Locator;
  /** Assertion: dialog visible. */
  expectVisible(): Promise<void>;
  /** Assertion: dialog hidden (form testid removed from DOM). */
  expectHidden(): Promise<void>;
  /** Assertion: submit button disabled (no rating + no description). */
  expectSendDisabled(): Promise<void>;
  /** Assertion: submit button enabled (rating OR description present). */
  expectSendEnabled(): Promise<void>;
  /** Click rating star N (1..5). */
  setRating(n: 1 | 2 | 3 | 4 | 5): Promise<void>;
  /** Fill the comment textarea. Use empty string to clear. */
  setComment(text: string): Promise<void>;
  /** Click submit. Does NOT wait for dialog close — caller asserts. */
  submit(): Promise<void>;
  /** Click cancel. Does NOT wait for dialog close. */
  cancel(): Promise<void>;
  /** Assertion: submit button data-status='sent' (locale-resilient). */
  expectSuccess(): Promise<void>;
  /** Assertion: rating N is checked (n=1..5) or no rating is checked (n=null). */
  expectRatingValue(n: 1 | 2 | 3 | 4 | 5 | null): Promise<void>;
  /** Assertion: comment textarea has the given value. */
  expectCommentValue(text: string): Promise<void>;
}

const RATINGS = [1, 2, 3, 4, 5] as const;

/**
 * Create a feedback-dialog fixture bound to `page`.
 *
 * The dialog Locator is testid-anchored to `feedback-form`; when the dialog
 * is closed the locator resolves to count=0 (see voter-feedback-persistence
 * H4 mitigation lineage: form-element DOM removal is the authoritative
 * close signal). When the dialog is open, the form testid resolves uniquely.
 */
export function createFeedbackDialog(page: Page): FeedbackDialogFixture {
  const dialog = page.getByTestId('feedback-form');
  const submitBtn = page.getByTestId('feedback-submit');
  const cancelBtn = page.getByTestId('feedback-cancel');
  const description = page.getByTestId('feedback-description');

  return {
    dialog,

    async expectVisible(): Promise<void> {
      await expect(dialog).toBeVisible();
    },

    async expectHidden(): Promise<void> {
      await expect(dialog).toHaveCount(0);
    },

    async expectSendDisabled(): Promise<void> {
      await expect(submitBtn).toBeDisabled();
    },

    async expectSendEnabled(): Promise<void> {
      await expect(submitBtn).toBeEnabled();
    },

    async setRating(n: 1 | 2 | 3 | 4 | 5): Promise<void> {
      await page.getByTestId(`feedback-rating-${n}`).click();
    },

    async setComment(text: string): Promise<void> {
      await description.fill(text);
    },

    async submit(): Promise<void> {
      await submitBtn.click();
    },

    async cancel(): Promise<void> {
      await cancelBtn.click();
    },

    async expectSuccess(): Promise<void> {
      // Pitfall 10: locale-resilient — assert on data-status attribute
      // (added in Phase 91 Plan 03 Task 1) rather than t('feedback.thanks')
      // submit-button text.
      await expect(submitBtn).toHaveAttribute('data-status', 'sent');
    },

    async expectRatingValue(n: 1 | 2 | 3 | 4 | 5 | null): Promise<void> {
      if (n === null) {
        for (const value of RATINGS) {
          await expect(page.getByTestId(`feedback-rating-${value}`)).not.toBeChecked();
        }
      } else {
        await expect(page.getByTestId(`feedback-rating-${n}`)).toBeChecked();
      }
    },

    async expectCommentValue(text: string): Promise<void> {
      await expect(description).toHaveValue(text);
    }
  };
}
