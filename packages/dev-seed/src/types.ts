/**
 * Shared type contracts for `@openvaa/dev-seed`.
 *
 * Consumers (generators, pipeline, writer, external overrides) import from here so
 * the type surface stays canonical — one `import type { ... } from '../types'`
 * covers every cross-module contract in the package.
 *
 * Note: `Ctx` lives in `ctx.ts` (not here) to avoid circular-import hazards;
 * `types.ts` only re-exports types-only (`export type`).
 */

import type { Ctx } from './ctx';

export type { Ctx } from './ctx';
export type { AnswerEmitter } from './emitters/answers';
export type { LatentHooks } from './emitters/latent/latentTypes';
export type { Template } from './template/types';

/**
 * Per-entity fragment shape — every generator's `generate(fragment)` accepts this.
 *
 * `TRow` is the `TablesInsert<'X'>` row type from `@openvaa/supabase-types`.
 * `fixed[]` accepts partial rows (so users can omit fields the generator fills in
 * from defaults / faker) but `external_id` is required so the writer's upsert
 * works (GEN-04).
 */
export type Fragment<TRow> = {
  count?: number;
  fixed?: Array<Partial<TRow> & { external_id: string }>;
};

/**
 * D-25 override map — public override signature.
 *
 *   `{ [table]: (fragment, ctx) => Rows[] }`
 *
 * The pipeline bridges this with the class-based built-in generators per D-26:
 *
 *   `const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);`
 *
 * NOT typed narrowly per-table because overrides are user-supplied — the pipeline
 * passes whatever fragment shape the template has. Narrower typing would couple
 * `Overrides` to the 14 generator classes and make user-authored overrides more
 * painful. `Record<string, unknown>` is the correct granularity at this seam.
 */
export type Overrides = {
  [table: string]: (fragment: unknown, ctx: Ctx) => Array<Record<string, unknown>>;
};
