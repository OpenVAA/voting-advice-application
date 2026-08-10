/**
 * bank-auth-journey data-setup project (EFLOW-10b).
 *
 * Opt-in-isolated (PLAYWRIGHT_BANK_AUTH-gated; stands ALONE, NOT threaded into
 * the perm serial chain — A4). Guarantees two things before the journey spec
 * runs:
 *
 *  1. The multi-election dataset (D-04). Reuses the EXISTING
 *     `perm-not-located-2e2cg` TEMPLATE (registry key
 *     `packages/dev-seed/src/templates/index.ts` →
 *     `permNotLocated2e2cgTemplate`) — confirmed to seed 2 elections × 2
 *     disjoint constituency groups × 2 constituencies each, the only existing
 *     shape that forces BOTH the candidate-preregister election selector AND
 *     the constituency selector to render (A1 confirmed; no fallback to
 *     `perm-2e-asymmetric` needed). Row prefix: `e2e-perm-notloc-`.
 *
 *  2. A clean auth.users state for the journey identity. The bank-auth journey
 *     creates a real `auth.users` + `candidates` + `user_roles` row (via the
 *     identity-callback + preregistration-invite flow). Pre-cleaning the
 *     journey's recipient address idempotently (mirror
 *     `candidate-journey.setup.ts`) means a cold-start, a warm-start, and a
 *     partial-prior-run all converge to the same clean starting state.
 *
 * The paired `bank-auth-journey.teardown.ts` owns BOTH the `e2e-perm-notloc-`
 * prefix wipe and the created auth-user delete.
 */

import { test as setup } from '@playwright/test';
import { BANK_AUTH_JOURNEY_EMAIL, BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('seed perm-not-located-2e2cg + pre-clean bank-auth-journey identity', async () => {
  // D-04: reuse the perm-not-located-2e2cg TEMPLATE (not the perm chain).
  //
  // Scoped preregistration enablement (EFLOW-10b): the candidate-preregister
  // route guard (`/candidate/preregister/+layout.server.ts`) reads
  // `app_settings.settings.preRegistration.enabled` server-side and renders the
  // preregister flow ONLY when it is truthy. `perm-not-located-2e2cg` is a
  // SHARED template (its other consumer, `perm-not-located-2e2cg.spec.ts`, must
  // keep preregistration DISABLED), so we do NOT enable it in the template nor
  // in `MINIMAL_BASE_APP_SETTINGS`. Instead we overlay the scoped flag onto the
  // runtime DB row AFTER seeding via `appSettingsOverride` (additive
  // merge_jsonb_column); the paired teardown resets it to `{ enabled: false }`
  // so a later default-suite run is NOT left with preregistration enabled.
  await setupFromTemplate('perm-not-located-2e2cg', {
    extraTeardownPrefix: ['test-', 'e2e-perm-'],
    appSettingsOverride: { preRegistration: { enabled: true } }
  });

  // Idempotent auth pre-clean: remove any auth.users + user_roles + ToU state
  // left behind by an aborted prior run. `unregisterCandidate` is a no-op when
  // no user matches the email.
  //
  // TWO addresses are cleaned: the PLACEHOLDER email the identity-callback Edge
  // Function actually creates the bank-auth user with
  // (`${sub}@bank-auth.placeholder`) — this is the one that leaks across runs —
  // and the typed `BANK_AUTH_JOURNEY_EMAIL` (defensive; the Supabase id_token
  // path does not persist it, but a future flow change or a partial prior run
  // could have left a row).
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL);
  await client.unregisterCandidate(BANK_AUTH_JOURNEY_EMAIL);
});
