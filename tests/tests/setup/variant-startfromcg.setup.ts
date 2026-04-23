import { expect, test as setup } from '@playwright/test';
import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import variantStartFromCgTemplate from './templates/variant-startfromcg';

const PREFIX = 'test-';

/**
 * Variant data setup: startFromConstituencyGroup configuration.
 *
 * Loads the Phase-59 filesystem template that extends the e2e base with a
 * region/municipality hierarchy plus an orphan-municipality edge case (no
 * parent region). The `startFromConstituencyGroup` setting itself is NOT set
 * here because it requires the database ID of the constituency group (not
 * externalId). The spec file queries for the group first, then sets the
 * setting at runtime.
 *
 * app_settings note: see data.setup.ts — legacy updateAppSettings call
 * preserved until the e2e template grows an app_settings.fixed[] block.
 */
setup('import startfromcg dataset', async () => {
  const template = variantStartFromCgTemplate;
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
  // The startFromConstituencyGroup setting will be applied in the spec file
  // after querying for the constituency group's database ID.
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
