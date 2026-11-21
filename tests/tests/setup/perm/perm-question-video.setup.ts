/**
 * perm-question-video data-setup project.
 *
 * Invokes setupFromTemplate('perm-question-video') then stores the seeded candidate's session through the shared session helper `registerAndStoreSession` (synthetic tokens fail server-side JWT validation).
 *
 * The spec consumes the storage state for the candidate `hideVideo` slice (navigate to /en/contestant/questions/[questionId] as an authenticated candidate and assert the question video shows with hideVideo=false, then is suppressed after re-seeding hideVideo=true). The voter slice runs unauthenticated.
 *
 * Prefix: 'e2e-perm-qvid-' (matches the template's `const P` in `perm-question-video.ts`).
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { TIMEOUTS } from '../../helpers';
import { TEST_PASSWORD } from '../../utils/testCredentials';
import { TESTS_DIR } from '../../utils/testsDir';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-qvid-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-question-video.json');

setup('import perm-question-video dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await setupFromTemplate('perm-question-video', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const fullExternalId = `${PREFIX}ca-1-1a`;
  await registerAndStoreSession(page, {
    entityGrants: [{ entityType: 'candidate', externalId: fullExternalId }],
    email: `${fullExternalId}@test.openvaa.local`,
    password: TEST_PASSWORD,
    storageStatePath: STORAGE_STATE_PATH,
    acceptTermsOfUse: true
  });
});
