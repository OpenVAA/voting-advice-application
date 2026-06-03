/**
 * @file candidateQuestionPage fixture — Phase 89 Plan 02 (TIR4:78 + 196-226 + D-89-02).
 *
 * Function-fixture for the candidate per-question editor page
 * (`apps/frontend/src/routes/candidate/(protected)/questions/[questionId]/+page.svelte`).
 *
 * Surface (TIR4:78 + 196-226):
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
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
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
