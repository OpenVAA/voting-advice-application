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
 * app_settings NOTE: the Phase 58 e2e template does NOT ship an
 * `app_settings.fixed[]` block, so the writer's Pass-5 merge_jsonb_column step
 * is a no-op. The legacy `updateAppSettings(...)` call from the pre-Phase-59
 * data.setup.ts is preserved here unchanged — without it, the Playwright specs
 * regress (category intros, popups, and hideIfMissingAnswers would be at their
 * default values). Follow-up work tracked in 59-04-SUMMARY.md: extend the e2e
 * template with this settings block so the setup file can drop this call.
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

  // 2. Seed via the package's pipeline + writer (D-59-05).
  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // 3. App settings (legacy preservation; see note above). Once the e2e
  //    template grows an `app_settings.fixed[]` block, delete this call.
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    results: {
      cardContents: {
        candidate: ['submatches'],
        organization: ['candidates']
      },
      sections: ['candidate', 'organization']
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });

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
