/**
 * perm-no-nomination data-setup project: the no-nomination dataset, and one stored session for each of its three editors.
 *
 * It seeds the `perm-no-nomination` template into the suite's project, then registers three users through the shared session helper: the editor of the candidate with no nomination, of the organization with no nomination and of the candidate with one. Each edits that one entity alone and has accepted the terms of use, so signing in sends the user straight to the entity's home, and a session is stored only once that home's status message has rendered. An entity with no nomination has a home like any other, so the two unnominated entities' editors are registered the same way.
 *
 * What it leaves behind: the dataset's rows under `e2e-perm-no-nomination-`, the settings row replaced with the template's, three auth users holding one editor grant each, and three storage-state files. Every session is this dataset's own: nothing but `perm-no-nomination.spec.ts` reads them, so that spec may edit and save under them. `data-teardown-perm-no-nomination` removes all of it.
 *
 * Each registration runs in a browser context of its own, because a page that is already signed in is never shown the login form. The session helper unregisters any user that already holds the address before it registers one, so a second run starts clean.
 *
 * `extraTeardownPrefix: ['test-', 'e2e-perm-']` clears the rows an earlier link of the chain may still hold while its own teardown runs.
 */

import { test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import {
  NO_NOMINATION_PASSWORD,
  NOMINATED_CANDIDATE_EDITOR_EMAIL,
  NOMINATED_CANDIDATE_GRANT,
  NOMINATED_CANDIDATE_STORAGE_STATE,
  UNNOMINATED_CANDIDATE_EDITOR_EMAIL,
  UNNOMINATED_CANDIDATE_GRANT,
  UNNOMINATED_CANDIDATE_STORAGE_STATE,
  UNNOMINATED_ORGANIZATION_EDITOR_EMAIL,
  UNNOMINATED_ORGANIZATION_GRANT,
  UNNOMINATED_ORGANIZATION_STORAGE_STATE
} from '../../utils/permNoNominationData';
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
  'import perm-no-nomination dataset + store a session for each of its three editors',
  async ({ browser, baseURL }) => {
    // Three sign-ins through the login form follow the seed; the Contestant App's first load can be slow.
    setup.setTimeout(TIMEOUTS.testMax);

    await setupFromTemplate('perm-no-nomination', {
      extraTeardownPrefix: ['test-', 'e2e-perm-']
    });

    // Each session is stored once the home of the editor's one entity has rendered its status message: with one entity to edit the user is sent straight to it.
    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [UNNOMINATED_CANDIDATE_GRANT],
        email: UNNOMINATED_CANDIDATE_EDITOR_EMAIL,
        password: NO_NOMINATION_PASSWORD,
        storageStatePath: UNNOMINATED_CANDIDATE_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [UNNOMINATED_ORGANIZATION_GRANT],
        email: UNNOMINATED_ORGANIZATION_EDITOR_EMAIL,
        password: NO_NOMINATION_PASSWORD,
        storageStatePath: UNNOMINATED_ORGANIZATION_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
    await inFreshContext(browser, baseURL, (page) =>
      registerAndStoreSession(page, {
        entityGrants: [NOMINATED_CANDIDATE_GRANT],
        email: NOMINATED_CANDIDATE_EDITOR_EMAIL,
        password: NO_NOMINATION_PASSWORD,
        storageStatePath: NOMINATED_CANDIDATE_STORAGE_STATE,
        acceptTermsOfUse: true,
        settledTestId: testIds.contestant.home.statusMessage
      })
    );
  }
);
