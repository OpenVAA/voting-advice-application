/**
 * perm-closed-project data-teardown project (162.1 D-21).
 *
 * Scoped to PREFIX='e2e-perm-closed-project-' (matches the template's own externalIdPrefix).
 *
 * It first unregisters the auth user the setup minted for the seeded candidate (perm teardowns must not leak auth users), then deletes the prefix, then REOPENS the E2E project with `ensureProject()`, which forces `open_for_voters = true`. This is restore layer 2 of 3 (the spec's `afterAll` is layer 1, the next run's global setup is layer 3). `runTeardownAsserted` deliberately does not reopen (162.1-05), so this call is what does it here.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-closed-project-';
// The auth.users row minted by the setup's forceRegister. runTeardown(PREFIX) deletes the seeded candidate row but NOT the auth user. Idempotent no-op when no matching auth.users row exists.
const CANDIDATE_EMAIL = `${PREFIX}cand-1@test.openvaa.local`;

teardown('delete perm-closed-project dataset and reopen the project', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(CANDIDATE_EMAIL);
  await runTeardownAsserted(PREFIX, client);
  await client.ensureProject();
});
