/**
 * defaultProject unit tests (Plan 57-06 Task 1).
 *
 * Exercises the per-question-type dispatch in `src/emitters/latent/project.ts`:
 *   - Ordinal (singleChoiceOrdinal) via COORDINATE inverse-normalize (D-57-08).
 *   - Single-choice categorical (singleChoiceCategorical) via per-choice argmax (D-57-09).
 *   - Multi-choice categorical with ≥ 1 guarantee (D-57-09 + S-4).
 *   - Non-choice types delegate to `defaultRandomValidEmit` (D-57-10).
 *   - Cross-cutting: empty questions, missing external_id, contract assertion.
 *
 * Plus the A2 fix regression on QuestionsGenerator.LIKERT_5 — each choice
 * carries `normalizableValue: j + 1` per RESEARCH Open Question 2.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import type { Enums, TablesInsert } from '@openvaa/supabase-types';
import { describe, expect, it } from 'vitest';
import { defaultProject } from '../../src/emitters/latent/project';
import { QuestionsGenerator } from '../../src/generators/QuestionsGenerator';
import { makeCtx } from '../utils';

const PROJECT_UUID = '00000000-0000-0000-0000-000000000001';
const CATEGORY_UUID = '00000000-0000-0000-0000-000000000099';

function mkQ(extId: string, type: Enums<'question_type'>, choices?: unknown): TablesInsert<'questions'> {
  return {
    external_id: extId,
    project_id: PROJECT_UUID,
    type,
    category_id: CATEGORY_UUID,
    ...(choices !== undefined ? { choices } : {})
  } as TablesInsert<'questions'>;
}

const LIKERT_5_WITH_NV = Array.from({ length: 5 }, (_, j) => ({
  id: String(j + 1),
  label: { en: `Label ${j + 1}` },
  normalizableValue: j + 1
}));

const LIKERT_5_NO_NV = Array.from({ length: 5 }, (_, j) => ({
  id: String(j + 1),
  label: { en: `Label ${j + 1}` }
}));

const CAT_3 = [
  { id: 'a', label: { en: 'Option A' } },
  { id: 'b', label: { en: 'Option B' } },
  { id: 'c', label: { en: 'Option C' } }
];

describe('defaultProject (GEN-06f)', () => {
  // ---- Ordinal dispatch ----

  it('ordinal: z = COORDINATE.Max (position+loading align) → top choice id "5"', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_WITH_NV);
    const r = defaultProject([0.5, 0], { q_ord: [1, 0] }, [q], 0, makeCtx());
    expect(r.q_ord.value).toBe('5');
  });

  it('ordinal: z = COORDINATE.Min → bottom choice id "1"', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_WITH_NV);
    const r = defaultProject([-0.5, 0], { q_ord: [1, 0] }, [q], 0, makeCtx());
    expect(r.q_ord.value).toBe('1');
  });

  it('ordinal: z = 0 → middle choice id "3"', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_WITH_NV);
    const r = defaultProject([0, 0], { q_ord: [1, 0] }, [q], 0, makeCtx());
    expect(r.q_ord.value).toBe('3');
  });

  it('ordinal: always returns a string id, never index (Pitfall 5)', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_WITH_NV);
    for (let i = 0; i < 100; i++) {
      const ctx = makeCtx();
      ctx.faker.seed(i);
      const pos = [ctx.faker.number.float({ min: -0.5, max: 0.5 }), ctx.faker.number.float({ min: -0.5, max: 0.5 })];
      const r = defaultProject(pos, { q_ord: [0.5, 0.5] }, [q], 0.3, ctx);
      expect(typeof r.q_ord.value).toBe('string');
      expect(['1', '2', '3', '4', '5']).toContain(r.q_ord.value);
    }
  });

  it('ordinal: noise=0 is deterministic across two calls', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_WITH_NV);
    const a = defaultProject([0.2, 0.3], { q_ord: [0.5, 0.5] }, [q], 0, makeCtx());
    const b = defaultProject([0.2, 0.3], { q_ord: [0.5, 0.5] }, [q], 0, makeCtx());
    expect(a).toEqual(b);
  });

  it('ordinal: noise > 0 varies output over many seeds', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_WITH_NV);
    const seen = new Set<unknown>();
    for (let seed = 0; seed < 100; seed++) {
      const ctx = makeCtx();
      ctx.faker.seed(seed);
      const r = defaultProject([0, 0], { q_ord: [0.5, 0.5] }, [q], 1, ctx);
      seen.add(r.q_ord.value);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('ordinal: parseInt fallback works when normalizableValue absent', () => {
    const q = mkQ('q_ord', 'singleChoiceOrdinal', LIKERT_5_NO_NV);
    const r = defaultProject([0.5, 0], { q_ord: [1, 0] }, [q], 0, makeCtx());
    expect(typeof r.q_ord.value).toBe('string');
    expect(['1', '2', '3', '4', '5']).toContain(r.q_ord.value);
  });

  // ---- Single categorical dispatch ----

  it('singleChoiceCategorical: returns a valid choice id', () => {
    const q = mkQ('q_cat', 'singleChoiceCategorical', CAT_3);
    const r = defaultProject([0.3, -0.2], { q_cat: [0.5, 0.5] }, [q], 0, makeCtx());
    expect(['a', 'b', 'c']).toContain(r.q_cat.value);
  });

  it('singleChoiceCategorical: deterministic for same position + seed', () => {
    const q = mkQ('q_cat', 'singleChoiceCategorical', CAT_3);
    const a = defaultProject([0.3, -0.2], {}, [q], 0, makeCtx());
    const b = defaultProject([0.3, -0.2], {}, [q], 0, makeCtx());
    expect(a).toEqual(b);
  });

  it('singleChoiceCategorical: different positions can produce different argmax', () => {
    const q = mkQ('q_cat', 'singleChoiceCategorical', CAT_3);
    const seen = new Set<unknown>();
    for (let seed = 0; seed < 30; seed++) {
      const ctxA = makeCtx();
      ctxA.faker.seed(seed);
      const rA = defaultProject([1, 1], {}, [q], 0, ctxA);
      const ctxB = makeCtx();
      ctxB.faker.seed(seed + 1000);
      const rB = defaultProject([-1, -1], {}, [q], 0, ctxB);
      seen.add(rA.q_cat.value);
      seen.add(rB.q_cat.value);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  // ---- Multi categorical dispatch ----

  it('multipleChoiceCategorical: returns non-empty array (D-57-09 ≥ 1 guardrail)', () => {
    const q = mkQ('q_multi', 'multipleChoiceCategorical', CAT_3);
    for (let seed = 0; seed < 50; seed++) {
      const ctx = makeCtx();
      ctx.faker.seed(seed);
      const r = defaultProject([0, 0], {}, [q], 0, ctx);
      expect(Array.isArray(r.q_multi.value)).toBe(true);
      expect((r.q_multi.value as Array<string>).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('multipleChoiceCategorical: every element is a valid choice id', () => {
    const q = mkQ('q_multi', 'multipleChoiceCategorical', CAT_3);
    const r = defaultProject([0.3, -0.2], {}, [q], 0, makeCtx());
    const arr = r.q_multi.value as Array<string>;
    arr.forEach((id) => expect(['a', 'b', 'c']).toContain(id));
  });

  it('multipleChoiceCategorical: produces variable selection sizes over many seeds', () => {
    const q = mkQ('q_multi', 'multipleChoiceCategorical', CAT_3);
    const sizes = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const ctx = makeCtx();
      ctx.faker.seed(seed);
      const pos = [ctx.faker.number.float({ min: -0.5, max: 0.5 }), ctx.faker.number.float({ min: -0.5, max: 0.5 })];
      const r = defaultProject(pos, {}, [q], 0, ctx);
      sizes.add((r.q_multi.value as Array<string>).length);
    }
    expect(sizes.size).toBeGreaterThanOrEqual(2); // must see at least 2 different selection counts
  });

  // ---- Non-choice fallback (D-57-10) ----

  it('text → non-empty string', () => {
    const q = mkQ('q_text', 'text');
    const r = defaultProject([0, 0], {}, [q], 0, makeCtx());
    expect(typeof r.q_text.value).toBe('string');
    expect((r.q_text.value as string).length).toBeGreaterThan(0);
  });

  it('number → integer in [0, 100]', () => {
    const q = mkQ('q_num', 'number');
    const r = defaultProject([0, 0], {}, [q], 0, makeCtx());
    expect(typeof r.q_num.value).toBe('number');
    expect(r.q_num.value as number).toBeGreaterThanOrEqual(0);
    expect(r.q_num.value as number).toBeLessThanOrEqual(100);
  });

  it('boolean → boolean', () => {
    const q = mkQ('q_bool', 'boolean');
    const r = defaultProject([0, 0], {}, [q], 0, makeCtx());
    expect(typeof r.q_bool.value).toBe('boolean');
  });

  it('date → ISO string', () => {
    const q = mkQ('q_date', 'date');
    const r = defaultProject([0, 0], {}, [q], 0, makeCtx());
    expect(typeof r.q_date.value).toBe('string');
    expect(() => new Date(r.q_date.value as string).toISOString()).not.toThrow();
  });

  it('image → null', () => {
    const q = mkQ('q_img', 'image');
    const r = defaultProject([0, 0], {}, [q], 0, makeCtx());
    expect(r.q_img.value).toBeNull();
  });

  it('multipleText → array of strings', () => {
    const q = mkQ('q_mt', 'multipleText');
    const r = defaultProject([0, 0], {}, [q], 0, makeCtx());
    expect(Array.isArray(r.q_mt.value)).toBe(true);
    (r.q_mt.value as Array<unknown>).forEach((s) => expect(typeof s).toBe('string'));
  });

  // ---- Cross-cutting ----

  it('empty questions → {}', () => {
    expect(defaultProject([0, 0], {}, [], 0.1, makeCtx())).toEqual({});
  });

  it('questions without external_id are silently skipped', () => {
    const q = { project_id: PROJECT_UUID, type: 'text', category_id: CATEGORY_UUID } as TablesInsert<'questions'>;
    expect(defaultProject([0, 0], {}, [q], 0.1, makeCtx())).toEqual({});
  });
});

describe('QuestionsGenerator LIKERT_5 A2 fix', () => {
  it('emits each LIKERT_5 choice with normalizableValue = j+1 (1..5)', () => {
    const ctx = makeCtx();
    const gen = new QuestionsGenerator(ctx);
    const rows = gen.generate({ count: 4 });
    const ordinal = rows.find((r) => r.type === 'singleChoiceOrdinal');
    expect(ordinal).toBeDefined();
    const choices = ordinal!.choices as Array<{ id: string; normalizableValue?: number }>;
    expect(choices).toHaveLength(5);
    choices.forEach((c, j) => {
      expect(c.normalizableValue).toBe(j + 1);
    });
  });
});
