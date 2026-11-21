/**
 * perm-hide-hero data-setup project.
 *
 * Invokes setupFromTemplate('perm-hide-hero') then stores the seeded candidate's session through the shared session helper `registerAndStoreSession` (synthetic tokens fail server-side JWT validation).
 *
 * The spec consumes the storage state to navigate to /en/contestant/questions/[questionId] as an authenticated candidate and assert hideHero=true suppresses hero rendering.
 *
 * Prefix: 'e2e-perm-hide-hero-'.
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
import { TEST_PASSWORD } from '../../utils/testCredentials';
import { TESTS_DIR } from '../../utils/testsDir';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-hide-hero-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');

setup('import perm-hide-hero dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await setupFromTemplate('perm-hide-hero', {
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
