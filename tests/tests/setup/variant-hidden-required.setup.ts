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
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

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

  // Auth wiring (D-24: tests/-only) — mirrors the canonical step in
  // data.setup.ts:139-146. runTeardown + Writer above re-write the candidates
  // table with fresh rows under new UUIDs, but the auth.users table is NOT
  // touched (no `test-` external_id link). After reseeding, Alpha's existing
  // auth.user.id no longer references any candidate row → STORAGE_STATE-based
  // login falls back to /login?redirectTo=candidate.
  //
  // Unregister-then-forceRegister is idempotent: unregisterCandidate is a no-op
  // when the email doesn't exist (line 386 of supabaseAdminClient.ts);
  // forceRegister creates a fresh auth.user, assigns the candidate role, and
  // links auth_user_id on the new candidate row. After this step Alpha's
  // pre-existing STORAGE_STATE token is INVALIDATED (the auth.user.id changes)
  // — but the candidate spec uses a fresh login flow (via STORAGE_STATE
  // re-establishment? — see notes below).
  //
  // NB: variant projects in playwright.config.ts re-use STORAGE_STATE from
  // auth-setup. If the variant's reseed creates a new auth.user with a new id,
  // the cached STORAGE_STATE will be stale (a token whose sub claim no longer
  // matches a candidate row). The candidate spec's `page.goto(CandAppHome)`
  // will fall through to /login and re-login via the auth-setup's
  // forceRegistered credentials (email+password unchanged). The spec is
  // structured to accept either landing-on-home OR a redirect-then-login flow,
  // BUT the canonical pattern is that auth-setup runs FIRST in the dependency
  // chain to refresh STORAGE_STATE after the variant reset. Here we rely on
  // the STORAGE_STATE token in playwright/.auth/user.json which is bound to
  // the most-recently-issued auth.user via data.setup.ts → auth.setup.ts
  // chain, NOT the variant-hidden-required reseed.
  //
  // Workaround for the standalone smoke (--no-deps): the variant setup
  // resets the candidates table and reissues a fresh auth.user, but the
  // existing playwright/.auth/user.json file is bound to the PREVIOUS
  // auth.user.id. Re-running auth.setup.ts after the variant reseed would
  // refresh user.json with the new token. In CI / full-dependency-chain
  // runs, the variant chain places this setup BEFORE the spec, but
  // STORAGE_STATE refresh is not invoked. The candidate spec MUST therefore
  // either (a) re-login via the login form (using TEST_CANDIDATE_EMAIL/
  // PASSWORD which persist across variant reseeds because the password is a
  // tests/-only constant in testCredentials.ts) OR (b) the project chain
  // adds a re-auth-setup-style refresh BEFORE the variant-hidden-required-
  // candidate project. Plan 04 takes path (a) — see the spec for details.
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.forceRegister('test-candidate-alpha', TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);
});
