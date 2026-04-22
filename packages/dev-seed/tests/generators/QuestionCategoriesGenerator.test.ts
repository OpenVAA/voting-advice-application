/**
 * QuestionCategoriesGenerator unit tests.
 *
 * D-22 acceptance (a)–(e) + default `category_type: 'opinion'` spot-check
 * (RESEARCH §4.12). The `_elections` join sentinel is populated by Plan 07's
 * post-topo pass; generator output here is sentinel-free.
 */

import { describe, expect, it } from 'vitest';
import { QuestionCategoriesGenerator } from '../../src/generators/QuestionCategoriesGenerator';
import { makeCtx } from '../utils';

describe('QuestionCategoriesGenerator', () => {
  it('honors count from fragment', () => {
    const gen = new QuestionCategoriesGenerator(makeCtx());
    expect(gen.generate({ count: 3 })).toHaveLength(3);
  });

  it('applies externalIdPrefix to generated rows (GEN-04)', () => {
    const gen = new QuestionCategoriesGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.external_id).toMatch(/^seed_cat_/));
  });

  it('applies externalIdPrefix to fixed[] rows (GEN-04)', () => {
    const gen = new QuestionCategoriesGenerator(makeCtx());
    const rows = gen.generate({
      count: 0,
      fixed: [{ external_id: 'my_cat', name: { en: 'Fixed' } as never }]
    });
    expect(rows[0].external_id).toBe('seed_my_cat');
  });

  it('passes through fixed[] data unchanged modulo prefix', () => {
    const gen = new QuestionCategoriesGenerator(makeCtx());
    const name = { en: 'Custom Cat' };
    const rows = gen.generate({ count: 0, fixed: [{ external_id: 'fx', name: name as never }] });
    expect(rows[0].name).toEqual(name);
  });

  it('produces deterministic output across runs with same seed', () => {
    const run1 = new QuestionCategoriesGenerator(makeCtx()).generate({ count: 3 });
    const run2 = new QuestionCategoriesGenerator(makeCtx()).generate({ count: 3 });
    expect(run1).toEqual(run2);
  });

  it('applies default category_type = opinion', () => {
    const gen = new QuestionCategoriesGenerator(makeCtx());
    const rows = gen.generate({ count: 2 });
    rows.forEach((r) => expect(r.category_type).toBe('opinion'));
  });
});
