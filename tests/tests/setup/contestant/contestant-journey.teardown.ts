/**
 * contestant-journey data-teardown project.
 *
 * Owns what the registration step of the contestant-journey spec creates: the invitation seeded for the unregistered candidate's address and the auth.users row that comes into being when its sign-in link is asked for. `unregisterCandidate` removes both, the claimed invitation included, with the grant the claim wrote and the user's terms-of-use acceptance. The `test-` row prefix is owned by `data-teardown-base`, which runs once at the end of the wider chain.
 *
 * Idempotent: with no auth.users row for the email, `unregisterCandidate` removes only the invitations addressed to it. Safe across cold-starts, warm-starts, and re-runs after a partial spec failure.
 */

import { test as teardown } from '@playwright/test';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../../utils/contestantJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

teardown('unregister contestant-journey auth user', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
});
