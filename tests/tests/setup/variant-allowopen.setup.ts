import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import variantAllowopenTemplate from './templates/variant-allowopen';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

/**
 * Variant data setup: allowopen configuration (Phase 77 SETTINGS-02).
 *
 * Loads the variant template that extends the e2e base by flipping
 * `customData.allowOpen` on `test-question-3` from `true` (base) to `false`
 * (variant). All other tables pass through the base e2e dataset unchanged.
 *
 * Per LANDMINE-1 reframing: the voter app has no authoring surface for
 * `answer.info`; this variant + the matching spec asserts the entity-detail
 * drawer's display chain (`<QuestionOpenAnswer>` rendering inside the
 * opinions tab). See `variant-allowopen.ts` doc-comment for the differential
 * assertion shape.
 *
 * app_settings is declared by this variant's filesystem template
 * (`templates/variant-allowopen.ts` `app_settings.fixed[]`). A post-seed
 * subset-match assertion (D-10 / LANDMINE-5) verifies the persisted row
 * matches the variant template's declared shape.
 */
setup('import allowopen dataset', async () => {
  const template = variantAllowopenTemplate;
  const overrides = BUILT_IN_OVERRIDES.e2e ?? {}; // variant reuses e2e's overrides map
  const seed = template.seed ?? 42;
  const prefix = template.externalIdPrefix ?? '';

  const client = new SupabaseAdminClient();
  await runTeardown(PREFIX, client);

  const rows = runPipeline(template, overrides);
  fanOutLocales(rows, template, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // Post-seed assertion — verify variant app_settings persisted (subset match
  // per `merge_jsonb_column` additive semantics; we verify our keys made it,
  // not exclusive equality).
  {
    const expected = template.app_settings?.fixed?.[0]?.settings;
    expect(
      expected,
      'post-seed assertion: variantAllowopenTemplate missing app_settings.fixed[0].settings — Phase 77 P03 regression?'
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);
});
