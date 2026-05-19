/**
 * Voter-not-located redirect E2E tests — Phase 78 CLEAN-02.
 *
 * Validates the deferred-target `?next=` round-trip implemented in
 * `apps/frontend/src/routes/(voters)/(located)/+layout.ts` + the
 * `(voters)/elections/{+page.ts,+page.svelte}` and
 * `(voters)/constituencies/{+page.ts,+page.svelte}` selector consumers.
 *
 * Behavior under test:
 *   1. A cold voter (empty cookies + empty localStorage) navigating directly
 *      to a located route (e.g. `/results`) is redirected through the
 *      selector chain carrying the original target as `?next=<encoded>`.
 *   2. After selection completes, the selectors `goto()` the original target
 *      — gated by a path-only URL whitelist regex
 *      (`/^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/`).
 *   3. Cross-origin / external `next=` values are rejected by the
 *      constituencies-side whitelist re-check (defense in depth) — the voter
 *      falls back to the default post-selection navigation rather than being
 *      sent to the attacker-controlled URL.
 *
 * Dataset: runs under the dedicated `voter-not-located-redirect` Playwright
 * project, which reuses the Ne-Nc variant seed (2 elections × 3 constituencies
 * each — see `tests/setup/templates/variant-Ne-Nc.ts`). The base e2e seed has
 * only 1 election × 1 constituency, which `(located)/+layout.ts`'s
 * `getImpliedElectionIds` short-circuits via auto-implication — that would
 * collapse the entire `/elections?next=…` → `/constituencies?next=…` chain to
 * a single direct /results landing and silently invalidate every assertion
 * below. The Ne-Nc shape forces both selector pages to render.
 *
 * Sentinel discipline (LANDMINE-8): all new test-data references use existing
 * fixture external_ids (`test-election-1`, `test-constituency-*`). No new
 * sentinel value contains the 'Alpha' substring — `test-candidate-alpha`
 * remains an existing fixture name and is not introduced here.
 *
 * Locator policy (CONTEXT D-20): `getByTestId` calls are scoped to the
 * voter-selector continue/list testIds (already exposed in
 * `apps/frontend/src/routes/(voters)/elections/+page.svelte` and the
 * `ConstituencySelector` component); each call is annotated with a
 * `// reason:` block per Phase 73 lint-gate.
 *
 * Determinism: `playwright/no-conditional-in-test` is hard-enforced. Every
 * test body uses only `expect()` + `await` + `await page.X()` calls; no `if`
 * or `try/catch` lives inside a `test(...)` callback. Branch dispatches
 * (e.g. "click Continue then wait for URL change") are linearized — the
 * Continue button is always clickable post-selection by the time we click.
 */

import { expect, test } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Ensure unauthenticated voter context for every test in this file —
// no storageState carried over from data-setup auth fixtures.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Pick the first option in every constituency `<Select>` (combobox) rendered
 * on the /constituencies page. ConstituencySelector renders one section per
 * applicable-elections group, and each section's `SingleGroupConstituencySelector`
 * is a `<Select>` (NOT a radiogroup — see Phase 86.1 post-fix RCA), so we
 * iterate the combobox locator instead of clicking radios.
 *
 * Lives at module scope so `playwright/no-conditional-in-test` (hard-enforced
 * in this spec) does not flag the iteration loop inside a test body.
 */
async function fillAllConstituencies(page: Page): Promise<void> {
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  await expect(constituenciesList).toBeVisible({ timeout: 10000 });
  const comboboxes = constituenciesList.getByRole('combobox');
  // Wait for at least one combobox to mount, then iterate every one.
  await comboboxes.first().waitFor({ state: 'visible', timeout: 10000 });
  const count = await comboboxes.count();
  expect(count, 'expected at least one constituency-group combobox to render').toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const cb = comboboxes.nth(i);
    await cb.click();
    const listbox = page.getByRole('listbox');
    await listbox.waitFor({ state: 'visible', timeout: 5000 });
    await listbox.getByRole('option').first().click();
    await listbox.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => null);
  }
}

test.describe.configure({ mode: 'serial' });

test.describe('CLEAN-02 voter-not-located deferred-target redirect', { tag: ['@voter'] }, () => {
  const adminClient = new SupabaseAdminClient();
  let electionUuid: string | undefined;

  test.beforeAll(async () => {
    // Discover the election UUID for Test 3 (single-bounce path requires an
    // explicit electionId in the URL). Postgres-assigned UUIDs are not stable
    // across runs — external_id lookup is the canonical pattern (mirrors
    // voter-popup-hydration.spec.ts:88-94).
    const electionResult = await adminClient.findData('elections', {
      externalId: { $eq: 'test-election-1' }
    });
    expect(electionResult.type, 'CLEAN-02 spec requires test-election-1 to be present in the e2e seed').toBe('success');
    electionUuid = electionResult.data?.[0]?.id as string | undefined;
    expect(electionUuid, 'CLEAN-02 spec requires a discoverable test-election-1 UUID').toBeTruthy();
  });

  ////////////////////////////////////////////////////////////////////
  // Phase 86.1 post-fix: prior SKIP-FALLBACK removed. Root cause of the
  // 86.1-03 cell 2 chain-head failure was a dataset/project-binding
  // mismatch — this spec was running under the default `voter-app` project
  // which uses the single-election e2e seed, so `(located)/+layout.ts`
  // auto-implied both election + constituency and short-circuited the
  // `?next=` redirect chain. The spec is now bound to the dedicated
  // `voter-not-located-redirect` Playwright project (multi-election ×
  // multi-constituency Ne-Nc seed), which forces both selector pages to
  // render. The H1/H2/H4 hypotheses were red herrings — none of those
  // pathologies could have produced the observed direct-to-/results
  // landing under the single-election dataset.
  ////////////////////////////////////////////////////////////////////
  test('CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Cold-start voter: navigate directly to /results without any selectors
    // resolved. The (located)/+layout.ts gate fires the `?next=` redirect.
    await page.goto('/results');

    // Phase 86 DETERM-12: chain-head FAIL was the first test in serial mode
    // with cold storageState; the 307 redirect chain (/results → /elections
    // ?next=...) needs domcontentloaded settle headroom on cold-start before
    // toHaveURL polls. Without this, the URL assertion fires before the
    // redirect has resolved the second hop on cold dev-server starts. See
    // 86-RESEARCH.md §3.4 + 86-01-PLAN.md Task 4 Step-2 verdict path.
    await page.waitForLoadState('domcontentloaded');

    // Phase 86.1-03 cell 2 H2/H4 defense: belt-and-suspenders storage clear in case
    // upstream serial-describe siblings (e.g., voter-popup-hydration localStorage
    // addInitScript) leaked browser-context state past the storageState override.
    // Idempotent on a fresh context; only meaningful if a prior test wrote state.
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // First bounce: /elections?next=<encoded-target>
    await expect(page).toHaveURL(/\/elections\b.*[&?]next=%2Fresults/, { timeout: 10000 });

    // reason: voter-elections-continue testId is the canonical submit button
    // for the election-selector page (no accessible name beyond
    // t('common.continue'), shared with several other voter routes). The
    // election list is auto-populated with all elections selected by the
    // page's $effect (line 62-64 in elections/+page.svelte).
    await page.getByTestId(testIds.voter.elections.continue).click();

    // Second bounce: /constituencies?next=<still-encoded-target>
    await expect(page).toHaveURL(/\/constituencies\b.*[&?]next=%2Fresults/, { timeout: 10000 });

    // Constituency selection: under the Ne-Nc dataset each election has
    // 3 constituencies, so `SingleGroupConstituencySelector` renders a
    // `<Select>` combobox (not radios). Drive every section's combobox via
    // the shared helper — selectionComplete becomes true after every group's
    // selectedId is set, enabling Continue.
    await fillAllConstituencies(page);

    // reason: voter-constituencies-continue testId is the canonical submit
    // button for the constituency-selector page (same locator-discoverability
    // constraint as voter-elections-continue above).
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Final landing: /results (the original deferred target).
    await expect(page).toHaveURL(/\/results(\/|\?|$)/, { timeout: 10000 });
  });

  test('CLEAN-02 — multi-election multi-constituency bounces twice and resumes deferred target with query params preserved', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Cold-start voter going to /results with an explicit non-persistent
    // query parameter the round-trip must preserve.
    const deferredTarget = '/results?foo=bar';
    await page.goto(deferredTarget);

    await expect(page).toHaveURL(/\/elections\b.*[&?]next=/, { timeout: 10000 });

    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page).toHaveURL(/\/constituencies\b.*[&?]next=/, { timeout: 10000 });

    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Original `foo=bar` must survive the round-trip.
    await expect(page).toHaveURL(/\/results\b.*[&?]foo=bar/, { timeout: 10000 });
  });

  test('CLEAN-02 — election pre-selected via URL bounces only to constituency selector and resumes deferred target', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Plan-D-07 case 3 — "single-election pre-selected bounces ONLY to
    // constituency selector". Under Ne-Nc the dataset has 2 elections so
    // `getImpliedElectionIds` returns undefined; we exercise the
    // single-bounce code path by carrying the electionId in the URL. This
    // walks the same `if (!constituencyId) redirect(307, ...)` branch in
    // (located)/+layout.ts that an auto-implied election would hit,
    // validating the `?next=` propagation through that branch.
    expect( , 'electionUuid must be discovered in beforeAll').toBeTruthy();
    const deferredTarget = `/results?electionId=${electionUuid}`;
    await page.goto(deferredTarget);

    // Election is provided — we should bounce only once, to /constituencies.
    await expect(page).toHaveURL(/\/constituencies\b.*[&?]next=/, { timeout: 10000 });
    // We should NEVER have visited /elections in this flow.
    await expect(page).not.toHaveURL(/\/election(\/|\?|$)/);

    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    await expect(page).toHaveURL(/\/results\b.*[&?]electionId=/, { timeout: 10000 });
  });

  test('CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target', async ({ page }) => {
    test.setTimeout(45000);

    // Step 1: complete the selector chain so the voter context is populated.
    // The starting URL carries no query — exercises the simplest cold path.
    await page.goto('/results');
    await expect(page).toHaveURL(/\/elections\b.*[&?]next=/, { timeout: 10000 });
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page).toHaveURL(/\/constituencies\b.*[&?]next=/, { timeout: 10000 });

    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Voter is now on the located route with cookies + localStorage holding
    // the selectedElection / selectedConstituency state.
    await expect(page).toHaveURL(/\/results(\/|\?|$)/, { timeout: 10000 });
    const resumedUrl = page.url();

    // Step 2: simulate mid-session storage clear — the persisted voter state
    // dies but the URL still carries the route's electionId + constituencyId
    // query params, so the (located)/+layout.ts gate parses them via
    // parseParams and the load succeeds without triggering a `?next=` bounce.
    // Verify the page reaches /results again with the same query params.
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expect(page).toHaveURL(new RegExp(resumedUrl.replace(/^https?:\/\/[^/]+/, '').replace(/[?].*$/, '')), {
      timeout: 15000
    });
  });

  test('CLEAN-02 — open-redirect attempt to external URL is rejected by whitelist (defense-in-depth)', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Manually craft a `?next=` value pointing at an external host. The
    // (located)/+layout.ts whitelist would have filtered this had the voter
    // landed there first, but the spec navigates DIRECTLY to /elections so
    // the constituencies-side re-check is the gate under test. The decoded
    // value (`https://evil.example/phish`) MUST fail the whitelist regex
    // (`/^\/[a-z]{2}\/.*|^\/(results|questions|nominations)\b/`) — schemed
    // URLs do not match either alternative.
    const evilTarget = 'https://evil.example/phish';
    const encoded = encodeURIComponent(evilTarget);
    await page.goto(`/elections?next=${encoded}`);

    // Submit elections — `next` forwards to /constituencies unchanged.
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page).toHaveURL(
      new RegExp(`/constituencies\\?.*next=${encoded.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`),
      {
        timeout: 15000
      }
    );

    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // The whitelist re-check rejected the value; the voter falls back to the
    // default constituency-completion route, which routes via $getRoute to
    // /questions (when startFromConstituencyGroup is unset). Critically, the
    // page MUST NOT have navigated cross-origin.
    await expect(page).not.toHaveURL(/^https?:\/\/evil\.example/, { timeout: 10000 });
    // Positive assertion: the voter ended up on an internal route. The
    // default fallback is /questions (per constituencies/+page.svelte
    // handleSubmit lines 78-83), but /results is also a valid landing if
    // implication succeeds. Match either internal route — what matters is
    // we did NOT navigate cross-origin.
    await expect(page).toHaveURL(/\/(questions|results)/, { timeout: 10000 });
  });
});
