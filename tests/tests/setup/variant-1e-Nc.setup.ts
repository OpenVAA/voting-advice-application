import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import variantOneENcTemplate from './templates/variant-1e-Nc';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

/**
 * Variant data setup: 1e-Nc configuration (Phase 74 E2E-04 cell 2).
 *
 * Loads the variant template that extends the e2e base with a 3-constituency
 * constituency group (test-cg-1e-Nc) under test-election-1, plus 3 new
 * nominations re-nominating base alpha/beta/gamma onto the 3 new
 * constituencies. The election count stays at 1 (auto-implied at the voter
 * app), but constituency selection is shown because N=3.
 *
 * app_settings is declared by this variant's filesystem template
 * (`templates/variant-1e-Nc.ts` `app_settings.fixed[]`). A post-seed
 * subset-match assertion verifies the persisted row matches the variant
 * template's declared shape (Pitfall 3: merge_jsonb_column is additive).
 */
setup('import 1e-Nc dataset', async () => {
  const template = variantOneENcTemplate;
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
      'post-seed assertion: variantOneENcTemplate missing app_settings.fixed[0].settings — Phase 74 regression?'
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
