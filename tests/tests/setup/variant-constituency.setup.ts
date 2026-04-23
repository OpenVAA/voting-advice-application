import { expect, test as setup } from '@playwright/test';
import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import variantConstituencyTemplate from './templates/variant-constituency';

const PREFIX = 'test-';

/**
 * Variant data setup: constituency configuration.
 *
 * Loads the Phase-59 filesystem template that extends the e2e base with a
 * region/municipality hierarchy + Election-2 scoping. Pre-clears prior state
 * via runTeardown to isolate from previous default + variant runs.
 *
 * app_settings note: see data.setup.ts — the Phase 58 e2e template has no
 * `app_settings.fixed[]` block, so the writer's Pass-5 merge step is a no-op
 * and the legacy `updateAppSettings(...)` call is preserved here to keep
 * Playwright popup-suppression + category-intro defaults in place.
 */
setup('import constituency dataset', async () => {
  const template = variantConstituencyTemplate;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {}; // variant reuses e2e's overrides map
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();
  await runTeardown(PREFIX, client);

  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // App settings (legacy preservation; see header comment).
  await client.updateAppSettings({
    questions: {
      categoryIntros: { show: false },
      questionsIntro: { allowCategorySelection: false, show: false },
      showResultsLink: true
    },
    entities: {
      hideIfMissingAnswers: { candidate: false },
      showAllNominations: true
    },
    notifications: { voterApp: { show: false } },
    analytics: { trackEvents: false }
  });

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
