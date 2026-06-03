/**
 * candidate-journey data-setup project — Phase 89 Plan 03 Task 1
 *   ↪ refactored 2026-05-31 to break the voter-journey cascade-skip;
 *   ↪ renamed candidate-mega→candidate-journey in Phase 93 Plan 04 (D-09/D-11).
 *
 * BEFORE: this setup called `setupFromTemplate('e2e/base')`, which runs
 * `runTeardown('test-')` before re-seeding. That forced the chain to be
 * sequenced AFTER voter-journey (shared 'test-' prefix race), and
 * Playwright's cascade-skip semantics meant any voter-journey failure
 * skipped the entire candidate-journey + perm-* downstream graph.
 *
 * AFTER: the chain consumes the base dataset ALREADY seeded by
 * `data-setup-base` and runs in parallel with `voter-journey`. The
 * only state this setup needs to guarantee is a clean `auth.users` row for
 * UNREGISTERED_CANDIDATE_EMAIL so the registration-via-email step in
 * candidate-journey.spec.ts step 7 lands deterministically. The
 * `unregisterCandidate` helper is idempotent (no-op if no matching user),
 * so a cold-start, a warm-start, and a partial-prior-run all converge to
 * the same starting state.
 *
 * Row-level base data is owned by `data-setup-base`; the paired
 * `data-teardown-base` is the sole owner of the `test-` prefix wipe.
 * `data-teardown-candidate-journey` only handles the auth.users row this
 * chain owns.
 */

import { test as setup } from '@playwright/test';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../../utils/candidateJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

setup('prepare candidate-journey auth state (unregister, idempotent)', async () => {
  const client = new SupabaseAdminClient();
  // Defensive unregister — clears any auth.users + user_roles + ToU state
  // for the unregistered candidate left behind by an aborted prior run.
  // Safe to call when nothing matches; safe to call alongside voter-journey
  // because the voter journey never touches this candidate's auth state.
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);
});
