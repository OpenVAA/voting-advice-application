/**
 * perm-contestant-nominations data-setup project: the contestant-nominations dataset, and one stored session for each of its four editors.
 *
 * It seeds the `perm-contestant-nominations` template into the suite's project, then registers four users through the shared session helper: the editor of the candidate with no nomination, of the party with no nomination, of the candidate with a nomination and of the party with nominations. Each is created with the service role and an editor grant on that one entity, and has accepted the terms of use, so signing in sends the user straight to the entity's home, and a session is stored only once that home's status message has rendered.
 *
 * What it leaves behind: the dataset's rows under `e2e-perm-contestant-nominations-`, the settings row replaced with the template's, four auth users holding one editor grant each, and four storage-state files. Every session is this dataset's own: nothing but `contestant-nominations.spec.ts` reads them, so that spec may edit and save under them. `data-teardown-perm-contestant-nominations` removes all of it.
 *
 * Each registration runs in a browser context of its own, because a page that is already signed in is never shown the login form. The editors are the data module's `EDITORS`, which the teardown removes again. The session helper unregisters any user that already holds the address before it registers one, so a second run starts clean.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` clears the rows an earlier link of the chain may still hold while its own teardown runs.
 */

import { test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { EDITORS } from '../../utils/permContestantNominationsData';
import { storeEditorSessions } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup(
  'import perm-contestant-nominations dataset + store a session for each of its four editors',
  async ({ browser, baseURL }) => {
    // Four sign-ins through the login form follow the seed; the Contestant App's first load can be slow.
    setup.setTimeout(TIMEOUTS.testMax);

    await setupFromTemplate('perm-contestant-nominations', {
      extraTeardownPrefix: ['test-', 'e2e-perm-']
    });

    await storeEditorSessions(browser, baseURL, EDITORS);
  }
);
