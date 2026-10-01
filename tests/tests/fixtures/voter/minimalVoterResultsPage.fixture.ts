/**
 * @file minimalVoterResultsPage fixture.
 *
 * A narrow, single-purpose fixture (separate from the full voter-journey composition root) for the minimal-dataset perm specs.
 *
 * `minimalVoterResultsPage` serves the MINIMAL (single-election + single-constituency) `buildMinimal` perm datasets. With a single election and a single constituency the elections and constituencies pages auto-imply and the /questions intro page is skipped, so the voter lands DIRECTLY on the first question and the intro start button never renders.
 * `navigateToFirstQuestion` walks from Home to that question through whichever pages render, and `answerAndAdvanceToResults` answers through to /results.
 *
 * Consumed by `perm-hide-if-missing-answers.spec.ts` + `perm-disable-allow-open.spec.ts`.
 */

import { test as base } from '@playwright/test';
import { answerAndAdvanceToResults } from './voter-journey.fixture';
import { navigateToFirstQuestion } from '../../utils/voterNavigation';
import type { Page } from '@playwright/test';
import type { AnswerMode } from './voter-journey.fixture';

type MinimalVoterResultsFixtureOptions = {
  /** Which extreme to pick on each opinion question. Default: 'max'. */
  answerMode: AnswerMode;
  /** Optional: cap total answers (for partial-answer scenarios). Default: undefined (answer all). */
  answerCount?: number;
};

type MinimalVoterResultsFixtures = MinimalVoterResultsFixtureOptions & {
  /**
   * A page on /results with all reachable opinion questions answered per answerMode — for the MINIMAL (single-election + single-constituency) `buildMinimal` perm datasets.
   */
  minimalVoterResultsPage: Page;
};

export const minimalVoterResultsTest = base.extend<MinimalVoterResultsFixtures>({
  answerMode: ['max', { option: true }],
  answerCount: [undefined, { option: true }],

  minimalVoterResultsPage: async ({ page, answerMode, answerCount }, use) => {
    // `navigateToFirstQuestion` walks through whichever intermediate pages render (none, when everything auto-implies) and lands on the first question. `answerAndAdvanceToResults` then answers through to /results; its opening stage walk acts on a questions intro only when one is showing.
    await navigateToFirstQuestion(page);
    await answerAndAdvanceToResults(page, answerMode, answerCount);
    await use(page);
  }
});

export { expect } from '@playwright/test';
