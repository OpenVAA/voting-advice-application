/**
 * Shared voter navigation helpers for E2E tests.
 *
 * These handle the full voter journey from Home to the first question,
 * clicking through any optional intermediate pages (main intro, questions
 * intro with/without category selection, category intros).
 *
 * The app's default behavior shows these intermediate pages. data.setup.ts
 * disables them, but parallel settings-mutating specs may re-enable them
 * at any time. These helpers are resilient to that.
 */

import { buildRoute } from './buildRoute';
import { testIds } from './testIds';
import type { Page } from '@playwright/test';

/**
 * Navigate from Home through all intermediate pages to the first question.
 *
 * Handles: Home → Intro → (Questions Intro?) → (Category Intro?) → First Question
 */
export async function navigateToFirstQuestion(page: Page): Promise<void> {
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  await page.getByTestId(testIds.voter.home.startButton).click();

  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  await introStart.waitFor({ state: 'visible' });
  await introStart.click();

  await clickThroughIntroPages(page);
}

/**
 * Click through any intermediate pages (questions intro, category intro)
 * until the first question's answer options are visible.
 *
 * Retries if elements are detached (e.g., due to parallel settings changes).
 */
export async function clickThroughIntroPages(page: Page): Promise<void> {
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption).first();
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  for (let attempt = 0; attempt < 5; attempt++) {
    await answerOption.or(questionsStart).or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });

    if (await answerOption.isVisible()) return;

    try {
      if (await questionsStart.isVisible()) {
        await questionsStart.click({ timeout: 3000 });
      } else if (await categoryStart.isVisible()) {
        await categoryStart.click({ timeout: 3000 });
      }
    } catch {
      // Element may have been detached due to concurrent settings change; retry
      continue;
    }
  }

  // Final fallback: just wait for the answer option
  await answerOption.waitFor({ state: 'visible', timeout: 10000 });
}

/**
 * Wait for the next question's answer options, clicking through any
 * category intro page that may appear between questions.
 */
export async function waitForNextQuestion(page: Page, answerIndex: number): Promise<void> {
  const nextAnswer = page.getByTestId(testIds.voter.questions.answerOption).nth(answerIndex);
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);

  await nextAnswer.or(categoryStart).waitFor({ state: 'visible', timeout: 10000 });
  if (await categoryStart.isVisible()) {
    await categoryStart.click();
    await nextAnswer.waitFor({ state: 'visible', timeout: 10000 });
  }
}
