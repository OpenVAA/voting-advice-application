/**
 * @openvaa/dev-seed pipeline orchestrator.
 *
 * `runPipeline(template, overrides?, ctx?)` drives all 14 generators in a topological order, populates `ctx.refs` between steps, bridges the `(fragment, ctx) => Rows ` override signature with the class-based built-in generators, and performs a post-topo sentinel enrichment pass.
 *
 * topo order with one refinement — `question_categories` / `questions` run BEFORE `candidates` so `ctx.refs.questions` is populated when CandidatesGenerator's answer emitter (seam) iterates questions.
 * This diverges from `bulk_import`'s own `processing_order` (migration line
 * 2751), which runs `candidates` before `question_categories`. The database does not care about the `ctx.refs.questions` contract; the pipeline does.
 *
 * every generator's `generate(fragment)` receives a fragment formed by
 *       `{ ...gen.defaults(ctx), ...(template[table] ?? {}) }` so the template wins field-by-field over the generator's smart defaults.
 *
 * bridge:
 *   const gen = new Gen(ctx);
 *   const fragment = { ...gen.defaults(ctx), ...(template[table] ?? {}) };
 *   const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);
 *
 * `ctx.refs[table]` carries the FULL emitted rows after each step. The public `Ctx` type in `ctx.ts` narrows each ref to `Array<{ external_id: string }>` as a MINIMAL contract — generators that need more (CandidatesGenerator's answer emitter reads `question.type` / `question.choices`) cast up explicitly. The narrower public type keeps consumers untyped-accident-free while the pipeline uses a wider internal view.
 *
 * Post-topo sentinel enrichment pass: after every generator runs, this file attaches `_constituencyGroups` onto elections, `_constituencies` onto constituency_groups, and `_elections` onto question_categories. Sentinel emission is deliberately deferred to this pass so generators themselves stay simple and each sentinel is computed from the FINAL ref graph — not the partial mid-topo state. `bulkImport` strips these `_`-prefixed fields before the RPC; `linkJoinTables` re-reads them from the same dataset in a second pass.
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
import { sentinelKeysFor } from './template/linkSentinels';
import type { Ctx, Overrides, Template } from './types';

/**
 * Topological order of generator execution.
 *
 * Source: (`bulk_import`'s `processing_order`, migration line 2751) with one refinement — `question_categories` / `questions` run BEFORE `candidates` so `ctx.refs.questions` is populated when the answer emitter (seam) iterates questions.
 *
 * Accounts and projects lead the order: they are pass-through (the seed.sql bootstrap owns those rows). Keeping them in the ordering means the pipeline's generator-class map does not need a special branch for bootstrap-only tables.
 *
 * `feedback` runs last — no downstream ref consumers; writer routes it separately.
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
  'questions', // before candidates, so the answer-emitter seam sees them
  'candidates', // reads ctx.refs.questions for the answer emitter
  'nominations',
  'app_settings',
  'feedback'
] as const;

export type TableName = (typeof TOPO_ORDER)[number];

/**
 * Shared shape every generator class satisfies. The pipeline instantiates each class once with `ctx` captured at construction, then calls `generate(fragment)`. Each class also exposes `defaults(ctx)`.
 *
 * `fragment` / rows are typed at `unknown` / `Record<string, unknown>` on the boundary because different generator classes consume narrower `Fragment<T>` shapes and emit narrower `TablesInsert<T>[]` shapes. The pipeline does not reason about those per-table shapes — it only orchestrates.
 */
interface GeneratorClass {
  new (ctx: Ctx): {
    defaults: (ctx: Ctx) => unknown;
    generate: (fragment: unknown) => Array<Record<string, unknown>>;
  };
}

/**
 * Map from table name to generator class. Pipeline iterates TOPO_ORDER and instantiates each class uniformly.
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
 *        field-path errors cleanly; `runPipeline` does not re-validate).
 * @param overrides Optional `{ [table]: (fragment, ctx) => Rows[] }` map per
 *        An override fully REPLACES the built-in generator's output for that table.
 * @param ctx Optional pre-built ctx — useful for tests that want to inject a
 *        deterministic logger or a custom `ctx.answerEmitter` (the seam the latent-factor emitter uses). Defaults to `buildCtx(template)`.
 *
 * @returns An object keyed by table name; each value is the full array of rows
 *          emitted for that table. Writer consumes this object directly.
 *
 * override signature class bridge:
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
 * `bulkImport` strips these `_`-prefixed fields before the RPC; `linkJoinTables` re-reads them from the same dataset in a second pass.
 */
export function runPipeline(
  template: Template,
  overrides: Overrides = {},
  ctx: Ctx = buildCtx(template)
): Record<string, Array<Record<string, unknown>>> {
  const output: Record<string, Array<Record<string, unknown>>> = {};
  const templateFragments = template as unknown as Record<string, unknown>;

  // seam: install the latent emitter unless a caller has already wired a custom one (test-injection path). `??=` is what preserves an externally-supplied `ctx.answerEmitter`. The latent emitter internally falls back to `defaultRandomValidEmit` for:
  //   - non-ordinal / non-choice question types
  //   - candidates missing an organization ref
  ctx.answerEmitter ??= latentAnswerEmitter(template);

  for (const table of TOPO_ORDER) {
    const Gen = GENERATOR_CLASSES[table];
    const gen = new Gen(ctx);
    const fragmentBase = gen.defaults(ctx) as Record<string, unknown>;
    const templateFragment = (templateFragments[table] ?? {}) as Record<string, unknown>;
    const fragment = { ...fragmentBase, ...templateFragment };

    // override signature class bridge.
    // `overrides[table]?.(fragment, ctx)` fully replaces the built-in output for that table. Falls back to the class-based built-in.
    const rows = overrides[table]?.(fragment, ctx) ?? gen.generate(fragment);

    output[table] = rows;

    // Populate ctx.refs[table] with the FULL emitted rows. The public `Ctx` type narrows each ref to `Array<{ external_id: string }>` — that's the MINIMAL contract. Generators that need more (CandidatesGenerator's answer emitter reads `question.type` / `question.choices`) cast up.
    (ctx.refs as unknown as Record<string, Array<unknown>>)[table] = rows;
  }

  // Post-topo sentinel enrichment pass. Sentinel emission is deferred to this pass so each sentinel is computed from the FINAL ref graph.
  attachSentinels(output);

  // Persist the emission order of `nominations` as `sort_order`. Runs AFTER the topo loop so it covers BOTH the built-in generator and any `overrides.nominations` (which fully replaces the generator's output).
  assignNominationSortOrder(output);

  return output;
}

/**
 * Persist each nomination's emission index as its `sort_order`.
 *
 * ## Why this exists (debug session `tied-match-order-churn`)
 *
 * `get_nominations` (`apps/supabase/supabase/schema/503-entity-rpcs.sql`) orders `ORDER BY n.sort_order NULLS LAST, n.id`. Before this pass, NO built-in template declared `sort_order` on a nomination, so that clause degenerated to `ORDER BY n.id` — and `nominations.id` is `uuid DEFAULT gen_random_uuid()`, minted fresh on every INSERT.
 *
 * Every E2E data-setup project tears the dataset DOWN and re-seeds it, so each run got a brand-new random ordering of the SAME rows. `seed: 42` pins the generated CONTENT; it has never pinned the database's surrogate keys.
 *
 * That random order flows unmodified into `MatchingAlgorithm.match()`'s `targets` (measured: every hop from the RPC response to the rendered list is order-preserving). `matches.sort((a, b) => a.distance - b.distance)` is a STABLE sort, so it re-orders every distinct score deterministically and leaves DISTANCE-TIED entries in their arrival order. Result: rows at unique scores were pixel-stable while a 10-way tie at 47% permuted on every run — the 11,748–15,928 px of "noise" that made the visual gate unusable.
 *
 * The template's `fixed[]` array is a deliberate, documented order (see the `nominations:` block header in `templates/e2e/base.ts`). This pass stops throwing it away.
 *
 * ## Contract
 *
 * - A row that ALREADY declares `sort_order` keeps it, verbatim. Authors stay in
 *   control; this only fills the gap.
 * - Rows without one are numbered by emission index, so the value is a pure
 *   function of the template and is byte-identical across reseeds.
 * - Numbering is global across the table (not per election/constituency), which
 *   is sufficient: every consumer query filters by election + constituency first, and a global counter guarantees uniqueness within any subset.
 *
 * NB. This does NOT give the PRODUCT a tie-break. An imported dataset whose nominations carry no `sort_order` still falls back to `n.id`. Adding a tie-break to the matcher changes which candidate a voter sees first and is a product decision, deliberately left out of scope here.
 */
function assignNominationSortOrder(output: Record<string, Array<Record<string, unknown>>>): void {
  const rows = output.nominations;
  if (!rows?.length) return;
  rows.forEach((row, index) => {
    if (row.sort_order == null) row.sort_order = index;
  });
}

/**
 * Attach `_`-prefixed sentinel fields to the rows that need them.
 *
 * `bulkImport` strips these before sending to the RPC; `linkJoinTables` re-reads them from the SAME input dataset in a second pass.
 *
 * Sentinels:
 *   - `election._constituencyGroups = { externalId: [...constituency_group extIds] }`
 *   - `constituency_group._constituencies = { externalId: [...constituency extIds] }`
 *   - `question_category._elections = { externalId: [...election extIds] }`
 *
 * Per-row scoping: a row that already declares scoping — via `_<sentinel>`, `<sentinel>`, or `<snake_case_sentinel>` (the four shapes `linkJoinTables` accepts in supabaseAdminClient.ts:324-330) — is left untouched. Only rows that lack any declaration receive the full-fanout default. Templates that want a realistic election→cg→constituency hierarchy declare the relationships inline on the relevant fixed[] rows; templates that want everything wired to everything (the default) omit the declarations and inherit fanout.
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

  // ⚠ Read this before treating the next three lines as redundant.
  //
  // The key lists below are DERIVED from `LINK_SENTINELS`, the same array `linkJoinTables` iterates, instead of being hand-written here. That makes the set of keys which SUPPRESSES the fanout byte-identical to the set the resolver READS, for all time, because both read one declaration. It also closes two latent defects that a hand-written list reopens:
  //
  //   1. The `_constituency_groups` override hole. `linkJoinTables` reads that key on an election row; the hand-written list here did NOT check it. An author scoping an election with `_constituency_groups` was therefore not recognised as having declared scope, got overwritten with a full-fanout `_constituencyGroups`, and the resolver's `??` chain then preferred the fanout because `_constituencyGroups` comes first — the author's explicit scoping silently replaced by everything-wired-to-everything.
  //   2. The bare-`elections` phantom. The hand-written list treated a bare `elections` array on a question-category row as declared scope and suppressed the fanout, but `linkJoinTables` reads that key on no collection, so the row ended with `election_ids = null = "all"` anyway.
  //      The two agreed only because the fanout would have listed every election; change the election set and they diverge.
  //
  // ⚠ What this does NOT derive: the fanout POLICY — which collections get a default at all — is the hand-written table below and stays hand-written.
  // Only three of the collection/key combinations get a default, and that asymmetry belongs to the open "remove the fan-out" todo, not here.
  const fanoutKeys = {
    elections: sentinelKeysFor('elections', '_constituencyGroups'),
    constituency_groups: sentinelKeysFor('constituency_groups', '_constituencies'),
    question_categories: sentinelKeysFor('question_categories', '_elections')
  };

  if (allGroupExtIds.length > 0) {
    for (const el of output.elections ?? []) {
      if (hasDeclaredScope(el, fanoutKeys.elections)) continue;
      el._constituencyGroups = { externalId: allGroupExtIds };
    }
  }
  if (allConstituencyExtIds.length > 0) {
    for (const cg of output.constituency_groups ?? []) {
      if (hasDeclaredScope(cg, fanoutKeys.constituency_groups)) continue;
      cg._constituencies = { externalId: allConstituencyExtIds };
    }
  }
  if (allElectionExtIds.length > 0) {
    for (const qc of output.question_categories ?? []) {
      if (hasDeclaredScope(qc, fanoutKeys.question_categories)) continue;
      qc._elections = { externalId: allElectionExtIds };
    }
  }
}

/**
 * Does this row already declare its own scoping under any of `keys`?
 *
 * `keys` is a `LINK_SENTINELS` rule's own key list (see `attachSentinels`), not a hand-written argument list — the rest signature it used to have made it too easy to pass a set that had drifted from the resolver's.
 *
 * @param row - The generated row.
 * @param keys - The rule's key forms.
 * @returns `true` when one key carries a non-empty declaration.
 */
function hasDeclaredScope(row: Record<string, unknown>, keys: ReadonlyArray<string>): boolean {
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
