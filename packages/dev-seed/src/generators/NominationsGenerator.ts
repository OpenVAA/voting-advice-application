/**
 * NominationsGenerator — polymorphic generator for the `nominations` table.
 *
 * Nominations wire candidates / parties / factions / alliances to
 * elections × constituencies. This is the most constraint-heavy generator in
 * Phase 56; it encodes three layers of DB-side invariants client-side so
 * misconfiguration fails fast with a readable error before bulk_import is
 * called.
 *
 * Polymorphism (migration line 741 CHECK):
 *   num_nonnulls(candidate_id, organization_id, faction_id, alliance_id) = 1
 *   — exactly ONE entity FK per row. Generator emits the corresponding ref
 *   shape; bulk_import's resolve_external_ref converts the ref → FK UUID.
 *
 * Hierarchy rules (validate_nomination trigger, migration lines 298–378):
 *   - alliance    → NO parent_nomination
 *   - organization → parent_nomination must be alliance (or none)
 *   - faction     → parent_nomination REQUIRED and must be organization
 *   - candidate   → parent_nomination must be organization or faction (or none)
 *
 * Parent consistency (migration lines 360–373): if parent_nomination_id is
 * set, the child's election_id / constituency_id / election_round MUST match
 * the parent's. Phase 56's generator emits top-level candidate nominations
 * only (no parent), sidestepping this trigger path; `fixed[]` rows that
 * include parents rely on the user supplying consistent values — per D-22
 * "pure I/O" contract.
 *
 * GEN-08 enforcement (D-07.3): BEFORE emitting any generated row, the
 * generator validates that the refs it needs are populated in `ctx.refs`.
 * An empty ref throws a descriptive client-side error pointing at the
 * missing category, which surfaces cleanly in the pipeline's exception
 * path — far better than a PL/pgSQL `RAISE EXCEPTION` trace from
 * bulk_import's resolve_external_ref.
 *
 * Phase 56 emission strategy (deliberately minimal): for each candidate in
 * `ctx.refs.candidates` (up to `fragment.count`), emit ONE candidate-type
 * nomination wired to the FIRST election × FIRST constituency. This
 * exercises the polymorphism + ref-resolution code path end-to-end without
 * combinatorial cross-election × cross-constituency wiring. Phase 58
 * templates override via `nominations: (fragment, ctx) => rows[]` for
 * richer topologies.
 *
 * Does NOT emit:
 *   - `id` (auto-generated UUID)
 *   - `entity_type` (GENERATED column; migration line 724–731 — would fail
 *     "cannot write to generated column")
 *   - Redundant `organization` ref on candidate-type rows. RESEARCH §9
 *     explicitly drops the legacy tests/ admin-client "emit both, strip
 *     one" workaround (lines 172–180): since dev-seed controls emission,
 *     it emits only the authoritative ref. The party-candidate
 *     relationship is already expressed via `candidates.organization_id`.
 *
 * Polymorphism variants NOT produced in Phase 56's generated path:
 *   organization / faction / alliance nominations. The SHAPE supports them
 *   (PolymorphicRef union + `fixed[]` pass-through); users who want them
 *   supply via `fixed[]`. Phase 58 templates extend to generate them.
 *
 * D-26: ctx captured at construction; `defaults(ctx)` is per-call per D-08.
 */

import type { TablesInsert } from '@openvaa/supabase-types';
import type { Ctx, Fragment } from '../types';

export type NominationsFragment = Fragment<TablesInsert<'nominations'>>;

// Polymorphic ref shapes — bulk_import's resolve_external_ref converts them
// to FK IDs. Exactly ONE of candidate/organization/faction/alliance must be
// set per row (CHECK constraint, migration line 741).
type CandidateRef = { candidate: { external_id: string } };
type OrganizationRef = { organization: { external_id: string } };
type FactionRef = { faction: { external_id: string } };
type AllianceRef = { alliance: { external_id: string } };
type PolymorphicRef = CandidateRef | OrganizationRef | FactionRef | AllianceRef;

// `election_id` and `constituency_id` are NOT NULL on TablesInsert<'nominations'>
// but bulk_import resolves them from the `election` / `constituency` ref shapes
// at write time. Same pattern as QuestionsGenerator's `category_id` relaxation.
type NominationRow = Omit<TablesInsert<'nominations'>, 'election_id' | 'constituency_id'> &
  Partial<PolymorphicRef> & {
    election?: { external_id: string };
    constituency?: { external_id: string };
    parent_nomination?: { external_id: string };
  };

export class NominationsGenerator {
  constructor(private ctx: Ctx) {}

  // Phase 56 ignores ctx here; Phase 58 templates drive counts via
  // `nominations: (fragment, ctx) => rows[]` overrides.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  defaults(ctx: Ctx): NominationsFragment {
    // Default 0 — Phase 56 emits `fixed[]` or explicit count; Phase 58
    // templates drive richer counts.
    return { count: 0 };
  }

  generate(fragment: NominationsFragment): Array<TablesInsert<'nominations'>> {
    const { projectId, externalIdPrefix, refs } = this.ctx;
    const rows: Array<NominationRow> = [];

    // fixed[] pass-through — user-authored nominations, prefix applied.
    // Users supplying fixed[] are responsible for polymorphism + hierarchy
    // correctness (D-22 pure-I/O contract). bulk_import's CHECK constraint
    // and validate_nomination trigger catch any violations DB-side.
    for (const fx of fragment.fixed ?? []) {
      rows.push({
        ...(fx as NominationRow),
        external_id: `${externalIdPrefix}${fx.external_id}`,
        project_id: fx.project_id ?? projectId
      });
    }

    // Generated rows: one candidate-type nomination per candidate in
    // ctx.refs.candidates, capped at fragment.count.
    const n = fragment.count ?? 0;
    if (n > 0) {
      // GEN-08: client-side ref validation. Throw with a descriptive error
      // that points at the missing ref category — catching this here is far
      // more debuggable than letting bulk_import fail deep in PL/pgSQL.
      this.assertRefsPopulated();

      const electionExtId = refs.elections[0].external_id;
      const constituencyExtId = refs.constituencies[0].external_id;

      // Cap count at the number of candidates available (can't nominate who
      // doesn't exist).
      const effectiveN = Math.min(n, refs.candidates.length);
      if (n > effectiveN) {
        this.ctx.logger(
          `[dev-seed] NominationsGenerator: requested ${n} candidate nominations but only ${refs.candidates.length} candidates in ctx.refs. Clamped to ${effectiveN}.`
        );
      }

      for (let i = 0; i < effectiveN; i++) {
        const candidateExtId = refs.candidates[i].external_id;
        rows.push({
          external_id: `${externalIdPrefix}nom_cand_${String(i).padStart(4, '0')}`,
          project_id: projectId,
          candidate: { external_id: candidateExtId },
          election: { external_id: electionExtId },
          constituency: { external_id: constituencyExtId },
          election_round: 1
          // No parent_nomination — Phase 56 candidate nominations are
          // top-level for simplicity (sidesteps parent-consistency trigger).
          // No organization ref — that redundancy was the legacy tests/
          // workaround (RESEARCH §9); dev-seed emits clean refs.
        });
      }
    }

    // Cast back to TablesInsert<'nominations'>[] — the polymorphic refs +
    // sentinels are part of the shape bulk_import consumes (migration lines
    // 2625–2634 relationship map).
    return rows as Array<TablesInsert<'nominations'>>;
  }

  /**
   * GEN-08 in-memory ref validation per D-07.3.
   *
   * Runs before any candidate-type nomination is emitted. Throws a
   * descriptive error pointing at the missing ref category, surfacing in
   * the pipeline's exception path with clear diagnostics — far better than
   * bulk_import's `RAISE EXCEPTION 'External reference not found: ...'`
   * trace from resolve_external_ref.
   */
  private assertRefsPopulated(): void {
    const { refs } = this.ctx;
    const missing: Array<string> = [];
    if (refs.candidates.length === 0) missing.push('candidates');
    if (refs.elections.length === 0) missing.push('elections');
    if (refs.constituencies.length === 0) missing.push('constituencies');
    if (missing.length > 0) {
      throw new Error(
        `[dev-seed] NominationsGenerator: cannot emit candidate nominations — ctx.refs is empty for: ${missing.join(', ')}. Ensure the pipeline runs in D-06 topo order (candidates/elections/constituencies BEFORE nominations) and that the template requests non-zero counts for these entities. Required refs must be populated before NominationsGenerator.generate() is called.`
      );
    }
  }
}
