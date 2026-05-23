/**
 * Voter mega-journey fixture — Phase 88 Plan 01 Task 3.
 *
 * Design source: TEST-INVENTORY-REFACTOR-1.md line 10
 *   - "Make the answering func robust so that the answer mode is 'min'
 *     or 'max' (first or last option, or min/max in numbers)"
 *
 * SIBLING (not replacement) to the existing tests/tests/fixtures/voter.fixture.ts.
 * The legacy fixture is consumed by ~30+ specs and is preserved per the
 * parallel-landing contract in 88-CONTEXT.md §"Parallel-setup principle".
 * Future plans (88-02+) decide whether to retire the legacy fixture once
 * its consumers migrate or absorb into the mega-journey.
 *
 * What this fixture exposes:
 *   - `answerMode: 'min' | 'max'` — which extreme to pick on each
 *     opinion question. `'min'` → first option / min value /
 *     `false`-boolean; `'max'` → last option / max value /
 *     `true`-boolean.
 *   - `answeredVoterPage: Page` — page navigated through the new base
 *     dataset's full intro flow (Home → Intro → election-select →
 *     constituency-select → questions-intro → category-intros +
 *     questions → results).
 *
 * This fixture is wired against the new BUILT_IN `baseV1` dataset
 * (multi-election + multi-constituency hierarchy). The legacy
 * `voter.fixture.ts` assumes a single-election + single-constituency
 * auto-implied dataset and is NOT used by the mega-journey.
 *
 * The mega-journey spec uses the raw `page` for the pre-results
 * walkthrough (steps 9.1.x → 9.5.x intro-flow) so it can assert at
 * intermediate checkpoints; `answeredVoterPage` is intended for tests
 * that just need a results-landing fixture and don't care about the
 * intermediate steps.
 */

import { test as base } from '@playwright/test';
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';

export type AnswerMode = 'min' | 'max';

type VoterMegaFixtureOptions = {
  /** Which extreme to pick on each opinion question. Default: 'max'. */
  answerMode: AnswerMode;
  /** Optional: cap total answers (for partial-answer scenarios). Default: undefined (answer all). */
  answerCount?: number;
};

type VoterMegaFixtures = VoterMegaFixtureOptions & {
  /** A page on /results with all reachable opinion questions answered per answerMode. */
  answeredVoterPage: import('@playwright/test').Page;
};

/**
 * Walk the voter through the full new-base-template flow until the
 * /results page is reached. Each opinion question is answered per the
 * `answerMode`:
 *   - Likert (5/4/7): 'min' → first option; 'max' → last option.
 *   - singleChoiceCategorical: 'min' → first option; 'max' → last option.
 *   - Boolean: 'min' → 'No' (index 0); 'max' → 'Yes' (index 1).
 *   - Number (NOT expected in opinion questions per refactor-doc:38-44,
 *     but the helper is future-proof): 'min' → first option index 0;
 *     'max' → last option index (nth(-1)).
 */
async function walkVoterMegaJourney(
  page: import('@playwright/test').Page,
  answerMode: AnswerMode,
  answerCount?: number
): Promise<void> {
  // 1. Home page → start.
  await page.goto(buildRoute({ route: 'Home', locale: 'en' }));
  const homeStart = page.getByTestId(testIds.voter.home.startButton);
  await homeStart.waitFor({ state: 'visible', timeout: 10_000 });
  await homeStart.click();

  // 2. Intro start.
  const introStart = page.getByTestId(testIds.voter.intro.startButton);
  // Intro may auto-redirect to elections/constituencies; tolerate either.
  await page
    .waitForURL((url) => !url.toString().endsWith('/en/') && !url.toString().endsWith('/en'), {
      timeout: 10_000
    })
    .catch(() => null);
  if (await introStart.isVisible().catch(() => false)) {
    await introStart.click();
  }

  // 3. Elections page (multi-election): select all elections then continue.
  const electionsList = page.getByTestId(testIds.voter.elections.list);
  const electionsContinue = page.getByTestId(testIds.voter.elections.continue);
  if (await electionsList.isVisible({ timeout: 5_000 }).catch(() => false)) {
    // Accept default (both elections selected) or click each card to ensure selection.
    await electionsContinue.waitFor({ state: 'visible' });
    await electionsContinue.click();
  }

  // 4. Constituencies page: pick the first option in each combobox.
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  const constituenciesContinue = page.getByTestId(testIds.voter.constituencies.continue);
  if (await constituenciesList.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const comboboxes = constituenciesList.getByRole('combobox');
    const count = await comboboxes.count();
    for (let i = 0; i < count; i++) {
      const combo = comboboxes.nth(i);
      await combo.click();
      const listbox = page.getByRole('listbox');
      await listbox.waitFor({ state: 'visible', timeout: 5_000 });
      await listbox.getByRole('option').first().click();
    }
    await constituenciesContinue.waitFor({ state: 'visible' });
    await constituenciesContinue.click();
  }

  // 5. Questions intro page: continue.
  const questionsStart = page.getByTestId(testIds.voter.questions.startButton);
  if (await questionsStart.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await questionsStart.click();
  }

  // 6. Answer loop: each iteration looks for either a category-intro
  //    (continue) or a question (answer per mode). Terminates on /results.
  const categoryStart = page.getByTestId(testIds.voter.questions.categoryStart);
  const answerOption = page.getByTestId(testIds.voter.questions.answerOption);
  const nextButton = page.getByTestId(testIds.voter.questions.nextButton);
  const terminal = /\/results/;
  let answered = 0;
  const cap = answerCount ?? Number.POSITIVE_INFINITY;
  const maxIterations = 50; // generous ceiling — base dataset has ≤9 reachable opinion questions
  for (let iter = 0; iter < maxIterations; iter++) {
    if (terminal.test(page.url())) break;
    const urlBefore = page.url();
    // Wait for either a category-intro or a question.
    await categoryStart
      .or(answerOption.first())
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 });

    if (await categoryStart.isVisible().catch(() => false)) {
      await categoryStart.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      continue;
    }

    // Question page — pick by answerMode.
    if (answered >= cap) {
      // Use Skip to advance past remaining questions when answerCount is capped.
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      continue;
    }
    const choiceCount = await answerOption.count();
    if (choiceCount === 0) {
      // No selectable choices (e.g. text/number rendering) — Skip.
      await nextButton.waitFor({ state: 'visible', timeout: 5_000 });
      await nextButton.click();
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      continue;
    }
    const pickIndex = answerMode === 'min' ? 0 : choiceCount - 1;
    await answerOption.nth(pickIndex).click();
    answered++;
    // Auto-advance OR fallback to nextButton (last-question case).
    try {
      await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 3_000 });
    } catch {
      if (await nextButton.isVisible().catch(() => false)) {
        await nextButton.click();
        await page.waitForURL((url) => url.toString() !== urlBefore, { timeout: 10_000 }).catch(() => null);
      }
    }
  }

  // 7. Wait for the results list.
  await page.getByTestId(testIds.voter.results.list).waitFor({ state: 'visible', timeout: 15_000 });
}

export const voterMegaTest = base.extend<VoterMegaFixtures>({
  answerMode: ['max', { option: true }],
  answerCount: [undefined, { option: true }],

  answeredVoterPage: async ({ page, answerMode, answerCount }, use) => {
    await walkVoterMegaJourney(page, answerMode, answerCount);
    await use(page);
  }
});
