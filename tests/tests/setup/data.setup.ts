import { expect, test as setup } from '@playwright/test';
import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_UNREGISTERED_EMAILS } from '../utils/e2eFixtureRefs';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

const PREFIX = 'test-';

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
  if (!template) throw new Error('BUILT_IN_TEMPLATES.e2e is undefined — Phase 58 regression?');
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {};
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();

  // 1. Pre-clear any stale state from a prior run. runTeardown enforces its
  //    own 2-char guard; PREFIX ('test-', 5 chars) is safe and matches what
  //    the e2e template emits verbatim (D-58-15 + 59 prefix reconciliation).
  await runTeardown(PREFIX, client);

  // 2. Seed via the package's pipeline + writer (D-59-05). Writer Pass-5
  //    applies the e2e template's `app_settings.fixed[]` block via
  //    `merge_jsonb_column` (Phase 63 E2E-02).
  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // 3. (D-10) Post-seed assertion — verify baseline app_settings persisted.
  //    Subset match per RESOLVED Q2: `merge_jsonb_column` is additive
  //    (Pitfall 3); we verify our keys made it, not exclusive equality.
  {
    const expected = template.app_settings?.fixed?.[0]?.settings;
    if (!expected) {
      throw new Error(
        'post-seed assertion: e2e template missing app_settings.fixed[0].settings — Phase 63 regression?'
      );
    }
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
  // forceRegister throws on any failure path (see supabaseAdminClient.ts:284-321);
  // reaching here means auth wiring succeeded.
  expect(true, 'forceRegister reached post-condition').toBe(true);
});
