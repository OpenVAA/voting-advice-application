/**
 * @file Composition root for the voter-view function-fixtures.
 *
 * Consumed by `voter-journey.spec.ts` and any perm-* specs that need the resultsPage / entityFilters / entityDetails abstractions.
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
 * The legacy `index.ts` root is UNCHANGED — both roots coexist until a future phase migrates the Page-Object specs to the function-fixture pattern.
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
import { attachForensicCapture, flushForensicCapture } from '../shared/forensicCapture.fixture';
import type { ForensicLog } from '../shared/forensicCapture.fixture';
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
  // Voter page fixtures carrying the goToPage(locale?) + expectPageVisible paradigm. Registered here so specs importing `test` from this root receive them by destructuring.
  voterHomePage: VoterHomePageFixture;
  voterIntroPage: VoterIntroPageFixture;
  voterQuestionsPage: VoterQuestionsPageFixture;
  // EPERM voter-scoped readers.
  aboutPage: AboutPageFixture;
  questionInfo: QuestionInfoFixture;
  // Forensic capture (auto).
  forensicCapture: ForensicLog;
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
  },
  // Browser console + pageerror + failed-request capture, attached BEFORE the spec navigates and flushed on teardown.
  //
  // NOTE — an auto-registered fixture has NO precedent anywhere in `tests/tests` (this registration is the only one), and it crosses the standing
  // `fixtures/shared/*` convention that such fixtures are
  // "NOT extended into a composition root". Both facts are deliberate. All 16 spec files importing this root are reached, which is the INTENDED coverage, not an incidental side effect: the standing waiver's condition — that the next occurrence arrives as data — only holds if a recurrence during ANY later run leaves evidence without someone having opted a spec in first.
  // Cost is three event listeners per page and no behaviour change; the fixture asserts nothing. See forensicCapture.fixture.ts for the rationale in full.
  forensicCapture: [
    async ({ page }, use, testInfo) => {
      const log = attachForensicCapture(page);
      await use(log);
      await flushForensicCapture(log, testInfo);
    },
    { auto: true }
  ]
});

export { expect };
