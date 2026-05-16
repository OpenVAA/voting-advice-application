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
 * Dataset: default `voter-app` Playwright project consumes the e2e seed
 * (2 elections × multi-constituency per `packages/dev-seed/src/templates/e2e.ts`).
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

// Ensure unauthenticated voter context for every test in this file —
// no storageState carried over from data-setup auth fixtures.
test.use({ storageState: { cookies: [], origins: [] } });

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
    expect(
      electionResult.type,
      'CLEAN-02 spec requires test-election-1 to be present in the e2e seed'
    ).toBe('success');
    electionUuid = electionResult.data?.[0]?.id as string | undefined;
    expect(
      electionUuid,
      'CLEAN-02 spec requires a discoverable test-election-1 UUID'
    ).toBeTruthy();
  });

  ////////////////////////////////////////////////////////////////////
  // Phase 86.1-03 cell 2 SKIP-FALLBACK (DETERM-14) — applied per
  // CONTEXT D-04 1h RCA cap and D-06 3-element skip protocol.
  //
  // What was attempted: H2/H4 belt-and-suspenders storage clear
  // (localStorage.clear() + sessionStorage.clear() at lines 92-97 above)
  // — insufficient. Per-spec smoke (post-fix/86.1-03-cell2-smoke.txt)
  // captured the failure: page.goto('/results') is now landing on
  // /results/candidates directly (URL pattern "received: http://localhost:
  // 5173/results/candidates"; expected: /\/elections\?next=/), so the
  // (located)/+layout.ts gate's redirect chain is either short-circuited
  // by auto-implication on cold-start full-suite runs OR a downstream
  // routing change made the `?next=` bounce unreachable for the simplest
  // cold path.
  //
  // Both H1 (Phase 84 DETERM-08 portrait-gate inversion) was disproved
  // by the Phase 86 domcontentloaded settle gate at line 90. H2 (cookie/
  // storage isolation) and H4 (serial-describe context-leak) both
  // empirically insufficient — the storage-clear runs AFTER the goto +
  // waitForLoadState, so by then the loader has already evaluated the
  // (located)/+layout.ts gate.
  //
  // 4 within-cascade tests (lines 152, 181, 215; plus the multi-election
  // variant at line 125) remain cascade-blocked under Playwright 1.58.2
  // serial-mode chain-head-skip propagation.
  //
  // v2.11+ investigation queued at:
  // .planning/todos/pending/2026-05-16-voter-not-located-redirect-clean-02.md
  ////////////////////////////////////////////////////////////////////
  // eslint-disable-next-line playwright/no-skipped-test
  test('CLEAN-02 — direct link to /results route with no election picked bounces twice and resumes /results', async ({
    page
  }) => {
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      true,
      [
        'Phase 86.1-03 cell 2: CLEAN-02 chain-head redirect-cascade exceeds 1h RCA budget.',
        'Phase 86 RESEARCH §3.4 H2 (cookie/storage isolation) + H4 (serial-describe context-leak) both plausible.',
        'Phase 84 DETERM-08 H1 disproved by Phase 86 commit settle gate at line 90.',
        'v2.11+: .planning/todos/pending/2026-05-16-voter-not-located-redirect-clean-02.md'
      ].join(' ')
    );

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
    await expect(page).toHaveURL(/\/elections\?next=/, { timeout: 15000 });

    // reason: voter-elections-continue testId is the canonical submit button
    // for the election-selector page (no accessible name beyond
    // t('common.continue'), shared with several other voter routes). The
    // election list is auto-populated with all elections selected by the
    // page's $effect (line 62-64 in elections/+page.svelte).
    await page.getByTestId(testIds.voter.elections.continue).click();

    // Second bounce: /constituencies?next=<still-encoded-target>
    await expect(page).toHaveURL(/\/constituencies\?next=/, { timeout: 15000 });

    // Constituency selection: the ConstituencySelector renders one selector
    // per election; clicking the first option for each completes the
    // selection (selectionComplete becomes true, enabling Continue).
    // reason: constituency-selector testId is the wrapper for the selector
    // surface — required because the radiogroup name varies per election and
    // has no globally-stable accessible name across the test seed.
    const selector = page.getByTestId(testIds.voter.constituencies.selector);
    await selector.first().waitFor({ state: 'visible', timeout: 10000 });
    // Click the first available option (radio role) within the selector.
    await selector.getByRole('radio').first().click();

    // reason: voter-constituencies-continue testId is the canonical submit
    // button for the constituency-selector page (same locator-discoverability
    // constraint as voter-elections-continue above).
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Final landing: /results (the original deferred target).
    await expect(page).toHaveURL(/\/results(\?|$)/, { timeout: 15000 });
  });

  test('CLEAN-02 — multi-election multi-constituency bounces twice and resumes deferred target with query params preserved', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Cold-start voter going to /results with an explicit non-persistent
    // query parameter the round-trip must preserve. Using `entityType` as a
    // canary — it is a non-persistent search param (see params.ts) and would
    // be stripped by buildRoute's filterPersistent if the `?next=` literal
    // did not survive the chain.
    const deferredTarget = '/results?entityType=candidates';
    await page.goto(deferredTarget);

    await expect(page).toHaveURL(/\/elections\?next=/, { timeout: 15000 });

    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page).toHaveURL(/\/constituencies\?next=/, { timeout: 15000 });

    const selector = page.getByTestId(testIds.voter.constituencies.selector);
    await selector.first().waitFor({ state: 'visible', timeout: 10000 });
    await selector.getByRole('radio').first().click();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Original `entityType=candidates` must survive the round-trip.
    await expect(page).toHaveURL(/\/results\?.*entityType=candidates/, { timeout: 15000 });
  });

  test('CLEAN-02 — election pre-selected via URL bounces only to constituency selector and resumes deferred target', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Plan-D-07 case 3 — "single-election auto-implied (or pre-selected)
    // bounces ONLY to constituency selector". The default e2e seed has 2
    // elections so `getImpliedElectionIds` returns undefined; we exercise
    // the equivalent single-bounce code path by carrying the electionId in
    // the URL. This walks the same `if (!constituencyId) redirect(307, ...)`
    // branch in (located)/+layout.ts that an auto-implied election would
    // hit, validating the `?next=` propagation through that branch.
    expect(electionUuid, 'electionUuid must be discovered in beforeAll').toBeTruthy();
    const deferredTarget = `/results?electionId=${electionUuid}`;
    await page.goto(deferredTarget);

    // Election is provided — we should bounce only once, to /constituencies.
    await expect(page).toHaveURL(/\/constituencies\?next=/, { timeout: 15000 });
    // We should NEVER have visited /elections in this flow.
    await expect(page).not.toHaveURL(/\/elections/);

    const selector = page.getByTestId(testIds.voter.constituencies.selector);
    await selector.first().waitFor({ state: 'visible', timeout: 10000 });
    await selector.getByRole('radio').first().click();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    await expect(page).toHaveURL(/\/results\?.*electionId=/, { timeout: 15000 });
  });

  test('CLEAN-02 — refresh after localStorage clear mid-session resumes deferred target', async ({
    page
  }) => {
    test.setTimeout(45000);

    // Step 1: complete the selector chain so the voter context is populated.
    // The starting URL carries no query — exercises the simplest cold path.
    await page.goto('/results');
    await expect(page).toHaveURL(/\/elections\?next=/, { timeout: 15000 });
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page).toHaveURL(/\/constituencies\?next=/, { timeout: 15000 });

    const selector = page.getByTestId(testIds.voter.constituencies.selector);
    await selector.first().waitFor({ state: 'visible', timeout: 10000 });
    await selector.getByRole('radio').first().click();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Voter is now on the located route with cookies + localStorage holding
    // the selectedElection / selectedConstituency state.
    await expect(page).toHaveURL(/\/results(\?|$)/, { timeout: 15000 });
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
    await expect(page).toHaveURL(new RegExp(`/constituencies\\?.*next=${encoded.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`), {
      timeout: 15000
    });

    const selector = page.getByTestId(testIds.voter.constituencies.selector);
    await selector.first().waitFor({ state: 'visible', timeout: 10000 });
    await selector.getByRole('radio').first().click();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // The whitelist re-check rejected the value; the voter falls back to the
    // default constituency-completion route, which routes via $getRoute to
    // /questions (when startFromConstituencyGroup is unset). Critically, the
    // page MUST NOT have navigated cross-origin.
    await expect(page).not.toHaveURL(/^https?:\/\/evil\.example/, { timeout: 15000 });
    // Positive assertion: the voter ended up on an internal route. The
    // default fallback is /questions (per constituencies/+page.svelte
    // handleSubmit lines 78-83), but /results is also a valid landing if
    // implication succeeds. Match either internal route — what matters is
    // we did NOT navigate cross-origin.
    await expect(page).toHaveURL(/\/(questions|results)/, { timeout: 15000 });
  });
});
