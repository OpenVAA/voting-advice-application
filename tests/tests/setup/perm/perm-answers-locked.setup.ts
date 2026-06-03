/**
 * perm-answers-locked data-setup project — Phase 91 Plan 02 (TIR6:3-14, A1).
 *
 * Invokes setupFromTemplate('perm-answers-locked') then mints a per-perm
 * Playwright storage-state JSON via real `forceRegister` + real UI login
 * through the candidate-app login form. This MIRRORS the canonical pattern
 * in `auth.setup.ts` + `data.setup.ts` (D-91-PD-06 REVISED: the prior
 * synthetic session helper was DELETED per 91-VERIFICATION.md CR-01
 * BLOCKER closure — synth base64 tokens fail server-side `safeGetSession()`
 * JWT validation; only real Supabase-minted sessions survive the protected
 * candidate layout).
 *
 * The storage-state file is consumed by the AUTHENTICATED sub-tests in
 * perm-answers-locked.spec.ts (surfaces 2 + 3: /candidate/profile +
 * /candidate/questions/[questionId]); the UNAUTH sub-test (surface 1,
 * /candidate login) does not use storage state.
 *
 * Prefix: 'e2e-perm-answers-locked-' per D-91-PD-05.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain
 * leakage from prior perm chains still mid-teardown when this setup starts.
 */

import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { setupFromTemplate } from '../shared/setupFromTemplate';
import type { Page } from '@playwright/test';

const PREFIX = 'e2e-perm-answers-locked-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');

/**
 * Wait for the candidate-app login form to be visible, reloading up to
 * `maxAttempts - 1` times if the backend is cold-starting. Mirrors the
 * canonical helper in `auth.setup.ts:23-57` (hoisted module-level so the
 * setup callback stays free of conditional control flow).
 */
async function waitForLoginForm(page: Page, loginRoute: string, emailTestId: string, maxAttempts = 3): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });
    try {
      await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 10000 });
      return;
    } catch {
      if (attempt >= maxAttempts - 1) {
        throw new Error(`Login form did not appear after ${attempt + 1} attempts on ${loginRoute}.`);
      }
      // Fall through — next iteration's goto() fully replaces page state.
    }
  }
}

setup('import perm-answers-locked dataset + mint candidate session', async ({ page }) => {
  // Candidate app data loading can be slow; mirror auth.setup.ts ceiling.
  setup.setTimeout(90000);

  // 1. Seed the dataset.
  await setupFromTemplate('perm-answers-locked', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  // 2. Provision a real auth user for the seeded candidate. Deterministic
  //    email per D-91-PD-06 fallback contract (dev-seed perm templates do
  //    not populate candidates.email). Defensive unregister keeps reruns
  //    idempotent (mirrors data.setup.ts:142-143).
  const fullExternalId = `${PREFIX}cand-1`;
  const candidateEmail = `${fullExternalId}@test.openvaa.local`;
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(candidateEmail);
  await client.forceRegister(fullExternalId, candidateEmail, TEST_CANDIDATE_PASSWORD);

  // 3. Perform a real UI login through the candidate-app login form and
  //    save the resulting cookie-based Supabase session as Playwright
  //    storage state. Mirrors auth.setup.ts:66-98.
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await waitForLoginForm(page, candidateHome, testIds.candidate.login.email);
  await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
  await page.getByTestId(testIds.candidate.password.field).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/.*login.*/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
