/**
 * @file perm-access-disable.spec.ts — EPERM-11 consolidated perm-chain spec.
 *
 * Consolidates the former `perm-disable-voter-app` + `perm-disable-candidate-app`
 * specs into ONE access-gating perm covering all three `access.*` modes, and
 * ADDS the net-new global `underMaintenance` slice. The spec re-seeds the
 * `app_settings` singleton per sub-test (perm-singleton pattern via
 * `updateAppSettings`) so each mode is exercised against the same seeded
 * dataset (`data-setup-perm-access-disable` → `perm-access-disable.ts`).
 *
 * Three access modes (all plain app-availability toggles — they gate the
 * MaintenancePage display, NOT auth/authorization):
 *
 *   1. access.voterApp = false        — voter-app routes (`/`, `/elections`)
 *                                       render the MaintenancePage (root <main>
 *                                       + <h1>, voter start button HIDDEN);
 *                                       the candidate-app route stays available.
 *   2. access.candidateApp = false    — candidate-app route (`/candidate`)
 *                                       renders the MaintenancePage (candidate
 *                                       login email input HIDDEN); the voter-app
 *                                       routes stay available.
 *   3. access.underMaintenance = true — NET-NEW global slice: BOTH the voter
 *                                       (`/`, `/elections`) AND candidate
 *                                       (`/candidate`) routes render the
 *                                       MaintenancePage simultaneously.
 *
 * The afterAll restores the seed's shipped base posture
 * (voterApp:false, candidateApp:true, underMaintenance:false) so the singleton
 * is not left mutated for any downstream perm node.
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch
 * wrapping expect(), no .catch fallbacks. Testid-only via `testIds`
 * (`getByRole('main')` / `heading` permitted per the maintenance-page pattern).
 */

import { expect, test } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { testIds } from '../../utils/testIds';

test.describe('perm-access-disable (EPERM-11)', () => {
  test.describe.configure({ mode: 'serial' });

  let client: SupabaseAdminClient;

  test.beforeAll(() => {
    client = new SupabaseAdminClient();
  });

  test.afterAll(async () => {
    // Restore the seed's shipped base posture so the singleton is clean for any
    // downstream perm node (the per-app-notifications node re-points here).
    if (client) {
      await client.updateAppSettings({
        access: { voterApp: false, candidateApp: true, underMaintenance: false }
      });
    }
  });

  test('voterApp disabled: / + /elections show maintenance; /candidate available', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: false, candidateApp: true, underMaintenance: false }
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

    // GET /en/candidate — NON-maintenance: candidate login page renders.
    await page.goto('/en/candidate');
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
  });

  test('candidateApp disabled: /candidate shows maintenance; / + /elections available', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: true, candidateApp: false, underMaintenance: false }
    });

    // GET /en/candidate — maintenance page on the candidate-app route.
    await page.goto('/en/candidate');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeHidden();

    // GET /en — NON-maintenance: voter home renders with the start button visible.
    await page.goto('/en');
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();

    // GET /en/elections — NON-maintenance: generic main landmark renders.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('underMaintenance: BOTH voter + candidate apps show maintenance simultaneously', async ({ page }) => {
    await client.updateAppSettings({
      access: { voterApp: true, candidateApp: true, underMaintenance: true }
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

    // GET /en/candidate — candidate app under global maintenance: login HIDDEN.
    await page.goto('/en/candidate');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeHidden();
  });
});
