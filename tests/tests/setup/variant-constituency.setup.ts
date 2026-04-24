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
 * app_settings is now declared by this variant's filesystem template
 * (`templates/variant-constituency.ts` `app_settings.fixed[]`). Phase 63
 * (E2E-02) deleted the legacy `updateAppSettings(...)` call from this file;
 * a post-seed subset-match assertion (D-10) verifies the persisted row
 * matches the variant template's declared shape.
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

  // (D-10) Post-seed assertion — verify variant app_settings persisted.
  // Subset match per RESOLVED Q2: `merge_jsonb_column` is additive
  // (Pitfall 3); we verify our keys made it, not exclusive equality.
  {
    const expected = template.app_settings?.fixed?.[0]?.settings;
    if (!expected) {
      throw new Error(
        'post-seed assertion: variantConstituencyTemplate missing app_settings.fixed[0].settings — Phase 63 regression?'
      );
    }
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
