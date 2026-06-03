/**
 * axe accessibility smoke — WCAG 2.1 AA regression gate.
 *
 * Asserts the 0-violation state across 6 voter-app routes AND a per-rule
 * regression gate (aria-required-parent, list, button-name) so future
 * reintroductions are caught.
 *
 * Routes (6 distinct entries):
 *   1. Home (voter landing /en)                       [pre-location — raw page.goto]
 *   2. Elections selector (/en/elections)             [pre-location — raw page.goto]
 *   3. Constituencies selector (/en/constituencies)   [pre-location — raw page.goto]
 *   4. Questions flow (/en/questions)                 [located — locatedVoterPage fixture]
 *   5. Results list (/en/results)                     [located — answeredVoterPage fixture]
 *   6. Voter-detail drawer (opened from Results)      [located — answeredVoterPage fixture]
 *
 * Each route: navigate → settle via role-based content wait (NEVER networkidle)
 * → run AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
 * → assert per-rule 0-violation gate + global 0-violation gate.
 *
 * Located routes consume the voter-journey fixtures:
 *   - `questions` route → `locatedVoterPage` (walks Home → Elections →
 *     Constituencies → /questions intro and STOPS).
 *   - `results` + `voter-detail-drawer` routes → `answeredVoterPage`
 *     (full walk through to /results landing).
 *
 * The fixtures walk the real voter flow and let the voter context populate
 * electionId/constituencyId via the live UI path, avoiding bypass-of-UI-flow
 * data setup and tightening the trust boundary.
 *
 * Per-rule axe-id assertions + global 0-violation gate are PRESERVED — no
 * weakening, per CLAUDE.md WCAG 2.1 AA discipline.
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { voterJourneyTest } from '../../fixtures/voter/voter-journey.fixture';
import { buildRoute } from '../../utils/buildRoute';
import type { Page, TestInfo } from '@playwright/test';
import type { Route } from '../../../../apps/frontend/src/lib/utils/route/route';

// Run unauthenticated — all routes are voter-app (public).
test.use({ storageState: { cookies: [], origins: [] } });
voterJourneyTest.use({ storageState: { cookies: [], origins: [] } });

// WCAG 2.1 AA superset — captures the maximum surface so the smoke gate
// reflects the full WCAG 2.1 AA contract. A downstream consumer can subset
// later if needed.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface UnlocatedAxeRoute {
  name: string;
  routeId: Route;
  /** Role-based content settle BEFORE axe scan (never networkidle) */
  settle: (page: Page) => Promise<void>;
}

const UNLOCATED_ROUTES: ReadonlyArray<UnlocatedAxeRoute> = [
  {
    name: 'home',
    routeId: 'Home',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'elections-selector',
    routeId: 'Elections',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'constituencies-selector',
    routeId: 'Constituencies',
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  }
];

/**
 * Assert the per-rule + global 0-violation gates against an axe scan result.
 * The per-rule trio (aria-required-parent, list, button-name) are the
 * historically-regressed rule-IDs.
 */
async function assertAxeGates(
  results: Awaited<ReturnType<AxeBuilder['analyze']>>,
  testInfo: TestInfo,
  routeName: string
): Promise<void> {
  await testInfo.attach(`axe-violations-${routeName}.json`, {
    body: JSON.stringify(results.violations, null, 2),
    contentType: 'application/json'
  });

  // Per-rule regression gates.
  expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);

  // Global zero gate — "0 violations across all 6 routes". Catches new rule-IDs
  // that the per-rule trio doesn't name (e.g., heading-order from a latent
  // h4-hoist outline gap).
  expect(results.violations).toHaveLength(0);

  // reason: defensive shape checks PRESERVED — defends against AxeBuilder API breakage on future axe-core upgrades; zero runtime cost.
  expect(results).toHaveProperty('violations');
  expect(Array.isArray(results.violations)).toBe(true);
}

// Module-level for…of route runner — module-level dispatch satisfies
// playwright/no-conditional-in-test (no `if` inside test() bodies).
for (const route of UNLOCATED_ROUTES) {
  test(`axe accessibility scan — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await assertAxeGates(results, testInfo, route.name);
  });
}

// ── Located routes — voter-journey fixture consumes ────────────────────────

voterJourneyTest('axe accessibility scan — questions', async ({ locatedVoterPage: page }, testInfo) => {
  // locatedVoterPage walks Home → Elections → Constituencies → /questions
  // intro and STOPS. The voter-questions-start button is visible at this
  // point — the intro page is the route under axe scan.
  await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'questions');
});

voterJourneyTest('axe accessibility scan — results', async ({ answeredVoterPage: page }, testInfo) => {
  // answeredVoterPage walks the full flow + lands on /results. Wait for the
  // results layout tablist (Tabs.svelte) — its explicit role="tablist"
  // resolves the aria-required-parent + list axe violations.
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'results');
});

voterJourneyTest('axe accessibility scan — voter-detail-drawer', async ({ answeredVoterPage: page }, testInfo) => {
  // Wait for the results layout tablist (Tabs.svelte) — its explicit
  // role="tablist" resolves the aria-required-parent + list axe violations.
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });
  // Open the drawer — click first entity card. The drawer renders as
  // role=dialog overlay intercepted by results/+layout.svelte beforeNavigate.
  await page.getByTestId('entity-card').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('entity-card').first().click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'voter-detail-drawer');
});
