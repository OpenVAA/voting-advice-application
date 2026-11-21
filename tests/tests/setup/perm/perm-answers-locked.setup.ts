/**
 * perm-answers-locked data-setup project.
 *
 * Invokes setupFromTemplate('perm-answers-locked') then stores the seeded candidate's session through the shared session helper `registerAndStoreSession`. Synthetic base64 tokens fail server-side `safeGetSession()` JWT validation, so only real Supabase-minted sessions survive the protected candidate layout.
 *
 * The storage-state file is consumed by the AUTHENTICATED sub-tests in perm-answers-locked.spec.ts (surfaces 2 + 3: /contestant/profile + /contestant/questions/[questionId]); the UNAUTH sub-test (surface 1, the contestant app's login and sign-in screens) does not use storage state.
 *
 * Prefix: 'e2e-perm-answers-locked-'.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` defends against cross-chain leakage from prior perm chains still mid-teardown when this setup starts.
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
import { TEST_PASSWORD } from '../../utils/testCredentials';
import { TESTS_DIR } from '../../utils/testsDir';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-answers-locked-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-answers-locked.json');

setup('import perm-answers-locked dataset + mint candidate session', async ({ page }) => {
  // Contestant app data loading can be slow.
  setup.setTimeout(TIMEOUTS.testMax);

  await setupFromTemplate('perm-answers-locked', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const fullExternalId = `${PREFIX}cand-1`;
  await registerAndStoreSession(page, {
    entityGrants: [{ entityType: 'candidate', externalId: fullExternalId }],
    email: `${fullExternalId}@test.openvaa.local`,
    password: TEST_PASSWORD,
    storageStatePath: STORAGE_STATE_PATH,
    acceptTermsOfUse: true
  });
});
