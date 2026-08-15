/**
 * bank-auth-journey data-teardown project (EFLOW-10b).
 *
 * Owns BOTH halves of the journey's runtime state (RESEARCH §Runtime State
 * Inventory):
 *
 *  1. The seeded dataset — clears the `e2e-bankauth-notloc-` prefix via
 *     `runTeardown`. Phase 140 CR-01: this prefix is DEDICATED to this
 *     project (registered via the `perm-bankauth-notloc` template — see
 *     `bank-auth-journey.setup.ts`'s docblock) and is disjoint from
 *     `perm-not-located-2e2cg.teardown.ts`'s `e2e-perm-notloc-` prefix, so the
 *     two teardown projects — which the DAG deliberately leaves unordered
 *     relative to each other (A4) — can never race on the same
 *     before/after row counts.
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

import { test as teardown } from '@playwright/test';
import { BANK_AUTH_JOURNEY_EMAIL, BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-bankauth-notloc-';

teardown('delete bank-auth-journey dataset + created auth user', async () => {
  const client = new SupabaseAdminClient();

  // 1. Clear the seeded perm-bankauth-notloc rows (own dedicated prefix — Phase 140 CR-01).
  await runTeardownAsserted(PREFIX, client);

  // 2. Delete the auth.users + user_roles + candidate-link the journey created.
  //    The identity-callback Edge Function creates the bank-auth user under the
  //    PLACEHOLDER email (`${sub}@bank-auth.placeholder`) — that is the cascade
  //    that leaks across runs, so it is the primary delete target. The typed
  //    `BANK_AUTH_JOURNEY_EMAIL` is cleaned defensively (the Supabase id_token
  //    path does not persist it, but a future flow change could). Idempotent —
  //    no-op when no user matches.
  //    NOTE: `unregisterCandidate` nulls the candidate's `auth_user_id` and
  //    deletes the auth user + roles; the orphaned bank-auth candidate row
  //    (created fresh by the Edge Function, no external_id prefix) is removed
  //    explicitly below so it does not accumulate across the 3× determinism gate.
  await client.deleteBankAuthCandidateBySub(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL);

  // 3. (Phase 140 review WR-08 — REMOVED, not gated) This step used to write
  //    `preRegistration.enabled = false` back onto the shared `app_settings`
  //    singleton via an ADDITIVE merge. That write is NOT ordered relative to
  //    the perm chain — `data-setup-bank-auth-journey` depends only on
  //    `data-setup-base` (Phase 140 CR-01), not on the perm serial chain
  //    (A4) — so under `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` this step could
  //    fire while the perm family is still mid-run and OWNS the singleton
  //    for its own authoritative REPLACE, clobbering it. Every
  //    `setupFromTemplate` call already does a full authoritative REPLACE of
  //    `app_settings.settings` before ITS OWN overlay (`setupFromTemplate.ts`
  //    step 3), so the next setup to run — base, perm, or a re-run of this
  //    project itself (which now always runs `data-setup-base` first) —
  //    unconditionally resets `preRegistration` to that setup's own baseline.
  //    Nothing needs to restore it here; doing so was both redundant and the
  //    one remaining unordered write into shared state.
});
