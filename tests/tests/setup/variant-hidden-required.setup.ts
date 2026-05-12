import {
  BUILT_IN_OVERRIDES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect, test as setup } from '@playwright/test';
import variantHiddenRequiredTemplate from './templates/variant-hidden-required';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'test-';

/**
 * Variant data setup: hidden+required configuration (Phase 77 SETTINGS-03).
 *
 * Loads the variant template that extends the e2e base by:
 *   - flipping `customData.hidden: true` on `test-voter-q-8` (was undefined
 *     in base) — voter-context filters this out of `_opinionQuestions`,
 *   - flipping `customData.required: true` on `test-question-displayname`
 *     (was undefined in base; the existing `custom_data.maxlength: 50`
 *     anchor from Phase 76 P01 is preserved),
 *   - deleting Alpha's answer for `test-question-displayname` (was authored
 *     as `'Display Name Sentinel 76'` at `e2e.ts:763` — removal yields
 *     `savedData.answers[<id>]` undefined → unansweredRequiredInfoQuestions
 *     includes the question → `profileComplete = false`),
 *   - app_settings overlay: `entities.hideIfMissingAnswers.candidate: false`
 *     (so the SETTINGS-03 candidate-required warning isolates on the
 *     required-info-question clause) + `questions.questionsIntro.show:
 *     false` (skip intro page mirror of variant-allowopen).
 *
 * Per RESEARCH LANDMINE-3: the voter-side required-info-question surface is
 * PRODUCT-GAP. This variant covers BOTH (a) the voter-side hidden-question
 * filter AND (b) the candidate-side required-info enforcement. The voter-side
 * required cell is captured PASS-WITH-DEFERRAL at
 * `.planning/todos/pending/2026-05-12-settings-03-voter-required-product-gap.md`.
 *
 * app_settings is declared by this variant's filesystem template
 * (`templates/variant-hidden-required.ts` `app_settings.fixed[]`). A post-seed
 * subset-match assertion verifies the persisted row matches the variant
 * template's declared shape.
 */
setup('import hidden-required dataset', async () => {
  const template = variantHiddenRequiredTemplate;
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
      'post-seed assertion: variantHiddenRequiredTemplate missing app_settings.fixed[0].settings — Phase 77 P04 regression?'
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // Sanity check — variant must have seeded something.
  expect(template.candidates?.fixed?.length ?? 0, 'variant template has no candidates').toBeGreaterThan(0);

  // Sanity check — confirm Alpha's test-question-displayname answer has been
  // deleted by the variant overlay (the candidate-required cell asserts the
  // unanswered case; this guards against silent regressions).
  {
    const alpha = (template.candidates?.fixed ?? []).find(
      (c) => (c as { external_id?: string }).external_id === 'test-candidate-alpha'
    ) as { answersByExternalId?: Record<string, unknown> } | undefined;
    expect(alpha, 'variant template missing Alpha candidate row').toBeTruthy();
    expect(
      alpha?.answersByExternalId?.['test-question-displayname'],
      'variant overlay must delete Alpha test-question-displayname answer (SETTINGS-03 candidate-required anchor)'
    ).toBeUndefined();
  }
});
