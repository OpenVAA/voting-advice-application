/**
 * perm-disable-allow-open data-setup project.
 *
 * Stores the seeded candidate's session through the shared session helper `registerAndStoreSession` (synthetic tokens fail server-side JWT validation). Consumed by the candidate-side describe block in perm-disable-allow-open.spec.ts. The voter-side describe block does not use storage state.
 *
 * Prefix: 'e2e-perm-no-allowopen-'.
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
import { TEST_PASSWORD } from '../../utils/testCredentials';
import { TESTS_DIR } from '../../utils/testsDir';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-no-allowopen-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-disable-allow-open.json');

setup('import perm-disable-allow-open dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await setupFromTemplate('perm-disable-allow-open', {
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
