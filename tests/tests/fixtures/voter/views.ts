/**
 * @file Composition root for the voter-view function-fixtures.
 *
 * Consumed by `voter-journey.spec.ts` and any perm-* specs that need the
 * resultsPage / entityFilters / entityDetails abstractions.
 *
 * Usage:
 * ```ts
 * import { test, expect } from '../../fixtures/voter/views';
 *
 * test('result card contents', async ({ page, resultsPage }) => {
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
import { createAboutPage } from './aboutPage.fixture';
import { createEntityDetails } from './entityDetails.fixture';
import { createEntityFilters } from './entityFilters.fixture';
import { createQuestionInfo } from './questionInfo.fixture';
import { createResultsPage } from './resultsPage.fixture';
import { createVoterHomePage } from './voterHomePage.fixture';
import { createVoterIntroPage } from './voterIntroPage.fixture';
import { createVoterQuestionsPage } from './voterQuestionsPage.fixture';
import type { AboutPageFixture } from './aboutPage.fixture';
import type { EntityDetailsFixture } from './entityDetails.fixture';
import type { EntityFiltersFixture } from './entityFilters.fixture';
import type { QuestionInfoFixture } from './questionInfo.fixture';
import type { ResultsPageFixture } from './resultsPage.fixture';
import type { VoterHomePageFixture } from './voterHomePage.fixture';
import type { VoterIntroPageFixture } from './voterIntroPage.fixture';
import type { VoterQuestionsPageFixture } from './voterQuestionsPage.fixture';

type ViewFixtures = {
  resultsPage: ResultsPageFixture;
  entityFilters: EntityFiltersFixture;
  entityDetails: EntityDetailsFixture;
  // Voter page fixtures carrying the goToPage(locale?) + expectPageVisible
  // paradigm. Registered here so specs importing `test` from this root
  // receive them by destructuring.
  voterHomePage: VoterHomePageFixture;
  voterIntroPage: VoterIntroPageFixture;
  voterQuestionsPage: VoterQuestionsPageFixture;
  // Phase-119 EPERM voter-scoped readers (Plan 06).
  aboutPage: AboutPageFixture;
  questionInfo: QuestionInfoFixture;
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
  },
  aboutPage: async ({ page }, use) => {
    await use(createAboutPage(page));
  },
  questionInfo: async ({ page }, use) => {
    await use(createQuestionInfo(page));
  }
});

export { expect };
