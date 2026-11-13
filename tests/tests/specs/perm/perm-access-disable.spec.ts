/**
 * @file perm-access-disable.spec.ts — the access-gating perm-chain spec.
 *
 * ONE access-gating perm covering all three `access.*` modes, the global `underMaintenance` slice included. The spec re-seeds the `app_settings` singleton per sub-test (perm-singleton pattern via `updateAppSettings`) so each mode is exercised against the same seeded dataset (`data-setup-perm-access-disable` → `perm-access-disable.ts`).
 *
 * Three access modes (all plain app-availability toggles — they gate the MaintenancePage display, NOT auth/authorization):
 *
 *   1. access.voterApp = false        — voter-app routes (`/`, `/elections`) render the MaintenancePage (root <main>
 *                                       + <h1>, voter start button HIDDEN); the contestant-app route stays available.
 *   2. access.contestantApp = false    — contestant-app route (`/contestant`) renders the MaintenancePage (the login screen is not rendered); the voter-app routes stay available.
 *   3. access.underMaintenance = true — NET-NEW global slice: BOTH the voter (`/`, `/elections`) AND candidate (`/contestant`) routes render the MaintenancePage simultaneously.
 *
 * The afterAll restores the seed's shipped base posture (voterApp:false, contestantApp:true, underMaintenance:false) so the singleton is not left mutated for any downstream perm node.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch wrapping expect(), no .catch fallbacks. Testid-only via `testIds` (`getByRole('main')` / `heading` permitted per the maintenance-page pattern); the login screen is asserted through its page object.
 */

import { expect, test } from '@playwright/test';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

test.describe('perm-access-disable (EPERM-11)', () => {
  test.describe.configure({ mode: 'serial' });

  let client: SupabaseAdminClient;

  test.beforeAll(() => {
    client = new SupabaseAdminClient();
  });

  test.afterAll(async () => {
    // Restore the seed's shipped base posture so the singleton is clean for any downstream perm node (the per-app-notifications node re-points here).
    if (client) {
      await client.updateAppSettings({
        access: { voterApp: false, contestantApp: true, underMaintenance: false }
      });
    }
  });

  test('voterApp disabled: / + /elections show maintenance; /contestant available', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: false, contestantApp: true, underMaintenance: false }
    });

    // GET /en — maintenance page on the voter-app root route.
    await page.goto('/en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/elections — maintenance page on the voter-app elections route.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/contestant — NON-maintenance: the login screen renders.
    await page.goto('/en/contestant');
    await createContestantLoginPage(page).expectEntryShown();
  });

  test('contestantApp disabled: /contestant shows maintenance; / + /elections available', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: true, contestantApp: false, underMaintenance: false }
    });

    // GET /en/contestant — maintenance page on the contestant-app route.
    await page.goto('/en/contestant');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await createContestantLoginPage(page).expectEntryNotShown();

    // GET /en — NON-maintenance: voter home renders with the start button visible.
    await page.goto('/en');
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();

    // GET /en/elections — NON-maintenance: generic main landmark renders.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('underMaintenance: BOTH voter + contestant apps show maintenance simultaneously', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: true, contestantApp: true, underMaintenance: true }
    });

    // GET /en — voter root under global maintenance: MaintenancePage, start hidden.
    await page.goto('/en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/elections — voter elections under global maintenance.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/contestant — contestant app under global maintenance: the login screen is not rendered.
    await page.goto('/en/contestant');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await createContestantLoginPage(page).expectEntryNotShown();
  });
});
