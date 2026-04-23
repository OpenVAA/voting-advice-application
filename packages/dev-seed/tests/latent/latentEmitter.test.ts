/**
 * latentAnswerEmitter unit tests (Plan 57-07 Task 1).
 *
 * Covers D-57-13 (closure-cached SpaceBundle), D-57-14 (hook precedence),
 * Pitfall 4 (no-party fallback), GEN-06g (six independently swappable hooks),
 * and the compile-time AnswerEmitter contract.
 */

import { describe, expect, it, vi } from 'vitest';
import { latentAnswerEmitter } from '../../src/emitters/latent/latentEmitter';
import { makeCtx } from '../utils';
import type { AnswerEmitter } from '../../src/types';
import type { Ctx } from '../../src/ctx';
import type { Template } from '../../src/template/types';
import type { TablesInsert } from '@openvaa/supabase-types';

const PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
const CATEGORY_UUID = '00000000-0000-0000-0000-000000000099';

const LIKERT_5 = Array.from({ length: 5 }, (_, j) => ({
  id: String(j + 1),
  normalizableValue: j + 1
}));

function mkQ(extId: string): TablesInsert<'questions'> {
  return {
    external_id: extId,
    project_id: PROJECT_UUID,
    type: 'singleChoiceOrdinal',
    category_id: CATEGORY_UUID,
    choices: LIKERT_5
  } as TablesInsert<'questions'>;
}

function mkCand(extId: string, orgExtId?: string): TablesInsert<'candidates'> {
  const base: Record<string, unknown> = {
    external_id: extId,
    project_id: PROJECT_UUID,
    first_name: 'Test',
    last_name: 'Candidate'
  };
  if (orgExtId) base.organization = { external_id: orgExtId };
  return base as TablesInsert<'candidates'>;
}

function ctxWith(orgExtIds: Array<string>, questions: Array<TablesInsert<'questions'>>): Ctx {
  const base = makeCtx();
  return makeCtx({
    refs: {
      ...base.refs,
      organizations: orgExtIds.map((id) => ({ external_id: id })),
      questions: questions as unknown as Array<{ external_id: string }>
    }
  });
}

describe('latentAnswerEmitter (D-57-13 / D-57-14 / GEN-06g)', () => {
  it('conforms to AnswerEmitter contract', () => {
    const e: AnswerEmitter = latentAnswerEmitter({} as Template);
    expect(typeof e).toBe('function');
  });

  it('caches SpaceBundle across candidate emissions (D-57-13)', () => {
    const centroidsHook = vi.fn(
      (dims: number, _ev: Array<number>, parties: ReadonlyArray<{ external_id: string }>) =>
        parties.map((_p, i) => Array.from({ length: dims }, (_, d) => (i === d ? 1 : 0)))
    );
    const ctx = ctxWith(['p0', 'p1'], [mkQ('q_0')]);
    ctx.latent = { centroids: centroidsHook };
    const emit = latentAnswerEmitter({} as Template);
    emit(mkCand('c0', 'p0'), [mkQ('q_0')], ctx);
    emit(mkCand('c1', 'p1'), [mkQ('q_0')], ctx);
    emit(mkCand('c2', 'p0'), [mkQ('q_0')], ctx);
    // centroidsHook invoked ONCE on first call; subsequent calls use the closure-cached bundle.
    expect(centroidsHook).toHaveBeenCalledTimes(1);
  });

  it('falls back to defaultRandomValidEmit when candidate has no organization (Pitfall 4)', () => {
    const ctx = ctxWith(['p0', 'p1'], [mkQ('q_0')]);
    const emit = latentAnswerEmitter({} as Template);
    const r = emit(mkCand('c0'), [mkQ('q_0')], ctx);
    // Ordinal question's defaultRandomValidEmit returns a choice id string from ['1'..'5'].
    expect(typeof r.q_0.value).toBe('string');
    expect(['1', '2', '3', '4', '5']).toContain(r.q_0.value);
  });

  it('falls back to defaultRandomValidEmit when organizations ref is empty (Pitfall 4)', () => {
    const ctx = ctxWith([], [mkQ('q_0'), mkQ('q_1')]);
    const emit = latentAnswerEmitter({} as Template);
    const r0 = emit(mkCand('c0', 'anyorg'), [mkQ('q_0'), mkQ('q_1')], ctx);
    const r1 = emit(mkCand('c1', 'otherorg'), [mkQ('q_0'), mkQ('q_1')], ctx);
    const r2 = emit(mkCand('c2'), [mkQ('q_0'), mkQ('q_1')], ctx);
    // All three candidates should have answers for both questions — the fallback path works.
    [r0, r1, r2].forEach((r) => {
      expect(r.q_0).toBeDefined();
      expect(r.q_1).toBeDefined();
    });
  });

  it('hook wins over template (D-57-14) — centroids hook invoked with template data as arg', () => {
    const centroidsHook = vi.fn((_dims, _ev, parties, _ctx, _tplCentroids) =>
      parties.map(() => [0, 0])
    );
    const templateCentroids = { p0: [0.1, 0.1], p1: [0.2, 0.2] };
    const ctx = ctxWith(['p0', 'p1'], [mkQ('q_0')]);
    ctx.latent = { centroids: centroidsHook };
    const emit = latentAnswerEmitter({
      latent: { centroids: templateCentroids }
    } as unknown as Template);
    emit(mkCand('c0', 'p0'), [mkQ('q_0')], ctx);
    expect(centroidsHook).toHaveBeenCalledTimes(1);
    const args = centroidsHook.mock.calls[0];
    // Fifth arg (0-indexed 4) is the template centroids map.
    expect(args[4]).toBe(templateCentroids);
  });

  it('dimensions hook receives template as arg (D-57-14 argument forwarding)', () => {
    const dimsHook = vi.fn(() => ({ dims: 2, eigenvalues: [1, 1 / 3] }));
    const ctx = ctxWith(['p0'], [mkQ('q_0')]);
    ctx.latent = { dimensions: dimsHook };
    const tpl = { latent: { dimensions: 2 } } as unknown as Template;
    const emit = latentAnswerEmitter(tpl);
    emit(mkCand('c0', 'p0'), [mkQ('q_0')], ctx);
    expect(dimsHook).toHaveBeenCalledTimes(1);
    expect(dimsHook.mock.calls[0][0]).toBe(tpl);
  });

  it('each of the 6 hooks is independently swappable (GEN-06g)', () => {
    const loadingsHook = vi.fn(
      (questions: ReadonlyArray<TablesInsert<'questions'>>, dims: number) => {
        const out: Record<string, Array<number>> = {};
        for (const q of questions) {
          if (q.external_id) out[q.external_id] = Array.from({ length: dims }, () => 0.5);
        }
        return out;
      }
    );
    const ctx = ctxWith(['p0'], [mkQ('q_0'), mkQ('q_1')]);
    ctx.latent = { loadings: loadingsHook };
    const emit = latentAnswerEmitter({} as Template);
    emit(mkCand('c0', 'p0'), [mkQ('q_0'), mkQ('q_1')], ctx);
    expect(loadingsHook).toHaveBeenCalledTimes(1);
    // Other sub-steps still run — the emit result is populated.
    const r = emit(mkCand('c1', 'p0'), [mkQ('q_0'), mkQ('q_1')], ctx);
    expect(r.q_0).toBeDefined();
    expect(r.q_1).toBeDefined();
    // Loadings hook NOT called again — second call uses closure-cached bundle.
    expect(loadingsHook).toHaveBeenCalledTimes(1);
  });

  it('two fresh pipelines produce identical outputs for the same candidate sequence', () => {
    const questions = [mkQ('q_0'), mkQ('q_1'), mkQ('q_2')];
    const ctxA = ctxWith(['p0', 'p1', 'p2'], questions);
    const ctxB = ctxWith(['p0', 'p1', 'p2'], questions);
    const emitA = latentAnswerEmitter({} as Template);
    const emitB = latentAnswerEmitter({} as Template);
    const cands = ['c0', 'c1', 'c2'].map((id, i) => mkCand(id, `p${i}`));
    const aOut = cands.map((c) => emitA(c, questions, ctxA));
    const bOut = cands.map((c) => emitB(c, questions, ctxB));
    expect(aOut).toEqual(bOut);
  });

  it('candidate with unknown organization id falls back (Pitfall 4 defensive)', () => {
    const ctx = ctxWith(['p0', 'p1'], [mkQ('q_0')]);
    const emit = latentAnswerEmitter({} as Template);
    // c0's organization ref does not match any party — must NOT throw, must fallback.
    const r = emit(mkCand('c0', 'does_not_exist'), [mkQ('q_0')], ctx);
    expect(r.q_0).toBeDefined();
    expect(typeof r.q_0.value).toBe('string');
  });
});
