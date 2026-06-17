/**
 * @file perm-interactive-info.spec.ts — EPERM-07 perm-chain spec.
 *
 * Asserts the `questions.interactiveInfo.enabled` matrix IN FULL plus the
 * advanced question-info content, against the `perm-interactive-info` dataset
 * (seeded by the data-setup-perm-interactive-info project). The spec mirrors the
 * de-risked `questionInfo.probe.spec.ts` walk and consumes the `questionInfo`
 * fixture (`createQuestionInfo`, views.ts:27).
 *
 * Coverage:
 *   1. POPUP mode (shipped default `interactiveInfo.enabled=true`): on qu-popup
 *      the info affordance opens a MODAL dialog (dismissable, NOT inline), and
 *      its customData.infoSections render (title + html). Per-type arguments
 *      render for the Likert / Boolean / Categorical carriers separately
 *      (categorical grouped by choiceId).
 *   2. EXPANDER mode (re-seeded `interactiveInfo.enabled=false`): on qu-default
 *      the info affordance reveals the body INLINE (no modal), collapsible. Both
 *      modes coexist per the SAME seed (the flag is app-level; the spec re-seeds
 *      the singleton per mode and restores it in afterAll).
 *
 * The seed (`perm-interactive-info.ts`) ships ONE category (qc-opin) with five
 * opinion questions in sort order: qu-popup (0, popup carrier + infoSections),
 * qu-default (1, expander carrier), qu-likert (2), qu-boolean (3),
 * qu-categorical (4). With MINIMAL_BASE_APP_SETTINGS both questionsIntro.show
 * and categoryIntros.show are false, so walkUntilQuestionsIntro lands straight
 * on the first question (qu-popup); intra-category advances use `question-next`.
 *
 * Rigidity contract: HARD assertions only (no expect.soft / try-catch / .catch);
 * testid-only via `testIds` (getByRole permitted for the modal dialog body).
 */

import { expect, test } from '../../fixtures/voter/views';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/**
 * Dismiss the open popup-info modal (Drawer) so it stops intercepting pointer
 * events on the page-level controls (the `question-next` button sits behind the
 * modal scrim while it is open). Escape closes the Drawer; the assertion settles
 * on the modal body being hidden.
 */
async function dismissInfoModal(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await expect(page.getByTestId(testIds.voter.questions.popupInfoModal)).toBeHidden({ timeout: 15_000 });
}

/**
 * Advance from the current question to the next via the stable `question-next`
 * button, anchoring on the next question's heading text to settle the nav.
 */
async function advanceToQuestion(page: Page, nextHeading: RegExp): Promise<void> {
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  await expect(nextButton).toBeVisible({ timeout: 15_000 });
  await nextButton.click();
  await expect(page.getByTestId(testIds.voter.questions.heading)).toHaveText(nextHeading, { timeout: 15_000 });
}

const HEADINGS = {
  popup: /\[QU-POPUP\]/i,
  default: /\[QU-DEFAULT\]/i,
  likert: /\[QU-LIKERT\]/i,
  boolean: /\[QU-BOOLEAN\]/i,
  categorical: /\[QU-CATEGORICAL\]/i
} as const;

test.describe('perm-interactive-info (EPERM-07)', () => {
  test.describe.configure({ mode: 'serial' });

  test('popup mode: modal info disclosure + infoSections + per-type arguments', async ({ page, questionInfo }) => {
    // questionsIntro.show=false → walkUntilQuestionsIntro lands directly on the
    // first question (qu-popup, sort_order 0).
    await walkUntilQuestionsIntro(page);
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(testIds.voter.questions.heading)).toHaveText(HEADINGS.popup, { timeout: 15_000 });

    // POPUP mode (interactiveInfo.enabled=true): the info affordance opens a
    // MODAL dialog body (NOT an inline reveal). expectInfoMode clicks the popup
    // info button and asserts the modal body is visible.
    await questionInfo.expectInfoMode(undefined, 'popup');

    // The customData.infoSections render inside the modal (two sections seeded).
    await questionInfo.expectInfoSections([0, 1]);
    // Close the modal before navigating — the open Drawer scrim intercepts the
    // page-level question-next pointer events.
    await dismissInfoModal(page);

    // ARGUMENTS render per-type. Each carrier (qu-likert/boolean/categorical) is
    // a SEPARATE question because argument rendering is type-dependent and the
    // categorical layout groups by choiceId. Reach each via question-next, open
    // its popup-info disclosure (the carrier co-seeds an infoSection so the popup
    // disclosure renders — QuestionArguments is gated inside it), assert its
    // argument group, then dismiss the modal before the next nav.
    await advanceToQuestion(page, HEADINGS.default);
    await advanceToQuestion(page, HEADINGS.likert);
    await questionInfo.expectInfoMode(undefined, 'popup');
    await questionInfo.expectArguments(undefined, 'ordinal');
    await dismissInfoModal(page);

    await advanceToQuestion(page, HEADINGS.boolean);
    await questionInfo.expectInfoMode(undefined, 'popup');
    await questionInfo.expectArguments(undefined, 'boolean');
    await dismissInfoModal(page);

    await advanceToQuestion(page, HEADINGS.categorical);
    await questionInfo.expectInfoMode(undefined, 'popup');
    await questionInfo.expectArguments(undefined, 'categorical');
    await dismissInfoModal(page);
  });

  test.describe('expander mode (interactiveInfo.enabled=false re-seed)', () => {
    let client: SupabaseAdminClient;

    test.beforeAll(async () => {
      client = new SupabaseAdminClient();
      // Re-seed the app_settings singleton to the static-expander posture. The
      // seed ships interactiveInfo.enabled=true (popup); flipping to false makes
      // the SAME questions reveal their info body inline (QuestionBasicInfo).
      await client.updateAppSettings({
        questions: { interactiveInfo: { enabled: false } }
      });
    });

    test.afterAll(async () => {
      if (client) {
        // Restore the shipped popup-modal posture so the seed is not left mutated
        // for any downstream perm node.
        await client.updateAppSettings({
          questions: { interactiveInfo: { enabled: true } }
        });
      }
    });

    test('expander mode: inline info reveal, NO modal', async ({ page, questionInfo }) => {
      await walkUntilQuestionsIntro(page);
      await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByTestId(testIds.voter.questions.heading)).toHaveText(HEADINGS.popup, { timeout: 15_000 });

      // qu-popup carries `info` text → under enabled=false it renders the
      // QuestionBasicInfo expander (voter-questions-info-button). expectInfoMode
      // 'expander' clicks it and asserts the inline body reveals WITHOUT a modal.
      await questionInfo.expectInfoMode(undefined, 'expander');
    });
  });
});

// EFLOW-11 D-03: interactive-info works on mobile.
//
// A SCOPED mobile-viewport sub-test — `test.use` is INSIDE its own describe so
// the 390×844 isMobile/hasTouch descriptor NEVER leaks to the EPERM-07 slices
// above (a file-scope test.use would flip the whole spec to mobile). Asserts the
// popup-modal info disclosure (the shipped interactiveInfo.enabled=true default)
// opens on mobile, reusing the EPERM-07 popup assertion adapted to mobile.
test.describe('mobile viewport smoke', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('popup info disclosure opens on mobile', async ({ page, questionInfo }) => {
    const consentDialog = page.getByRole('dialog');

    // questionsIntro.show=false + categoryIntros.show=false → walkUntilQuestionsIntro
    // lands directly on the first question (qu-popup, sort_order 0). The shared
    // walk installs the DataConsentPopup auto-grant handler, so the mobile-only
    // full-width consent modal is dismissed during the walk.
    await walkUntilQuestionsIntro(page);
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId(testIds.voter.questions.heading)).toHaveText(HEADINGS.popup, { timeout: 15_000 });

    // The walk's consent handler has granted + closed the popup; assert it is
    // gone so the consent modal scrim cannot intercept the in-question popup-info
    // button driven below.
    await expect(consentDialog).toBeHidden({ timeout: 15_000 });

    // POPUP mode (interactiveInfo.enabled=true): the info affordance opens the
    // MODAL dialog body on mobile. expectInfoMode clicks the popup info button
    // and hard-asserts the modal body is visible.
    await questionInfo.expectInfoMode(undefined, 'popup');
    await expect(page.getByTestId(testIds.voter.questions.popupInfoModal)).toBeVisible({ timeout: 15_000 });
  });
});
