/**
 * @openvaa/dev-seed — Template-driven dev data generator for OpenVAA.
 *
 * Public API (stable; see phase 56):
 *
 * Runtime values:
 *   - `runPipeline(template, overrides?, ctx?)` — orchestrate all 14 generators
 *     in topo order; bridges (fragment, ctx) => Rows overrides with the
 *     class-based built-ins; performs post-topo sentinel enrichment.
 *   - `TOPO_ORDER` — generator execution order (see phase 56 refinement:
 *     questions before candidates for the answer-emitter seam).
 *   - `Writer` — env-enforced writer (NF-02) with routing.
 *   - `SupabaseAdminClient` — bulk-write base class (split). Consumed by
 *     the tests/ subclass in Plan 10.
 *   - `TEST_PROJECT_ID` — bootstrap project UUID from seed.sql.
 *   - `buildCtx(template)` — fresh ctx factory with seeded faker.
 *   - `validateTemplate(input)` — zod v4 validator with field-path
 *     errors.
 *   - `TemplateSchema` — zod schema (re-exported for `.extend()` use (see phase 57, 58)
 *     composition).
 *   - `defaultRandomValidEmit` — see phase 56 answer-emitter stub. see phase 57
 *     supplies a latent-factor emitter via `ctx.answerEmitter` (seam).
 *   - `latentAnswerEmitter` — see phase 57 latent-factor answer emitter factory
 *     . Installed by the pipeline via `ctx.answerEmitter??=
 *     latentAnswerEmitter(template)` — customizable per-sub-step via
 *     `ctx.latent` (swappable seam).
 *
 * Built-in templates:
 *   - `BUILT_IN_TEMPLATES` — name => Template for every built-in the CLI
 *     resolves. `default`, `e2e/base`, and the `perm-*` /
 *     `show-feedback-survey` permutation fixtures.
 *   - `BUILT_IN_OVERRIDES` — name => Overrides, paired 1:1 with the above.
 *     Consulted only after a built-in name matches.
 *   - `defaultTemplate` / `defaultOverrides` — the `default` built-in and its
 *     non-uniform candidate / question-type shaping.
 *   - `baseTemplate` — the `e2e/base` canonical Playwright dataset.
 *   - `BASE_APP_SETTINGS` — the `app_settings` object `e2e/base` seeds, exported
 *     so specs assert against one copy rather than a hand-maintained second.
 *
 * CLI surface (exported so `tests/` drives the same code the CLIs do):
 *   - `resolveTemplate(arg, builtIns)` — built-in-name-first, filesystem-path
 *     fallback resolution, validating whatever it returns.
 *   - `runTeardown(prefix, client)` — pure teardown orchestration, no
 *     `process.exit` / env reads / stdout writes.
 *   - `assertTeardownPrefix(prefix, callerLabel)` — the 2-character mass-delete
 *     guard. Exported so out-of-package callers re-check the SAME invariant
 *     instead of keeping a copy that can drift.
 *   - `ALLOWED_TEARDOWN_TABLES` — the 10 tables `bulk_delete` clears.
 *   - `formatSummary(input)` — the post-seed stdout summary.
 *   - `SEED_CLI_USAGE` / `TEARDOWN_USAGE` — the two `--help` texts.
 *
 * Locales:
 *   - `LOCALES` — the supported locale codes the fan-out expands to.
 *   - `fanOutLocales(rows, template, seed)` — 4-locale JSONB expansion; a no-op
 *     when `generateTranslationsForAllLocales` is off.
 *
 * app_settings external-id resolution:
 *   - `settingsContainsExternalIdRefs(settings)` — does this settings tree carry
 *     any `{ externalId }` shape?
 *   - `resolveAppSettingsExternalIds(...)` — resolve those refs to UUIDs at seed
 *     time (see phase 88 T3, Option B).
 *
 * Types:
 *   - `Template` — validated template type (`z.infer<typeof TemplateSchema>`).
 *   - `Ctx` — pipeline ctx (seam).
 *   - `AnswerEmitter` — seam function pointer type.
 *   - `Fragment<TRow>` — per-entity template-fragment shape.
 *   - `Overrides` — override map shape.
 *   - `FindDataResult` — admin-client query result (consumed by tests/ subclass
 *     in Plan 10).
 *   - `TableName` — union of the 14 table names in TOPO_ORDER.
 *   - `LatentHooks` — swappable seam on `ctx.latent` (GEN-06g).
 *   - `LocaleCode` — union of the `LOCALES` entries.
 *   - `SummaryInput` — argument shape of `formatSummary`.
 *   - `TeardownResult` — `{ rowsDeleted, storageRemoved }` from `runTeardown`.
 *
 * Notes:
 *   - Private workspace; no npm publish.
 *   - tsx-only runner; no tsup build step. Consumers import via
 *     `"@openvaa/dev-seed": "workspace:^"`; tsx + Turborepo resolve transparently.
 *   - Individual generator classes are NOT re-exported — overrides use the
 *     `{ [table]: (fragment, ctx) => Rows }` map shape, not class
 *     imports.
 */

// Runtime exports
export { USAGE as SEED_CLI_USAGE } from './cli/help';
export { resolveTemplate } from './cli/resolve-template';
export { formatSummary } from './cli/summary';
// `ALLOWED_TEARDOWN_TABLES` is exported so the tests/ row-count probe iterates the
// same ten tables `bulk_delete` clears, rather than keeping a second copy.
export { ALLOWED_TEARDOWN_TABLES, assertTeardownPrefix, runTeardown } from './cli/teardown';
export { TEARDOWN_USAGE } from './cli/teardown-help';
export { buildCtx } from './ctx';
export { defaultRandomValidEmit } from './emitters/answers';
export { latentAnswerEmitter } from './emitters/latent/latentEmitter';
export { fanOutLocales, LOCALES } from './locales';
export { runPipeline, TOPO_ORDER } from './pipeline';
export { resolveAppSettingsExternalIds, settingsContainsExternalIdRefs } from './resolveAppSettingsExternalIds';
export { SupabaseAdminClient, TEST_PROJECT_ID } from './supabaseAdminClient';
export { TemplateSchema, validateTemplate } from './template/schema';
export {
  BASE_APP_SETTINGS,
  baseTemplate,
  BUILT_IN_OVERRIDES,
  BUILT_IN_TEMPLATES,
  defaultOverrides,
  defaultTemplate
} from './templates';
export { Writer } from './writer';

// Type exports
export type { SummaryInput } from './cli/summary';
export type { TeardownResult } from './cli/teardown';
export type { Ctx } from './ctx';
export type { AnswerEmitter } from './emitters/answers';
export type { LatentHooks } from './emitters/latent/latentTypes';
export type { LocaleCode } from './locales';
export type { TableName } from './pipeline';
export type { FindDataResult } from './supabaseAdminClient';
export type { Template } from './template/types';
export type { Fragment, Overrides } from './types';
