/**
 * @file candidateQuestionPage fixture.
 *
 * Function-fixture for the candidate per-question editor page
 * (`apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte`).
 *
 * Surface:
 *  - expectHeroVisible('emoji' | 'image') — assert the candidate-questions-hero
 *                                            figure contains an emoji glyph or
 *                                            an `<img>` descendant.
 *  - expectContinueDisabled()              — assert candidate-questions-save is
 *                                            disabled.
 *  - expectContinueEnabled()               — assert candidate-questions-save is
 *                                            enabled.
 *  - selectChoice(value)                   — pick an answer choice. Number =
 *                                            0-indexed nth choice; string =
 *                                            choice label (substring match).
 *  - enterInfo(text)                       — fill the candidate-questions-comment
 *                                            open-answer textarea.
 *  - clickContinue()                       — click candidate-questions-save.
 *  - expectQuestionText(textOrRegex)       — assert the page heading matches.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`,
 * NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { selectSmallestValidMultiChoice } from '../../utils/multiChoice';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createCandidateQuestionPage(page: Page) {
  return {
    /**
     * Assert the hero figure carries the expected content variant.
     *
     * `'emoji'` → the hero figure contains a non-empty text glyph. Hero.svelte
     * renders emoji content as inline text inside `<HeroEmoji>` so a
     * non-empty hero text is the canonical signal.
     *
     * `'image'` → the hero figure contains an `<img>` descendant. Hero.svelte
     * renders image content as `<img src=...>` directly.
     */
    async expectHeroVisible(content: 'emoji' | 'image'): Promise<void> {
      const hero = page.getByTestId(testIds.candidate.questions.hero);
      await expect(hero).toBeVisible();
      if (content === 'image') {
        await expect(hero.getByRole('img').first()).toBeVisible();
      } else {
        // emoji: the hero must render visible text content (Hero.svelte
        // renders emoji via <HeroEmoji> which emits the glyph as inline
        // text). Assert the rendered text is non-empty.
        await expect(hero).not.toHaveText('');
      }
    },

    /**
     * Assert the candidate-questions-save button is disabled.
     */
    async expectContinueDisabled(): Promise<void> {
      await expect(page.getByTestId(testIds.candidate.questions.saveButton)).toBeDisabled();
    },

    /**
     * Assert the candidate-questions-save button is enabled.
     */
    async expectContinueEnabled(): Promise<void> {
      await expect(page.getByTestId(testIds.candidate.questions.saveButton)).toBeEnabled();
    },

    /**
     * Pick an answer choice on the OpinionQuestionInput. Numeric `value`
     * → 0-indexed nth answer-option in DOM order. String `value` →
     * choice-label substring match on the candidate-questions-answer
     * container's question-choice descendants.
     */
    async selectChoice(value: string | number): Promise<void> {
      const answerContainer = page.getByTestId(testIds.candidate.questions.answerInput);
      const choices = answerContainer.getByTestId('question-choice');
      if (typeof value === 'number') {
        await choices.nth(value).click();
        return;
      }
      await choices.filter({ hasText: value }).first().click();
    },

    /**
     * Answer the CURRENT opinion question type-aware (Phase 129 D-12), scoped to
     * `questionId` (the DB id from the URL) so a mid-transition read never
     * touches the OUTGOING question's stale (detaching) choices:
     *   - number-scale → focus the native slider + press End (exact max).
     *   - multi-choice (checkbox) → click choices from index 0 upward until Save
     *     enables (the smallest count inside the authored min/max window).
     *   - radio (single/boolean/ordinal) → click the first choice.
     *
     * Settles first by waiting for either a slider OR a choice belonging to THIS
     * question (`name=questionChoices-{questionId}`) to be visible.
     */
    async answerCurrentQuestion(questionId: string): Promise<void> {
      // Page-level locators: the candidate page remounts via `{#key question.id}`
      // so exactly one question renders at a time. (The number input's root
      // carries its own `number-scale-input` testid, which overrides the
      // `candidate-questions-answer` restProp — so we cannot scope through that
      // container for sliders; a page-level slider locator is correct.)
      const slider = page.getByTestId(testIds.voter.questions.numberSlider);
      // eslint-disable-next-line playwright/no-restricted-locators -- testid+name conjunction not expressible via getByTestId
      const scopedChoices = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
      // Settle on THIS question's id-scoped choices first (reliable — a stale
      // slider lingering from an outgoing number question can NOT satisfy an
      // id-scoped choice wait). If they never appear, it is the number question.
      const isChoiceQuestion = await scopedChoices
        .first()
        .waitFor({ state: 'visible', timeout: 4000 })
        .then(() => true)
        .catch(() => false);
      if (isChoiceQuestion) {
        // Checkbox multi-choice needs a selection count inside the authored
        // min/max window; radio needs 1.
        const isCheckbox = (await scopedChoices.first().getAttribute('type')) === 'checkbox';
        if (isCheckbox) {
          // Phase 135 GUARD-01: select the SMALLEST VALID count instead of a
          // hard-coded 2. The base seed now carries TWO multi-choice opinion
          // questions with DIFFERENT windows (base-7 → 2..3, base-8 → exactly
          // 1), so 2 clicks is over-max on base-8 and leaves Save permanently
          // disabled — `walkRemainingOpinionQuestions`'s `expectContinueEnabled`
          // would fail there. The Save button IS the validity signal
          // (isMultiChoiceCountValid, multiChoiceValidity.ts:30).
          const selected = await selectSmallestValidMultiChoice({
            choices: scopedChoices,
            validWhenEnabled: page.getByTestId(testIds.candidate.questions.saveButton)
          });
          // Every box the helper ticked must actually be checked (unchanged
          // strictness — the old code asserted this for its fixed pair).
          for (let i = 0; i < selected; i++) {
            await expect(scopedChoices.nth(i)).toBeChecked();
          }
        } else {
          await scopedChoices.nth(0).click();
        }
        return;
      }
      // Number question — no id-scoped choices. Wait for the slider then max it.
      await expect(slider.first()).toBeVisible();
      await slider.first().focus();
      await page.keyboard.press('End');
    },

    /**
     * Fill the open-answer (comment) textarea.
     */
    async enterInfo(text: string): Promise<void> {
      // For `textarea-multilingual`, the `data-testid` (passed via restProps) is
      // spread directly onto the <textarea> element itself — which IS the textbox.
      // So fill the testid'd element directly; `.getByRole('textbox')` would look
      // for a (non-existent) textbox DESCENDANT of the textarea and hang. When
      // translations are collapsed only the current-locale textarea renders, but
      // `.first()` keeps this robust if a translations panel is open.
      const commentInput = page.getByTestId(testIds.candidate.questions.commentInput).first();
      await commentInput.fill(text);
    },

    /**
     * Click the candidate-questions-save button.
     */
    async clickContinue(): Promise<void> {
      await page.getByTestId(testIds.candidate.questions.saveButton).click();
    },

    /**
     * Assert the visible page heading matches `textOrRegex`.
     */
    async expectQuestionText(textOrRegex: string | RegExp): Promise<void> {
      await expect(page.getByRole('heading').first()).toContainText(textOrRegex);
    }
  };
}

export type CandidateQuestionPageFixture = ReturnType<typeof createCandidateQuestionPage>;
