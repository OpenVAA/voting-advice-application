/**
 * Pipeline orchestration tests — cross-cutting coverage that no single generator owns.
 *
 * Covers:
 *   - TMPL-02: `{}` template produces a valid row-set for every real entity
 *     (accounts/projects/feedback/app_settings/alliances/factions/nominations
 *     default to 0 rows per D-18 / per-generator defaults; the seven
 *     "content" entities always have ≥1 row).
 *   - GEN-03 / D-25: override signature `(fragment, ctx) => Rows[]` fully
 *     replaces the built-in generator's output for that table AND receives
 *     the pipeline's ctx (projectId + seeded faker) as second arg.
 *   - D-08: template fragment wins field-by-field over the generator's
 *     `defaults(ctx)` (template-over-defaults merge order).
 *   - Post-topo sentinel enrichment: `_constituencyGroups` on elections,
 *     `_constituencies` on constituency_groups, `_elections` on
 *     question_categories (sentinels computed from the FINAL ref graph after
 *     every generator has run — Plan 07's post-topo pass).
 *   - Phase 56 topo refinement: `questions` run BEFORE `candidates` so
 *     CandidatesGenerator's answer emitter (D-27 seam) can read question rows
 *     from `ctx.refs.questions`. Validated indirectly via
 *     `candidates[i].answersByExternalId` being populated with one entry per
 *     question.
 *   - GEN-08 end-to-end nomination wiring (plan-checker ISS-05): the default
 *     `{}` template emits zero nominations because NominationsGenerator's
 *     `defaults(ctx)` returns `{ count: 0 }`, so Phase 56 Success Criterion 5
 *     is NOT exercised by TMPL-02. This file therefore asserts the full
 *     GEN-08 graph wires correctly when the template DOES request
 *     nominations: `{ nominations: { count: 2 } }` produces 2 rows with
 *     populated candidate / election / constituency refs that correspond to
 *     entities actually present in the pipeline output (no orphan FKs).
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it, vi } from 'vitest';
import { buildCtx } from '../src/ctx';
import { runPipeline } from '../src/pipeline';
import type { Ctx } from '../src/ctx';

describe('runPipeline', () => {
  it('TMPL-02: {} template produces non-empty output for every "content" entity', () => {
    const out = runPipeline({});

    // The seven entities that have non-zero `defaults(ctx).count` in Wave 3 generators.
    expect(out.elections.length).toBeGreaterThan(0);
    expect(out.constituency_groups.length).toBeGreaterThan(0);
    expect(out.constituencies.length).toBeGreaterThan(0);
    expect(out.organizations.length).toBeGreaterThan(0);
    expect(out.question_categories.length).toBeGreaterThan(0);
    expect(out.questions.length).toBeGreaterThan(0);
    expect(out.candidates.length).toBeGreaterThan(0);

    // Entities with default count = 0 per D-18 — pipeline still emits the key.
    expect(Array.isArray(out.accounts)).toBe(true);
    expect(Array.isArray(out.projects)).toBe(true);
    expect(Array.isArray(out.alliances)).toBe(true);
    expect(Array.isArray(out.factions)).toBe(true);
    expect(Array.isArray(out.nominations)).toBe(true);
    expect(Array.isArray(out.app_settings)).toBe(true);
    expect(Array.isArray(out.feedback)).toBe(true);
  });

  it('D-25: override fully replaces the built-in generator output', () => {
    const out = runPipeline({}, { elections: () => [] });
    expect(out.elections).toEqual([]);
    // Other entities still flow normally.
    expect(out.organizations.length).toBeGreaterThan(0);
  });

  it('D-25: override receives (fragment, ctx) with seeded faker + projectId', () => {
    const overrideSpy = vi.fn((_fragment: unknown, ctx: Ctx) => [
      { external_id: 'override_el_0', project_id: ctx.projectId }
    ]);
    runPipeline({ elections: { count: 3 } }, { elections: overrideSpy });

    expect(overrideSpy).toHaveBeenCalledTimes(1);
    const [receivedFragment, receivedCtx] = overrideSpy.mock.calls[0];

    // Fragment carries the template's count (D-08 merged fragment).
    expect(receivedFragment).toMatchObject({ count: 3 });

    // Ctx exposes the seeded faker + the bootstrap project UUID.
    expect(receivedCtx.projectId).toBe('00000000-0000-0000-0000-000000000001');
    expect(receivedCtx.faker).toBeDefined();
    expect(typeof receivedCtx.faker.person.firstName).toBe('function');
  });

  it('D-08: template fragment wins over generator defaults', () => {
    // ElectionsGenerator.defaults returns { count: 1 }; template supplies 5.
    const out = runPipeline({ elections: { count: 5 } });
    expect(out.elections).toHaveLength(5);
  });

  it('post-topo: every election has _constituencyGroups sentinel with all group external_ids', () => {
    const out = runPipeline({});
    const allGroupExtIds = out.constituency_groups.map((g) => g.external_id);

    out.elections.forEach((el) => {
      const elRow = el as Record<string, unknown>;
      expect(elRow._constituencyGroups).toBeDefined();
      const sentinel = elRow._constituencyGroups as { externalId: Array<string> };
      expect(Array.isArray(sentinel.externalId)).toBe(true);
      // Full-fanout strategy (Phase 56): every election gets ALL groups.
      expect(sentinel.externalId).toEqual(allGroupExtIds);
    });
  });

  it('post-topo: every constituency_group has _constituencies sentinel with all constituency external_ids', () => {
    const out = runPipeline({});
    const allConstituencyExtIds = out.constituencies.map((c) => c.external_id);

    out.constituency_groups.forEach((cg) => {
      const cgRow = cg as Record<string, unknown>;
      expect(cgRow._constituencies).toBeDefined();
      const sentinel = cgRow._constituencies as { externalId: Array<string> };
      expect(sentinel.externalId).toEqual(allConstituencyExtIds);
    });
  });

  it('post-topo: every question_category has _elections sentinel with all election external_ids', () => {
    const out = runPipeline({});
    const allElectionExtIds = out.elections.map((e) => e.external_id);

    out.question_categories.forEach((qc) => {
      const qcRow = qc as Record<string, unknown>;
      expect(qcRow._elections).toBeDefined();
      const sentinel = qcRow._elections as { externalId: Array<string> };
      expect(sentinel.externalId).toEqual(allElectionExtIds);
    });
  });

  it('topo refinement: questions run before candidates (answersByExternalId populated)', () => {
    const out = runPipeline({});
    const firstCandidate = out.candidates[0] as Record<string, unknown>;
    // If questions had NOT run first, refs.questions would be empty and
    // CandidatesGenerator's answer emitter would skip — sentinel would be absent.
    expect(firstCandidate.answersByExternalId).toBeDefined();
    const answers = firstCandidate.answersByExternalId as Record<string, unknown>;
    // One answer per question (the emitter iterates ctx.refs.questions).
    expect(Object.keys(answers)).toHaveLength(out.questions.length);
  });

  it('override map uses TOPO_ORDER table names (D-06)', () => {
    // Spot-check that an override keyed to a mid-topo table still replaces its output.
    const out = runPipeline({}, { organizations: () => [] });
    expect(out.organizations).toEqual([]);
  });

  it('accepts a pre-populated ctx as optional third argument (logger flows to generators)', () => {
    // NominationsGenerator clamps count to refs.candidates.length and calls
    // ctx.logger with a warning. Requesting 100 > default 8 candidates triggers
    // the warning; the test verifies the caller-supplied ctx is threaded through.
    const logger = vi.fn();
    const customCtx: Ctx = { ...buildCtx({}), logger };
    runPipeline({ nominations: { count: 100 } }, {}, customCtx);
    expect(logger).toHaveBeenCalled();
    expect(logger.mock.calls.some((call) => String(call[0]).includes('Clamped'))).toBe(true);
  });

  // GEN-08 end-to-end nomination wiring (plan-checker ISS-05).
  //
  // The `{}` template emits zero nominations because NominationsGenerator's
  // `defaults(ctx)` returns `{ count: 0 }` — so Phase 56 Success Criterion 5
  // ("GEN-08 graph wires end-to-end") is NOT exercised by TMPL-02 alone.
  // This test provides the ONLY runtime proof that the full graph wires:
  // nominations carry candidate / election / constituency refs that point
  // to entities actually present in the pipeline output.
  it('GEN-08: nominations: { count: 2 } emits 2 rows with refs pointing to real entities', () => {
    const out = runPipeline({ nominations: { count: 2 } });

    expect(out.nominations).toHaveLength(2);

    const candidateExtIds = new Set(out.candidates.map((c) => c.external_id as string));
    const electionExtIds = new Set(out.elections.map((e) => e.external_id as string));
    const constituencyExtIds = new Set(out.constituencies.map((c) => c.external_id as string));

    out.nominations.forEach((nom) => {
      const nomRow = nom as Record<string, unknown>;

      // Candidate ref — polymorphic CHECK constraint: candidate-type nomination.
      const candRef = nomRow.candidate as { external_id: string } | undefined;
      expect(candRef).toBeDefined();
      expect(typeof candRef!.external_id).toBe('string');
      expect(candidateExtIds.has(candRef!.external_id)).toBe(true);

      // Election ref.
      const elRef = nomRow.election as { external_id: string } | undefined;
      expect(elRef).toBeDefined();
      expect(electionExtIds.has(elRef!.external_id)).toBe(true);

      // Constituency ref.
      const conRef = nomRow.constituency as { external_id: string } | undefined;
      expect(conRef).toBeDefined();
      expect(constituencyExtIds.has(conRef!.external_id)).toBe(true);
    });
  });
});
