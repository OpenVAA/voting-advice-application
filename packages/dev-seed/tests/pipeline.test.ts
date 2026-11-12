/**
 * Pipeline orchestration tests — cross-cutting coverage that no single generator owns.
 *
 * Covers:
 *   `{}` template produces a valid row-set for every real entity (accounts/projects/feedback/app_settings/alliances/factions/nominations default to 0 rows per the per-generator defaults; the seven "content" entities always have ≥1 row).
 *   override signature `(fragment, ctx) => Rows ` fully replaces the built-in generator's output for that table AND receives the pipeline's ctx (projectId + seeded faker) as second arg.
 *   template fragment wins field-by-field over the generator's `defaults(ctx)` (template-over-defaults merge order).
 *   - Post-topo sentinel enrichment: `_constituencyGroups` on elections, `_constituencies` on constituency_groups, `_elections` on question_categories (sentinels computed from the FINAL ref graph after every generator has run — the post-topo pass).
 *   - topo refinement: `questions` run BEFORE `candidates` so CandidatesGenerator's answer emitter (seam) can read question rows from `ctx.refs.questions`. Validated indirectly via `candidates[i].answersByExternalId` being populated with one entry per question.
 *   - end-to-end nomination wiring (plan-checker): the default `{}` template emits zero nominations because NominationsGenerator's `defaults(ctx)` returns `{ count: 0 }`, so the wiring is NOT exercised by the empty template. This file therefore asserts the full graph wires correctly when the template DOES request nominations: `{ nominations: { count: 2 } }` produces 2 rows with populated candidate / election / constituency refs that correspond to entities actually present in the pipeline output (no orphan FKs).
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { describe, expect, it, vi } from 'vitest';
import { buildCtx } from '../src/ctx';
import { runPipeline } from '../src/pipeline';
import type { Ctx } from '../src/ctx';

describe('runPipeline', () => {
  it('TMPL-02: {} template produces non-empty output for every "content" entity', () => {
    const out = runPipeline({});

    // The seven entities whose `defaults(ctx).count` is non-zero.
    expect(out.elections.length).toBeGreaterThan(0);
    expect(out.constituency_groups.length).toBeGreaterThan(0);
    expect(out.constituencies.length).toBeGreaterThan(0);
    expect(out.organizations.length).toBeGreaterThan(0);
    expect(out.question_categories.length).toBeGreaterThan(0);
    expect(out.questions.length).toBeGreaterThan(0);
    expect(out.candidates.length).toBeGreaterThan(0);

    // Entities with default count = 0 per — pipeline still emits the key.
    expect(Array.isArray(out.accounts)).toBe(true);
    expect(Array.isArray(out.projects)).toBe(true);
    expect(Array.isArray(out.alliances)).toBe(true);
    expect(Array.isArray(out.factions)).toBe(true);
    expect(Array.isArray(out.nominations)).toBe(true);
    expect(Array.isArray(out.app_settings)).toBe(true);
    expect(Array.isArray(out.feedback)).toBe(true);
  });

  it('override fully replaces the built-in generator output', () => {
    const out = runPipeline({}, { elections: () => [] });
    expect(out.elections).toEqual([]);
    // Other entities still flow normally.
    expect(out.organizations.length).toBeGreaterThan(0);
  });

  it('override receives (fragment, ctx) with seeded faker + projectId', () => {
    const overrideSpy = vi.fn((_fragment: unknown, ctx: Ctx) => [
      { external_id: 'override_el_0', project_id: ctx.projectId }
    ]);
    runPipeline({ elections: { count: 3 } }, { elections: overrideSpy });

    expect(overrideSpy).toHaveBeenCalledTimes(1);
    const [receivedFragment, receivedCtx] = overrideSpy.mock.calls[0];

    // Fragment carries the template's count (merged fragment).
    expect(receivedFragment).toMatchObject({ count: 3 });

    // Ctx exposes the seeded faker + the bootstrap project UUID.
    expect(receivedCtx.projectId).toBe('00000000-0000-0000-0000-000000000001');
    expect(receivedCtx.faker).toBeDefined();
    expect(typeof receivedCtx.faker.person.firstName).toBe('function');
  });

  it('template fragment wins over generator defaults', () => {
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
      // Full-fanout strategy: every election gets ALL groups.
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

  it('post-topo: per-row constituency_groups declaration on a fixed[] election overrides full-fanout', () => {
    const out = runPipeline({
      externalIdPrefix: '',
      elections: {
        count: 0,
        fixed: [
          {
            external_id: 'el_a',
            constituency_groups: [{ external_id: 'cg_a' }]
          },
          { external_id: 'el_b' }
        ]
      },
      constituency_groups: {
        count: 0,
        fixed: [{ external_id: 'cg_a' }, { external_id: 'cg_b' }]
      }
    });

    const elA = out.elections.find((e) => e.external_id === 'el_a') as Record<string, unknown>;
    const elB = out.elections.find((e) => e.external_id === 'el_b') as Record<string, unknown>;

    // el_a declared cg_a inline → fanout sentinel is NOT attached; the original declaration is left intact for linkJoinTables to consume.
    expect(elA._constituencyGroups).toBeUndefined();
    expect(elA.constituency_groups).toEqual([{ external_id: 'cg_a' }]);

    // el_b declared nothing → still gets the full-fanout default.
    const sentinel = elB._constituencyGroups as { externalId: Array<string> };
    expect(sentinel.externalId).toEqual(['cg_a', 'cg_b']);
  });

  it('post-topo: per-row constituencies declaration on a fixed[] constituency_group overrides full-fanout', () => {
    const out = runPipeline({
      externalIdPrefix: '',
      constituency_groups: {
        count: 0,
        fixed: [{ external_id: 'cg_a', constituencies: [{ external_id: 'c_a' }] }, { external_id: 'cg_b' }]
      },
      constituencies: {
        count: 0,
        fixed: [{ external_id: 'c_a' }, { external_id: 'c_b' }]
      }
    });

    const cgA = out.constituency_groups.find((c) => c.external_id === 'cg_a') as Record<string, unknown>;
    const cgB = out.constituency_groups.find((c) => c.external_id === 'cg_b') as Record<string, unknown>;

    expect(cgA._constituencies).toBeUndefined();
    expect(cgA.constituencies).toEqual([{ external_id: 'c_a' }]);

    const sentinel = cgB._constituencies as { externalId: Array<string> };
    expect(sentinel.externalId).toEqual(['c_a', 'c_b']);
  });

  it('topo refinement: questions run before candidates (answersByExternalId populated)', () => {
    const out = runPipeline({});
    const firstCandidate = out.candidates[0] as Record<string, unknown>;
    // If questions had NOT run first, refs.questions would be empty and CandidatesGenerator's answer emitter would skip — sentinel would be absent.
    expect(firstCandidate.answersByExternalId).toBeDefined();
    const answers = firstCandidate.answersByExternalId as Record<string, unknown>;
    // One answer per question (the emitter iterates ctx.refs.questions).
    expect(Object.keys(answers)).toHaveLength(out.questions.length);
  });

  it('override map uses TOPO_ORDER table names', () => {
    // Spot-check that an override keyed to a mid-topo table still replaces its output.
    const out = runPipeline({}, { organizations: () => [] });
    expect(out.organizations).toEqual([]);
  });

  it('accepts a pre-populated ctx as optional third argument (logger flows to generators)', () => {
    // NominationsGenerator clamps count to refs.candidates.length and calls ctx.logger with a warning. Requesting 100 > default 8 candidates triggers the warning; the test verifies the caller-supplied ctx is threaded through.
    const logger = vi.fn();
    const customCtx: Ctx = { ...buildCtx({}), logger };
    runPipeline({ nominations: { count: 100 } }, {}, customCtx);
    expect(logger).toHaveBeenCalled();
    expect(logger.mock.calls.some((call) => String(call[0]).includes('Clamped'))).toBe(true);
  });

  // end-to-end nomination wiring (plan-checker).
  //
  // The `{}` template emits zero nominations because NominationsGenerator's `defaults(ctx)` returns `{ count: 0 }` — so "the graph wires end-to-end" is NOT exercised by the empty template alone.
  // This test provides the ONLY runtime proof that the full graph wires: nominations carry candidate / election / constituency refs that point to entities actually present in the pipeline output.
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

/**
 * Regression guard for debug session `tied-match-order-churn`.
 *
 * `get_nominations` orders `ORDER BY n.sort_order NULLS LAST, n.id`. When every seeded nomination left `sort_order` NULL that collapsed to `ORDER BY n.id` — a `gen_random_uuid()` surrogate key, freshly minted on every teardown+reseed.
 * The random row order reached `MatchingAlgorithm.match()` unchanged, and its STABLE distance sort left DISTANCE-TIED candidates in that random order, so a 10-way tie permuted on every visual run while every unique score stayed put.
 *
 * The oracle here is DERIVED, not implicit: the contract is "the emitted `sort_order` sequence is a total order that is a pure function of the template", which is what the RPC's ORDER BY needs to be deterministic.
 */
describe('runPipeline — nomination sort_order (tied-match-order-churn regression)', () => {
  const template = { nominations: { count: 3 } };

  it('assigns a sort_order to every nomination', () => {
    const out = runPipeline(template);

    expect(out.nominations.length).toBe(3);
    for (const nom of out.nominations) {
      expect(typeof nom.sort_order).toBe('number');
    }
  });

  it('numbers from 0 and is dense + strictly increasing (a total order)', () => {
    const out = runPipeline(template);

    // Boundary: the FIRST row must be 0, not 1 — a truthiness guard instead of a null-check would skip index 0 and leave it NULL, which is precisely the NULLS-LAST hole this fix closes.
    expect(out.nominations.map((n) => n.sort_order)).toEqual([0, 1, 2]);
  });

  it('is byte-identical across two independent pipeline runs of the same template', () => {
    const a = runPipeline(template).nominations.map((n) => [n.external_id, n.sort_order]);
    const b = runPipeline(template).nominations.map((n) => [n.external_id, n.sort_order]);

    expect(a).toEqual(b);
    // Two all-undefined sequences are also "equal" — assert the sequence is a real ordering key, or this test would stay green with the fix removed.
    expect(a.map(([, order]) => order)).toEqual([0, 1, 2]);
  });

  it('preserves an author-supplied sort_order, including the falsy 0', () => {
    const out = runPipeline({
      nominations: {
        count: 0,
        fixed: [
          { external_id: 'nom-a', sort_order: 900 },
          // Boundary: 0 is falsy. `!row.sort_order` would overwrite it with the emission index; the shipped `== null` check must not.
          { external_id: 'nom-b', sort_order: 0 },
          { external_id: 'nom-c' }
        ]
      }
    } as never);

    expect(out.nominations.map((n) => n.sort_order)).toEqual([900, 0, 2]);
  });

  it('covers the override path, which fully replaces the built-in generator', () => {
    const out = runPipeline(template, {
      nominations: () => [{ external_id: 'ovr-1' }, { external_id: 'ovr-2' }]
    } as never);

    expect(out.nominations.map((n) => n.sort_order)).toEqual([0, 1]);
  });

  it('is a no-op on an empty nominations set', () => {
    const out = runPipeline({});

    expect(out.nominations).toEqual([]);
  });

  it('handles the singleton boundary', () => {
    const out = runPipeline({ nominations: { count: 1 } });

    expect(out.nominations.map((n) => n.sort_order)).toEqual([0]);
  });
});
