/**
 * perm-startfromcg data-setup project: the start-from-constituency dataset, and one stored session for the editor of one of its candidates.
 *
 * It seeds the `perm-startfromcg` template into the suite's project, then registers one user through the shared session helper: created with the service role and an editor grant on one candidate, with the terms of use accepted, so signing in sends the user straight to that candidate's home, and the session is stored only once that home's status message has rendered.
 *
 * The template leaves `elections.startFromConstituencyGroup` out: `perm-startfromcg.spec.ts` resolves the id of the group of municipalities and writes the setting when its tests run.
 *
 * What it leaves behind: the dataset's rows under `e2e-perm-startfromcg-`, the settings row replaced with the template's, one auth user holding one editor grant, and one storage-state file. The session is this dataset's own: nothing but the contestant tests of `perm-startfromcg.spec.ts` reads it. `data-teardown-perm-startfromcg` removes all of it.
 *
 * The registration runs in a browser context of its own. The session helper unregisters any user that already holds the address before it registers one, so a second run starts clean.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` clears the rows an earlier link of the chain may still hold while its own teardown runs.
 */

import { test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import {
  CANDIDATE_EDITOR_EMAIL,
  CANDIDATE_GRANT,
  CANDIDATE_STORAGE_STATE,
  START_FROM_CG_PASSWORD
} from '../../utils/permStartFromCgData';
import { testIds } from '../../utils/testIds';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup(
  'import perm-startfromcg dataset + store a session for the editor of one candidate',
  async ({ browser, baseURL }) => {
    // A sign-in through the login form follows the seed; the Contestant App's first load can be slow.
    setup.setTimeout(TIMEOUTS.testMax);

    await setupFromTemplate('perm-startfromcg', { extraTeardownPrefix: ['test-', 'e2e-perm-'] });

    // The session is stored once the candidate's home has rendered its status message: with one entity to edit the user is sent straight to it.
    const context = await browser.newContext({ baseURL });
    try {
      await registerAndStoreSession(await context.newPage(), {
        entityGrants: [CANDIDATE_GRANT],
        email: CANDIDATE_EDITOR_EMAIL,
        password: START_FROM_CG_PASSWORD,
        storageStatePath: CANDIDATE_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      });
    } finally {
      await context.close();
    }
  }
);
