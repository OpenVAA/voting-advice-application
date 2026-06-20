/**
 * Generic template-driven setup helper: teardown, seed, post-seed check, and
 * a returned cleanup function to run from `afterAll` if needed.
 *
 * Resolution: looks `templateName` up in `BUILT_IN_TEMPLATES`. Filesystem
 * template paths are not supported — the BUILT_IN-only surface is sufficient.
 *
 * The returned `cleanup` function re-invokes `runTeardown(prefix, client)` —
 * idempotent and safe to call from `afterAll`. The dedicated
 * `data-teardown-base` playwright project (base.teardown.ts) also invokes
 * runTeardown, so calling cleanup() is optional for the base-journey chain.
 */

import {
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  fanOutLocales,
  resolveAppSettingsExternalIds,
  runPipeline,
  runTeardown,
  settingsContainsExternalIdRefs,
  Writer
} from '@openvaa/dev-seed';
import { expect } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import type { Template } from '@openvaa/dev-seed';

/**
 * Optional hook for template-specific post-seed assertions. Receives the resolved client +
 * template so callers can probe Supabase directly.
 */
export type PostSeedAssertions = (client: SupabaseAdminClient, template: Template) => Promise<void>;

export interface SetupFromTemplateOptions {
  postSeedAssertions?: PostSeedAssertions;
  /**
   * Extra prefix(es) to teardown before seeding this template. Useful for
   * chain-family isolation: when chain B's setup runs immediately after chain
   * A's spec (with chain A's teardown still running in parallel via Playwright's
   * `teardown:` key), residual chain-A rows can be visible to chain B's spec
   * because each per-template runTeardown only clears its own prefix.
   *
   * Accepts a single prefix or an array of prefixes — each is fed through
   * runTeardown sequentially. Use the array form when this template needs to
   * clean up after multiple non-related chains (e.g. perm-* setups clearing
   * both `test-` (base/journey leftover) AND `e2e-perm-` (previous
   * perm chain leftover) before seeding).
   *
   * All prefixes are honored BEFORE the template's own prefix teardown.
   */
  extraTeardownPrefix?: string | Array<string>;
  /**
   * Optional `app_settings` overlay deep-merged onto the persisted settings
   * AFTER the template's `app_settings.fixed[]` block has seeded + the post-seed
   * subset-match assertion has run.
   *
   * This is a SCENARIO mutation, not a baseline-settings change: it mutates the
   * runtime DB `app_settings` row for the duration of a single opt-in run
   * (the caller's paired teardown is responsible for restoring it), and it does
   * NOT touch the shared template nor `MINIMAL_BASE_APP_SETTINGS`. The bank-auth
   * journey uses it to flip `preRegistration.enabled = true` while reusing the
   * SHARED `perm-not-located-2e2cg` template (whose other consumer must keep
   * preregistration disabled).
   *
   * Applied via the additive `merge_jsonb_column` RPC (`updateAppSettings`), so
   * the post-seed `toMatchObject` assertion on the template's settings still
   * holds (the overlay only ADDS the scoped key).
   */
  appSettingsOverride?: Record<string, unknown>;
}

// reason: dev-seed `default` template emits `seed_`-prefixed baseline rows into
// TEST_PROJECT_ID (packages/dev-seed/src/ctx.ts:89 — `externalIdPrefix ?? 'seed_'`).
// The freshness probe must NOT treat those auto-seeded baseline rows as
// "non-test contamination". Excluded alongside the per-template teardown prefix;
// genuinely-contaminated (non-seed_, non-test) rows still warn.
const BASELINE_SEED_PREFIX = 'seed_';

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
async function probeFreshDatabasePrecondition(client: SupabaseAdminClient, prefix: string): Promise<void> {
  const requireFresh = process.env.E2E_REQUIRE_FRESH_DB === 'true';
  // Chained .not().not() → NOT LIKE ${prefix}% AND NOT LIKE seed_% (PostgREST).
  // NULL external_id rows stay excluded by NOT LIKE semantics (seed.sql candidate).
  const candQuery = client.query('candidates');
  const { data: nonTestCands, error: candErr } = await candQuery
    .not('external_id', 'like', `${prefix}%`)
    .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
    .limit(5);
  const orgQuery = client.query('organizations');
  const { data: nonTestOrgs, error: orgErr } = await orgQuery
    .not('external_id', 'like', `${prefix}%`)
    .not('external_id', 'like', `${BASELINE_SEED_PREFIX}%`)
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
 * @param options.postSeedAssertions - Optional template-specific assertions.
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
  // emit pre-prefixed external_ids (e2e/base) declare `externalIdPrefix: ''`
  // so the writer's `${externalIdPrefix}${fx.external_id}` pass-through is a
  // no-op. Generated rows prepend the prefix.
  const prefix = template!.externalIdPrefix ?? '';
  // Teardown prefix — runTeardown enforces a 2-char minimum to prevent
  // mass-delete. The only template with an empty externalIdPrefix is the base
  // dataset (e2e/base), which pre-writes literal `test-e2e-base-` external_ids;
  // map that one explicitly onto the `test-e2e-base-` teardown fallback. Any
  // other empty-prefix template would silently reuse the base teardown prefix
  // and wipe the base dataset, so fail loudly instead. perm-* templates carry
  // their own `e2e-perm-*` prefix (>=2 chars) and take the first branch.
  const teardownPrefix =
    prefix.length >= 2
      ? prefix
      : templateName === 'e2e/base'
        ? 'test-e2e-base-'
        : (() => {
            throw new Error(`Empty externalIdPrefix for '${templateName}' has no teardown-prefix fallback`);
          })();

  const client = new SupabaseAdminClient();

  // 0. Fresh-database precondition probe (warn by default; opt-in to fail
  //    via E2E_REQUIRE_FRESH_DB=true). See data.setup.ts:88-106.
  await probeFreshDatabasePrecondition(client, teardownPrefix);

  // 1a. (Optional) Pre-clear chain-family prefix(es) first — defends against
  //     the case where another chain's per-prefix teardown is still running in
  //     parallel with this setup (Playwright wires per-setup teardowns via the
  //     `teardown:` key, which runs after the setup's dependents finish but
  //     BEFORE the next chain's setup waits on it). Without this, two
  //     templates from different chains coexist briefly. ≥2-char guard
  //     delegated to runTeardown itself.
  if (options?.extraTeardownPrefix) {
    const prefixes = Array.isArray(options.extraTeardownPrefix)
      ? options.extraTeardownPrefix
      : [options.extraTeardownPrefix];
    for (const extra of prefixes) {
      await runTeardown(extra, client);
    }
  }

  // 1b. Pre-clear any stale state from a prior run. runTeardown's 2-char
  //     guard requires prefix.length >= 2; the base dataset uses
  //     'test-e2e-base-' (empty-prefix fallback above).
  await runTeardown(teardownPrefix, client);

  // 2. Pipeline + writer. Writer Pass-5 applies app_settings.fixed[] via
  //    merge_jsonb_column.
  const rows = runPipeline(template!, overrides);
  fanOutLocales(rows, template!, seed);
  const writer = new Writer();
  await writer.write(rows, prefix);

  // 3. Authoritative app_settings REPLACE + EXACT post-seed assertion.
  //
  //    ROOT-CAUSE FIX (perm-* singleton-merge contamination): the local test DB
  //    has a SINGLE `app_settings` row that EVERY perm setup mutates, and entity
  //    teardown deliberately EXCLUDES `app_settings` (resetting it is
  //    `db:reset`'s job). The Writer's Pass-5 applies `app_settings.fixed[]` via
  //    the ADDITIVE `merge_jsonb_column` RPC, so any key a PRIOR perm set but
  //    THIS perm's settings object omits LEAKS forward — the singleton becomes a
  //    deep-merge of every perm's settings, and each perm's voter/candidate walk
  //    runs against that contaminated blend (e.g. perm-localisation-positive
  //    stalling on the voter Intro because an upstream perm's
  //    `elections.startFromConstituencyGroup` / access flag bled in).
  //
  //    Every E2E/perm template emits a COMPLETE settings object in
  //    `app_settings.fixed[0].settings` (MINIMAL_BASE_APP_SETTINGS or a
  //    deep-merge of it), so we REPLACE the entire `settings` JSONB with THIS
  //    template's own resolved settings — a destructive full-set write that
  //    WIPES any accumulated foreign keys. The frontend fills any omitted keys
  //    from the TS/staticSettings defaults (the bootstrap row seeds `{}`), so a
  //    full overwrite is self-contained.
  //
  //    Templates may carry `{externalId}` shapes inside
  //    `results.cardContents.*[*].question` that the Writer's Pass-5 seed-time
  //    resolver flattens to plain UUID strings before persistence. We resolve
  //    `expected` the SAME way the Writer did so the REPLACE writes (and the
  //    EXACT assertion compares against) the post-Writer shape the DB sees.
  //
  //    The assertion is `toEqual` (EXACT), NOT `toMatchObject` (SUBSET): after a
  //    REPLACE the persisted row MUST equal the template's settings exactly. An
  //    exact match is the anti-flake guard — it makes any future contamination
  //    (a stray foreign key surviving the REPLACE) fail LOUDLY at setup time
  //    instead of silently corrupting a downstream walk.
  {
    const rawExpected = template!.app_settings?.fixed?.[0]?.settings;
    expect(
      rawExpected,
      `post-seed assertion: ${templateName} template missing app_settings.fixed[0].settings`
    ).toBeDefined();
    // If the template uses any {externalId} refs, build the same map the
    // Writer used and resolve. Otherwise short-circuit (the helper is a
    // no-op for plain payloads).
    let expected = rawExpected as Record<string, unknown>;
    if (settingsContainsExternalIdRefs(expected)) {
      const externalIdToUuid = await client.selectQuestionExternalIds();
      expected = resolveAppSettingsExternalIds(expected, externalIdToUuid);
    }
    // REPLACE (full overwrite) — defeats the singleton-merge contamination.
    // `expected` is deep-cloned through JSON so a readonly `as const` template
    // (e.g. MINIMAL_BASE_APP_SETTINGS) is sent as a plain mutable JSON payload.
    await client.replaceAppSettings(JSON.parse(JSON.stringify(expected)) as Record<string, unknown>);
    const persisted = await client.getAppSettings();
    expect(persisted, 'post-seed app_settings row should exist').toBeTruthy();
    // EXACT equality (round-trip through JSON to normalise readonly/undefined
    // drops the way the persisted JSONB does) — proves the singleton holds
    // EXACTLY this perm's settings with zero contamination carried forward.
    expect(persisted).toEqual(JSON.parse(JSON.stringify(expected)));
  }

  // 3b. (Optional) Scenario-scoped app_settings overlay. Applied AFTER the
  //     post-seed subset-match so the assertion compares the seeded template
  //     shape, not the overlaid shape. Additive merge_jsonb_column — the
  //     overlay only ADDS the scoped key (e.g. preRegistration.enabled) on top
  //     of the template's baseline. The caller's paired teardown restores it.
  if (options?.appSettingsOverride) {
    await client.updateAppSettings(options.appSettingsOverride);
  }

  // 4. Optional template-specific assertions hook.
  if (options?.postSeedAssertions) {
    await options.postSeedAssertions(client, template!);
  }

  // 5. Cleanup closure — idempotent re-invocation of runTeardown.
  const cleanup = async (): Promise<void> => {
    await runTeardown(teardownPrefix, client);
  };

  return { cleanup };
}
