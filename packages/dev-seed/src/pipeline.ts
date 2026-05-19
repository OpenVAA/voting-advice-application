/**
 * @openvaa/dev-seed pipeline orchestrator.
 *
 * `runPipeline(template, overrides?, ctx?)` drives all 14 generators in a
 * topological order, populates `ctx.refs` between steps, bridges the D-25
 * `(fragment, ctx) => Rows[]` override signature with the D-26 class-based
 * built-in generators, and performs a post-topo sentinel enrichment pass.
 *
 * D-06 topo order with one Phase 56 refinement — `question_categories` /
 * `questions` run BEFORE `candidates` so `ctx.refs.questions` is populated
 * when CandidatesGenerator's answer emitter (D-27 seam) iterates questions.
 * This diverges from `bulk_import`'s own `processing_order` (migration line
 * 2751), which runs `candidates` before `question_categories`. The database
 * does not care about the `ctx.refs.questions` contract; the pipeline does.
 *
 * D-08: every generator's `generate(fragment)` receives a fragment formed by
 *       `{ ...gen.defaults(ctx), ...(template[table] ?? {}) }` so the template
 *       wins field-by-field over the generator's smart defaults.
 *
 * D-25 + D-26 bridge:
 *   const gen = new Gen(ctx);
 *   const fragment = { ...gen.defaults(ctx), ...(template[table] ?? {}) };
 *   const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);
 *
 * `ctx.refs[table]` carries the FULL emitted rows after each step. The public
 * `Ctx` type in `ctx.ts` narrows each ref to `Array<{ external_id: string }>`
 * as a MINIMAL contract — generators that need more (CandidatesGenerator's
 * answer emitter reads `question.type` / `question.choices`) cast up
 * explicitly. The narrower public type keeps consumers untyped-accident-free
 * while the pipeline uses a wider internal view.
 *
 * Post-topo sentinel enrichment pass: after every generator runs, this file
 * attaches `_constituencyGroups` onto elections, `_constituencies` onto
 * constituency_groups, and `_elections` onto question_categories. Plans 04
 * and 05 deliberately deferred sentinel emission to this pass so generators
 * themselves stay simple and each sentinel is computed from the FINAL ref
 * graph — not the partial mid-topo state. `bulkImport` strips these
 * `_`-prefixed fields before the RPC; `linkJoinTables` re-reads them from
 * the same dataset in a second pass (RESEARCH §2).
 */

import { buildCtx } from './ctx';
import { latentAnswerEmitter } from './emitters/latent/latentEmitter';
import { AccountsGenerator } from './generators/AccountsGenerator';
import { AlliancesGenerator } from './generators/AlliancesGenerator';
import { AppSettingsGenerator } from './generators/AppSettingsGenerator';
import { CandidatesGenerator } from './generators/CandidatesGenerator';
import { ConstituenciesGenerator } from './generators/ConstituenciesGenerator';
import { ConstituencyGroupsGenerator } from './generators/ConstituencyGroupsGenerator';
import { ElectionsGenerator } from './generators/ElectionsGenerator';
import { FactionsGenerator } from './generators/FactionsGenerator';
import { FeedbackGenerator } from './generators/FeedbackGenerator';
import { NominationsGenerator } from './generators/NominationsGenerator';
import { OrganizationsGenerator } from './generators/OrganizationsGenerator';
import { ProjectsGenerator } from './generators/ProjectsGenerator';
import { QuestionCategoriesGenerator } from './generators/QuestionCategoriesGenerator';
import { QuestionsGenerator } from './generators/QuestionsGenerator';
import type { Ctx, Overrides, Template } from './types';

/**
 * Topological order of generator execution.
 *
 * Source: D-06 (`bulk_import`'s `processing_order`, migration line 2751) with a
 * Phase 56 refinement — `question_categories` / `questions` run BEFORE
 * `candidates` so `ctx.refs.questions` is populated when the answer emitter
 * (D-27 seam) iterates questions.
 *
 * Accounts and projects lead the order: they are pass-through per D-11 (the
 * seed.sql bootstrap owns those rows). Keeping them in the ordering means the
 * pipeline's generator-class map does not need a special branch for
 * bootstrap-only tables.
 *
 * `feedback` runs last — no downstream ref consumers; writer routes it
 * separately per D-11.
 */
export const TOPO_ORDER = [
  'accounts',
  'projects',
  'elections',
  'constituency_groups',
  'constituencies',
  'organizations',
  'alliances',
  'factions',
  'question_categories',
  'questions', // before candidates — Phase 56 refinement of D-06 for the D-27 seam
  'candidates', // reads ctx.refs.questions for the answer emitter
  'nominations',
  'app_settings',
  'feedback'
] as const;

export type TableName = (typeof TOPO_ORDER)[number];

/**
 * Shared shape every generator class satisfies. The pipeline instantiates each
 * class once with `ctx` captured at construction (D-26), then calls
 * `generate(fragment)`. Each class also exposes `defaults(ctx)` (D-08).
 *
 * `fragment` / rows are typed at `unknown` / `Record<string, unknown>` on the
 * boundary because different generator classes consume narrower `Fragment<T>`
 * shapes and emit narrower `TablesInsert<T>[]` shapes. The pipeline does not
 * reason about those per-table shapes — it only orchestrates.
 */
interface GeneratorClass {
  new (ctx: Ctx): {
    defaults: (ctx: Ctx) => unknown;
    generate: (fragment: unknown) => Array<Record<string, unknown>>;
  };
}

/**
 * Map from table name to generator class. Pipeline iterates TOPO_ORDER and
 * instantiates each class uniformly.
 */
const GENERATOR_CLASSES: Record<TableName, GeneratorClass> = {
  accounts: AccountsGenerator as unknown as GeneratorClass,
  projects: ProjectsGenerator as unknown as GeneratorClass,
  elections: ElectionsGenerator as unknown as GeneratorClass,
  constituency_groups: ConstituencyGroupsGenerator as unknown as GeneratorClass,
  constituencies: ConstituenciesGenerator as unknown as GeneratorClass,
  organizations: OrganizationsGenerator as unknown as GeneratorClass,
  alliances: AlliancesGenerator as unknown as GeneratorClass,
  factions: FactionsGenerator as unknown as GeneratorClass,
  question_categories: QuestionCategoriesGenerator as unknown as GeneratorClass,
  questions: QuestionsGenerator as unknown as GeneratorClass,
  candidates: CandidatesGenerator as unknown as GeneratorClass,
  nominations: NominationsGenerator as unknown as GeneratorClass,
  app_settings: AppSettingsGenerator as unknown as GeneratorClass,
  feedback: FeedbackGenerator as unknown as GeneratorClass
};

/**
 * Run the full seeding pipeline.
 *
 * @param template Validated Template (run `validateTemplate()` first to surface
 *        TMPL-09 field-path errors cleanly; `runPipeline` does not re-validate).
 * @param overrides Optional `{ [table]: (fragment, ctx) => Rows[] }` map per
 *        D-25. An override fully REPLACES the built-in generator's output for
 *        that table (GEN-03, D-05).
 * @param ctx Optional pre-built ctx — useful for tests that want to inject a
 *        deterministic logger or a custom `ctx.answerEmitter` (D-27 seam for
 *        Phase 57's latent-factor emitter). Defaults to `buildCtx(template)`.
 *
 * @returns An object keyed by table name; each value is the full array of rows
 *          emitted for that table. Writer consumes this object directly.
 *
 * D-25 override signature + D-26 class bridge:
 * ```ts
 * const gen = new Gen(ctx);
 * const fragment = { ...gen.defaults(ctx), ...(template[table] ?? {}) };
 * const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);
 * ```
 *
 * After all generators run, `attachSentinels()` attaches:
 *   - `_constituencyGroups` on every election row
 *   - `_constituencies` on every constituency_group row
 *   - `_elections` on every question_category row
 *
 * `bulkImport` strips these `_`-prefixed fields before the RPC; `linkJoinTables`
 * re-reads them from the same dataset in a second pass (RESEARCH §2).
 */
export function runPipeline(
  template: Template,
  overrides: Overrides = {},
  ctx: Ctx = buildCtx(template)
): Record<string, Array<Record<string, unknown>>> {
  const output: Record<string, Array<Record<string, unknown>>> = {};
  const templateFragments = template as unknown as Record<string, unknown>;

  // D-27 seam: install the Phase 57 latent emitter unless a caller has already
  // wired a custom one (test-injection path). `??=` preserves Phase 56 behavior
  // for tests that pre-set ctx.answerEmitter on an externally-supplied ctx.
  // The latent emitter internally falls back to `defaultRandomValidEmit` for:
  //   - non-ordinal / non-choice question types (D-57-10)
  //   - candidates missing an organization ref (Pitfall 4)
  ctx.answerEmitter ??= latentAnswerEmitter(template);

  for (const table of TOPO_ORDER) {
    const Gen = GENERATOR_CLASSES[table];
    const gen = new Gen(ctx);
    const fragmentBase = gen.defaults(ctx) as Record<string, unknown>;
    const templateFragment = (templateFragments[table] ?? {}) as Record<string, unknown>;
    const fragment = { ...fragmentBase, ...templateFragment };

    // D-25 override signature + D-26 class bridge.
    // `overrides[table]?.(fragment, ctx)` fully replaces the built-in output
    // for that table (GEN-03 + D-05). Falls back to the class-based built-in.
    const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);

    output[table] = rows;

    // Populate ctx.refs[table] with the FULL emitted rows. The public `Ctx`
    // type narrows each ref to `Array<{ external_id: string }>` — that's the
    // MINIMAL contract. Generators that need more (CandidatesGenerator's
    // answer emitter reads `question.type` / `question.choices`) cast up.
    (ctx.refs as unknown as Record<string, Array<unknown>>)[table] = rows;
  }

  // Post-topo sentinel enrichment pass. Plans 04 + 05 deferred sentinel emission
  // to this pass so each sentinel can be computed from the FINAL ref graph.
  attachSentinels(output);

  return output;
}

/**
 * Attach `_`-prefixed sentinel fields to the rows that need them.
 *
 * `bulkImport` strips these before sending to the RPC; `linkJoinTables` re-reads
 * them from the SAME input dataset in a second pass (RESEARCH §2).
 *
 * Sentinels:
 *   - `election._constituencyGroups = { externalId: [...constituency_group extIds] }`
 *   - `constituency_group._constituencies = { externalId: [...constituency extIds] }`
 *   - `question_category._elections = { externalId: [...election extIds] }`
 *
 * Per-row scoping (delivers the Phase 58 hook the original full-fanout comment
 * promised): a row that already declares scoping — via `_<sentinel>`,
 * `<sentinel>`, or `<snake_case_sentinel>` (the four shapes `linkJoinTables`
 * accepts in supabaseAdminClient.ts:324-330) — is left untouched. Only rows
 * that lack any declaration receive the full-fanout default. Templates that
 * want a realistic election→cg→constituency hierarchy declare the relationships
 * inline on the relevant fixed[] rows; templates that want everything wired to
 * everything (the Phase 56 default) omit the declarations and inherit fanout.
 */
function attachSentinels(output: Record<string, Array<Record<string, unknown>>>): void {
  const allGroupExtIds = (output.constituency_groups ?? [])
    .map((g) => g.external_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  const allConstituencyExtIds = (output.constituencies ?? [])
    .map((c) => c.external_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);
  const allElectionExtIds = (output.elections ?? [])
    .map((e) => e.external_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  if (allGroupExtIds.length > 0) {
    for (const el of output.elections ?? []) {
      if (hasDeclaredScope(el, '_constituencyGroups', 'constituencyGroups', 'constituency_groups')) continue;
      el._constituencyGroups = { externalId: allGroupExtIds };
    }
  }
  if (allConstituencyExtIds.length > 0) {
    for (const cg of output.constituency_groups ?? []) {
      if (hasDeclaredScope(cg, '_constituencies', 'constituencies')) continue;
      cg._constituencies = { externalId: allConstituencyExtIds };
    }
  }
  if (allElectionExtIds.length > 0) {
    for (const qc of output.question_categories ?? []) {
      if (hasDeclaredScope(qc, '_elections', 'elections')) continue;
      qc._elections = { externalId: allElectionExtIds };
    }
  }
}

function hasDeclaredScope(row: Record<string, unknown>, ...keys: Array<string>): boolean {
  return keys.some((k) => {
    const v = row[k];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') {
      const anyV = v as { externalId?: Array<string>; external_id?: Array<string> };
      return (anyV.externalId?.length ?? 0) > 0 || (anyV.external_id?.length ?? 0) > 0;
    }
    return false;
  });
}
