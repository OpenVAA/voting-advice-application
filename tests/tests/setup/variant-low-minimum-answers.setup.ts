import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import variantLowMinimumAnswersTemplate from './templates/variant-low-minimum-answers';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

/**
 * Variant data setup: low-minimum-answers configuration (Phase 74 E2E-02).
 *
 * Loads the variant template that extends the e2e base with a settings-only
 * overlay: `matching.minimumAnswers: 1` (default is 5). All other tables pass
 * through the base e2e dataset unchanged.
 *
 * app_settings is declared by this variant's filesystem template
 * (`templates/variant-low-minimum-answers.ts` `app_settings.fixed[]`). A
 * post-seed subset-match assertion (D-10) verifies the persisted row matches
 * the variant template's declared shape.
 */
setup('import low-minimum-answers dataset', async () => {
  const template = variantLowMinimumAnswersTemplate;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {}; // variant reuses e2e's overrides map
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();
  await runTeardown(PREFIX, client);

  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // (D-10) Post-seed assertion — verify variant app_settings persisted.
  // Subset match per RESOLVED Q2: `merge_jsonb_column` is additive
  // (Pitfall 3); we verify our keys made it, not exclusive equality.
  {
    const expected = template.app_settings?.fixed?.[0]?.settings;
    expect(
      expected,
      'post-seed assertion: variantLowMinimumAnswersTemplate missing app_settings.fixed[0].settings — Phase 74 regression?'
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
