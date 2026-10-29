/**
 * contestant-journey data-setup project.
 *
 * The chain consumes the base dataset ALREADY seeded by `data-setup-base` and runs in parallel with `voter-journey`. The only state this setup guarantees is a clean `auth.users` row for UNREGISTERED_CANDIDATE_EMAIL so the registration-via-email step in the contestant-journey spec lands deterministically. The `unregisterCandidate` helper is idempotent (no-op if no matching user), so a cold-start, a warm-start, and a partial-prior-run all converge to the same starting state.
 *
 * Row-level base data is owned by `data-setup-base`; the paired `data-teardown-base` is the sole owner of the `test-` prefix wipe.
 * `data-teardown-contestant-journey` only handles the auth.users row this chain owns.
 */

import { test as setup } from '@playwright/test';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../../utils/contestantJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

setup('prepare contestant-journey auth state (unregister, idempotent)', async () => {
  const client = new SupabaseAdminClient();
  // Defensive unregister — removes any auth user holding the unregistered candidate's email that an aborted prior run left behind; that user's grants and terms-of-use acceptance go with it.
  // Safe to call when nothing matches; safe to call alongside voter-journey because the voter journey never touches this candidate's auth state.
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
});
