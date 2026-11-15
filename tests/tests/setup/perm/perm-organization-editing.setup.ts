/**
 * perm-organization-editing data-setup project: the organization-editing dataset, and one stored session for each of its three editors.
 *
 * It seeds the `perm-organization-editing` template into the suite's project, then registers three users through the shared session helper: the editor of the confirmed organization, of the unconfirmed organization and of the unconfirmed candidate. Each edits that one entity alone and has accepted the terms of use, so signing in sends the user straight to the entity's home, and a session is stored only once that home's status message has rendered.
 *
 * What it leaves behind: the dataset's rows under `e2e-perm-organization-editing-`, the settings row replaced with the template's, three auth users holding one editor grant each, and three storage-state files. Every session is this dataset's own: nothing but `perm-organization-editing.spec.ts` reads them, so that spec may edit and save under them. `data-teardown-perm-organization-editing` removes all of it.
 *
 * Each registration runs in a browser context of its own, because a page that is already signed in is never shown the login form.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` clears the rows an earlier link of the chain may still hold while its own teardown runs.
 */

import { test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import {
  CONFIRMED_ORGANIZATION_EDITOR_EMAIL,
  CONFIRMED_ORGANIZATION_GRANT,
  CONFIRMED_ORGANIZATION_STORAGE_STATE,
  ORGANIZATION_EDITING_PASSWORD,
  UNCONFIRMED_CANDIDATE_EDITOR_EMAIL,
  UNCONFIRMED_CANDIDATE_GRANT,
  UNCONFIRMED_CANDIDATE_STORAGE_STATE,
  UNCONFIRMED_ORGANIZATION_EDITOR_EMAIL,
  UNCONFIRMED_ORGANIZATION_GRANT,
  UNCONFIRMED_ORGANIZATION_STORAGE_STATE
} from '../../utils/permOrganizationEditingData';
import { testIds } from '../../utils/testIds';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import { setupFromTemplate } from '../shared/setupFromTemplate';
import type { Browser, Page } from '@playwright/test';

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
  'import perm-organization-editing dataset + store a session for each of its three editors',
  async ({ browser, baseURL }) => {
    // Three sign-ins through the login form follow the seed; the Contestant App's first load can be slow.
    setup.setTimeout(TIMEOUTS.testMax);

    await setupFromTemplate('perm-organization-editing', {
      extraTeardownPrefix: ['test-', 'e2e-perm-']
    });

    // Each session is stored once the home of the editor's one entity has rendered its status message: with one entity to edit the user is sent straight to it.
    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [CONFIRMED_ORGANIZATION_GRANT],
        email: CONFIRMED_ORGANIZATION_EDITOR_EMAIL,
        password: ORGANIZATION_EDITING_PASSWORD,
        storageStatePath: CONFIRMED_ORGANIZATION_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [UNCONFIRMED_ORGANIZATION_GRANT],
        email: UNCONFIRMED_ORGANIZATION_EDITOR_EMAIL,
        password: ORGANIZATION_EDITING_PASSWORD,
        storageStatePath: UNCONFIRMED_ORGANIZATION_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
    // The candidate's editor: one registration, with the candidate's row and nomination in the template.
    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [UNCONFIRMED_CANDIDATE_GRANT],
        email: UNCONFIRMED_CANDIDATE_EDITOR_EMAIL,
        password: ORGANIZATION_EDITING_PASSWORD,
        storageStatePath: UNCONFIRMED_CANDIDATE_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
  }
);
