import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import { TEST_UNREGISTERED_EMAILS } from '../utils/e2eFixtureRefs';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

const PREFIX = 'test-';

/**
 * Probe candidates + organizations for any row whose `external_id` is NOT
 * prefixed with `PREFIX`. By default this WARNS (so a CI run that pointed at
 * a clean DB sees no impact); set `E2E_REQUIRE_FRESH_DB=true` to escalate to
 * a hard failure.
 *
 * Module-level helper hoisted out of the setup body (RESEARCH Pattern 4
 * canonical 3) so playwright/no-conditional-in-test holds for the setup
 * callback itself. The post-probe branches (probe-failed vs has-non-test-rows
 * vs require-fresh-vs-warn) are legitimate dispatches on settled query results
 * — not race-masks.
 */
async function probeFreshDatabasePrecondition(
  client: SupabaseAdminClient,
  prefix: string
): Promise<void> {
  const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';
  const candQuery = client.query('candidates');
  const { data: nonTestCands, error: candErr } = await candQuery
    .not('external_id', 'like', `${prefix}%`)
    .limit(5);
  const orgQuery = client.query('organizations');
  const { data: nonTestOrgs, error: orgErr } = await orgQuery
    .not('external_id', 'like', `${prefix}%`)
    .limit(5);

  if (candErr || orgErr) {
    // Probe failed (e.g. RLS, missing tables) — log but do not block.
    // (no-console is off in tests/eslint.config.mjs; no disable needed.)
    console.warn(
      `[data.setup] Fresh-database probe failed (candidates: ${candErr?.message ?? 'ok'}; organizations: ${orgErr?.message ?? 'ok'}) — proceeding without precondition guarantee.`
    );
    return;
  }

  const totalNonTest = (nonTestCands?.length ?? 0) + (nonTestOrgs?.length ?? 0);
  if (totalNonTest === 0) return;

  const message = `[data.setup] Database is NOT fresh — found ${nonTestCands?.length ?? 0} non-test candidate(s) and ${nonTestOrgs?.length ?? 0} non-test organization(s) (probe limited to 5 each). Pre-existing non-test data will coexist with the seeded e2e dataset and may produce confusing test failures (extra entities in result lists, mismatched filter counts, spurious parity diffs). Run \`yarn supabase:reset\` (migrations only, no seed overlay) before re-running the e2e suite, or set E2E_REQUIRE_FRESH_DB=false to silence this. (Set E2E_REQUIRE_FRESH_DB=true to make this a hard failure.)`;

  if (requireFresh) {
    throw new Error(message);
  }
  console.warn(message);
}

/**
 * Data-setup project: seeds the e2e template's data via @openvaa/dev-seed,
 * then wires auth (D-24 split: dev-seed owns rows/storage; tests/ owns auth).
 *
 * Pre-clears prior runs via runTeardown('test-', ...) for idempotency. This
 * replaces the legacy delete-then-import-per-fixture chain (Phase 59 E2E-01).
 *
 * app_settings is now declared by the dev-seed e2e template's
 * `app_settings.fixed[]` block (Phase 63 E2E-02). Writer Pass-5 routes it
 * through `merge_jsonb_column` automatically. The legacy
 * `updateAppSettings(...)` call here was deleted in Plan 63-02 Task 3; a
 * post-seed subset-match assertion (D-10 + RESOLVED Q2) verifies the
 * persisted row matches the template's declared shape.
 */
setup('import test dataset', async () => {
  const template = BUILT_IN_TEMPLATES.e2e;
  // Unconditional assertion replaces the prior `if (!template) throw` guard
  // (Pattern 5 — unconditional `expect()` form per the variant-*.setup.ts
  // sibling rewrites in this plan).
  expect(template, 'BUILT_IN_TEMPLATES.e2e is undefined — Phase 58 regression?').toBeDefined();
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
  const seed = template!.seed ?? 42;
  const prefix = template!.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();

  // 0. Fresh-database precondition check.
  //
  //    The e2e suite expects a database containing ONLY 'test-'-prefixed rows
  //    (cleared + reseeded by step 1 below). Pre-existing non-test data —
  //    typically the operator's local dev seed (`yarn dev:reset-with-data`) —
  //    coexists with the seeded test data and produces confusing test
  //    results: extra entities show up in result lists, filter counts do not
  //    match expected fixture values, parity-baseline diffs flag spurious
  //    failures.
  //
  //    Probe is hoisted to `probeFreshDatabasePrecondition` (module-level) so
  //    the setup body stays conditional-free (RESEARCH Pattern 4 canonical 3).
  //
  //    TODO: when we move to project scoping, the e2e can seed its own
  //    project (`projectId: TEST_PROJECT_ID`) and this check becomes obsolete
  //    — the operator's dev data will live under a different project_id and
  //    not interfere with the e2e dataset. See REQUIREMENTS.md
  //    `frontend-project-id-scoping` (v2.9 candidate).
  await probeFreshDatabasePrecondition(client, PREFIX);

  // 1. Pre-clear any stale state from a prior run. runTeardown enforces its
  //    own 2-char guard; PREFIX ('test-', 5 chars) is safe and matches what
  //    the e2e template emits verbatim (D-58-15 + 59 prefix reconciliation).
  await runTeardown(PREFIX, client);

  // 2. Seed via the package's pipeline + writer (D-59-05). Writer Pass-5
  //    applies the e2e template's `app_settings.fixed[]` block via
  //    `merge_jsonb_column` (Phase 63 E2E-02).
  const rows = runPipeline(template!, overrides);
  fanOutLocales(rows, template!, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // 3. (D-10) Post-seed assertion — verify baseline app_settings persisted.
  //    Subset match per RESOLVED Q2: `merge_jsonb_column` is additive
  //    (Pitfall 3); we verify our keys made it, not exclusive equality.
  {
    const expected = template!.app_settings?.fixed?.[0]?.settings;
    // Unconditional assertion replaces the prior `if (!expected) throw` guard
    // (Pattern 5 — same idiom as variant-*.setup.ts).
    expect(
      expected,
      'post-seed assertion: e2e template missing app_settings.fixed[0].settings — Phase 63 regression?'
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // 4. Auth wiring (D-24: tests/-only, subclass methods). Unregister the known
  //    unregistered emails + alpha, then forceRegister alpha with the shared pwd.
  for (const email of TEST_UNREGISTERED_EMAILS) {
    await client.unregisterCandidate(email);
  }
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.forceRegister('test-candidate-alpha', TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);

  // Phase 78 CLEAN-05 IN-05 fix: replace the prior tautological
  // `expect(true).toBe(true)` placeholder with a semantic post-condition that
  // verifies `forceRegister`'s observable effect — the candidate row's
  // `auth_user_id` is populated. The prior tautology made the test green even
  // if forceRegister silently no-op'd; this assertion fails if the link step
  // did not write the auth user id. (LANDMINE-8: 'test-candidate-alpha' is an
  // EXISTING fixture external id, not a new sentinel value containing 'Alpha'.)
  const candidate = await client.findData('candidates', { externalId: { $eq: 'test-candidate-alpha' } });
  expect(candidate.data?.[0]?.auth_user_id, 'forceRegister must link auth_user_id on candidate row').toBeTruthy();
});
