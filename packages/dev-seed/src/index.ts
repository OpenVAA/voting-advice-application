/**
 * @openvaa/dev-seed — Template-driven dev data generator for OpenVAA.
 *
 * Public API (stable within Phase 56):
 *
 * Runtime values:
 *   - `runPipeline(template, overrides?, ctx?)` — orchestrate all 14 generators
 *     in topo order; bridges D-25 (fragment, ctx) => Rows[] overrides with the
 *     D-26 class-based built-ins; performs post-topo sentinel enrichment.
 *   - `TOPO_ORDER` — generator execution order (D-06 + Phase 56 refinement:
 *     questions before candidates for the D-27 answer-emitter seam).
 *   - `Writer` — env-enforced writer (D-15 / NF-02) with D-11 routing.
 *   - `SupabaseAdminClient` — bulk-write base class (D-24 split). Consumed by
 *     the tests/ subclass in Plan 10.
 *   - `TEST_PROJECT_ID` — bootstrap project UUID from seed.sql.
 *   - `buildCtx(template)` — fresh ctx factory with seeded faker.
 *   - `validateTemplate(input)` — zod v4 validator with TMPL-09 field-path
 *     errors.
 *   - `TemplateSchema` — zod schema (re-exported for Phase 57/58 `.extend()`
 *     composition).
 *   - `defaultRandomValidEmit` — Phase 56 answer-emitter stub (D-19). Phase 57
 *     supplies a latent-factor emitter via `ctx.answerEmitter` (D-27 seam).
 *   - `latentAnswerEmitter` — Phase 57 latent-factor answer emitter factory
 *     (GEN-06). Installed by the pipeline via `ctx.answerEmitter ??=
 *     latentAnswerEmitter(template)` — customizable per-sub-step via
 *     `ctx.latent` (D-57-12 swappable seam).
 *
 * Types:
 *   - `Template` — validated template type (`z.infer<typeof TemplateSchema>`).
 *   - `Ctx` — pipeline ctx (D-07 + D-27 seam).
 *   - `AnswerEmitter` — D-27 seam function pointer type.
 *   - `Fragment<TRow>` — per-entity template-fragment shape.
 *   - `Overrides` — D-25 override map shape.
 *   - `FindDataResult` — admin-client query result (consumed by tests/ subclass
 *     in Plan 10).
 *   - `TableName` — union of the 14 table names in TOPO_ORDER.
 *   - `LatentHooks` — D-57-12 swappable seam on `ctx.latent` (GEN-06g).
 *
 * Notes:
 *   - Private workspace per D-28; no npm publish.
 *   - tsx-only runner; no tsup build step. Consumers import via
 *     `"@openvaa/dev-seed": "workspace:^"`; tsx + Turborepo resolve transparently.
 *   - Individual generator classes are NOT re-exported — overrides use the
 *     `{ [table]: (fragment, ctx) => Rows[] }` map shape per D-25, not class
 *     imports.
 */

// Runtime exports
export { buildCtx } from './ctx';
export { defaultRandomValidEmit } from './emitters/answers';
export { latentAnswerEmitter } from './emitters/latent/latentEmitter';
export { runPipeline, TOPO_ORDER } from './pipeline';
export { SupabaseAdminClient, TEST_PROJECT_ID } from './supabaseAdminClient';
export { TemplateSchema, validateTemplate } from './template/schema';
export { Writer } from './writer';

// Type exports
export type { Ctx } from './ctx';
export type { AnswerEmitter } from './emitters/answers';
export type { LatentHooks } from './emitters/latent/latentTypes';
export type { TableName } from './pipeline';
export type { FindDataResult } from './supabaseAdminClient';
export type { Template } from './template/types';
export type { Fragment, Overrides } from './types';
