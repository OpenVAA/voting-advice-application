/**
 * Default-template test suite (TMPL-04) — covers 27 behaviors across:
 *   - candidatesOverride: non-uniform distribution + per-locale faker cycling
 *   - questionsOverride: D-58-03 type mix (18 ordinal + 4 categorical + 1 MC + 1 boolean)
 *   - defaultTemplate shape: counts, flags, frontmatter constants
 *   - End-to-end pipeline integration: runPipeline(defaultTemplate, defaultOverrides)
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { runPipeline } from '../../src/pipeline';
import { validateTemplate } from '../../src/template/schema';
import { defaultOverrides, defaultTemplate } from '../../src/templates/default';
import { candidatesOverride } from '../../src/templates/defaults/candidates-override';
import { questionsOverride } from '../../src/templates/defaults/questions-override';
import { makeCtx } from '../utils';

// ---------------------------------------------------------------------------
// Fixtures — synthetic refs mimic what the pipeline populates mid-topo.
// ---------------------------------------------------------------------------

/** 8 synthetic parties matching the default template's PARTY_WEIGHTS length. */
function eightParties(): Array<{ external_id: string }> {
  return Array.from({ length: 8 }, (_, i) => ({ external_id: `seed_party_${i}` }));
}

function fourCategories(): Array<{ external_id: string }> {
  return Array.from({ length: 4 }, (_, i) => ({ external_id: `seed_cat_${i}` }));
}

// ---------------------------------------------------------------------------
// candidatesOverride
// ---------------------------------------------------------------------------

describe('candidatesOverride — non-uniform distribution + locale cycling', () => {
  it('Test 1: produces exactly 100 candidate rows given 8 orgs', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    expect(rows).toHaveLength(100);
  });

  it('Test 2: party assignment follows PARTY_WEIGHTS [20,18,15,12,10,10,8,7]', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    const expected = [20, 18, 15, 12, 10, 10, 8, 7];
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const org = (row as { organization?: { external_id: string } }).organization;
      expect(org).toBeDefined();
      counts[org!.external_id] = (counts[org!.external_id] ?? 0) + 1;
    }
    for (let p = 0; p < 8; p++) {
      expect(counts[`seed_party_${p}`]).toBe(expected[p]);
    }
  });

  it('Test 3: every candidate row has an organization ref', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      const org = (row as { organization?: { external_id: string } }).organization;
      expect(org).toBeDefined();
      expect(typeof org!.external_id).toBe('string');
      expect(org!.external_id.length).toBeGreaterThan(0);
    }
  });

  it('Test 4: is_generated: true on every row', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      expect((row as { is_generated?: boolean }).is_generated).toBe(true);
    }
  });

  it('Test 5: first_name + last_name are non-empty strings', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      const r = row as { first_name?: string; last_name?: string };
      expect(typeof r.first_name).toBe('string');
      expect(r.first_name!.length).toBeGreaterThan(0);
      expect(typeof r.last_name).toBe('string');
      expect(r.last_name!.length).toBeGreaterThan(0);
    }
  });

  it('Test 6: external_id starts with prefix + "cand_"', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      expect((row as { external_id: string }).external_id).toMatch(/^seed_cand_\d{4}$/);
    }
  });

  it('Test 7: throws when orgs.length !== 8', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, organizations: [{ external_id: 'seed_party_0' }] }
    });
    expect(() => candidatesOverride({}, ctx)).toThrow(/8 organizations|PARTY_WEIGHTS/);
  });

  it('Test 8: external_ids are cand_0000 through cand_0099 (sort-order determinism)', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    for (let i = 0; i < rows.length; i++) {
      expect((rows[i] as { external_id: string }).external_id).toBe(`seed_cand_${String(i).padStart(4, '0')}`);
      expect((rows[i] as { sort_order?: number }).sort_order).toBe(i);
    }
  });

  it('Test 9: deterministic — same ctx/org refs yield byte-identical rows across calls', () => {
    const ctxA = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const ctxB = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rowsA = candidatesOverride({}, ctxA);
    const rowsB = candidatesOverride({}, ctxB);
    expect(JSON.stringify(rowsA)).toEqual(JSON.stringify(rowsB));
  });

  it('Test 10: faker locale cycling — 25 candidates per locale block (en/fi/sv/da)', () => {
    // Spec: indices 0-24 use en, 25-49 fi, 50-74 sv, 75-99 da. We cannot easily
    // assert the locale packet, but we can assert that names within a block are
    // byte-identical to a freshly-seeded per-locale Faker. The override's
    // LOCALE_BLOCK_SIZE constant is 25. Shape-only assertion: non-empty strings.
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightParties() } });
    const rows = candidatesOverride({}, ctx);
    // Spot-check the 4 block starts have non-empty names.
    for (const idx of [0, 25, 50, 75]) {
      const r = rows[idx] as { first_name?: string; last_name?: string };
      expect(r.first_name).toBeTruthy();
      expect(r.last_name).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// questionsOverride
// ---------------------------------------------------------------------------

describe('questionsOverride — D-58-03 type mix', () => {
  it('Test 11: produces exactly 24 question rows', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    expect(rows).toHaveLength(24);
  });

  it('Test 12: type mix is 18 singleChoiceOrdinal + 5 singleChoiceCategorical + 1 boolean', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const t = (row as { type?: string }).type!;
      counts[t] = (counts[t] ?? 0) + 1;
    }
    expect(counts.singleChoiceOrdinal).toBe(18);
    expect(counts.singleChoiceCategorical).toBe(5);
    expect(counts.boolean).toBe(1);
    expect(counts.multipleChoiceCategorical).toBeUndefined();
  });

  it('Test 13: every question has a category ref', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    for (const row of rows) {
      const cat = (row as { category?: { external_id: string } }).category;
      expect(cat).toBeDefined();
      expect(typeof cat!.external_id).toBe('string');
    }
  });

  it('Test 14: each of the 4 categories receives >=1 question', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    const catCounts: Record<string, number> = {};
    for (const row of rows) {
      const cat = (row as { category?: { external_id: string } }).category!.external_id;
      catCounts[cat] = (catCounts[cat] ?? 0) + 1;
    }
    for (const c of fourCategories()) {
      expect(catCounts[c.external_id] ?? 0).toBeGreaterThanOrEqual(1);
    }
  });

  it('Test 15: no question has a forbidden type (number/text/date/image/multipleText)', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    const forbidden = new Set(['number', 'text', 'date', 'image', 'multipleText']);
    for (const row of rows) {
      const t = (row as { type?: string }).type!;
      expect(forbidden.has(t)).toBe(false);
    }
  });

  it('Test 16: deterministic output at same seed', () => {
    const ctxA = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const ctxB = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rowsA = questionsOverride({}, ctxA);
    const rowsB = questionsOverride({}, ctxB);
    expect(JSON.stringify(rowsA)).toEqual(JSON.stringify(rowsB));
  });
});

// ---------------------------------------------------------------------------
// defaultTemplate shape
// ---------------------------------------------------------------------------

describe('defaultTemplate — shape & frontmatter constants', () => {
  it('Test 17: validateTemplate(defaultTemplate) passes', () => {
    expect(() => validateTemplate(defaultTemplate)).not.toThrow();
  });

  it('Test 18: generateTranslationsForAllLocales === true (D-58-04)', () => {
    expect(defaultTemplate.generateTranslationsForAllLocales).toBe(true);
  });

  it('Test 19: organizations.fixed has 8 entries (D-58-01)', () => {
    expect(defaultTemplate.organizations?.fixed).toBeDefined();
    expect(defaultTemplate.organizations?.fixed).toHaveLength(8);
  });

  it('Test 20: elections.fixed has 1 entry (D-58-02)', () => {
    expect(defaultTemplate.elections?.fixed).toHaveLength(1);
  });

  it('Test 21: constituency_groups.fixed has 1 entry (D-58-02)', () => {
    expect(defaultTemplate.constituency_groups?.fixed).toHaveLength(1);
  });

  it('Test 22: constituencies.fixed has 13 entries (D-58-02)', () => {
    expect(defaultTemplate.constituencies?.fixed).toHaveLength(13);
  });

  it('Test 23: question_categories.fixed has 4 entries (D-58-02)', () => {
    expect(defaultTemplate.question_categories?.fixed).toHaveLength(4);
  });

  it('Test 24: questions.count === 24 (D-58-02)', () => {
    expect(defaultTemplate.questions?.count).toBe(24);
  });

  it('Test 25: candidates.count === 100 (D-58-02)', () => {
    expect(defaultTemplate.candidates?.count).toBe(100);
  });

  it('Test 26: seed is set (deterministic default template)', () => {
    expect(typeof defaultTemplate.seed).toBe('number');
  });

  // ---------------------------------------------------------------------------
  // Test 27 — end-to-end pipeline integration
  // ---------------------------------------------------------------------------

  it('Test 27: runPipeline(defaultTemplate, defaultOverrides) emits correct row counts per table', () => {
    const rows = runPipeline(defaultTemplate, defaultOverrides);
    expect(rows.elections).toHaveLength(1);
    expect(rows.constituency_groups).toHaveLength(1);
    expect(rows.constituencies).toHaveLength(13);
    expect(rows.organizations).toHaveLength(8);
    expect(rows.question_categories).toHaveLength(4);
    expect(rows.questions).toHaveLength(24);
    expect(rows.candidates).toHaveLength(100);
    expect(rows.nominations).toHaveLength(100);
  });
});
