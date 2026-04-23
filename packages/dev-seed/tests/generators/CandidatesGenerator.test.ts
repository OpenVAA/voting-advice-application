/**
 * CandidatesGenerator unit tests.
 *
 * D-22 acceptance (a)–(e) plus the D-27 answer-emitter seam — the contract that
 * Phase 57's latent-factor emitter will drop in unchanged:
 *   - Default path: `ctx.answerEmitter` undefined → `defaultRandomValidEmit`
 *   - Injected path: `ctx.answerEmitter = customEmitter` → custom function called
 *
 * Plus organization-ref attach/omit behavior and `answersByExternalId` sentinel
 * emission (stripped by bulk_import; consumed by Plan 07's `importAnswers`).
 *
 * Pipeline contract: `ctx.refs.questions` carries full question rows (not just
 * ext_id stubs) after QuestionsGenerator runs. Tests cast through `unknown` at
 * the ref-injection seam to match CandidatesGenerator's internal re-cast.
 */

import { describe, expect, it, vi } from 'vitest';
import { CandidatesGenerator } from '../../src/generators/CandidatesGenerator';
import { makeCtx } from '../utils';
import type { TablesInsert } from '@openvaa/supabase-types';
import type { AnswerEmitter } from '../../src/types';

const ORG_REF = { external_id: 'seed_party_01' };

const SAMPLE_QUESTION: TablesInsert<'questions'> = {
  external_id: 'seed_q_001',
  project_id: '00000000-0000-0000-0000-000000000001',
  type: 'boolean',
  // category_id NOT NULL on TablesInsert but the pipeline supplies full question
  // rows with IDs resolved post-insert. Tests can cast-through since they only
  // exercise the emitter seam, not the writer.
  category_id: '00000000-0000-0000-0000-000000000099'
};

// Narrow cast target for refs.questions — the generator casts it back to
// Array<TablesInsert<'questions'>> internally (see src/generators/CandidatesGenerator.ts).
const questionRefs = [SAMPLE_QUESTION] as unknown as Array<{ external_id: string }>;

describe('CandidatesGenerator', () => {
  it('honors count from fragment', () => {
    const base = makeCtx();
    const gen = new CandidatesGenerator(makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } }));
    expect(gen.generate({ count: 5 })).toHaveLength(5);
  });

  it('applies externalIdPrefix (GEN-04)', () => {
    const gen = new CandidatesGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_cand_/));
  });

  it('passes through fixed[] rows modulo prefix', () => {
    const gen = new CandidatesGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_c', first_name: 'Alice', last_name: 'Example' }]
    });
    expect(rows).toHaveLength(1);
    expect(rows[0].external_id).toBe('seed_my_c');
    expect(rows[0].first_name).toBe('Alice');
    expect(rows[0].last_name).toBe('Example');
  });

  it('produces deterministic output for same seed', () => {
    const base = makeCtx();
    const ctxA = makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } });
    const ctxB = makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } });
    const run1 = new CandidatesGenerator(ctxA).generate({ count: 3 });
    const run2 = new CandidatesGenerator(ctxB).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('attaches organization ref when refs.organizations populated', () => {
    const base = makeCtx();
    const gen = new CandidatesGenerator(makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } }));
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => {
      const rowAny = r as unknown as { organization?: { external_id: string } };
      expect(rowAny.organization).toEqual(ORG_REF);
    });
  });

  it('omits organization ref when refs.organizations empty', () => {
    const gen = new CandidatesGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0]).not.toHaveProperty('organization');
  });

  it('D-27 seam: uses defaultRandomValidEmit when ctx.answerEmitter is undefined', () => {
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs }
      })
    );
    const rows = gen.generate({ count: 1 });
    const rowAny = rows[0] as unknown as {
      answersByExternalId?: Record<string, { value: unknown }>;
    };
    expect(rowAny.answersByExternalId).toBeDefined();
    expect(rowAny.answersByExternalId!['seed_q_001']).toBeDefined();
    // defaultRandomValidEmit for 'boolean' type → boolean value
    expect(typeof rowAny.answersByExternalId!['seed_q_001'].value).toBe('boolean');
  });

  it('D-27 seam: uses ctx.answerEmitter when provided (Phase 57 path)', () => {
    const customEmitter: AnswerEmitter = vi.fn(() => ({
      seed_q_001: { value: 'CUSTOM_VALUE' }
    }));
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs },
        answerEmitter: customEmitter
      })
    );
    const rows = gen.generate({ count: 1 });
    expect(customEmitter).toHaveBeenCalledTimes(1);
    const rowAny = rows[0] as unknown as {
      answersByExternalId?: Record<string, { value: unknown }>;
    };
    expect(rowAny.answersByExternalId!['seed_q_001'].value).toBe('CUSTOM_VALUE');
  });

  it('omits answersByExternalId when refs.questions empty', () => {
    const base = makeCtx();
    const gen = new CandidatesGenerator(makeCtx({ refs: { ...base.refs, organizations: [ORG_REF] } }));
    const rows = gen.generate({ count: 1 });
    expect(rows[0]).not.toHaveProperty('answersByExternalId');
  });

  it('forwards candidate.organization into ctx.answerEmitter when refs.organizations populated (D-57 Interpretation Note)', () => {
    // B1 regression test: pins the `candidateForEmit` literal to include the
    // organization ref. Prevents future narrowing that would silently break
    // Phase 57 latent emitter's findPartyIndex.
    const spy = vi.fn(() => ({ seed_q_001: { value: true } })) as unknown as AnswerEmitter;
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs },
        answerEmitter: spy
      })
    );
    gen.generate({ count: 1 });
    const mockCalls = (spy as unknown as { mock: { calls: Array<Array<unknown>> } }).mock.calls;
    expect(mockCalls).toHaveLength(1);
    const candidateArg = mockCalls[0][0] as { organization?: { external_id: string } };
    expect(candidateArg.organization).toBeDefined();
    expect(candidateArg.organization).toEqual(ORG_REF);
  });

  it('does NOT forward organization property when refs.organizations is empty (Phase 56 invariant preserved)', () => {
    // Preserves the existing `omits organization ref when refs.organizations empty`
    // shape on the emitter boundary too — not just on the emitted row.
    const spy = vi.fn(() => ({ seed_q_001: { value: true } })) as unknown as AnswerEmitter;
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, questions: questionRefs },
        answerEmitter: spy
      })
    );
    gen.generate({ count: 1 });
    const mockCalls = (spy as unknown as { mock: { calls: Array<Array<unknown>> } }).mock.calls;
    expect(mockCalls).toHaveLength(1);
    const candidateArg = mockCalls[0][0] as { organization?: { external_id: string } };
    expect(candidateArg).not.toHaveProperty('organization');
  });

  it('D-57-20 (a): fixed row with answersByExternalId is used verbatim — emitter NOT invoked', () => {
    // Fixed rows with pre-supplied answersByExternalId must bypass the emitter
    // entirely. D-57-20 bullet 1.
    const spy = vi.fn(() => ({ seed_q_001: { value: true } })) as unknown as AnswerEmitter;
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs },
        answerEmitter: spy
      })
    );
    const supplied = { seed_q_001: { value: 'hand_authored' } };
    const rows = gen.generate({
      count: 0,
      fixed: [
        {
          external_id: 'hand_c',
          first_name: 'Hand',
          last_name: 'Authored',
          // `answersByExternalId` is not on the TablesInsert<'candidates'> surface;
          // it's a sentinel field the writer layer reads. Cast through.
          ...({ answersByExternalId: supplied } as unknown as Record<string, unknown>)
        }
      ]
    });
    expect(rows).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0); // D-57-20: emitter NOT invoked for fixed rows
    const rowAny = rows[0] as unknown as {
      answersByExternalId?: Record<string, { value: unknown }>;
    };
    expect(rowAny.answersByExternalId).toEqual(supplied);
  });

  it('D-57-20 (b): fixed row without answersByExternalId — emitter NOT invoked; row carries no synthesized answers', () => {
    // D-57-20 bullet 2: fixed rows skip the latent pipeline entirely. The
    // generator does NOT invoke the emitter for fixed rows. If a consumer wants
    // answers on a fixed row, they supply answersByExternalId (branch a above).
    const spy = vi.fn(() => ({ seed_q_001: { value: true } })) as unknown as AnswerEmitter;
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs },
        answerEmitter: spy
      })
    );
    const rows = gen.generate({
      count: 0,
      fixed: [
        {
          external_id: 'bare_c',
          first_name: 'Bare',
          last_name: 'Fixed'
          // no answersByExternalId
        }
      ]
    });
    expect(rows).toHaveLength(1);
    expect(spy).toHaveBeenCalledTimes(0); // D-57-20: fixed row → emitter skipped
    const rowAny = rows[0] as unknown as {
      answersByExternalId?: Record<string, { value: unknown }>;
    };
    expect(rowAny.answersByExternalId).toBeUndefined();
  });

  it('D-57-20 (c): synthetic (count-generated) rows always run through the latent emitter', () => {
    // D-57-20 bullet 3: synthetic rows always go through ctx.answerEmitter (the
    // latent emitter in production wiring). Emitter invoked once per synthetic
    // row; each candidate arg carries `organization` (from Task 0's amendment).
    const spy = vi.fn(() => ({ seed_q_001: { value: false } })) as unknown as AnswerEmitter;
    const base = makeCtx();
    const gen = new CandidatesGenerator(
      makeCtx({
        refs: { ...base.refs, organizations: [ORG_REF], questions: questionRefs },
        answerEmitter: spy
      })
    );
    const rows = gen.generate({ count: 3 });
    expect(rows).toHaveLength(3);
    expect(spy).toHaveBeenCalledTimes(3); // D-57-20: once per synthetic row
    const mockCalls = (spy as unknown as { mock: { calls: Array<Array<unknown>> } }).mock.calls;
    mockCalls.forEach((args) => {
      const cand = args[0] as { organization?: { external_id: string } };
      // Every synthetic call received the organization ref forwarded by Task 0.
      expect(cand.organization).toEqual(ORG_REF);
    });
  });
});
