/**
 * Generic template-driven setup helper — Phase 88 Plan 01 Task 2.
 *
 * Design source: TEST-INVENTORY-REFACTOR-1.md lines 4-8
 *   - teardown
 *   - seed
 *   - seed check
 *   - returns a cleanup function to be run afterAll if necessary
 *
 * Canonical-shape precedent: tests/tests/setup/data.setup.ts:76-154.
 * The body below mirrors data.setup.ts's setup() callback verbatim minus
 * the auth-wiring step (auth is the consumer's responsibility — the
 * mega-journey is voter-only; future plans compose this helper with
 * explicit auth setup if needed).
 *
 * Resolution: looks `templateName` up in `BUILT_IN_TEMPLATES`. Filesystem
 * template paths are NOT supported in Plan 88-01 (the BUILT_IN-only
 * surface is sufficient — variant migrations are deferred to 88-NN).
 *
 * The returned `cleanup` function re-invokes `runTeardown(prefix, client)`
 * — idempotent and safe to call from `afterAll`. The dedicated
 * `data-teardown-baseV1` playwright project at
 * tests/tests/setup/baseV1.teardown.ts also invokes runTeardown, so
 * calling cleanup() is optional for the mega-journey chain.
 *
 * Notes on the operator USER NOTE on Task 2: `likertOnly` is NOT
 * supported. All tests must respect the question set declared by the
 * template — the new baseV1 dataset is authored to not need the
 * likert-only filter, and adding it here would block the deprecation
 * direction documented at TEST-INVENTORY-REFACTOR-1.md:3.
 */

import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  runPipeline,
  runTeardown,
  Writer
} from '@openvaa/dev-seed';
import { expect } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import type { Template } from '@openvaa/dev-seed';

/**
 * Optional hook for variant-specific post-seed assertions (e.g. the
 * multi-election variant's `template.candidates?.fixed?.length > 0` check
 * at variant-multi-election.setup.ts). Receives the resolved client +
 * template so callers can probe Supabase directly.
 */
export type PostSeedAssertions = (client: SupabaseAdminClient, template: Template) => Promise<void>;

export interface SetupFromTemplateOptions {
  postSeedAssertions?: PostSeedAssertions;
}

export interface SetupFromTemplateResult {
  /**
   * Idempotent cleanup function — re-invokes `runTeardown(prefix, client)`
   * to clear all rows with the template's externalIdPrefix. Safe to call
   * multiple times; safe to NOT call (dedicated teardown projects also
   * invoke runTeardown).
   */
  cleanup: () => Promise<void>;
}

/**
 * Probe candidates + organizations for any row whose `external_id` is NOT
 * prefixed with `PREFIX`. Hoisted out of data.setup.ts verbatim (the
 * helper is module-local there too).
 *
 * Set `E2E_REQUIRE_FRESH_DB=true` to escalate to a hard failure; the
 * default is a console.warn.
 */
async function probeFreshDatabasePrecondition(
  client: SupabaseAdminClient,
  prefix: string
): Promise<void> {
  const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';
  const candQuery = client.query('candidates');
  const { data: nonTestCands, error: candErr } = await candQuery
    .not('external_id', 'like', `${prefix}%`)
    .limit(5);
  const orgQuery = client.query('organizations');
  const { data: nonTestOrgs, error: orgErr } = await orgQuery
    .not('external_id', 'like', `${prefix}%`)
    .limit(5);

  if (candErr || orgErr) {
    console.warn(
      `[setupFromTemplate] Fresh-database probe failed (candidates: ${candErr?.message ?? 'ok'}; organizations: ${orgErr?.message ?? 'ok'}) — proceeding without precondition guarantee.`
    );
    return;
  }

  const totalNonTest = (nonTestCands?.length ?? 0) + (nonTestOrgs?.length ?? 0);
  if (totalNonTest === 0) return;

  const message = `[setupFromTemplate] Database is NOT fresh — found ${nonTestCands?.length ?? 0} non-test candidate(s) and ${nonTestOrgs?.length ?? 0} non-test organization(s) (probe limited to 5 each). Pre-existing non-test data will coexist with the seeded dataset and may produce confusing test failures.`;

  if (requireFresh) {
    throw new Error(message);
  }
  console.warn(message);
}

/**
 * Generic template-driven setup helper. Resolves the named BUILT_IN
 * template, runs teardown → pipeline → fanOutLocales → Writer.write,
 * post-seed asserts `app_settings`, and returns a cleanup function.
 *
 * @param templateName - Key into `BUILT_IN_TEMPLATES`. Throws if not found.
 * @param options.postSeedAssertions - Optional variant-specific assertions.
 * @returns `{ cleanup }` — call from `afterAll` if needed.
 */
export async function setupFromTemplate(
  templateName: string,
  options?: SetupFromTemplateOptions
): Promise<SetupFromTemplateResult> {
  const template = BUILT_IN_TEMPLATES[templateName];
  expect(
    template,
    `BUILT_IN_TEMPLATES.${templateName} is undefined — check templates/index.ts registration.`
  ).toBeDefined();
  const overrides = BUILT_IN_OVERRIDES[templateName] ?? {};
  const seed = template!.seed ?? 42;
  // Writer prefix — passed to writer.write(rows, prefix). Templates that
  // emit pre-prefixed external_ids (e2e + baseV1) declare `externalIdPrefix: ''`
  // so the writer's `${externalIdPrefix}${fx.external_id}` pass-through is a
  // no-op. Generated rows (Phase 56 generators) prepend the prefix.
  const prefix = template!.externalIdPrefix ?? '';
  // Teardown prefix — runTeardown enforces a 2-char minimum to prevent
  // mass-delete. Templates whose externalIdPrefix is empty pre-write
  // literal `test-` external_ids; fall back to 'test-' for teardown in
  // that case. data.setup.ts does this via a hard-coded `PREFIX = 'test-'`;
  // the helper derives the same fallback here.
  const teardownPrefix = prefix.length >= 2 ? prefix : 'test-';

  const client = new SupabaseAdminClient();

  // 0. Fresh-database precondition probe (warn by default; opt-in to fail
  //    via E2E_REQUIRE_FRESH_DB=true). See data.setup.ts:88-106.
  await probeFreshDatabasePrecondition(client, teardownPrefix);

  // 1. Pre-clear any stale state from a prior run. runTeardown's 2-char
  //    guard requires prefix.length >= 2; baseV1 / e2e both use 'test-'.
  await runTeardown(teardownPrefix, client);

  // 2. Pipeline + writer. Writer Pass-5 applies app_settings.fixed[] via
  //    merge_jsonb_column (D-11 / Phase 63 E2E-02).
  const rows = runPipeline(template!, overrides);
  fanOutLocales(rows, template!, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // 3. Post-seed app_settings subset-match. Mirrors data.setup.ts:121-135.
  {
    const expected = template!.app_settings?.fixed?.[0]?.settings;
    expect(
      expected,
      `post-seed assertion: ${templateName} template missing app_settings.fixed[0].settings`
    ).toBeDefined();
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    expect(persisted).toMatchObject(expected as Record<string, unknown>);
  }

  // 4. Optional variant-specific assertions hook.
  if (options?.postSeedAssertions) {
    await options.postSeedAssertions(client, template!);
  }

  // 5. Cleanup closure — idempotent re-invocation of runTeardown.
  const cleanup = async (): Promise<void> => {
    await runTeardown(teardownPrefix, client);
  };

  return { cleanup };
}
