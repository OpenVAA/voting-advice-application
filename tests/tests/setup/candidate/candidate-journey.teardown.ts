/**
 * candidate-journey data-teardown project.
 *
 * Only owns the auth.users row created by the registration-via-email step
 * in the candidate-journey spec. The `test-` row prefix is owned by
 * `data-teardown-base`, which runs once at the end of the wider chain.
 *
 * Idempotent: `unregisterCandidate` is a no-op when no auth.users row
 * matches the email. Safe across cold-starts, warm-starts, and re-runs
 * after a partial spec failure.
 */

import { test as teardown } from '@playwright/test';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../../utils/candidateJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

teardown('unregister candidate-journey auth user', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
});
