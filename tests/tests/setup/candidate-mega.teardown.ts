/**
 * candidate-mega data-teardown project — Phase 89 Plan 03 Task 1
 *   ↪ refactored 2026-05-31 to align with cascade-decoupled setup.
 *
 * Only owns the auth.users row created by the registration-via-email step
 * in candidate-mega-journey.spec.ts. The `test-` row prefix is owned by
 * `data-teardown-baseV1`, which runs once at the end of the wider chain.
 *
 * Idempotent: `unregisterCandidate` is a no-op when no auth.users row
 * matches the email. Safe across cold-starts, warm-starts, and re-runs
 * after a partial spec failure.
 */

import { test as teardown } from '@playwright/test';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../utils/candidateJourneyConstants';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

teardown('unregister candidate-mega auth user', async () => {
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
});
