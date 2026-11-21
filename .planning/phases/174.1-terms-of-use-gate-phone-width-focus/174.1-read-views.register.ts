// 174.1-read-views.register.ts — the two users of the plan `views` of 174.1-read.mjs, and their stored sessions.
//
// Run by 174.1-read.mjs alone, as the project views-users-register of 174.1-read-views.config.ts, after the suite's
// data-setup-base has seeded the base dataset. Both users are registered through the suite's own
// `registerAndStoreSession` with `acceptTermsOfUse: false`, the mechanism auth-setup registers its terms-pending user
// by, so each is shown the terms-of-use view at the app root and the session is stored once that view has rendered.
//
//   multi   the editor of the two selection candidates and the selection organization of the base dataset. Once this
//           user accepts, the app root shows the selection screen.
//   none    registered as the editor of the selection organization, because the login form refuses a user with
//           nothing to edit; the grant is removed once the session is stored. The application lists a user's entities
//           from the grants table and not from the token, so once this user accepts, the app root shows the "nothing
//           to edit" view.
//
// The three rows are the ones the suite's entity-selection setup registers its own users on. That setup is not run in
// a read session, so the two candidates, which admit one editor each, have none when this file runs.
//
// `registerAndStoreSession` unregisters a user holding the address first, so a session made after an aborted one
// starts from the same state. The users are removed by 174.1-read-views.unregister.ts.

import { expect, test as setup } from '@playwright/test';
import { TIMEOUTS } from '../../../tests/tests/helpers';
import { registerAndStoreSession } from '../../../tests/tests/setup/shared/registerAndStoreSession';
import { SupabaseAdminClient } from '../../../tests/tests/utils/supabaseAdminClient';
import {
  TEST_CANDIDATE_PASSWORD,
  TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID,
  TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID,
  TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
} from '../../../tests/tests/utils/testCredentials';
import { testIds } from '../../../tests/tests/utils/testIds';
import type { EntityGrantTarget } from '../../../tests/tests/utils/supabaseAdminClient';

/** A value 174.1-read.mjs puts in the environment of this invocation. */
function given(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set: this file is run by 174.1-read.mjs, which sets it`);
  return value;
}

const MULTI_EMAIL = given('READ1741_MULTI_EMAIL');
const NONE_EMAIL = given('READ1741_NONE_EMAIL');
const MULTI_STATE = given('READ1741_MULTI_STATE');
const NONE_STATE = given('READ1741_NONE_STATE');

const SELECTION_ORGANIZATION: EntityGrantTarget = {
  entityType: 'organization',
  externalId: TEST_SELECTION_ORGANIZATION_EXTERNAL_ID
};

const MULTI_GRANTS: ReadonlyArray<EntityGrantTarget> = [
  { entityType: 'candidate', externalId: TEST_SELECTION_CANDIDATE_A_EXTERNAL_ID },
  { entityType: 'candidate', externalId: TEST_SELECTION_CANDIDATE_B_EXTERNAL_ID },
  SELECTION_ORGANIZATION
];

setup('register a user who has not accepted the terms of use and edits several entities', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await registerAndStoreSession(page, {
    entityGrants: MULTI_GRANTS,
    email: MULTI_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: MULTI_STATE,
    acceptTermsOfUse: false,
    settledTestId: testIds.contestant.terms.submit
  });

  expect(await new SupabaseAdminClient().entityGrantCountForUser(MULTI_EMAIL)).toBe(MULTI_GRANTS.length);
});

setup('register a user who has not accepted the terms of use and whose only grant is then removed', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await registerAndStoreSession(page, {
    entityGrants: [SELECTION_ORGANIZATION],
    email: NONE_EMAIL,
    password: TEST_CANDIDATE_PASSWORD,
    storageStatePath: NONE_STATE,
    acceptTermsOfUse: false,
    settledTestId: testIds.contestant.terms.submit
  });

  const client = new SupabaseAdminClient();
  await client.revokeEntityGrant(NONE_EMAIL, SELECTION_ORGANIZATION);
  expect(await client.entityGrantCountForUser(NONE_EMAIL)).toBe(0);
});
