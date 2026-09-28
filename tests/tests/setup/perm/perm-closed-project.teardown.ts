/**
 * perm-closed-project data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-closed-project-' (matches the template's own externalIdPrefix).
 *
 * It unregisters the auth user the setup minted for the seeded candidate, deletes the prefix, and always reopens the shared E2E project with `ensureProject`, which forces `open_for_voters = true`. `runTeardownAsserted` does not reopen the project, so this call is the one that does.
 *
 * The reopen runs in a `finally` because a closed project fails every later spec in the run. A throw from either delete step still fails the teardown after the project is reopened.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-closed-project-';
// The auth.users row minted by the setup's forceRegister. runTeardown(PREFIX) deletes the seeded candidate row but NOT the auth user. Idempotent no-op when no matching auth.users row exists.
const CANDIDATE_EMAIL = `${PREFIX}cand-1@test.openvaa.local`;

teardown('delete perm-closed-project dataset and reopen the project', async () => {
  const client = new SupabaseAdminClient();
  try {
    await client.unregisterCandidate(CANDIDATE_EMAIL);
    await runTeardownAsserted(PREFIX, client);
  } finally {
    await client.ensureProject();
  }
});
