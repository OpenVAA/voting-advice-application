/**
 * CandidatesGenerator — content generator for the `candidates` table.
 *
 * Schema: `project_id`, `first_name`, `last_name` are required; `organization_id` is nullable FK; `answers` JSONB defaults to '{}'.
 *
 * Ref shape: `organization: { external_id }` → bulk_import (migration line 2624) resolves to `organization_id` at write time.
 *
 * Sentinel: `answersByExternalId: { [questionExtId]: { value, info? } }` — stripped by bulk_import (unknown fields are ignored) and later consumed by the `importAnswers` helper, which resolves question ext_id → UUID and stitches the `candidate.answers` JSONB post-insert. The generator only populates the sentinel; the writer owns the round-trip in a post-topo pass.
 *
 * seam (critical): `const emit = ctx.answerEmitter ?? defaultRandomValidEmit` is the SINGLE hook point the latent-factor emitter overrides. The default is the random-valid-per-question-type stub in emitters/answers.ts. This file does NOT change between emitter generations — only `ctx.answerEmitter` gets populated.
 *
 * The default emitter produces shape-valid random answers per question type, and shape-valid ONLY. Subdimension / MISSING_VALUE projection stays in `@openvaa/matching`; correlated / clustered answers are the latent emitter's concern, never this file's. ctx is captured at construction; `defaults(ctx)` is per-call.
 *
 * Ref dependencies (the pipeline must run generators in topological order):
 *   - `ctx.refs.organizations` — candidates round-robin pick an organization
 *   - `ctx.refs.questions` — answer emitter reads question types + choices
 *
 * Pipeline contract: after QuestionsGenerator runs, the pipeline MUST populate `ctx.refs.questions` with the FULL question rows (not just external_id stubs) so the answer emitter can read question.type + choices. Questions are the one entity whose ref map carries full rows rather than stubs.
 *
 * If either ref is empty at generate time, the corresponding field is omitted (no organization ref; no answers). bulk_import / importAnswers then proceed with plain insert — failing fast on semantic errors in the template is better than silently producing orphan rows.
 *
 * Default count = 8: enough candidates per organization (4 orgs × 2) for visible matching patterns without stressing the <10s seed budget. Tune it upward when the latent emitter drives clustering.
 */

import { defaultRandomValidEmit } from '../emitters/answers';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type CandidatesFragment = Fragment<TablesInsert<'candidates'>>;

/**
 * CandidateRow carries two sentinel / ref fields not on TablesInsert<'candidates'>:
 *   - `organization: { external_id }` — bulk_import resolves to organization_id
 *   - `answersByExternalId` — stripped by bulk_import; read by importAnswers
 */
type CandidateRow = TablesInsert<'candidates'> & {
  organization?: { external_id: string };
  answersByExternalId?: Record<string, { value: unknown; info?: unknown }>;
};

export class CandidatesGenerator {
  constructor(private ctx: Ctx) {}

  // `defaults` ignores ctx here. Reading `ctx.refs.organizations` is what would let the count scale proportionally (candidates per organization).

  defaults(ctx: Ctx): CandidatesFragment {
    return { count: 8 };
  }

  generate(fragment: CandidatesFragment): Array<TablesInsert<'candidates'>> {
    const { faker, projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<CandidateRow> = [];

    // fixed[] pass-through — external_id prefixed, project_id defaulted.
    // first_name / last_name are DB NOT NULL but Fragment's Partial relaxes them. Users supplying fixed[] are responsible for providing required fields; Postgres surfaces any omission with a clear NOT NULL error.
    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      } as CandidateRow);
    }

    // seam: resolve the answer emitter ONCE per run. An override drops in here via `ctx.answerEmitter = latentEmitter`, with zero changes to this generator.
    const emit = this.ctx.answerEmitter ?? defaultRandomValidEmit;

    // Pipeline contract: ctx.refs.questions carries the FULL question rows (not just { external_id } stubs) after QuestionsGenerator runs, so the answer emitter can read question.type + choices. The cast reflects that enrichment — given stubs only, the emitter fails at runtime with a clear missing-field error.
    const questionRows = refs.questions as unknown as Array<TablesInsert<'questions'>>;

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      // Pick organization round-robin (deterministic — `i % N` with a seeded faker means reruns produce identical candidate → organization mappings).
      const organization =
        refs.organizations.length > 0 ? refs.organizations[i % refs.organizations.length] : undefined;

      const row: CandidateRow = {
        external_id: `${externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
        project_id: projectId,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        sort_order: i,
        is_generated: true
      };

      // Organization ref — only attach if the upstream ref was populated.
      // Missing org → candidate has NULL organization_id (legal per schema but semantically sparse; the unit suite covers this edge case).
      if (organization) {
        row.organization = { external_id: organization.external_id };
      }

      // Answer emission via the seam. Skipped if no questions exist — importAnswers then has nothing to stitch and no-ops.
      if (questionRows.length > 0) {
        // Narrow candidate shape for the emitter: only fields the emitter may read are passed. The default emitter does not read the candidate at all (`_candidate` arg); the latent emitter reads the latent position and the organization ref injected onto this object.
        //
        // ⚠ Forward the already-populated `row.organization` ref so the latent emitter's `findOrganizationIndex` can resolve a non-negative organizationIdx on the production path. Synthetic candidates set `row.organization` above when `refs.organizations` is non-empty; if the ref is missing, `row.organization` is undefined and the property is spread-omitted from the literal. That preserves the invariant that `rows[0]` carries no `organization` property when the ref is empty.
        const candidateForEmit: TablesInsert<'candidates'> = {
          external_id: row.external_id,
          project_id: projectId,
          first_name: row.first_name,
          last_name: row.last_name,
          ...(row.organization !== undefined ? { organization: row.organization } : {})
        };
        row.answersByExternalId = emit(candidateForEmit, questionRows, this.ctx);
      }

      rows.push(row);
    }

    return rows as Array<TablesInsert<'candidates'>>;
  }
}
