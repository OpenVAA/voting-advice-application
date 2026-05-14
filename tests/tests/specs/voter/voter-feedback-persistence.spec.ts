/**
 * Voter feedback dialog persistence E2E test (E2E-03).
 *
 * Asserts the observable contract derived from
 * `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:85`
 * (`description = $state('')`) and `Feedback.svelte:132-137` (`reset()` only
 * called on send via `FeedbackModal.svelte:47-52` `onSent` timeout):
 *
 * - Opening the feedback dialog, typing text, dismissing (cancel), and
 *   reopening preserves the typed text — Feedback is kept mounted in the
 *   modal via `bind:this={feedbackRef}` so its internal `$state` survives
 *   open/close cycles, and cancel does NOT call `reset()`.
 * - After sending feedback (modal auto-closes after CLOSE_DELAY=1500ms via
 *   the `onSent` timeout that explicitly calls `feedbackRef?.reset()`),
 *   reopening shows an empty textarea.
 *
 * Spec asserts the contract, not the mechanism.
 *
 * Runs within the `voter-app` project (no settings mutation; does NOT need
 * `voter-app-popups`). The `answeredVoterPage` fixture lands the voter on
 * the results page where the feedback nav-menu entry is available
 * (rendered when `voterCtx.openFeedbackModal` is truthy per
 * `VoterNav.svelte:101-108`).
 *
 * ## DATA_RACE classification — surfaced to Plan 07
 *
 * This spec inherits the Phase-73-locked DATA_RACE for `answeredVoterPage`
 * at `voter.fixture.ts:85` — the e2e seed has 40 heterogeneous questions
 * but the fixture hard-codes 16 Likert answers (Q1–Q16) and breaks on the
 * Q25/40 categorical question (only 3 choices, `answerOption.nth(4)` is
 * invisible). Root cause + repro recorded at
 * `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`
 * (Path B + `--likert-only` modifier; scoped to Phase 78 CLEAN-05). The
 * spec body itself asserts the correct contract against the Feedback
 * component lifecycle; once CLEAN-05 lands and the fixture answers 16
 * Likert questions cleanly, this spec will move from DATA_RACE → PASS_LOCKED.
 */

import { expect } from '@playwright/test';
import { voterTest as test } from '../../fixtures/voter.fixture';

test.describe('feedback persistence (E2E-03)', { tag: ['@voter'] }, () => {
  test('feedback text persists across dismiss and resets after send', async ({ answeredVoterPage }) => {
    // Fixture answers 16 questions and navigates to /results. The feedback
    // button lives in the nav menu (rendered when voterCtx.openFeedbackModal
    // is truthy per VoterNav.svelte:101-108).
    const page = answeredVoterPage;

    // Open the feedback modal via the nav-menu feedback button. The button
    // text comes from t('feedback.send'); a locale-resilient regex matches
    // 'Feedback' (en) and equivalents.
    const openFeedbackBtn = page.getByRole('button', { name: /feedback/i }).first();
    await openFeedbackBtn.click();

    // Pitfall 8 anti-collision: multiple components render <dialog role="dialog">
    // (feedback modal, popup modal, entity-details drawer). Anchor the dialog
    // locator to a distinguishing child element. Feedback.svelte:158 renders
    // `<form data-testid="feedback-form" ...>` inside the modal — `has:` is the
    // canonical filter shape.
    const feedbackDialog = page.getByRole('dialog').filter({ has: page.getByTestId('feedback-form') });
    await expect(feedbackDialog).toBeVisible();

    // reason: textarea has aria-label tied to t('feedback.description.label');
    // multiple locales make a stable getByLabel regex fragile. Anchor to
    // testid per v2.8 P70 Cat A (CONTEXT D-11).
    const description = feedbackDialog.getByTestId('feedback-description');
    await description.fill('persistence test text');

    // Dismiss via the cancel button. Feedback.svelte:243-249 onclick={() =>
    // onCancel?.()} → FeedbackModal.svelte:62 maps onCancel to closeFeedback
    // which closes the modal WITHOUT calling feedbackRef.reset(); the inner
    // $state survives.
    // reason: cancel button text is t('common.cancel'); locale-resilient
    // testid anchor is more stable per CONTEXT D-11.
    await feedbackDialog.getByTestId('feedback-cancel').click();
    // Phase 86 DETERM-13 H1 fix: replace toBeHidden() with toHaveCount(0)
    // on the dialog locator. The <dialog> element stays in the DOM after
    // closeModal() (Modal.svelte + ModalContainer.svelte:131-144) — its
    // `open` attribute is removed, and getByRole('dialog') only matches
    // open dialogs in the accessibility tree, so count==0 == closed.
    // toBeHidden() was failing because the filter({ has: feedback-form })
    // can still resolve to an element with a stale `aria-hidden` evaluation
    // during the close transition. Mirrors the canonical Phase 64 D-11 +
    // D-14 + D-15 close-race pattern at voter-results.spec.ts:274 / 351.
    await expect(feedbackDialog).toHaveCount(0, { timeout: 5000 });

    // Reopen — Feedback is kept mounted via bind:this in FeedbackModal:62, so
    // description $state survives the close.
    await openFeedbackBtn.click();
    await expect(feedbackDialog).toBeVisible();
    await expect(description).toHaveValue('persistence test text');

    // Type new text, send. The modal auto-closes after CLOSE_DELAY=1500ms via
    // FeedbackModal.svelte:47-52 onSent → setTimeout(closeFeedback +
    // feedbackRef?.reset()). Allow up to 5s for the round-trip + close.
    await description.fill('new text for send-reset');
    // reason: submit button text varies by status (t('feedback.send') →
    // t('feedback.sending') → t('feedback.thanks')); locale-resilient testid
    // anchor is more stable per CONTEXT D-11.
    await feedbackDialog.getByTestId('feedback-submit').click();
    // Phase 86 DETERM-13 H1 fix: same toHaveCount(0) substitute for the
    // post-send close. The 1500ms CLOSE_DELAY in FeedbackModal.svelte:47-52
    // is captured by the 5s timeout; the dialog's `open` attribute is
    // removed when closeFeedback fires inside the setTimeout.
    await expect(feedbackDialog).toHaveCount(0, { timeout: 5000 });

    // Reopen post-send — feedbackRef.reset() cleared description to ''.
    await openFeedbackBtn.click();
    await expect(feedbackDialog).toBeVisible();
    await expect(description).toHaveValue('');
  });
});
