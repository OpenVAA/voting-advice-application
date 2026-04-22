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
});
