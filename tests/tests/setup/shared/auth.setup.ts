/**
 * Auth setup project: registers users on the base dataset and stores one signed-in session per user.
 *
 * Depends on `data-setup-base` (a candidate row must exist in the database before a user can be force-registered as its editor).
 *
 * Two sessions, one setup test each, both a single call of `registerAndStoreSession`:
 *   - the base candidate's user, who has accepted the terms of use and so lands on the contestant home. Stored at `playwright/.auth/user.json`, the file the Playwright config names `STORAGE_STATE`.
 *   - a user who has NOT accepted the terms of use, and so is shown the terms-of-use view at every protected URL. Stored at `TERMS_PENDING_STORAGE_STATE`.
 *
 * A further identity is one more setup test holding one more call of the helper, with its own external id, email and session path. The helper lives in the plain module `registerAndStoreSession.ts` beside this file, where its mechanism is described, so that a second setup file can import it.
 */

import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerAndStoreSession } from './registerAndStoreSession';
import { TIMEOUTS } from '../../helpers';
import {
  TERMS_PENDING_STORAGE_STATE,
  TEST_CANDIDATE_EMAIL,
  TEST_CANDIDATE_EXTERNAL_ID,
  TEST_CANDIDATE_PASSWORD,
  TEST_TERMS_PENDING_CANDIDATE_EMAIL,
  TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID
} from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(currentDir, '../../../playwright/.auth/user.json');

setup('register + authenticate as base candidate', async ({ page }) => {
  // Contestant app data loading can be slow; increase timeout
  setup.setTimeout(TIMEOUTS.testMax);

  await registerAndStoreSession(page, {
    externalId: TEST_CANDIDATE_EXTERNAL_ID,
    email: TEST_CANDIDATE_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: authFile,
    acceptTermsOfUse: true
  });
});

setup('register + authenticate as a user who has not accepted the terms of use', async ({ page }) => {
  // Contestant app data loading can be slow; increase timeout
  setup.setTimeout(TIMEOUTS.testMax);

  // Settled on the terms-of-use view's submit button: the session is stored only once that view has rendered for this user.
  await registerAndStoreSession(page, {
    externalId: TEST_TERMS_PENDING_CANDIDATE_EXTERNAL_ID,
    email: TEST_TERMS_PENDING_CANDIDATE_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: TERMS_PENDING_STORAGE_STATE,
    acceptTermsOfUse: false,
    settledTestId: testIds.contestant.terms.submit
  });
});
