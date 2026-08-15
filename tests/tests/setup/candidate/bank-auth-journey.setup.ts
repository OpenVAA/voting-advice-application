/**
 * bank-auth-journey data-setup project (EFLOW-10b).
 *
 * Opt-in-isolated (PLAYWRIGHT_BANK_AUTH-gated; stands ALONE, NOT threaded into
 * the perm serial chain — A4). Guarantees two things before the journey spec
 * runs:
 *
 *  1. The multi-election dataset (D-04). Seeds the DEDICATED
 *     `perm-bankauth-notloc` TEMPLATE (registry key
 *     `packages/dev-seed/src/templates/index.ts` →
 *     `permBankauthNotLocatedTemplate`) — a Phase 140 CR-01 copy of
 *     `perm-not-located-2e2cg`'s shape (2 elections × 2 disjoint constituency
 *     groups × 2 constituencies each, the only existing shape that forces
 *     BOTH the candidate-preregister election selector AND the constituency
 *     selector to render; A1 confirmed; no fallback to `perm-2e-asymmetric`
 *     needed), under its OWN `e2e-bankauth-notloc-` row prefix.
 *
 *     Phase 140 CR-01: this project originally reused the SHARED
 *     `perm-not-located-2e2cg` template verbatim, which meant its teardown
 *     shared the `e2e-perm-notloc-` PREFIX with
 *     `perm-not-located-2e2cg.teardown.ts`. The two data-teardown projects
 *     are not ordered relative to EACH OTHER in the DAG (A4 keeps this
 *     project standing alone, deliberately NOT depending on the perm serial
 *     chain — see `IDURA-TEST-RUNBOOK.md` Step B-3's isolated
 *     `--project=bank-auth-journey` 3× determinism gate, which would break if
 *     this project depended on the perm chain), so under
 *     `PLAYWRIGHT_BANK_AUTH=1 yarn test:e2e` the two teardowns could run
 *     concurrently and race on the same before/after row counts. A dedicated
 *     template with a disjoint prefix removes the collision at the root
 *     instead of ordering around it. No `extraTeardownPrefix` pre-clear on
 *     THIS setup is needed: the dedicated prefix means this setup never needs
 *     to wipe the `test-` / `e2e-perm-` namespaces it does not own.
 *
 *     Phase 140 CR-01 (iteration-2 regression fix): the dedicated
 *     `e2e-bankauth-notloc-` prefix also sits outside every EXISTING sweep in
 *     the suite (`base.setup`'s old `'e2e-perm-'` pre-clear, and all 19 perm
 *     setups' `['test-', 'e2e-perm-']`), so a failed/aborted teardown here
 *     used to self-heal via those sweeps and no longer did. The fix is a
 *     `dependencies: ['data-setup-base']` edge on `data-setup-bank-auth-journey`
 *     (`playwright.config.ts`) — mirrors the sibling `bank-auth` project, is
 *     `data-setup-base` ONLY (not the perm chain, so A4 and the isolated 3×
 *     determinism gate above are unaffected) — paired with `base.setup.ts`
 *     adding `'e2e-bankauth-'` to ITS `extraTeardownPrefix` sweep so an
 *     orphaned bank-auth dataset is cleared before base (and this project)
 *     re-seed.
 *
 *  2. A clean auth.users state for the journey identity. The bank-auth journey
 *     creates a real `auth.users` + `candidates` + `user_roles` row (via the
 *     identity-callback + preregistration-invite flow). Pre-cleaning the
 *     journey's recipient address idempotently (mirror
 *     `candidate-journey.setup.ts`) means a cold-start, a warm-start, and a
 *     partial-prior-run all converge to the same clean starting state.
 *
 * The paired `bank-auth-journey.teardown.ts` owns BOTH the
 * `e2e-bankauth-notloc-` prefix wipe and the created auth-user delete.
 */

import { test as setup } from '@playwright/test';
import { BANK_AUTH_JOURNEY_EMAIL, BANK_AUTH_JOURNEY_PLACEHOLDER_EMAIL } from '../../utils/bankAuthJourneyConstants';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { setupFromTemplate } from '../shared/setupFromTemplate';

setup('seed perm-bankauth-notloc + pre-clean bank-auth-journey identity', async () => {
  // D-04 / Phase 140 CR-01: seed the DEDICATED perm-bankauth-notloc template
  // (own `e2e-bankauth-notloc-` prefix — see the file docblock for why this is
  // a separate template rather than a runtime prefix override on the shared
  // perm-not-located-2e2cg template).
  //
  // Scoped preregistration enablement (EFLOW-10b): the candidate-preregister
  // route guard (`/candidate/preregister/+layout.server.ts`) reads
  // `app_settings.settings.preRegistration.enabled` server-side and renders the
  // preregister flow ONLY when it is truthy. We do NOT enable it in the
  // template nor in `MINIMAL_BASE_APP_SETTINGS`. Instead we overlay the scoped
  // flag onto the runtime DB row AFTER seeding via `appSettingsOverride`
  // (additive merge_jsonb_column); the paired teardown resets it to
  // `{ enabled: false }` so a later default-suite run is NOT left with
  // preregistration enabled.
  //
  // No `extraTeardownPrefix` pre-clear: `perm-bankauth-notloc-` is this
  // project's OWN dedicated namespace, so there is nothing to wipe on behalf
  // of another chain (Phase 140 CR-01 — the prior `['test-', 'e2e-perm-']`
  // pre-clear wiped namespaces this project does not own).
  await setupFromTemplate('perm-bankauth-notloc', {
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
