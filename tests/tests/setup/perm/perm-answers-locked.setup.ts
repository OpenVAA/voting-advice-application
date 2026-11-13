/**
 * perm-answers-locked data-setup project.
 *
 * Invokes setupFromTemplate('perm-answers-locked') then mints a per-perm Playwright storage-state JSON via real `forceRegister` + a real sign-in on the contestant app's sign-in screen. Synthetic base64 tokens fail server-side `safeGetSession()` JWT validation, so only real Supabase-minted sessions survive the protected candidate layout.
 *
 * The storage-state file is consumed by the AUTHENTICATED sub-tests in perm-answers-locked.spec.ts (surfaces 2 + 3: /contestant/profile + /contestant/questions/[questionId]); the UNAUTH sub-test (surface 1, the contestant app's login and sign-in screens) does not use storage state.
 *
 * Prefix: 'e2e-perm-answers-locked-'.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain leakage from prior perm chains still mid-teardown when this setup starts.
 */

import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { TIMEOUTS } from '../../helpers';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { TESTS_DIR } from '../../utils/testsDir';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-answers-locked-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');

setup('import perm-answers-locked dataset + mint candidate session', async ({ page }) => {
  // Contestant app data loading can be slow.
  setup.setTimeout(TIMEOUTS.testMax);

  // 1. Seed the dataset.
  await setupFromTemplate('perm-answers-locked', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  // 2. Provision a real auth user for the seeded candidate. Deterministic
  //    email via the fallback contract (dev-seed perm templates do not populate candidates.email). Defensive unregister keeps reruns idempotent (mirrors data.setup.ts).
  const fullExternalId = `${PREFIX}cand-1`;
  const candidateEmail = `${fullExternalId}@test.openvaa.local`;
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(candidateEmail);
  await client.forceRegister(fullExternalId, candidateEmail, TEST_CANDIDATE_PASSWORD);

  // 3. Sign in on the contestant app's sign-in screen and save the resulting cookie-based Supabase session as Playwright storage state.
  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await createContestantLoginPage(page).signInFromCold(candidateEmail, TEST_CANDIDATE_PASSWORD);
  await expect(page).not.toHaveURL(/.*login.*/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
