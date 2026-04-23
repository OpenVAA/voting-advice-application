import { expect, test as setup } from '@playwright/test';
import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import variantMultiElectionTemplate from './templates/variant-multi-election';

const PREFIX = 'test-';

/**
 * Variant data setup: multi-election configuration.
 *
 * Loads the Phase-59 filesystem template that extends the e2e base with 2
 * elections and cross-nominations — existing base candidates alpha/beta/gamma
 * are re-nominated onto Election-2, plus 3 net-new e2-cand-{1,2,3} candidates
 * are added on test-constituency-e2.
 *
 * app_settings note: see data.setup.ts — legacy updateAppSettings call
 * preserved until the e2e template grows an app_settings.fixed[] block.
 */
setup('import multi-election dataset', async () => {
  const template = variantMultiElectionTemplate;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {}; // variant reuses e2e's overrides map
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();
  await runTeardown(PREFIX, client);

  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // App settings (legacy preservation). multi-election-specific extras:
  // results.showFeedbackPopup + showSurveyPopup forced to 0 so multi-election
  // specs don't trip on popup dialogs. Does NOT set disallowSelection -- that
  // is tested as a toggle in the spec.
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
    analytics: { trackEvents: false },
    results: {
      showFeedbackPopup: 0,
      showSurveyPopup: 0
    }
  });

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
