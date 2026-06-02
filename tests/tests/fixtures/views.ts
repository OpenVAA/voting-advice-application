/**
 * @file Composition root for the TIR3 function-fixtures (Phase 88 Plan 04).
 *
 * Consumed by `voter-mega-journey.spec.ts` (Plan 88-04 T5-T8) and any
 * future perm-* specs that need the resultsPage / entityFilters /
 * entityDetails abstractions.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../../fixtures/views';
 *
 * test('result-card-contents', async ({ page, resultsPage }) => {
 *   await resultsPage.selectElection(/Regional/i);
 *   const cards = resultsPage.getEntityCards();
 *   await expect(cards.first()).toBeVisible();
 * });
 * ```
 *
 * The legacy `index.ts` root is UNCHANGED — both roots coexist until a
 * future phase migrates the Page-Object specs to the function-fixture
 * pattern.
 */

import { expect, test as base } from '@playwright/test';
import { createEntityDetails } from './entityDetails.fixture';
import { createEntityFilters } from './entityFilters.fixture';
import { createResultsPage } from './resultsPage.fixture';
import { createVoterHomePage } from './voter/voterHomePage.fixture';
import { createVoterIntroPage } from './voter/voterIntroPage.fixture';
import { createVoterQuestionsPage } from './voter/voterQuestionsPage.fixture';
import type { EntityDetailsFixture } from './entityDetails.fixture';
import type { EntityFiltersFixture } from './entityFilters.fixture';
import type { ResultsPageFixture } from './resultsPage.fixture';
import type { VoterHomePageFixture } from './voter/voterHomePage.fixture';
import type { VoterIntroPageFixture } from './voter/voterIntroPage.fixture';
import type { VoterQuestionsPageFixture } from './voter/voterQuestionsPage.fixture';

type ViewFixtures = {
  resultsPage: ResultsPageFixture;
  entityFilters: EntityFiltersFixture;
  entityDetails: EntityDetailsFixture;
  // Phase 92 Plan 03 (D-09): the net-new voter page fixtures carrying the
  // goToPage(locale?) + expectPageVisible paradigm. Registered here so specs
  // importing `test` from this root receive them by destructuring.
  voterHomePage: VoterHomePageFixture;
  voterIntroPage: VoterIntroPageFixture;
  voterQuestionsPage: VoterQuestionsPageFixture;
};

export const test = base.extend<ViewFixtures>({
  resultsPage: async ({ page }, use) => {
    await use(createResultsPage(page));
  },
  entityFilters: async ({ page }, use) => {
    await use(createEntityFilters(page));
  },
  entityDetails: async ({ page }, use) => {
    await use(createEntityDetails(page));
  },
  voterHomePage: async ({ page }, use) => {
    await use(createVoterHomePage(page));
  },
  voterIntroPage: async ({ page }, use) => {
    await use(createVoterIntroPage(page));
  },
  voterQuestionsPage: async ({ page }, use) => {
    await use(createVoterQuestionsPage(page));
  }
});

export { expect };
