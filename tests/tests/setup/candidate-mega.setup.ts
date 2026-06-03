/**
 * candidate-mega data-setup project — Phase 89 Plan 03 Task 1
 *   ↪ refactored 2026-05-31 to break the voter-mega-journey cascade-skip.
 *
 * BEFORE: this setup called `setupFromTemplate('baseV1')`, which runs
 * `runTeardown('test-')` before re-seeding. That forced the chain to be
 * sequenced AFTER voter-mega-journey (shared 'test-' prefix race), and
 * Playwright's cascade-skip semantics meant any voter-mega-journey failure
 * skipped the entire candidate-mega + perm-* downstream graph.
 *
 * AFTER: the chain consumes the baseV1 dataset ALREADY seeded by
 * `data-setup-baseV1` and runs in parallel with `voter-mega-journey`. The
 * only state this setup needs to guarantee is a clean `auth.users` row for
 * UNREGISTERED_CANDIDATE_EMAIL so the registration-via-email step in
 * candidate-mega-journey.spec.ts step 7 lands deterministically. The
 * `unregisterCandidate` helper is idempotent (no-op if no matching user),
 * so a cold-start, a warm-start, and a partial-prior-run all converge to
 * the same starting state.
 *
 * Row-level baseV1 data is owned by `data-setup-baseV1`; the paired
 * `data-teardown-baseV1` is the sole owner of the `test-` prefix wipe.
 * `data-teardown-candidate-mega` only handles the auth.users row this
 * chain owns.
 */

import { test as setup } from '@playwright/test';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../utils/candidateJourneyConstants';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

setup('prepare candidate-mega auth state (unregister, idempotent)', async () => {
  const client = new SupabaseAdminClient();
  // Defensive unregister — clears any auth.users + user_roles + ToU state
  // for the unregistered candidate left behind by an aborted prior run.
  // Safe to call when nothing matches; safe to call alongside voter-mega-
  // journey because voter-mega never touches this candidate's auth state.
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
});
