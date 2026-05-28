/**
 * @file Composition root for the TIR3 function-fixtures (Phase 88 Plan 04).
 *
 * Sibling to `tests/tests/fixtures/index.ts` (the legacy Page-Object root).
 * Consumed by `voter-mega-journey.spec.ts` (Plan 88-04 T5-T8) and any
 * future perm-* / variant-* specs that need the resultsPage / entityFilters
 * / entityDetails abstractions.
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
import type { EntityDetailsFixture } from './entityDetails.fixture';
import type { EntityFiltersFixture } from './entityFilters.fixture';
import type { ResultsPageFixture } from './resultsPage.fixture';

type ViewFixtures = {
  resultsPage: ResultsPageFixture;
  entityFilters: EntityFiltersFixture;
  entityDetails: EntityDetailsFixture;
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
  }
});

export { expect };
