/**
 * CandidatesGenerator — content generator for the `candidates` table.
 *
 * RESEARCH §4.9: `project_id`, `first_name`, `last_name` are required;
 * `organization_id` is nullable FK; `answers` JSONB defaults to '{}'.
 *
 * Ref shape: `organization: { external_id }` → bulk_import (migration line 2624)
 * resolves to `organization_id` at write time.
 *
 * Sentinel: `answersByExternalId: { [questionExtId]: { value, info? } }` — stripped
 * by bulk_import (unknown fields are ignored) and later consumed by Plan 07's
 * `importAnswers` helper, which resolves question ext_id → UUID and stitches
 * the `candidate.answers` JSONB post-insert. Generator only populates the
 * sentinel; writer owns the round-trip (D-07.2 post-topo pass).
 *
 * D-27 seam (critical): `const emit = ctx.answerEmitter ?? defaultRandomValidEmit`
 * is the SINGLE hook point Phase 57's latent-factor emitter overrides. The
 * default is the random-valid-per-question-type stub in emitters/answers.ts.
 * This file does NOT change between Phase 56 and Phase 57 — only
 * `ctx.answerEmitter` gets populated.
 *
 * D-19: Phase 56 emits shape-valid random answers per question type.
 * D-20: shape-valid ONLY. Subdimension / MISSING_VALUE projection stays in
 * `@openvaa/matching`. No correlated/clustered answers here — that's Phase 57.
 * D-26: ctx captured at construction; `defaults(ctx)` is per-call per D-08.
 *
 * Ref dependencies (requires Plan 07's pipeline to run generators in D-06 topo
 * order):
 *   - `ctx.refs.organizations` — candidates round-robin pick a party
 *   - `ctx.refs.questions` — answer emitter reads question types + choices
 *
 * Cross-plan contract for Plan 07: after QuestionsGenerator runs, the pipeline
 * MUST populate `ctx.refs.questions` with the FULL question rows (not just
 * external_id stubs) so the answer emitter can read question.type + choices.
 * This is a refinement of the D-07.3 "prior-entity ref map" — for questions
 * specifically, refs carry full rows. Plan 07's pipeline documents this.
 *
 * If either ref is empty at generate time, the corresponding field is omitted
 * (no organization ref; no answers). bulk_import / importAnswers then proceed
 * with plain insert — failing fast on semantic errors in the template is
 * better than silently producing orphan rows.
 *
 * Default count = 8: enough candidates per party (4 orgs × 2) for visible
 * matching patterns without stressing the <10s seed budget (NF-01). Phase 57
 * tunes this upward once the latent emitter drives clustering.
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

  // Phase 56 ignores ctx here; Phase 57 reads ctx.refs.organizations to scale
  // count proportionally (candidates per party).
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): CandidatesFragment {
    return { count: 8 };
  }

  generate(fragment: CandidatesFragment): Array<TablesInsert<'candidates'>> {
    const { faker, projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<CandidateRow> = [];

    // fixed[] pass-through — external_id prefixed, project_id defaulted.
    // first_name / last_name are DB NOT NULL but Fragment's Partial relaxes
    // them. Users supplying fixed[] are responsible for providing required
    // fields; Postgres surfaces any omission with a clear NOT NULL error.
    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...fx,
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      } as CandidateRow);
    }

    // D-27 seam: resolve the answer emitter ONCE per run. Phase 57's override
    // drops in here via `ctx.answerEmitter = latentEmitter` with zero changes
    // to this generator.
    const emit = this.ctx.answerEmitter ?? defaultRandomValidEmit;

    // Pipeline contract (Plan 07): ctx.refs.questions carries the FULL question
    // rows (not just { external_id } stubs) after QuestionsGenerator runs, so
    // the answer emitter can read question.type + choices. The cast reflects
    // the enrichment — if Plan 07 ships only stubs, the emitter will fail at
    // runtime with a clear missing-field error.
    const questionRows = refs.questions as unknown as Array<TablesInsert<'questions'>>;

    const n = fragment.count ?? 0;
    for (let i = 0; i < n; i++) {
      // Pick organization round-robin (deterministic — `i % N` with a seeded
      // faker means reruns produce identical candidate → party mappings).
      const party = refs.organizations.length > 0 ? refs.organizations[i % refs.organizations.length] : undefined;

      const row: CandidateRow = {
        external_id: `${externalIdPrefix}cand_${String(i).padStart(4, '0')}`,
        project_id: projectId,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        sort_order: i,
        is_generated: true
      };

      // Organization ref — only attach if the upstream ref was populated.
      // Missing org → candidate has NULL organization_id (legal per schema
      // but semantically sparse; tests in Plan 08 cover this edge case).
      if (party) {
        row.organization = { external_id: party.external_id };
      }

      // Answer emission via the D-27 seam. Skipped if no questions exist —
      // importAnswers then has nothing to stitch and no-ops.
      if (questionRows.length > 0) {
        // Narrow candidate shape for the emitter: only fields the emitter may
        // read are passed. Phase 56's default emitter doesn't read the candidate
        // (`_candidate` arg); Phase 57's latent emitter will read latent
        // position / party ref injected onto this object.
        //
        // D-57 Interpretation Note (2026-04-22 revision): forward the already-
        // populated `row.organization` ref to the emitter so Phase 57's latent
        // emitter `findPartyIndex` can resolve a non-negative partyIdx in the
        // production path. Synthetic candidates set `row.organization` above
        // (line 121) when `refs.organizations` is non-empty; if the ref is
        // missing, `row.organization` is undefined and the property is
        // spread-omitted from the literal (preserves the Phase 56 invariant
        // that `rows[0]` carries no `organization` property when the ref is
        // empty).
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
