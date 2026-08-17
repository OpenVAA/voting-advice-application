/**
 * @file feedbackDialog fixture.
 *
 * Shared function-fixture for the feedback dialog (Feedback.svelte +
 * FeedbackModal.svelte). Authored standalone under tests/tests/fixtures/shared/
 * (NOT extended into voter-journey.fixture.ts) so the candidate journey can
 * consume the same surface without coupling to voter-journey's option chain.
 *
 * Surface:
 *  - dialog: Locator              — testid-bound feedback-form anchor.
 *  - expectVisible()              — assert dialog visible.
 *  - expectHidden()               — assert dialog hidden (form not visible; may remain in DOM).
 *  - expectSendDisabled()         — assert submit button disabled.
 *  - expectSendEnabled()          — assert submit button enabled.
 *  - setRating(n)                 — click rating-N button.
 *  - setComment(text)             — fill the description textarea.
 *  - submit()                     — click feedback-submit.
 *  - cancel()                     — click feedback-cancel.
 *  - expectSuccess()              — assert submit button data-status='sent'
 *                                   (locale-resilient).
 *  - expectRatingValue(n)         — assert rating N is checked (n=1..5) or
 *                                   no rating is checked (n=null).
 *  - expectCommentValue(text)     — assert description textarea has the
 *                                   given value.
 *
 * **Rigidity contract**:
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 *  - All locators are testid-anchored (locale-resilient).
 *
 * Surface bound to:
 *  - apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:158
 *    (`data-testid="feedback-form"`)
 *  - Feedback.svelte:184 (`data-testid="feedback-rating-{value}"`)
 *  - Feedback.svelte:197 (`data-testid="feedback-description"`)
 *  - Feedback.svelte:235 (`data-testid="feedback-submit"` +
 *    `data-status={status}` attribute).
 *  - Feedback.svelte:247 (`data-testid="feedback-cancel"`).
 */

import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

/**
 * Give every `POST /rest/v1/feedback` from this page its OWN feedback
 * rate-limit bucket by injecting a unique `x-forwarded-for` header per request.
 *
 * ## Why
 * The DB feedback insert is gated by a per-client-IP rate-limit trigger — 5
 * inserts per 5-minute window — keyed on the first `x-forwarded-for` IP, which
 * defaults to the literal `'unknown'` in local dev (no proxy header). Under the
 * single-worker full suite EVERY feedback-submitting spec (voter-journey ×2,
 * voter-journey-mobile ×1) POSTs from that SAME `'unknown'` bucket, and a
 * retried test re-submits — so the SHARED budget is exhausted and a genuine
 * submit is rejected 400 `P0001 "Rate limit exceeded"`. The app's catch-less
 * `submit().then()` then leaves the button stuck in `'sending'` until its 5s
 * error-timeout, past the test's `expectSuccess` window → a residual flake.
 *
 * Stamping a unique IP per request lands each genuine submission in its own
 * rate-limit bucket — exactly how distinct real users behave — so the real
 * rate-limit logic still runs (nothing is masked or disabled), it just no longer
 * collides across tests/retries. PostgREST forwards request headers into
 * `current_setting('request.headers')`, so the injected `x-forwarded-for`
 * reaches the trigger.
 *
 * Install ONCE per page before any feedback submission (idempotent — the route
 * handler is additive and only touches the feedback endpoint).
 */
export async function isolateFeedbackRateLimit(page: Page): Promise<void> {
  await page.route('**/rest/v1/feedback', async (route) => {
    // A fresh RFC-5737 TEST-NET-3 (203.0.113.0/24) address per request — a
    // reserved documentation range, guaranteed never a real client, and unique
    // enough across a suite to keep each submission in its own bucket.
    const ip = `203.0.113.${Math.floor(Math.random() * 254) + 1}`;
    await route.continue({
      headers: { ...route.request().headers(), 'x-forwarded-for': ip }
    });
  });
}

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
 * is closed the locator resolves to count=0 (form-element DOM removal is the
 * authoritative close signal). When the dialog is open, the form testid
 * resolves uniquely.
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
      await expect(dialog).toBeHidden();
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
      // Locale-resilient — assert on the data-status attribute rather than
      // t('feedback.thanks') submit-button text.
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
