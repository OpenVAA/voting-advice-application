/**
 * Default-template test suite — covers 29 behaviors across:
 *   - candidatesOverride: non-uniform distribution + per-locale faker cycling
 *   - questionsOverride: type mix (18 ordinal + 4 categorical + 1 MC + 1 boolean)
 *   - defaultTemplate shape: counts, flags, frontmatter constants
 *   - End-to-end pipeline integration: runPipeline(defaultTemplate, defaultOverrides)
 *   - The anon-RLS precondition (Tests 28/29): every emitted candidate row carries `terms_of_use_accepted`, at the same literal `e2e/base` uses.
 *     This is the fast early-warning tier beside the live anon-client guard in tests/integration/default-template.integration.test.ts — cheap enough to run with no database, so a regression surfaces before the integration job.
 *
 * contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc `.
 */

import { describe, expect, it } from 'vitest';
import { runPipeline } from '../../src/pipeline';
import { validateTemplate } from '../../src/template/schema';
import { BUILT_IN_TEMPLATES } from '../../src/templates';
import { defaultOverrides, defaultTemplate } from '../../src/templates/default';
import {
  __buildLocaleFakerForTests,
  candidatesOverride,
  LOCALE_BLOCK_SIZE
} from '../../src/templates/defaults/candidates-override';
import { ALLIANCE_MEMBERSHIP } from '../../src/templates/defaults/alliances-override';
import { questionsOverride } from '../../src/templates/defaults/questions-override';
import { makeCtx } from '../utils';

// ---------------------------------------------------------------------------
// Fixtures — synthetic refs mimic what the pipeline populates mid-topo.
// ---------------------------------------------------------------------------

/** 8 synthetic organizations matching the default template's ORGANIZATION_WEIGHTS length. */
function eightOrganizations(): Array<{ external_id: string }> {
  return Array.from({ length: 8 }, (_, i) => ({ external_id: `seed_org_${i}` }));
}

function fourCategories(): Array<{ external_id: string }> {
  return Array.from({ length: 4 }, (_, i) => ({ external_id: `seed_cat_${i}` }));
}

// ---------------------------------------------------------------------------
// candidatesOverride
// ---------------------------------------------------------------------------

describe('candidatesOverride — non-uniform distribution + locale cycling', () => {
  it('Test 1: produces exactly 327 candidate rows given 8 orgs', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    expect(rows).toHaveLength(327);
  });

  it('Test 2: organization assignment follows ORGANIZATION_WEIGHTS [61,56,49,43,38,33,26,21]', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    const expected = [61, 56, 49, 43, 38, 33, 26, 21];
    const counts: Record<string, number> = {};
    for (const row of rows) {
      const org = (row as { organization?: { external_id: string } }).organization;
      expect(org).toBeDefined();
      counts[org!.external_id] = (counts[org!.external_id] ?? 0) + 1;
    }
    for (let p = 0; p < 8; p++) {
      expect(counts[`seed_org_${p}`]).toBe(expected[p]);
    }
  });

  it('Test 3: every candidate row has an organization ref', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      const org = (row as { organization?: { external_id: string } }).organization;
      expect(org).toBeDefined();
      expect(typeof org!.external_id).toBe('string');
      expect(org!.external_id.length).toBeGreaterThan(0);
    }
  });

  it('Test 4: is_generated: true on every row', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      expect((row as { is_generated?: boolean }).is_generated).toBe(true);
    }
  });

  it('Test 5: first_name + last_name are non-empty strings', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
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
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    for (const row of rows) {
      expect((row as { external_id: string }).external_id).toMatch(/^seed_cand_\d{4}$/);
    }
  });

  it('Test 7: throws when orgs.length !== 8', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, organizations: [{ external_id: 'seed_org_0' }] }
    });
    expect(() => candidatesOverride({}, ctx)).toThrow(/8 organizations|ORGANIZATION_WEIGHTS/);
  });

  it('Test 8: external_ids are cand_0000 through cand_0326 (sort-order determinism)', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    for (let i = 0; i < rows.length; i++) {
      expect((rows[i] as { external_id: string }).external_id).toBe(`seed_cand_${String(i).padStart(4, '0')}`);
      expect((rows[i] as { sort_order?: number }).sort_order).toBe(i);
    }
  });

  it('Test 9: deterministic — same ctx/org refs yield byte-identical rows across calls', () => {
    const ctxA = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const ctxB = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rowsA = candidatesOverride({}, ctxA);
    const rowsB = candidatesOverride({}, ctxB);
    expect(JSON.stringify(rowsA)).toEqual(JSON.stringify(rowsB));
  });

  it('Test 10: faker locale cycling — three equal locale blocks (en/fi/sv), asserted at the boundary', () => {
    // The corpus is partitioned into three equal per-locale blocks — en, then fi, then sv — and each block's names replay a freshly-seeded Faker for that locale exactly, two draws per row (first name, then last name).
    //
    // Asserting only that names are non-empty cannot see that partition at all: every locale pack yields non-empty names, so collapsing all three blocks into a single locale leaves such a test green. That is what this test used to do (sweep finding F18).
    //
    // Read carefully before changing: the block SIZE is read from the LOCALE_BLOCK_SIZE constant and asserted, never restated as a literal — but the boundary INDICES are derived from the generated corpus, deliberately NOT from that constant. A regression that changes LOCALE_BLOCK_SIZE would drag constant-derived indices along with it and this test would go blind again, which is the exact defect the rewrite removed. rows.length comes from ORGANIZATION_WEIGHTS, which is independent of the block size. Do not "simplify" blockSize back into LOCALE_BLOCK_SIZE.
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);

    // Three locale blocks partition the corpus. Derived from the generated rows.
    const blockSize = rows.length / 3;

    // Soft assertions so a single run reports every boundary axis that broke, rather than aborting at the first one.
    expect.soft(LOCALE_BLOCK_SIZE).toBe(blockSize);

    // Last row of block 0 is the en Faker's `blockSize`-th draw pair.
    const en = __buildLocaleFakerForTests('en');
    let enLast = { first: '', last: '' };
    for (let i = 0; i < blockSize; i++) {
      enLast = { first: en.person.firstName(), last: en.person.lastName() };
    }
    const lastOfBlock0 = rows[blockSize - 1] as { first_name: string; last_name: string };
    expect.soft(lastOfBlock0.first_name).toBe(enLast.first);
    expect.soft(lastOfBlock0.last_name).toBe(enLast.last);

    // First row of block 1 is the fi Faker's FIRST draw pair — a different locale pack, so a single-locale collapse fails precisely here.
    const fi = __buildLocaleFakerForTests('fi');
    const firstOfBlock1 = rows[blockSize] as { first_name: string; last_name: string };
    expect.soft(firstOfBlock1.first_name).toBe(fi.person.firstName());
    expect.soft(firstOfBlock1.last_name).toBe(fi.person.lastName());
  });

  it('Test 28: every emitted candidate row carries terms_of_use_accepted (anon-RLS precondition)', () => {
    const ctx = makeCtx({ refs: { ...makeCtx().refs, organizations: eightOrganizations() } });
    const rows = candidatesOverride({}, ctx);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      // `anon_select_candidates` is THREE clauses, not one:
      //   published = true AND terms_of_use_accepted IS NOT NULL AND terms_of_use_accepted < now() `published` is auto-defaulted by `bulkImport`'s PUBLISHABLE_TABLES set (src/supabaseAdminClient.ts) — this column is NOT, and its absence is exactly what made the Candidates tab disappear from the voter results page while the seed suite stayed green: every other check in this repository reads as service_role, which bypasses RLS entirely.
      //
      // The LITERAL is asserted, not mere presence, because the value is also the cross-template consistency Test 29 pins: `e2e/base` uses the same string, so the two templates diff cleanly and a future change to it fails in one obvious place. A computed `new Date().toISOString()` would additionally break Test 9's byte-identical determinism assertion.
      expect((row as { terms_of_use_accepted?: string }).terms_of_use_accepted).toBe('2025-01-01T00:00:00.000Z');
    }
  });

  it('Test 29: e2e/base candidate rows use the same terms_of_use_accepted literal (cross-template consistency)', () => {
    // Resolved through the built-ins map rather than by a direct module import, so this asserts about whatever module the CLI actually serves for the `e2e/base` key — still pure I/O (the templates are plain data; no Supabase import, no client, no RPC).
    const baseCandidates = BUILT_IN_TEMPLATES['e2e/base'].candidates?.fixed ?? [];
    expect(baseCandidates.length).toBeGreaterThan(0);

    // `ca-aa-hidden` and `ca-aa-unregistered` DELIBERATELY omit the key — they are an in-repo negative control for the hidden and the not-yet-registered candidate, and the migration that introduced the three-clause policy cites the first of them by name. They must STAY omitted, so this test filters to the rows that carry the key at all rather than requiring it everywhere; the filter is what keeps this green without "fixing" the control away.
    const withTerms = baseCandidates.filter(
      (row) => (row as { terms_of_use_accepted?: string }).terms_of_use_accepted !== undefined
    );
    expect(withTerms.length).toBeGreaterThan(0);
    for (const row of withTerms) {
      expect((row as { terms_of_use_accepted?: string }).terms_of_use_accepted).toBe('2025-01-01T00:00:00.000Z');
    }
  });
});

// ---------------------------------------------------------------------------
// questionsOverride
// ---------------------------------------------------------------------------

describe('questionsOverride — type mix', () => {
  it('Test 11: produces exactly 26 question rows', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    expect(rows).toHaveLength(26);
  });

  it('Test 12: type mix is 18 singleChoiceOrdinal + 5 singleChoiceCategorical + 1 boolean + 1 number + 1 multipleChoiceCategorical', () => {
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
    expect(counts.number).toBe(1);
    expect(counts.multipleChoiceCategorical).toBe(1);
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

  it('Test 15: no question has a forbidden type (text/date/image/multipleText)', () => {
    const ctx = makeCtx({
      refs: { ...makeCtx().refs, question_categories: fourCategories() }
    });
    const rows = questionsOverride({}, ctx);
    // number + multipleChoiceCategorical are now intentional demo types; text/date/image/multipleText remain excluded from the default template.
    const forbidden = new Set(['text', 'date', 'image', 'multipleText']);
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

  it('Test 18: generateTranslationsForAllLocales === true', () => {
    expect(defaultTemplate.generateTranslationsForAllLocales).toBe(true);
  });

  it('Test 19: organizations.fixed has 8 entries', () => {
    expect(defaultTemplate.organizations?.fixed).toBeDefined();
    expect(defaultTemplate.organizations?.fixed).toHaveLength(8);
  });

  it('Test 20: elections.fixed has 1 entry', () => {
    expect(defaultTemplate.elections?.fixed).toHaveLength(1);
  });

  it('Test 21: constituency_groups.fixed has 1 entry', () => {
    expect(defaultTemplate.constituency_groups?.fixed).toHaveLength(1);
  });

  it('Test 22: constituencies.fixed has 5 entries (manual-smoke densification)', () => {
    expect(defaultTemplate.constituencies?.fixed).toHaveLength(5);
  });

  it('Test 23: question_categories.fixed has 4 entries', () => {
    expect(defaultTemplate.question_categories?.fixed).toHaveLength(4);
  });

  it('Test 24: questions.count === 26', () => {
    expect(defaultTemplate.questions?.count).toBe(26);
  });

  it('Test 25: candidates.count === 327 (manual-smoke densification)', () => {
    expect(defaultTemplate.candidates?.count).toBe(327);
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
    expect(rows.constituencies).toHaveLength(5);
    expect(rows.organizations).toHaveLength(8);
    // 2 hand-authored alliances (Progressive Front + Conservative Bloc).
    expect(rows.alliances).toHaveLength(2);
    expect(rows.question_categories).toHaveLength(4);
    expect(rows.questions).toHaveLength(26);
    expect(rows.candidates).toHaveLength(327);
    // 327 candidate noms + 8 × 5 = 40 organization noms (matrix is dense, every cell ≥ 1)
    // + 10 alliance noms (2 alliances × 5 constituencies)
    expect(rows.nominations).toHaveLength(327 + 40 + 10);
  });

  // ---------------------------------------------------------------------------
  // Tests 30-32 — the external_id idiom, pinned
  //
  // The default template's organization and constituency external_ids use the generator typecodes `org_*` / `con_NN`, not the retired `party_*` / `c_0N`.
  // A one-off grep is not a standing guard: a future edit could reintroduce the retired idiom and nothing would go red. These three tests are that guard.
  //
  // Test 32 is the load-bearing one. `ALLIANCE_MEMBERSHIP` is the ONE lookup in this package that keys by identifier VALUE — the matrices all index positionally — so a PARTIAL rename (template renamed, map not) yields alliances with zero members and raises no error anywhere. That is the failure mode worth a test rather than a regex.
  // ---------------------------------------------------------------------------

  it('Test 30: organization external_ids use the org_ idiom, not the retired party_ one', () => {
    const rows = runPipeline(defaultTemplate, defaultOverrides);
    expect(rows.organizations.length).toBe(8);
    for (const row of rows.organizations) {
      const id = (row as { external_id: string }).external_id;
      // `seed_` is the pipeline-applied prefix, hardcoded here exactly as Test 6 hardcodes it for `seed_cand_NNNN`.
      expect(id).toMatch(/^seed_org_[a-z]+$/);
      expect(id).not.toMatch(/party_/);
    }
  });

  it('Test 31: constituency external_ids use the con_ idiom, not the retired c_0N one', () => {
    const rows = runPipeline(defaultTemplate, defaultOverrides);
    expect(rows.constituencies.length).toBe(5);
    for (const row of rows.constituencies) {
      const id = (row as { external_id: string }).external_id;
      expect(id).toMatch(/^seed_con_\d{2}$/);
      expect(id).not.toMatch(/^seed_c_\d/);
    }
  });

  it('Test 32: every ALLIANCE_MEMBERSHIP member resolves to an emitted organization row', () => {
    const rows = runPipeline(defaultTemplate, defaultOverrides);
    // ALLIANCE_MEMBERSHIP keys on the UNPREFIXED external_id (its own docstring says so: `org_social`, not `seed_org_social`), so the prefix comes off before comparing. Stripping here rather than prefixing the map is what keeps the map's documented contract the thing under test.
    const emitted = new Set(
      rows.organizations.map((r) => (r as { external_id: string }).external_id.replace(/^seed_/, ''))
    );

    const members = [...ALLIANCE_MEMBERSHIP.alliance_L, ...ALLIANCE_MEMBERSHIP.alliance_R];
    // 3 + 3; the remaining 2 of the 8 organizations are deliberately standalone.
    expect(members.length).toBe(6);
    for (const memberExtId of members) {
      // The assertion that catches a half-done rename: the map still names an organization the template no longer emits.
      expect(
        emitted.has(memberExtId),
        `ALLIANCE_MEMBERSHIP names ${memberExtId}, which no organization row emits`
      ).toBe(true);
    }
    // And the reverse direction, so a rename that renamed the MAP but not the template cannot pass either: exactly 2 organizations stay outside both alliances.
    expect([...emitted].filter((id) => !members.includes(id)).length).toBe(2);
  });
});
