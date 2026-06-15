/**
 * @file questionInfo.probe.spec.ts — smoke/probe for the `questionInfo` fixture
 * (EPERM-07).
 *
 * SC2 (A8 fixtures-first): exercises the `createQuestionInfo` readers
 * (`tests/tests/fixtures/voter/questionInfo.fixture.ts`) end-to-end —
 * `expectInfoMode` (popup vs expander), `expectInfoSections`, `expectArguments`.
 *
 * ## Probe convention — see video.probe.spec.ts. Probes are OUT of the perm
 * serial chain, seeded out-of-band via the dev-seed CLI, and run in isolation
 * (perm templates clobber the shared `app_settings` singleton).
 *
 * ## SEED (out-of-band pre-step)
 *
 *   yarn db:seed --template perm-interactive-info
 *
 * `perm-interactive-info` seeds one `interactiveInfo.enabled=true` (popup) +
 * one default (static-expander) question, PLUS `customData.infoSections` (>=1
 * question) and `customData.arguments` on three questions (one Likert/ordinal,
 * one Boolean, one Categorical — categorical grouped by `choiceId`).
 *
 * ## RUN (single-file, isolated)
 *
 *   npx playwright test tests/tests/specs/_probes/questionInfo.probe.spec.ts \
 *     -c tests/playwright.config.ts
 *
 * NOTE on `question` index: the readers take an OPTIONAL 0-based index scoping
 * the locator to the Nth matching element on the page. Because the questions
 * flow shows one question at a time, the probe omits the index (defaults to the
 * first match on the current question page).
 */

import { expect, test } from '../../fixtures/voter/views';
import { walkUntilQuestionsIntro } from '../../fixtures/voter/voter-journey.fixture';
import { testIds } from '../../utils/testIds';

test.describe('@probe questionInfo fixture (EPERM-07)', () => {
  test('expectInfoMode popup + expectInfoSections on the popup carrier (q1)', async ({
    page,
    voterQuestionsPage,
    questionInfo
  }) => {
    // Walk to the located questions flow. With questionsIntro.show=false the
    // intro auto-redirects straight to the first question (qu-popup, sort_order
    // 0 — the infoSections + popup-modal carrier). clickStart is bypass-tolerant
    // (Phase 120-01) and no-ops when the page already advanced.
    await walkUntilQuestionsIntro(page);
    await voterQuestionsPage.clickStart();
    await expect(page.getByTestId(testIds.voter.questions.answerOption).first()).toBeVisible();

    // interactiveInfo.enabled=true (seed default) → the info affordance opens a
    // modal disclosure (popup mode).
    await questionInfo.expectInfoMode(undefined, 'popup');

    // Its infoSections render inside the modal (>=1 section, index 0 present).
    // The component bakes the index into the testid (voter-questions-info-section-0).
    await questionInfo.expectInfoSections([0]);
  });

  // NOTE (Phase 120-01): the per-type ARGUMENT assertions (expectArguments) and
  // the STATIC-EXPANDER mode (expectInfoMode 'expander') are NOT smoke-proven in
  // this probe. Two trace-confirmed blockers, both deferred to the EPERM-07 SPEC
  // build (Plan 05) — see 120-01-PROBE-DIAGNOSIS.md:
  //
  //   1. ARGUMENTS render-gating (component issue): QuestionArguments is rendered
  //      ONLY inside QuestionExtendedInfo.svelte's `{#if infoSections?.length}`
  //      block (QuestionExtendedInfo.svelte:52,70-80). The seed's argument
  //      carriers (qu-likert/qu-boolean/qu-categorical) carry `arguments` but NO
  //      `infoSections`, so their argument groups never render. Surfacing/deciding
  //      this gating (move `{#if args}` outside the infoSections conditional, or
  //      co-seed infoSections on the argument carriers) is EPERM-07 spec work.
  //
  //   2. EXPANDER mode: interactiveInfo.enabled is an APP-LEVEL setting
  //      (perm-interactive-info.ts:297, MINIMAL_BASE_APP_SETTINGS) and this
  //      template ships enabled=true. The expander-mode assertion requires
  //      re-seeding app_settings to enabled=false — the per-mode re-seed matrix
  //      that the EPERM-07 spec owns (per the seed's own design comment).
  //
  // The probe proves the popup-path readers (expectInfoMode 'popup' +
  // expectInfoSections) against the shipped seed posture — the SC2 fixtures-first
  // smoke contract.
});
