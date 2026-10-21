/**
 * entity-selection data-teardown project.
 *
 * Owns the three auth users `data-setup-entity-selection` registers, and their grants, which go with them. It performs no prefix delete: the rows the users were granted belong to the base dataset and leave with it, in `data-teardown-base`.
 *
 * Idempotent: `unregisterCandidate` is a no-op when no auth user holds the email. Safe across cold starts, warm starts and reruns after a partial failure.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_LOGOUT_ENTITY_EMAIL, TEST_MULTI_ENTITY_EMAIL, TEST_NO_ENTITY_EMAIL } from '../../utils/testCredentials';

teardown('unregister the entity-selection auth users', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(TEST_MULTI_ENTITY_EMAIL);
  await client.unregisterCandidate(TEST_NO_ENTITY_EMAIL);
  await client.unregisterCandidate(TEST_LOGOUT_ENTITY_EMAIL);
});
