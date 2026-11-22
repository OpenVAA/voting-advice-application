/**
 * @file voter.smoke.ts.
 *
 * A voter on the deployed application, reading the hosted `smoke` dataset anonymously: from the home page to the first question, whose heading holds the dataset's first statement, then through every question to the candidate results.
 *
 * It runs only behind the deployed smoke gate, which has already proved the served build and the Supabase project. It answers in the browser and writes nothing to the hosted project.
 *
 * The usage-data consent prompt is shown only when the project's `analytics.trackEvents` is on and consent is gated. When it is shown, the spec declines it through its own button, which closes the prompt, so the run sends nothing beyond the identifier-free pageview and passes whatever the hosted setting is. The handler is local to this spec because two local specs rely on the shared navigation showing the prompt as it is. A voter notification queued ahead of the prompt would need a handler of its own.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback; the prompt is handled by `addLocatorHandler` alone.
 */

import { expect, test } from '@playwright/test';
import { SMOKE_STATEMENTS } from './smokeContent';
import { answerAndAdvanceToResults } from '../fixtures/voter/voter-journey.fixture';
import { testIds } from '../utils/testIds';
import { navigateToFirstQuestion } from '../utils/voterNavigation';

test('a voter answers the hosted questions and reaches candidate results', async ({ page }) => {
  const decline = page
    .getByRole('dialog', { name: /collecting usage data/i })
    .getByRole('button', { name: /don.t want to share my data/i });
  await page.addLocatorHandler(decline, async () => {
    await decline.click();
  });
  await navigateToFirstQuestion(page);
  await expect(page.getByTestId(testIds.voter.questions.heading)).toContainText(SMOKE_STATEMENTS[0]);
  await answerAndAdvanceToResults(page, 'max');
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId(testIds.voter.results.candidateSection)).toBeVisible();
  await expect(page.getByTestId(testIds.voter.results.card).first()).toBeVisible();
});
