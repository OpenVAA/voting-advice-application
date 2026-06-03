/**
 * @file minimalVoterResultsPage fixture — Phase 93 Plan 03 (D-16, FLAG-5).
 *
 * Extracted from `voter-journey.fixture.ts` (formerly `voter-mega.fixture.ts`)
 * so the minimal-dataset perm specs depend on a narrow, single-purpose
 * fixture rather than the full voter-journey composition root.
 *
 * `minimalVoterResultsPage` drives the robust race-based
 * `navigateToFirstQuestion` (`advanceVoterFlow`) traversal for the MINIMAL
 * (single-election + single-constituency) `buildMinimal` perm datasets. With
 * a single election + single constituency the elections/constituencies pages
 * auto-imply and the /questions intro page is skipped — the voter lands
 * DIRECTLY on the first question, so the intro start button never renders.
 * The race-based passer tolerates every missing intermediate page; the
 * hard-wait `walkUntilQuestionsIntro` (used by `answeredVoterPage`) does not.
 *
 * Behaviour is identical to the pre-extraction `minimalVoterResultsPage`
 * fixture body (CLEAN CUT, no rewrite): `navigateToFirstQuestion(page)` then
 * `answerAndAdvanceToResults(page, answerMode, answerCount)` then `use(page)`.
 *
 * Consumed by `perm-hide-if-missing-answers.spec.ts` +
 * `perm-disable-allow-open.spec.ts`.
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
   * A page on /results with all reachable opinion questions answered per
   * answerMode — for the MINIMAL (single-election + single-constituency)
   * `buildMinimal` perm datasets.
   */
  minimalVoterResultsPage: Page;
};

export const minimalVoterResultsTest = base.extend<MinimalVoterResultsFixtures>({
  answerMode: ['max', { option: true }],
  answerCount: [undefined, { option: true }],

  minimalVoterResultsPage: async ({ page, answerMode, answerCount }, use) => {
    // Robust traversal for the minimal (1-election + 1-constituency)
    // perm datasets: `navigateToFirstQuestion` race-walks through whatever
    // intermediate pages render (none, when everything auto-implies) and
    // lands on the first question. `answerAndAdvanceToResults` then answers
    // through to /results — its leading questions-intro start click is
    // guarded with `isVisible`, so it no-ops when the intro page was skipped.
    await navigateToFirstQuestion(page);
    await answerAndAdvanceToResults(page, answerMode, answerCount);
    await use(page);
  }
});

export { expect } from '@playwright/test';
