/**
 * entity-selection data-setup project: three users on three rows of the base dataset, and two stored sessions.
 *
 * The chain consumes the base dataset already seeded by `data-setup-base` and seeds nothing. The rows it grants are seeded for it and for nothing else: two candidates and one organization, each unconfirmed and so invisible to voters. A candidate admits one editor and an organization several, so the two candidates belong to the first user alone and all three users share the organization.
 *
 *   - **multi** edits both candidates and the organization. Its session is stored at `MULTI_ENTITY_STORAGE_STATE` once the profile selection screen has rendered for it.
 *   - **none** is registered as an editor of the organization and signed in, its session is stored at `NO_ENTITY_STORAGE_STATE`, and its grant is then removed. The login form refuses a user with nothing to edit, so the session cannot start without a grant. The application lists a user's entities from the grants table and not from the token, so from the removal on the stored session shows the "nothing to edit" view.
 *   - **logout** is registered as an editor of the organization and no session is stored for it: the spec signs it in through the login form, so the one case that signs out ends no stored session.
 *
 * Both stored sessions are read-only for the run. Each user has accepted the terms of use, so none of them stops at the terms-of-use view.
 *
 * Each test unregisters its own user first, so a rerun, a cold start and a run after an aborted one all begin from the same state; `data-teardown-entity-selection` unregisters the three again.
 */

import { expect, test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import {
  MULTI_ENTITY_STORAGE_STATE,
  NO_ENTITY_STORAGE_STATE,
  TEST_CANDIDATE_PASSWORD,
  TEST_LOGOUT_ENTITY_EMAIL,
  TEST_MULTI_ENTITY_EMAIL,
  TEST_NO_ENTITY_EMAIL,
  TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID,
  TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID,
  TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
} from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { registerAndStoreSession } from '../shared/registerAndStoreSession';
import type { EntityGrantTarget } from '../../utils/supabaseAdminClient';

const SELECTION_ORGANIZATION: EntityGrantTarget = {
  entityType: 'organization',
  externalId: TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
};

setup('register + authenticate as a user who edits two candidates and an organization', async ({ page }) => {
  // Contestant app data loading can be slow; increase timeout
  setup.setTimeout(TIMEOUTS.testMax);

  // Settled on the selection list: the session is stored only once the profile selection screen has rendered for this user.
  await registerAndStoreSession(page, {
    entityGrants: [
      { entityType: 'candidate', externalId: TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID },
      { entityType: 'candidate', externalId: TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID },
      SELECTION_ORGANIZATION
    ],
    email: TEST_MULTI_ENTITY_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: MULTI_ENTITY_STORAGE_STATE,
    acceptTermsOfUse: true,
    settledTestId: testIds.contestant.entitySelection.list
  });
});

setup('register + authenticate as a user whose only grant is then removed', async ({ page }) => {
  // Contestant app data loading can be slow; increase timeout
  setup.setTimeout(TIMEOUTS.testMax);

  // Settled on the organization's home: with one entity to edit the user is sent straight to it.
  await registerAndStoreSession(page, {
    entityGrants: [SELECTION_ORGANIZATION],
    email: TEST_NO_ENTITY_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: NO_ENTITY_STORAGE_STATE,
    acceptTermsOfUse: true,
    settledTestId: testIds.contestant.home.statusMessage
  });

  const client = new SupabaseAdminClient();
  await client.revokeEntityGrant(TEST_NO_ENTITY_EMAIL, SELECTION_ORGANIZATION);
  expect(await client.entityGrantCountForUser(TEST_NO_ENTITY_EMAIL)).toBe(0);
});

setup('register a user to sign in and out through the forms', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(TEST_LOGOUT_ENTITY_EMAIL);
  await client.forceRegisterUser(TEST_LOGOUT_ENTITY_EMAIL, TEST_CANDIDATE_PASSWORD, {
    entityGrants: [SELECTION_ORGANIZATION]
  });
});
