/**
 * perm-organization-editing data-setup project: the organization-editing dataset, and one stored session for each of its three editors.
 *
 * It seeds the `perm-organization-editing` template into the suite's project, then registers three users through the shared session helper: the editor of the confirmed organization, of the unconfirmed organization and of the unconfirmed candidate. Each edits that one entity alone and has accepted the terms of use, so signing in sends the user straight to the entity's home, and a session is stored only once that home's status message has rendered.
 *
 * What it leaves behind: the dataset's rows under `e2e-perm-organization-editing-`, the settings row replaced with the template's, three auth users holding one editor grant each, and three storage-state files. Every session is this dataset's own: nothing but `perm-organization-editing.spec.ts` reads them, so that spec may edit and save under them. `data-teardown-perm-organization-editing` removes all of it.
 *
 * Each registration runs in a browser context of its own, because a page that is already signed in is never shown the login form. The editors are the data module's `EDITORS`, which the teardown removes again.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` clears the rows an earlier link of the chain may still hold while its own teardown runs.
 */

import { test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { EDITORS } from '../../utils/permOrganizationEditingData';
import { storeEditorSessions } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup(
  'import perm-organization-editing dataset + store a session for each of its three editors',
  async ({ browser, baseURL }) => {
    // Three sign-ins through the login form follow the seed; the Contestant App's first load can be slow.
    setup.setTimeout(TIMEOUTS.testMax);

    await setupFromTemplate('perm-organization-editing', {
      extraTeardownPrefix: ['test-', 'e2e-perm-']
    });

    await storeEditorSessions(browser, baseURL, EDITORS);
  }
);
