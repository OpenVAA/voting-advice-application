/**
 * bank-auth-journey data-teardown project.
 *
 * Owns BOTH halves of the journey's runtime state:
 *
 *  1. The seeded dataset — clears the `e2e-bankauth-notloc-` prefix via `runTeardown`. This prefix is DEDICATED to this project (registered via the `perm-bankauth-notloc` template — see `bank-auth-journey.setup.ts`'s docblock) and is disjoint from `perm-not-located-2e2cg.teardown.ts`'s `e2e-perm-notloc-` prefix, so the two teardown projects — which the project graph deliberately leaves unordered relative to each other — can never race on the same before/after row counts.
 *  2. The created identity — the bank-auth journey creates a real `auth.users` + `candidates` + `grants` row (via the identity-callback + preregistration-invite flow). `deleteBankAuthCandidateBySub` deletes the candidate row, found through the user's candidate-editor grant, with the grants naming it; `unregisterCandidate` then deletes the user's remaining grants and the auth.users row.
 *
 * Idempotent: `runTeardown`, `deleteBankAuthCandidateBySub` and `unregisterCandidate` are all no-ops when nothing matches — safe across cold-starts, warm-starts, and re-runs after a partial spec failure.
 */

import { test as teardown } from '@playwright/test';
import { BANK_AUTH_JOURNEY_EMAIL, BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-bankauth-notloc-';

teardown('delete bank-auth-journey dataset + created auth user', async () => {
  const client = new SupabaseAdminClient();

  // 1. Clear the seeded perm-bankauth-notloc rows (own dedicated prefix).
  await runTeardownAsserted(PREFIX, client);

  // 2. Delete the candidate, grants and auth.users row the journey created.
  //    The identity-callback Edge Function creates the bank-auth user under the PLACEHOLDER email (`${sub}@bank-auth.placeholder`) — that is the cascade that leaks across runs, so it is the primary delete target. The typed `BANK_AUTH_JOURNEY_EMAIL` is cleaned defensively (the Supabase id_token path does not persist it, but a future flow change could). Idempotent — no-op when no user matches.
  //    The bank-auth candidate row is created fresh by the Edge Function with no external_id prefix, so `runTeardown` cannot reach it and `unregisterCandidate` never deletes a candidate row; `deleteBankAuthCandidateBySub` removes it so it does not accumulate across repeated runs. It runs first because it finds the candidate through the grant `unregisterCandidate` deletes.
  await client.deleteBankAuthCandidateBySub(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL);

  // Nothing is written back to the shared `app_settings` singleton here. This teardown is NOT ordered relative to the perm chain — `data-setup-bank-auth-journey` depends only on `data-setup-base` — so under `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` a write here could land while the perm family is mid-run and OWNS the singleton for its own authoritative REPLACE, clobbering it. Restoring `preRegistration` is unnecessary anyway: every `setupFromTemplate` call does a full authoritative REPLACE of `app_settings.settings` before ITS OWN overlay (`setupFromTemplate.ts` step 3), so the next setup to run — base, perm, or a re-run of this project, which always runs `data-setup-base` first — resets `preRegistration` to that setup's own baseline.
});
