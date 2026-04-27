/**
 * QuestionsGenerator unit tests.
 *
 * D-22 acceptance (a)–(e) + per-type choices contract (RESEARCH §4.13 /
 * validate_question_choices trigger, migration lines 645–689):
 *   - singleChoiceOrdinal → choices present, ≥2 entries with string `id`
 *   - singleChoiceCategorical → choices present
 *   - text / boolean → choices absent
 *
 * Plus category ref attach/omit behavior driven by ctx.refs.question_categories.
 */

import { describe, expect, it } from 'vitest';
import { QuestionsGenerator } from '../../src/generators/QuestionsGenerator';
import { makeCtx } from '../utils';

describe('QuestionsGenerator', () => {
  it('honors count from fragment', () => {
    const gen = new QuestionsGenerator(makeCtx());
    expect(gen.generate({ count: 4 })).toHaveLength(4);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_q_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_q', type: 'text', name: { en: 'Fixed?' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_q');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const name = { en: 'Custom Q?' };
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'fx', type: 'text', name: name as never }]
    });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new QuestionsGenerator(makeCtx()).generate({ count: 4 });
    const run2 = new QuestionsGenerator(makeCtx()).generate({ count: 4 });
    expect(run1).toEqual(run2);
  });

  it('attaches category ref when refs.question_categories populated', () => {
    const base = makeCtx();
    const gen = new QuestionsGenerator(
      makeCtx({
        refs: { ...base.refs, question_categories: [{ external_id: 'seed_cat_00' }] }
      })
    );
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => {
      const rowAny = r as unknown as { category?: { external_id: string } };
      expect(rowAny.category).toEqual({ external_id: 'seed_cat_00' });
    });
  });

  it('omits category ref when refs.question_categories empty', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const rows = gen.generate({ count: 1 });
    expect(rows[0]).not.toHaveProperty('category');
  });

  it('attaches choices array for singleChoiceOrdinal questions (≥2 entries)', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const rows = gen.generate({ count: 4 });
    const ordinal = rows.find((r) => r.type === 'singleChoiceOrdinal');
    expect(ordinal).toBeDefined();
    expect(Array.isArray(ordinal!.choices)).toBe(true);
    const choices = ordinal!.choices as Array<{ id: string }>;
    expect(choices.length).toBeGreaterThanOrEqual(2);
    choices.forEach((c) => expect(typeof c.id).toBe('string'));
  });

  it('attaches choices for singleChoiceCategorical questions', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const rows = gen.generate({ count: 4 });
    const cat = rows.find((r) => r.type === 'singleChoiceCategorical');
    expect(cat).toBeDefined();
    expect(Array.isArray(cat!.choices)).toBe(true);
    expect((cat!.choices as Array<{ id: string }>).length).toBeGreaterThanOrEqual(2);
  });

  it('omits choices for text and boolean questions (trigger allows NULL)', () => {
    const gen = new QuestionsGenerator(makeCtx());
    const rows = gen.generate({ count: 4 });
    const text = rows.find((r) => r.type === 'text');
    const bool = rows.find((r) => r.type === 'boolean');
    if (text) expect(text.choices).toBeUndefined();
    if (bool) expect(bool.choices).toBeUndefined();
  });
});
