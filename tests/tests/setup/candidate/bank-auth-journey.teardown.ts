/**
 * bank-auth-journey data-teardown project (EFLOW-10b).
 *
 * Owns BOTH halves of the journey's runtime state (RESEARCH §Runtime State
 * Inventory):
 *
 *  1. The seeded dataset — clears the `e2e-perm-notloc-` prefix via
 *     `runTeardown` (mirror `perm-not-located-2e2cg.teardown.ts`).
 *  2. The created auth user — the bank-auth journey creates a real
 *     `auth.users` + `candidates` + `user_roles` row (via the
 *     identity-callback + preregistration-invite flow). `unregisterCandidate`
 *     deletes the cascade (clears the candidate's auth_user_id + ToU, deletes
 *     user_roles, deletes the auth.users row) for the journey's recipient
 *     address.
 *
 * Idempotent: both `runTeardown` and `unregisterCandidate` are no-ops when
 * nothing matches — safe across cold-starts, warm-starts, and re-runs after a
 * partial spec failure.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { BANK_AUTH_JOURNEY_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-notloc-';

teardown('delete bank-auth-journey dataset + created auth user', async () => {
  const client = new SupabaseAdminClient();

  // 1. Clear the seeded perm-not-located-2e2cg rows.
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);

  // 2. Delete the auth.users + candidates + user_roles cascade the journey
  //    created (idempotent — no-op when no user matches the email).
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL);
});
