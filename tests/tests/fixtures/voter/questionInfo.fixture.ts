/**
 * @file questionInfo fixture (voter).
 *
 * Function-fixture exposing the extended-question-info readers consumed by the
 * Phase-120 EPERM specs: `expectInfoMode`, `expectInfoSections`,
 * `expectArguments`. Mirrors the `feedbackDialog.fixture.ts` testid-anchored
 * reader-factory shape (typed interface + `create<Name>(page)` factory) and
 * routes every locator through `testIds` (A3 — no raw locators).
 *
 * Surface:
 *  - expectInfoMode(question, mode)   — assert the info affordance opens the
 *      expected surface:
 *        - 'popup'    → click the interactiveInfo button, assert the modal body
 *                       (`popupInfoModal`) is visible (modal disclosure).
 *        - 'expander' → click the existing expander info button
 *                       (`voter-questions-info-button`), assert the inline body
 *                       reveals WITHOUT a modal (`popupInfoModal` not visible).
 *  - expectInfoSections(sections)     — enumerate the per-section testids
 *      (`infoSection`) and assert each expected section index renders.
 *  - expectArguments(question, type)  — assert the type-appropriate argument
 *      layout (`argumentGroup`). For `type='categorical'` the groups are keyed
 *      by `choiceId`, so the reader asserts ≥1 grouped argument block renders.
 *
 * **`question` shape:** an OPTIONAL 0-based index used to scope the locator to
 * the Nth matching element on the page (the lightest shape consistent with the
 * voterQuestionsPage fixture, which navigates one question at a time). When the
 * page shows a single question the index is omitted (defaults to the first
 * match). Documented in the plan SUMMARY.
 *
 * **Rigidity contract**:
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 *  - All locators are testid-anchored via `testIds` (locale-resilient).
 *
 * Surface bound to:
 *  - QuestionExtendedInfoButton.svelte popup info button
 *    (`testIds.voter.questions.popupInfoButton`).
 *  - QuestionExtendedInfo.svelte modal body
 *    (`testIds.voter.questions.popupInfoModal`) + per-section markers
 *    (`testIds.voter.questions.infoSection`).
 *  - QuestionBasicInfo.svelte expander info button
 *    (`testIds.voter.questions.infoButton`).
 *  - QuestionArguments.svelte per-group markers
 *    (`testIds.voter.questions.argumentGroup`, categorical keyed by choiceId).
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/** Info disclosure mode. */
export type InfoMode = 'popup' | 'expander';

/**
 * Optional 0-based question index used to scope a reader to the Nth matching
 * element on the page. Omit when the page shows a single question.
 */
export type QuestionRef = number | undefined;

export interface QuestionInfoFixture {
  /**
   * Click the info affordance for `question` and assert the expected
   * disclosure surface:
   *  - 'popup'    → modal body visible.
   *  - 'expander' → inline body revealed, no modal.
   */
  expectInfoMode(question: QuestionRef, mode: InfoMode): Promise<void>;
  /**
   * Assert each expected info-section index renders. `sections` is the set of
   * 0-based section indices expected to be present.
   */
  expectInfoSections(sections: ReadonlyArray<number>): Promise<void>;
  /**
   * Assert the type-appropriate argument layout for `question`. For
   * `type='categorical'` the groups are keyed by choiceId; the reader asserts
   * at least one argument group renders.
   */
  expectArguments(question: QuestionRef, type: 'ordinal' | 'boolean' | 'categorical'): Promise<void>;
}

/**
 * Resolve a testid-anchored locator, optionally scoped to the Nth match when an
 * index is supplied. When `index` is undefined the first match is used.
 */
function nthOrFirst(locator: Locator, index: QuestionRef): Locator {
  return typeof index === 'number' ? locator.nth(index) : locator.first();
}

/**
 * Create a question-info reader bound to `page`.
 */
/**
 * Per-type argument-group testid suffix. `QuestionArguments.svelte` bakes the
 * suffix INTO the testid (`voter-questions-argument-group-{choiceId ?? type}`,
 * QuestionArguments.svelte:64), so — like the `infoSection` per-index testid —
 * the base `voter-questions-argument-group` is an exact-match miss and never
 * resolves. The reader must target the suffixed testid.
 *
 * Non-categorical carriers key by the ARGUMENT_TYPE string (`likertPros` /
 * `booleanPros`); the categorical carrier keys by `choiceId` ('a' is the first
 * seeded choice group). Each carrier seeds at least the "pros" group, so the
 * reader asserts that group renders.
 */
const ARGUMENT_GROUP_SUFFIX: Record<'ordinal' | 'boolean' | 'categorical', string> = {
  ordinal: 'likertPros',
  boolean: 'booleanPros',
  categorical: 'a'
};

export function createQuestionInfo(page: Page): QuestionInfoFixture {
  const popupButton = page.getByTestId(testIds.voter.questions.popupInfoButton);
  const popupModal = page.getByTestId(testIds.voter.questions.popupInfoModal);
  const expanderButton = page.getByTestId(testIds.voter.questions.infoButton);

  return {
    async expectInfoMode(question: QuestionRef, mode: InfoMode): Promise<void> {
      if (mode === 'popup') {
        await nthOrFirst(popupButton, question).click();
        await expect(nthOrFirst(popupModal, question)).toBeVisible();
      } else {
        await nthOrFirst(expanderButton, question).click();
        // Expander reveals the inline body — assert NO modal appears. The popup
        // modal is never mounted in expander mode (count=0); `toBeHidden()`
        // passes for both the not-attached and hidden states and is the
        // lint-preferred form (playwright/no-useless-not).
        await expect(popupModal).toBeHidden();
      }
    },

    async expectInfoSections(sections: ReadonlyArray<number>): Promise<void> {
      // QuestionExtendedInfo.svelte bakes the section index INTO the testid
      // (`data-testid="voter-questions-info-section-{index}"`,
      // QuestionExtendedInfo.svelte:58), so each section is an exact-match
      // distinct testid — NOT a `.nth(index)` slice of a shared base testid.
      // Playwright's `getByTestId` is an exact match, so the base
      // `voter-questions-info-section` never matches `…-section-0` (see phase 120
      // trace-confirmed fixture/component mismatch).
      for (const index of sections) {
        await expect(page.getByTestId(`${testIds.voter.questions.infoSection}-${index}`)).toBeVisible();
      }
    },

    async expectArguments(question: QuestionRef, type: 'ordinal' | 'boolean' | 'categorical'): Promise<void> {
      // The arguments live in a collapsible Expander (QuestionExtendedInfo.svelte)
      // whose content mounts ONLY when expanded (Expander.svelte:162 `{#if
      // expanded}`). Expand it first by clicking its toggle checkbox (the
      // Expander starts collapsed; expectArguments is called against a freshly
      // opened modal, so a single click reveals it deterministically).
      const argumentsExpander = page.getByTestId(testIds.voter.questions.argumentsExpander);
      await expect(argumentsExpander).toBeVisible();
      await argumentsExpander.getByRole('checkbox').click();

      // The type-appropriate layout renders a grouped argument block keyed by
      // choiceId (categorical) or the ARGUMENT_TYPE string (ordinal/boolean).
      // `QuestionArguments.svelte:64` bakes the suffix into the testid, so the
      // reader targets `voter-questions-argument-group-{suffix}` (an exact-match
      // distinct testid) — NOT the bare base, which never resolves.
      const suffixed = page.getByTestId(`${testIds.voter.questions.argumentGroup}-${ARGUMENT_GROUP_SUFFIX[type]}`);
      await expect(nthOrFirst(suffixed, question)).toBeVisible();
    }
  };
}

export type { QuestionInfoFixture as QuestionInfoFixtureType };
