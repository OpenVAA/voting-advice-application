/**
 * @file voter.smoke.ts.
 *
 * A voter on the deployed application, reading the hosted `smoke` dataset anonymously: from the home page to the first question, whose heading holds the dataset's first statement, then through every question to the results list and its first card.
 *
 * It runs only behind the deployed smoke gate, which has already proved the served build and the Supabase project. It answers in the browser and writes nothing to the hosted project.
 *
 * The usage-data consent prompt is shown only when the project's `analytics.trackEvents` is on and consent is gated. When it is shown, the spec declines it through its own button, which closes the prompt, so the run sends nothing beyond the identifier-free pageview and passes whatever the hosted setting is. The handler is local to this spec because two local specs rely on the shared navigation showing the prompt as it is. A voter notification queued ahead of the prompt would need a handler of its own.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback; the prompt is handled by `addLocatorHandler` alone.
 */

import { expect, test } from '@playwright/test';
import { SMOKE_STATEMENTS } from './smokeContent';
import { createConsentPrompt, DECLINED_BUTTON } from '../fixtures/voter/consentPrompt.fixture';
import { createResultsPage } from '../fixtures/voter/resultsPage.fixture';
import { answerAndAdvanceToResults } from '../fixtures/voter/voter-journey.fixture';
import { testIds } from '../utils/testIds';
import { navigateToFirstQuestion } from '../utils/voterNavigation';

test('a voter answers the hosted questions and reaches the results', async ({ page }) => {
  const decline = createConsentPrompt(page).prompt.getByRole('button', { name: DECLINED_BUTTON });
  await page.addLocatorHandler(decline, async () => {
    await decline.click();
  });
  await navigateToFirstQuestion(page);
  await expect(page.getByTestId(testIds.voter.questions.heading)).toContainText(SMOKE_STATEMENTS[0]);
  await answerAndAdvanceToResults(page, 'max');
  await expect(page).toHaveURL(/\/results/);
  const results = createResultsPage(page);
  await results.expectPageVisible();
  await expect(results.getEntityCards().first()).toBeVisible();
});
