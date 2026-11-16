/**
 * @file contestantQuestionPage fixture.
 *
 * Function-fixture for the candidate per-question editor page (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/[questionId]/+page.svelte`).
 *
 * Surface:
 *  - expectHeroVisible('emoji' | 'image') — assert the contestant-questions-hero figure contains an emoji glyph or an `<img>` descendant.
 *  - expectContinueDisabled()              — assert contestant-questions-save is disabled.
 *  - expectContinueEnabled()               — assert contestant-questions-save is enabled.
 *  - selectChoice(value)                   — pick an answer choice. Number = 0-indexed nth choice; string = choice label (substring match).
 *  - enterInfo(text)                       — fill the contestant-questions-comment open-answer textarea.
 *  - clickContinue()                       — click contestant-questions-save.
 *  - saveAndLeave()                        — click contestant-questions-save and wait until the question's page has been left.
 *  - saveAndExpect(destination)            — click contestant-questions-save and assert which page the save leads to: the list of questions or the entity's home.
 *  - expectSaveLabel(kind)                 — assert that contestant-questions-save reads as a button that continues or as one that returns.
 *  - expectQuestionText(textOrRegex)       — assert the page heading matches.
 *  - expectSelectedChoice(index)           — assert the 0-indexed nth choice is the checked one.
 *  - clickCancel()                         — click contestant-questions-cancel, which discards the unsaved edit and returns to the overview.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { contestantHomeUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { selectSmallestValidMultiChoice } from '../../utils/multiChoice';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/** A page a save of a question can lead to, other than another question. */
export type QuestionSaveDestination = 'home' | 'list';

/** What a save button's label says the save leads to: onward, or back. */
export type QuestionSaveLabel = 'continue' | 'return';

/** The word of the English label that tells the two kinds apart: "Save and Continue" from "Save and Return" or "Return". */
const SAVE_LABEL_TEXT: Readonly<Record<QuestionSaveLabel, RegExp>> = Object.freeze({
  continue: /Continue/,
  return: /Return/
});

export function createContestantQuestionPage(page: Page) {
  return {
    /**
     * Assert the hero figure carries the expected content variant.
     *
     * `'emoji'` → the hero figure contains a non-empty text glyph. Hero.svelte renders emoji content as inline text inside `<HeroEmoji>` so a non-empty hero text is the canonical signal.
     *
     * `'image'` → the hero figure contains an `<img>` descendant. Hero.svelte renders image content as `<img src=...>` directly.
     */
    async expectHeroVisible(content: 'emoji' | 'image'): Promise<void> {
      const hero = page.getByTestId(testIds.contestant.questions.hero);
      await expect(hero).toBeVisible();
      if (content === 'image') {
        await expect(hero.getByRole('img').first()).toBeVisible();
      } else {
        // emoji: the hero must render visible text content (Hero.svelte renders emoji via <HeroEmoji> which emits the glyph as inline text). Assert the rendered text is non-empty.
        await expect(hero).not.toHaveText('');
      }
    },

    /**
     * Assert the contestant-questions-save button is disabled.
     */
    async expectContinueDisabled(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.questions.saveButton)).toBeDisabled();
    },

    /**
     * Assert the contestant-questions-save button is enabled.
     */
    async expectContinueEnabled(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.questions.saveButton)).toBeEnabled();
    },

    /**
     * Pick an answer choice on the OpinionQuestionInput. Numeric `value` → 0-indexed nth answer-option in DOM order. String `value` → choice-label substring match on the contestant-questions-answer container's question-choice descendants.
     */
    async selectChoice(value: string | number): Promise<void> {
      const answerContainer = page.getByTestId(testIds.contestant.questions.answerInput);
      const choices = answerContainer.getByTestId('question-choice');
      if (typeof value === 'number') {
        await choices.nth(value).click();
        return;
      }
      await choices.filter({ hasText: value }).first().click();
    },

    /**
     * Answer the CURRENT opinion question type-aware, scoped to `questionId` (the DB id from the URL) so a mid-transition read never touches the OUTGOING question's stale (detaching) choices:
     *   - number-scale → focus the native slider + press End (exact max).
     *   - multi-choice (checkbox) → click choices from index 0 upward until Save
     *     enables (the smallest count inside the authored min/max window).
     *   - radio (single/boolean/ordinal) → click the first choice.
     *
     * Settles first by waiting for either a slider OR a choice belonging to THIS question (`name=questionChoices-{questionId}`) to be visible.
     */
    async answerCurrentQuestion(questionId: string): Promise<void> {
      // Page-level locators: the candidate page remounts via `{#key question.id}` so exactly one question renders at a time. (The number input's root carries its own `number-scale-input` testid, which overrides the `contestant-questions-answer` restProp — so we cannot scope through that container for sliders; a page-level slider locator is correct.)
      const slider = page.getByTestId(testIds.voter.questions.numberSlider);
      // eslint-disable-next-line playwright/no-restricted-locators -- testid+name conjunction not expressible via getByTestId
      const scopedChoices = page.locator(`[data-testid="question-choice"][name="questionChoices-${questionId}"]`);
      // Settle on THIS question's id-scoped choices first (reliable — a stale slider lingering from an outgoing number question can NOT satisfy an id-scoped choice wait). If they never appear, it is the number question.
      const isChoiceQuestion = await scopedChoices
        .first()
        .waitFor({ state: 'visible', timeout: 4000 })
        .then(() => true)
        .catch(() => false);
      if (isChoiceQuestion) {
        // Checkbox multi-choice needs a selection count inside the authored min/max window; radio needs 1.
        const isCheckbox = (await scopedChoices.first().getAttribute('type')) === 'checkbox';
        if (isCheckbox) {
          // Select the SMALLEST VALID count instead of a hard-coded 2.
          // The base seed carries TWO multi-choice opinion questions with DIFFERENT windows (base-7 → 2..3, base-8 → exactly
          // 1), so 2 clicks is over-max on base-8 and leaves Save permanently disabled — `walkRemainingOpinionQuestions`'s `expectContinueEnabled` would fail there. The Save button IS the validity signal (isMultiChoiceCountValid, multiChoiceValidity.ts:30).
          const selected = await selectSmallestValidMultiChoice({
            choices: scopedChoices,
            validWhenEnabled: page.getByTestId(testIds.contestant.questions.saveButton)
          });
          // Every box the helper ticked must actually be checked (unchanged strictness — the old code asserted this for its fixed pair).
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
      // For `textarea-multilingual`, the `data-testid` (passed via restProps) is spread directly onto the <textarea> element itself — which IS the textbox.
      // So fill the testid'd element directly; `.getByRole('textbox')` would look for a (non-existent) textbox DESCENDANT of the textarea and hang. When translations are collapsed only the current-locale textarea renders, but `.first()` keeps this robust if a translations panel is open.
      const commentInput = page.getByTestId(testIds.contestant.questions.commentInput).first();
      await commentInput.fill(text);
    },

    /**
     * Click the contestant-questions-save button.
     */
    async clickContinue(): Promise<void> {
      await page.getByTestId(testIds.contestant.questions.saveButton).click();
    },

    /**
     * Click the contestant-questions-save button and wait until the page of this question has been left. Where a save leads is the app's to decide — the next unanswered question, the list or the entity's home — and this step asserts none of them.
     */
    async saveAndLeave(): Promise<void> {
      const questionUrl = page.url();
      await page.getByTestId(testIds.contestant.questions.saveButton).click();
      await expect(page).not.toHaveURL(questionUrl, { timeout: TIMEOUTS.slowPage });
    },

    /**
     * Click the contestant-questions-save button and assert the page the save leads to: `list` is the list of the entity's questions, `home` the entity's home. The URL patterns exclude each other, and neither matches a question's own page.
     */
    async saveAndExpect(destination: QuestionSaveDestination): Promise<void> {
      await page.getByTestId(testIds.contestant.questions.saveButton).click();
      await expect(page).toHaveURL(destination === 'list' ? contestantUrlRe('/questions') : contestantHomeUrlRe(), {
        timeout: TIMEOUTS.slowPage
      });
    },

    /**
     * Assert that the contestant-questions-save button reads as one that continues or as one that returns. The label is read in English, so the page is one opened in that locale.
     */
    async expectSaveLabel(kind: QuestionSaveLabel): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.questions.saveButton)).toHaveText(SAVE_LABEL_TEXT[kind], {
        timeout: TIMEOUTS.page
      });
    },

    /**
     * Assert the 0-indexed nth answer choice, in DOM order, is checked. Waits for the answer input first: the saved answer and the entity's draft reach the page after its first paint.
     */
    async expectSelectedChoice(index: number): Promise<void> {
      const answerContainer = page.getByTestId(testIds.contestant.questions.answerInput);
      await expect(answerContainer.getByTestId('question-choice').nth(index)).toBeChecked();
    },

    /**
     * Click the contestant-questions-cancel button: the page discards the unsaved edit and returns to the questions overview without a prompt.
     */
    async clickCancel(): Promise<void> {
      await page.getByTestId('contestant-questions-cancel').click();
    },

    /**
     * Assert the visible page heading matches `textOrRegex`.
     */
    async expectQuestionText(textOrRegex: string | RegExp): Promise<void> {
      await expect(page.getByRole('heading').first()).toContainText(textOrRegex);
    }
  };
}

export type ContestantQuestionPageFixture = ReturnType<typeof createContestantQuestionPage>;
