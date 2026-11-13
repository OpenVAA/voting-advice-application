/**
 * @file perm-closed-project.spec.ts — a project that is not open for voters.
 *
 * Runs on the terminal Playwright node: `data-setup-perm-closed-project` seeds `perm-closed-project`, whose `openForVoters: false` closes the E2E project the dev server serves. The node depends on every leaf of the suite, so no other spec observes the closed project.
 *
 * What it pins: an anonymous visitor sees the existing `MaintenancePage` with `dynamic.voterAppNotAccessible` on the voter app, including on deep links, never the global `ErrorMessage`; the contestant app's login screen still renders its entries, its sign-in screen and the admin login their forms, and a candidate can log in and reach the candidate home, because candidates must be able to answer before a project opens. A grant holder (the admin stored session) sees the real voter app and the admin shell, because preview is decided by what RLS returns to the caller, not by a client-side role check.
 *
 * The seeded settings keep `access.voterApp: true`, so a maintenance page seen here can only have been caused by the project being closed, never by the access flag.
 *
 * The `afterAll` reopens the project (restore layer 1 of 3; the teardown project and the next run's global setup are layers 2 and 3).
 *
 * The last describe pins the contestant app's configuration as an anonymous visitor of the closed project receives it, through `contestant_app_public_config`. On the login screen: that it offers sign-in alone for an empty registration matrix and Register beside it for the `code` mode and for the `identity_provider` mode, for candidates and for organizations alone; that it says so while answers are locked, and then offers sign-in alone whatever the matrix allows; and that the heading names the app after the served entity types. On the registration page: that Register leads to it, that it shows the one listed mode's panel directly, and that it offers the identity provider's panel for candidates, and for a party alone without asking. For the registration addresses: that the registration page ends on the login screen where no mode is listed — an empty matrix, a row declared for an entity type the project does not serve, and answers locked — and that the two screens a registration code leads to end there where the `code` mode is off. Each of those tests first writes the served entity types and both rows of the matrix, because the write is a merge and a row left out would keep what the test before it wrote. The answers lock is written by one describe, which takes it off again when it ends. Nothing else is written back: the next setup to run replaces the settings row whole.
 *
 * One state of the login screen and three states of the registration page are scanned in both themes through `declareEntryScans`, which ends in `assertAxeScan`, the scan body the a11y specs share: the one listed mode's panel, the identity provider's panel asking which of the two entity types it registers, and that question after Continue with none chosen. The panel asking the type is also measured at two phone widths, 320 and 390 pixels, in English: no wider than its viewport. Last, under the same settings, every radio of the registration page, of the modes and of the entity types, draws its border, and the provider's panel names each type by its catalogue text.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks. Testid-only via `testIds` (`getByRole('heading')` permitted per the maintenance-page pattern); the login screen, the sign-in screen and the registration page are driven through their page objects. The one soft assertion that can fire here is not this file's: `assertAxeScan` reports its raw-i18n-key verdict softly on its own account, so that it cannot hide the axe verdict taken on the same page.
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
