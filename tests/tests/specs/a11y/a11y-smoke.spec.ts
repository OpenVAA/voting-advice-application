/**
 * A11Y-03 axe smoke — WCAG 2.1 AA scan against 5 high-traffic voter-app routes.
 *
 * Phase 76 Plan 03 — wiring + first-run baseline only (cite-and-fix is OUT OF SCOPE for v2.9
 * per ROADMAP A11Y-03; tracked as a follow-up todo to be filed by Plan 04). The smoke runs
 * ONLY when PLAYWRIGHT_A11Y=1 is set (per the conditional-project block in
 * tests/playwright.config.ts).
 *
 * Routes (per Phase 76 CONTEXT D-07; 5 distinct entries):
 *   1. Home (voter landing /en)
 *   2. Elections selector (/en/elections)
 *   3. Constituencies selector (/en/constituencies)
 *   4. Questions flow (/en/questions — requires election + constituency selected)
 *   5. Results list (/en/results — requires election + constituency selected)
 *   6. Voter-detail drawer (opened from Results route — additive 6th block honoring the
 *      CONTEXT D-07 spec sketch; Plan 04 baseline-capture aggregates accordingly)
 *
 * Each route: navigate → settle via role-based content wait (NEVER networkidle per DETERM-03)
 * → run AxeBuilder.withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()
 * → log violations.length (do NOT assert specific count — first-run baseline only).
 *
 * STATE PREFILL — voter context reads selectedElection / selectedConstituency from URL
 * SEARCH PARAMS (NOT localStorage; verified at planning time in
 * apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts:64,66 via paramStore('electionId')
 * + paramStore('constituencyId')). Routes inside the (located) layout (questions / results /
 * voter-detail) therefore append `?electionId=<uuid>&constituencyId=<uuid>` to the navigation
 * target. UUIDs are resolved at runtime from the seeded data via SupabaseAdminClient.findData
 * (PATH A per RESEARCH §LANDMINE-6; mirrors how multi-election.spec.ts:176-181 resolves
 * variant UUIDs).
 *
 * The original LANDMINE-6 OPTION-A localStorage-prefill recipe is incorrect — the voter
 * context does not persist electionId/constituencyId to localStorage. URL search params
 * are the correct mechanism.
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import type { Page } from '@playwright/test';
import type { Route } from '../../../../apps/frontend/src/lib/utils/route/route';

// Run unauthenticated — all routes are voter-app (public).
test.use({ storageState: { cookies: [], origins: [] } });

// WCAG 2.1 AA superset per RESEARCH §Open-Question-3 — captures the maximum surface so
// Plan 04's first-run baseline reflects the full WCAG 2.1 AA contract from ROADMAP A11Y-03
// 'WCAG 2.1 AA smoke'. Cite-and-fix downstream phase can subset later if needed.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

interface AxeRoute {
  name: string;
  routeId: Route;
  /** Routes inside the (located) layout group need ?electionId=…&constituencyId=… prefill */
  needsLocatedPrefill?: boolean;
  /** Optional post-navigation interaction (e.g., open drawer) */
  postNavigate?: (page: Page) => Promise<void>;
  /** Role-based content settle BEFORE axe scan (never networkidle per DETERM-03) */
  settle: (page: Page) => Promise<void>;
}

const UNLOCATED_ROUTES: ReadonlyArray<AxeRoute> = [
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

const LOCATED_ROUTES: ReadonlyArray<AxeRoute> = [
  {
    name: 'questions',
    routeId: 'Questions',
    needsLocatedPrefill: true,
    settle: async (page) => {
      await page.getByRole('heading').first().waitFor({ state: 'visible', timeout: 10000 });
    }
  },
  {
    name: 'results',
    routeId: 'Results',
    needsLocatedPrefill: true,
    settle: async (page) => {
      await page.getByRole('list').first().waitFor({ state: 'visible', timeout: 15000 });
    }
  },
  {
    name: 'voter-detail-drawer',
    routeId: 'Results',
    needsLocatedPrefill: true,
    settle: async (page) => {
      // Wait for results list to render
      await page.getByRole('list').first().waitFor({ state: 'visible', timeout: 15000 });
      // Open the drawer — click first entity card. The drawer renders as role=dialog overlay
      // intercepted by results/+layout.svelte beforeNavigate (per voter-detail.spec.ts pattern).
      await page.getByTestId('entity-card').first().waitFor({ state: 'visible', timeout: 10000 });
      await page.getByTestId('entity-card').first().click();
      await page.getByRole('dialog').waitFor({ state: 'visible', timeout: 10000 });
    }
  }
];

let electionUuid: string;
let constituencyUuid: string;

test.beforeAll(async () => {
  // Resolve seeded election + constituency UUIDs (PATH A per RESEARCH §LANDMINE-6).
  // Mirrors multi-election.spec.ts:176-181 — uses the SupabaseAdminClient probe pattern.
  const adminClient = new SupabaseAdminClient();
  const elections = await adminClient.findData('elections', {
    externalId: { $eq: 'test-election-1' }
  });
  const constituencies = await adminClient.findData('constituencies', {
    externalId: { $eq: 'test-constituency-alpha' }
  });
  if (elections.type !== 'success' || elections.data.length === 0) {
    throw new Error(
      'A11Y-03: failed to resolve test-election-1 UUID — ' +
        `e2e seed not loaded? ${elections.type === 'failure' ? elections.cause : 'no rows'}`
    );
  }
  if (constituencies.type !== 'success' || constituencies.data.length === 0) {
    throw new Error(
      'A11Y-03: failed to resolve test-constituency-alpha UUID — ' +
        `e2e seed not loaded? ${constituencies.type === 'failure' ? constituencies.cause : 'no rows'}`
    );
  }
  electionUuid = elections.data[0].id as string;
  constituencyUuid = constituencies.data[0].id as string;
});

function buildLocatedUrl(routeId: Route): string {
  // buildRoute returns a path WITHOUT leading slash; the located routes need election +
  // constituency search params or the (located) layout redirects to the selector flow.
  const path = buildRoute({ route: routeId, locale: 'en' });
  const params = `electionId=${encodeURIComponent(electionUuid)}&constituencyId=${encodeURIComponent(constituencyUuid)}`;
  return `${path}?${params}`;
}

// Module-level for…of route runner — module-level dispatch satisfies
// playwright/no-conditional-in-test (no `if` inside test() bodies).
for (const route of UNLOCATED_ROUTES) {
  test(`A11Y-03 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildRoute({ route: route.routeId, locale: 'en' }));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

    // First-run baseline ONLY — log + attach raw violations JSON for Plan 04 baseline artifact.
    // Do NOT assert results.violations.length === 0; that's the cite-and-fix downstream phase's job.
     
    console.log(`[A11Y-03] ${route.name}: ${results.violations.length} violations`);

    await testInfo.attach(`axe-violations-${route.name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });

    // Defensive sanity check — analyze() returned a result object with the expected shape.
    expect(results).toHaveProperty('violations');
    expect(Array.isArray(results.violations)).toBe(true);
  });
}

for (const route of LOCATED_ROUTES) {
  test(`A11Y-03 axe smoke — ${route.name}`, async ({ page }, testInfo) => {
    await page.goto(buildLocatedUrl(route.routeId));
    await route.settle(page);

    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

     
    console.log(`[A11Y-03] ${route.name}: ${results.violations.length} violations`);

    await testInfo.attach(`axe-violations-${route.name}.json`, {
      body: JSON.stringify(results.violations, null, 2),
      contentType: 'application/json'
    });

    expect(results).toHaveProperty('violations');
    expect(Array.isArray(results.violations)).toBe(true);
  });
}
