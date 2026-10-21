/**
 * perm-contestant-nominations data-setup project: the contestant-nominations dataset, and one stored session for each of its four editors.
 *
 * It seeds the `perm-contestant-nominations` template into the suite's project, then registers four users through the shared session helper: the editor of the candidate with no nomination, of the party with no nomination, of the candidate with a nomination and of the party with nominations. Each is created with the service role and an editor grant on that one entity, and has accepted the terms of use, so signing in sends the user straight to the entity's home, and a session is stored only once that home's status message has rendered.
 *
 * What it leaves behind: the dataset's rows under `e2e-perm-contestant-nominations-`, the settings row replaced with the template's, four auth users holding one editor grant each, and four storage-state files. Every session is this dataset's own: nothing but `contestant-nominations.spec.ts` reads them, so that spec may edit and save under them. `data-teardown-perm-contestant-nominations` removes all of it.
 *
 * Each registration runs in a browser context of its own, because a page that is already signed in is never shown the login form. The session helper unregisters any user that already holds the address before it registers one, so a second run starts clean.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` clears the rows an earlier link of the chain may still hold while its own teardown runs.
 */

import { test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import {
  CONTESTANT_NOMINATIONS_PASSWORD,
  EDIT_CANDIDATE_EDITOR_EMAIL,
  EDIT_CANDIDATE_GRANT,
  EDIT_CANDIDATE_STORAGE_STATE,
  EDIT_ORGANIZATION_EDITOR_EMAIL,
  EDIT_ORGANIZATION_GRANT,
  EDIT_ORGANIZATION_STORAGE_STATE,
  NEW_CANDIDATE_EDITOR_EMAIL,
  NEW_CANDIDATE_GRANT,
  NEW_CANDIDATE_STORAGE_STATE,
  NEW_ORGANIZATION_EDITOR_EMAIL,
  NEW_ORGANIZATION_GRANT,
  NEW_ORGANIZATION_STORAGE_STATE
} from '../../utils/permContestantNominationsData';
import { testIds } from '../../utils/testIds';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';
import type { Browser, Page } from '@playwright/test';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

/** The four editors of the dataset: the entity each edits, its address and where its session is stored. */
const EDITORS: ReadonlyArray<{ grant: EntityGrantTarget; email: string; storageStatePath: string }> = [
  { grant: NEW_CANDIDATE_GRANT, email: NEW_CANDIDATE_EDITOR_EMAIL, storageStatePath: NEW_CANDIDATE_STORAGE_STATE },
  {
    grant: NEW_ORGANIZATION_GRANT,
    email: NEW_ORGANIZATION_EDITOR_EMAIL,
    storageStatePath: NEW_ORGANIZATION_STORAGE_STATE
  },
  { grant: EDIT_CANDIDATE_GRANT, email: EDIT_CANDIDATE_EDITOR_EMAIL, storageStatePath: EDIT_CANDIDATE_STORAGE_STATE },
  {
    grant: EDIT_ORGANIZATION_GRANT,
    email: EDIT_ORGANIZATION_EDITOR_EMAIL,
    storageStatePath: EDIT_ORGANIZATION_STORAGE_STATE
  }
];

/**
 * Run `action` on a page of a browser context that holds no session, and close the context afterwards.
 */
async function inFreshContext(
  browser: Browser,
  baseURL: string | undefined,
  action: (page: Page) => Promise<void>
): Promise<void> {
  const context = await browser.newContext({ baseURL });
  try {
    await action(await context.newPage());
  } finally {
    await context.close();
  }
}

setup(
  'import perm-contestant-nominations dataset + store a session for each of its four editors',
  async ({ browser, baseURL }) => {
    // Four sign-ins through the login form follow the seed; the Contestant App's first load can be slow.
    setup.setTimeout(TIMEOUTS.testMax);

    await setupFromTemplate('perm-contestant-nominations', {
      extraTeardownPrefix: ['test-', 'e2e-perm-']
    });

    // Each session is stored once the home of the editor's one entity has rendered its status message: with one entity to edit the user is sent straight to it.
    for (const editor of EDITORS) {
      await inFreshContext(browser, baseURL, (page) =>
        registerAndStoreSession(page, {
          entityGrants: [editor.grant],
          email: editor.email,
          password: CONTESTANT_NOMINATIONS_PASSWORD,
          storageStatePath: editor.storageStatePath,
          acceptTermsOfUse: true,
          settledTestId: testIds.contestant.home.statusMessage
        })
      );
    }
  }
);
