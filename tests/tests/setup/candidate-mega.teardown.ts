/**
 * candidate-mega data-teardown project — Phase 89 Plan 03 Task 1.
 *
 * Two-step teardown:
 *   1. `unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL)` — removes the
 *      auth.users row + user_roles row + clears auth_user_id on the
 *      candidate, created by the registration-via-email flow in the spec.
 *      MUST run BEFORE the generic 'test-' teardown — otherwise
 *      runTeardown deletes the candidate row first, after which the
 *      `update({ auth_user_id: null, ... }).eq('auth_user_id', user.id)`
 *      step inside unregisterCandidate is a silent no-op (no matching
 *      row), leaving the auth.users entry orphaned. Plan 89-03 R4
 *      binding.
 *   2. `runTeardown('test-', client)` — deletes every row with the
 *      `test-` external_id prefix (idempotent; safe across multiple
 *      project boundaries).
 *
 * Mirror of `tests/tests/setup/baseV1.teardown.ts` shape, but augmented
 * with the auth-unregister branch (the candidate-mega chain creates a
 * real auth.users row via `inviteUserByEmail`; the voter-mega chain
 * authenticates nobody and so needs no equivalent step).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { UNREGISTERED_CANDIDATE_EMAIL } from '../utils/candidateMegaConstants';

const PREFIX = 'test-';

teardown('delete baseV1 dataset + unregister candidate (candidate-mega chain)', async () => {
  const client = new SupabaseAdminClient();

  // 1. Auth-users cleanup FIRST — see file-level docstring rationale.
  //    unregisterCandidate is idempotent (early-returns if no auth user
  //    matches the email), so this is safe across cold + warm runs.
  await client.unregisterCandidate(UNREGISTERED_CANDIDATE_EMAIL);

  // 2. Generic 'test-' prefix teardown.
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
