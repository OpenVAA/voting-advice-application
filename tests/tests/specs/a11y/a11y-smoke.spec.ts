/**
 * A11Y-04 axe smoke — WCAG 2.1 AA cite-and-fix regression gate.
 *
 * Phase 80 — cite-and-fix regression gate. Phase 76 baselined 5 violations across 3 rule-IDs
 * (aria-required-parent × 4, list × 2, button-name × 1 — see `76-A11Y-BASELINE.md`).
 * Phase 80 component fixes resolve all 5; this spec asserts the post-fix 0-violation state
 * AND the per-rule regression (catches future reintroductions).
 *
 * Routes (per Phase 76 CONTEXT D-07; 6 distinct entries):
 *   1. Home (voter landing /en)                       [pre-location — raw page.goto]
 *   2. Elections selector (/en/elections)             [pre-location — raw page.goto]
 *   3. Constituencies selector (/en/constituencies)   [pre-location — raw page.goto]
 *   4. Questions flow (/en/questions)                 [located — locatedVoterPage fixture]
 *   5. Results list (/en/results)                     [located — answeredVoterPage fixture]
 *   6. Voter-detail drawer (opened from Results)      [located — answeredVoterPage fixture]
 *
 * Each route: navigate → settle via role-based content wait (NEVER networkidle per DETERM-03)
 * → run AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
 * → assert per-rule 0-violation gate + global 0-violation gate.
 *
 * Phase 91 Plan 04 (D-91-RS-02b) — Located routes now consume the
 * voter-journey.fixture.ts fixtures:
 *   - `questions` route → `locatedVoterPage` (walks Home → Elections →
 *     Constituencies → /questions intro and STOPS).
 *   - `results` + `voter-detail-drawer` routes → `answeredVoterPage`
 *     (full walk through to /results landing).
 *
 * The previous admin-client UUID resolution + buildLocatedUrl helper
 * (~30 lines) is REMOVED — the fixture walks the real voter flow and
 * lets the voter context populate electionId/constituencyId via the live UI
 * path, eliminating the bypass-of-UI-flow data setup and tightening the
 * trust boundary (T-91-12 threat-register mitigation).
 *
 * Per-rule axe-id assertions + global 0-violation gate PRESERVED — no
 * weakening per CLAUDE.md WCAG 2.1 AA discipline.
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

// WCAG 2.1 AA superset per RESEARCH §Open-Question-3 — captures the maximum surface so
// Plan 04's first-run baseline reflects the full WCAG 2.1 AA contract from ROADMAP A11Y-03
// 'WCAG 2.1 AA smoke'. Cite-and-fix downstream phase can subset later if needed.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface UnlocatedAxeRoute {
  name: string;
  routeId: Route;
  /** Role-based content settle BEFORE axe scan (never networkidle per DETERM-03) */
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
 * Phase 80 cite-and-fix gate. Phase 76 baselined 5 violations across 3 rule-IDs:
 *   aria-required-parent × 4, list × 2, button-name × 1 (76-A11Y-BASELINE.md).
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

  // Per-rule regression gates (Phase 76 baselined IDs).
  expect(results.violations.filter((v) => v.id === 'aria-required-parent')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'list')).toHaveLength(0);
  expect(results.violations.filter((v) => v.id === 'button-name')).toHaveLength(0);

  // SC #4 global zero gate — "0 violations across all 6 routes". Catches new rule-IDs
  // that the per-rule trio doesn't name (e.g., heading-order from a latent h4-hoist
  // outline gap; RESEARCH §Pitfall 1).
  expect(results.violations).toHaveLength(0);

  // reason: defensive shape checks PRESERVED per RESEARCH §Open Question 3 — defends against AxeBuilder API breakage on future axe-core upgrades; zero runtime cost.
  expect(results).toHaveProperty('violations');
  expect(Array.isArray(results.violations)).toBe(true);
}

// Module-level for…of route runner — module-level dispatch satisfies
// playwright/no-conditional-in-test (no `if` inside test() bodies).
for (const route of UNLOCATED_ROUTES) {
  test(`A11Y-04 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    await assertAxeGates(results, testInfo, route.name);
  });
}

// ── Located routes — voter-journey fixture consumes (D-91-RS-02b) ──────────

voterJourneyTest('A11Y-04 axe smoke — questions', async ({ locatedVoterPage: page }, testInfo) => {
  // locatedVoterPage walks Home → Elections → Constituencies → /questions
  // intro and STOPS. The voter-questions-start button is visible at this
  // point — the intro page is the route under axe scan (matches Phase 76
  // CONTEXT D-07 "Questions flow" semantics).
  await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'questions');
});

voterJourneyTest('A11Y-04 axe smoke — results', async ({ answeredVoterPage: page }, testInfo) => {
  // answeredVoterPage walks the full flow + lands on /results. Wait for the
  // results layout tablist (Tabs.svelte) — Phase 80 Task 5b added explicit
  // role="tablist" to resolve aria-required-parent + list axe violations.
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'results');
});

voterJourneyTest('A11Y-04 axe smoke — voter-detail-drawer', async ({ answeredVoterPage: page }, testInfo) => {
  // Wait for the results layout tablist (Tabs.svelte) — Task 5b added
  // explicit role="tablist" to resolve aria-required-parent + list axe
  // violations. Same DOM target as the pre-fix `getByRole('list').first()`
  // settle, accurate role.
  await page.getByRole('tablist').first().waitFor({ state: 'visible', timeout: 10000 });
  // Open the drawer — click first entity card. The drawer renders as
  // role=dialog overlay intercepted by results/+layout.svelte beforeNavigate.
  await page.getByTestId('entity-card').first().waitFor({ state: 'visible', timeout: 10000 });
  await page.getByTestId('entity-card').first().click();
  await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });

  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  await assertAxeGates(results, testInfo, 'voter-detail-drawer');
});
