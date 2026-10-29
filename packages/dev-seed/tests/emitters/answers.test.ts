/**
 * `defaultRandomValidEmit` range guard.
 *
 * The emitter's contract is "random VALID per question type". For a `number` question, valid means *inside the range the question itself declares* in `custom_data.min` / `custom_data.max` — the same range `NumberQuestion.isMatchable` reads and the same range `normalizeCoordinate` (`@openvaa/core`) throws outside of.
 *
 * The defect this guards against: the `number` branch drew from a hardcoded `0–100` regardless of the declared range, so the default template's one number question (`{ min: 0, max: 10 }`) received answers up to 100. That was latent until candidates became anon-visible — at which point the voter app began normalizing those answers and threw on render.
 *
 * Both bounds are read back OFF THE QUESTION ROW rather than written as literals in the assertion, so the guard follows a template that later changes its range instead of silently passing for the wrong reason.
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { describe, expect, it } from 'vitest';
import { defaultRandomValidEmit } from '../../src/emitters/answers';
import { makeCtx } from '../utils';
import type { Enums, TablesInsert } from '@openvaa/supabase-types';

const PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
const CATEGORY_UUID = '00000000-0000-0000-0000-000000000099';

/**
 * Enough draws that a `0–100` draw against a narrow declared range is certain to be observed: for `[0, 10]` the per-draw escape probability is ~90/101, so 100 draws miss it with probability ~1e-100.
 */
const ITERATIONS = 100;

/** The documented fallback for a question that declares no range at all. */
const FALLBACK = { min: 0, max: 100 };

function mkNumberQ(extId: string, customData?: unknown): TablesInsert<'questions'> {
  return {
    external_id: extId,
    project_id: PROJECT_UUID,
    type: 'number' satisfies Enums<'question_type'>,
    category_id: CATEGORY_UUID,
    ...(customData !== undefined ? { custom_data: customData } : {})
  } as TablesInsert<'questions'>;
}

/** Read the declared bounds back off the row — never hardcoded in the assertion. */
function declaredRange(q: TablesInsert<'questions'>): { min: number; max: number } {
  const cd = (q.custom_data ?? {}) as { min?: unknown; max?: unknown };
  return {
    min: typeof cd.min === 'number' ? cd.min : FALLBACK.min,
    max: typeof cd.max === 'number' ? cd.max : FALLBACK.max
  };
}

/**
 * Draw `ITERATIONS` answers for `q` through the PRODUCTION emit path — one shared `Ctx` so the seeded Faker advances between calls (a fresh `makeCtx()` per call re-seeds to 42 and would return the same value every time).
 */
function drawMany(q: TablesInsert<'questions'>): Array<number> {
  const ctx = makeCtx();
  const cand = { external_id: 'seed_c_test', project_id: PROJECT_UUID } as TablesInsert<'candidates'>;
  const out: Array<number> = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const emitted = defaultRandomValidEmit(cand, [q], ctx);
    out.push(emitted[q.external_id as string].value as number);
  }
  return out;
}

describe('defaultRandomValidEmit — number answers respect the declared range (TMPL-03)', () => {
  // Two declared ranges, so a fix that merely hardcodes the default template's `[0, 10]` cannot satisfy this guard either.
  it.each([
    { label: "the default template's number question", custom_data: { min: 0, max: 10 } },
    { label: 'a narrow off-centre range', custom_data: { min: 3, max: 6 } }
  ])('emits inside custom_data.min/max for $label', ({ custom_data }) => {
    const q = mkNumberQ('seed_q_ranged', custom_data);
    const { min, max } = declaredRange(q);
    const values = drawMany(q);
    const offenders = values.filter((v) => typeof v !== 'number' || v < min || v > max);
    expect(
      offenders,
      `${offenders.length}/${ITERATIONS} emitted number answers fall outside the range the question declares ` +
        `[${min}, ${max}] — e.g. ${String(offenders[0])} (observed span ${Math.min(...values)}–${Math.max(...values)})`
    ).toEqual([]);
  });

  it('falls back to the documented 0–100 span when the question declares no range', () => {
    const q = mkNumberQ('seed_q_unranged');
    const { min, max } = declaredRange(q);
    expect({ min, max }).toEqual(FALLBACK);
    const values = drawMany(q);
    const offenders = values.filter((v) => typeof v !== 'number' || v < min || v > max);
    expect(
      offenders,
      `${offenders.length}/${ITERATIONS} emitted number answers fall outside the documented fallback [${min}, ${max}]`
    ).toEqual([]);
    // The fallback must remain a real span, not a collapsed constant.
    expect(new Set(values).size).toBeGreaterThan(1);
  });
});
