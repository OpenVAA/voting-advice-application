import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import variantNeNcTemplate from './templates/variant-Ne-Nc';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

/**
 * Variant data setup: Ne-Nc configuration (Phase 74 E2E-04 cell 4).
 *
 * Loads the variant template that extends the e2e base with 2 elections,
 * each with its own 3-constituency constituency group (test-cg-Ne-Nc-e1 +
 * test-cg-Ne-Nc-e2), and 18 new nominations (3 base candidates × 6 slots).
 * The cross-bleed-free shape (per-row `constituency_groups` scoping) is the
 * seed for the spec's cross-bleed assertion.
 *
 * app_settings is declared by this variant's filesystem template
 * (`templates/variant-Ne-Nc.ts` `app_settings.fixed[]`) — including the
 * popup-suppression overlay (`results.showFeedbackPopup: 0`,
 * `results.showSurveyPopup: 0`) since the matrix flow may land on /results
 * during navigation. A post-seed subset-match assertion verifies the
 * persisted row matches the variant template's declared shape.
 */
setup('import Ne-Nc dataset', async () => {
  const template = variantNeNcTemplate;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {}; // variant reuses e2e's overrides map
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();
  await runTeardown(PREFIX, client);

  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // Post-seed assertion — verify variant app_settings persisted.
  // Subset match per Pitfall 3 (merge_jsonb_column is additive).
  {
    const expected = template.app_settings?.fixed?.[0]?.settings;
    expect(
      expected,
      'post-seed assertion: variantNeNcTemplate missing app_settings.fixed[0].settings — Phase 74 regression?'
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
