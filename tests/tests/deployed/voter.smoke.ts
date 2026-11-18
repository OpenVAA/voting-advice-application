/**
 * @file voter.smoke.ts.
 *
 * A voter on the deployed application, reading the hosted `smoke` dataset anonymously: from the home page to the first question, whose heading holds the dataset's first statement, then through every question to the candidate results.
 *
 * It runs only behind the deployed smoke gate, which has already proved the served build and the Supabase project. It answers in the browser and writes nothing to the hosted project.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { SMOKE_STATEMENTS } from './smokeContent';
import { answerAndAdvanceToResults } from '../fixtures/voter/voter-journey.fixture';
import { testIds } from '../utils/testIds';
import { navigateToFirstQuestion } from '../utils/voterNavigation';

test('a voter answers the hosted questions and reaches candidate results', async ({ page }) => {
  await navigateToFirstQuestion(page);
  await expect(page.getByTestId(testIds.voter.questions.heading)).toContainText(SMOKE_STATEMENTS[0]);
  await answerAndAdvanceToResults(page, 'max');
  await expect(page).toHaveURL(/\/results/);
  await expect(page.getByTestId(testIds.voter.results.candidateSection)).toBeVisible();
  await expect(page.getByTestId(testIds.voter.results.card).first()).toBeVisible();
});
