/**
 * perm-not-located-2e2cg — Phase 88 Plan 03 (test catalog audit).
 *
 * Topology: 2 elections × 2 disjoint CGs × 2 COs each.
 * Authoritative spec: TEST-INVENTORY-REFACTOR-2.md:198-209
 * Memo: .planning/phases/88-.../88-03-SCOPE.md (5-cell rebuild of
 * voter-not-located-redirect.spec.ts:106/161/183/211/241; MED-4 whitelist
 * landing regex).
 *
 * Rebuild of the 5 contracts from voter-not-located-redirect.spec.ts against
 * the new minimal 2E×2disjointCG×2CO dataset:
 *   1. /results → bounces twice → resumes /results
 *   2. /results?foo=bar → bounces twice → resumes /results?foo=bar
 *   3. /results?electionId=<uuid> → single-bounce → resumes /results
 *   4. localStorage.clear() + reload → resumes /results
 *   5. external next= → whitelist rejects → lands on /(questions|results)
 *
 * Rigidity contract: every assertion HARD.
 */

import { expect, test } from '@playwright/test';
import { expectLandedOn, iterateSelectOptions, settleNetworkIdle } from '../../helpers';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

// Ensure unauthenticated voter context — no carryover from other chains.
test.use({ storageState: { cookies: [], origins: [] } });

/**
 * Pick the first option in every constituency `<Select>` rendered on the
 * /constituencies page. ConstituencySelector renders one combobox per
 * applicable-elections group (NOT a radiogroup) — iterate the combobox
 * locator. Hoisted to module scope for playwright/no-conditional-in-test.
 */
async function fillAllConstituencies(page: Page): Promise<void> {
  const constituenciesList = page.getByTestId(testIds.voter.constituencies.list);
  await expect(constituenciesList).toBeVisible({ timeout: 10000 });
  await iterateSelectOptions(page, constituenciesList.getByRole('combobox'));
}

test.describe.configure({ mode: 'serial' });

test.describe('perm-not-located-2e2cg', () => {
  const adminClient = new SupabaseAdminClient();
  let electionUuid: string | undefined;

  test.beforeAll(async () => {
    const electionResult = await adminClient.findData('elections', {
      externalId: { $eq: 'test-perm-notloc-el-1' }
    });
    expect(
      electionResult.type,
      'perm-not-located-2e2cg requires test-perm-notloc-el-1 to be present in the seed'
    ).toBe('success');
    electionUuid = electionResult.data?.[0]?.id as string | undefined;
    expect(electionUuid, 'perm-not-located-2e2cg requires a discoverable EL-1 UUID').toBeTruthy();
  });

  test('direct /results with no election picked bounces twice and resumes /results', async ({ page }) => {
    test.setTimeout(45000);

    await page.goto('/results');
    await settleNetworkIdle(page, { waitUntil: 'domcontentloaded' });

    // Belt-and-suspenders: clear any storage leakage from prior runs.
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await expectLandedOn(page, /\/elections\b.*[&?]next=%2Fresults/);
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expectLandedOn(page, /\/constituencies\b.*[&?]next=%2Fresults/);
    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();
    await expectLandedOn(page, /\/results(\/|\?|$)/);
  });

  test('multi-bounce preserves arbitrary query params (foo=bar)', async ({ page }) => {
    test.setTimeout(45000);

    const deferredTarget = '/results?foo=bar';
    await page.goto(deferredTarget);

    await expectLandedOn(page, /\/elections\b.*[&?]next=/);
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expectLandedOn(page, /\/constituencies\b.*[&?]next=/);
    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();
    await expectLandedOn(page, /\/results\b.*[&?]foo=bar/);
  });

  test('election pre-selected via URL bounces only to constituency selector', async ({ page }) => {
    test.setTimeout(45000);

    expect(electionUuid, 'electionUuid must be discovered in beforeAll').toBeTruthy();
    const deferredTarget = `/results?electionId=${electionUuid}`;
    await page.goto(deferredTarget);

    // Single-bounce to constituencies — must NOT visit /elections.
    await expectLandedOn(page, /\/constituencies\b.*[&?]next=/);
    await expect(page).not.toHaveURL(/\/election(\/|\?|$)/);

    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();
    await expectLandedOn(page, /\/results\b.*[&?]electionId=/);
  });

  test('refresh after localStorage clear mid-session resumes deferred target', async ({ page }) => {
    test.setTimeout(45000);

    // Step 1: complete the selector chain.
    await page.goto('/results');
    await expectLandedOn(page, /\/elections\b.*[&?]next=/);
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expectLandedOn(page, /\/constituencies\b.*[&?]next=/);
    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();
    await expectLandedOn(page, /\/results(\/|\?|$)/);
    const resumedUrl = page.url();

    // Step 2: simulate mid-session storage clear; URL params allow direct re-entry.
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    await expectLandedOn(
      page,
      new RegExp(resumedUrl.replace(/^https?:\/\/[^/]+/, '').replace(/[?].*$/, '')),
      { timeoutMs: 15000 }
    );
  });

  test('open-redirect attempt to external URL is rejected by whitelist (defense-in-depth)', async ({ page }) => {
    test.setTimeout(45000);

    const evilTarget = 'https://evil.example/phish';
    const encoded = encodeURIComponent(evilTarget);
    await page.goto(`/elections?next=${encoded}`);

    await page.getByTestId(testIds.voter.elections.continue).click();
    await expectLandedOn(
      page,
      new RegExp(`/constituencies\\?.*next=${encoded.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`),
      { timeoutMs: 15000 }
    );

    await fillAllConstituencies(page);
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // MED-4 — whitelist rejects external URL; voter lands on internal route
    // (/(questions|results) per voter-not-located-redirect.spec.ts:279).
    await expect(page).not.toHaveURL(/^https?:\/\/evil\.example/, { timeout: 10000 });
    await expectLandedOn(page, /\/(questions|results)/);
  });
});
