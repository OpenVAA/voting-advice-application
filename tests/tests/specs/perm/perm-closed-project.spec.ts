/**
 * @file perm-closed-project.spec.ts — a project that is NOT open for voters (162.1 D-05, D-16, D-21).
 *
 * Runs on the TERMINAL Playwright node: `data-setup-perm-closed-project` seeds `perm-closed-project`, whose `openForVoters: false` closes the E2E project the dev server serves. The node depends on every leaf of the suite, so no other spec observes the closed project.
 *
 * What it pins: anon sees the existing `MaintenancePage` with `dynamic.voterAppNotAccessible` on the voter app, including on deep links, never the global `ErrorMessage`; both login pages still render their forms, and a candidate can log in and reach the candidate home, because candidates must be able to answer before a project opens (D-16). A grant holder (the admin stored session) sees the real voter app and the admin shell, because preview is decided by what RLS returns to the caller, not by a client-side role check (D-17). Before 162.1-07 every one of these routes rendered `ErrorMessage` (the root layout rejected the empty election data anon receives on a closed project); that red run is recorded in the phase evidence.
 *
 * The seeded settings keep `access.voterApp: true`, so a maintenance page seen here can only have been caused by the project being closed, never by the access flag.
 *
 * The `afterAll` reopens the project (restore layer 1 of 3; the teardown project and the next run's global setup are layers 2 and 3).
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks. Testid-only via `testIds` (`getByRole('heading')` permitted per the maintenance-page pattern).
 */

import { expect, test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { ADMIN_STORAGE_STATE } from '../../utils/adminCredentials';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

/**
 * The English maintenance title, read from the compiled message source rather than copied, so a copy edit to the message cannot turn this spec into an assertion about a stale string.
 */
/** The candidate the setup project force-registers (its email follows the perm-template fallback contract). */
const CANDIDATE_EMAIL = 'e2e-perm-closed-project-cand-1@test.openvaa.local';

const MAINTENANCE_TITLE: string = JSON.parse(
  fs.readFileSync(path.join(TESTS_DIR, '../../apps/frontend/messages/en/dynamic.json'), 'utf8')
).dynamic.voterAppNotAccessible.title;

test.describe('perm-closed-project (162.1 D-05, D-16, D-17)', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await new SupabaseAdminClient().ensureProject();
  });

  test('anon voter home shows the not-released maintenance page, not an error', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByTestId(testIds.shared.maintenancePage)).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(MAINTENANCE_TITLE);
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();
  });

  test('anon voter deep links show maintenance, never an error', async ({ page }) => {
    for (const route of ['/en/elections', '/en/questions']) {
      await page.goto(route);
      await expect(page.getByTestId(testIds.shared.maintenancePage)).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(MAINTENANCE_TITLE);
      await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
    }
  });

  test('anon can reach the candidate login and the admin login on a closed project', async ({ page }) => {
    await page.goto('/en/candidate/login');
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();

    await page.goto('/en/admin/login');
    await expect(page.getByTestId(testIds.candidate.password.field)).toBeVisible();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
  });

  test('a candidate can log in and reach the candidate home on a closed project (D-16)', async ({ page }) => {
    await page.goto(buildRoute({ route: 'CandAppLogin', locale: 'en' }));
    await page.getByTestId(testIds.candidate.login.email).fill(CANDIDATE_EMAIL);
    await page.getByTestId(testIds.candidate.password.field).fill(TEST_CANDIDATE_PASSWORD);
    await page.getByTestId(testIds.candidate.login.submit).click();
    await expect(page).not.toHaveURL(/\/candidate\/login/);
    await expect(page.getByTestId(testIds.candidate.home.statusMessage)).toBeVisible();
    await expect(page.getByTestId(testIds.shared.errorMessage)).toBeHidden();
  });

  test.describe('grant holder preview (D-17)', () => {
    test.use({ storageState: ADMIN_STORAGE_STATE });

    test('a grant holder sees the real voter app and the admin shell on a closed project', async ({ page }) => {
      await page.goto('/en');
      await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();
      await expect(page.getByTestId(testIds.shared.maintenancePage)).toBeHidden();

      await page.goto(buildRoute({ route: 'AdminAppHome', locale: 'en' }));
      await expect(page.getByRole('button', { name: 'Jobs Monitoring' })).toBeVisible();
    });
  });
});
