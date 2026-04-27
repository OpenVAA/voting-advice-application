/**
 * e2eTemplate parity tests (TMPL-05 / D-58-15 / D-58-16).
 *
 * Audit-driven assertions against `.planning/phases/58-templates-cli-default-dataset/58-E2E-AUDIT.md`:
 *
 *   §1 / §1.1 — REQUIRED_EXTERNAL_IDS: every id asserted on by specs MUST
 *               appear as a fixed[] entry in the matching table.
 *   §2 / §2.1 — Display-text contracts: literal name strings asserted by
 *               specs (e.g. 'Test Election 2025', 'Municipalities') must
 *               appear verbatim; candidate firstName/lastName preserved
 *               for voter-detail filter + voter-matching template-literal
 *               assertions.
 *   §2.2     — Ordering invariants: test-candidate-alpha is candidates[0];
 *               test-candidate-unregistered precedes test-candidate-unregistered-2.
 *               Email wiring: mock.candidate.2@openvaa.org on alpha.
 *   §3       — Relational triangles: every nomination has
 *               (candidate|organization) + election + constituency refs.
 *   §4 / §4.1 — FORBIDDEN_EXTERNAL_IDS: implicit-invariant fixture rows that
 *               D-58-15 REJECTS mechanical translation of. These MUST NOT
 *               appear in any table.
 *   §7       — Row-count minimums per table.
 *   §8.3     — test-voter-cand-hidden lacks terms_of_use_accepted AND its
 *               nomination carries unconfirmed: true.
 *   §8.4     — test-question-1 carries custom_data.allowOpen: true.
 *
 * Extending the template with a new fixed[] entry REQUIRES a corresponding
 * entry in 58-E2E-AUDIT.md §Section 1. If this file's REQUIRED_EXTERNAL_IDS
 * array diverges from the audit, the test fails until both are synced.
 *
 * D-22 contract: pure I/O. No Supabase imports, no `createClient`, no `.rpc()`.
 */

import { describe, expect, it } from 'vitest';
import { validateTemplate } from '../../src/template/schema';
import { e2eTemplate } from '../../src/templates/e2e';

// ---------------------------------------------------------------------------
// Audit §1 + §1.1 — positive inclusion list.
// Each entry is (table, external_id, audit-section) — the audit section
// citation is informational, not tested.
// ---------------------------------------------------------------------------

const REQUIRED_EXTERNAL_IDS: Array<{ table: string; id: string }> = [
  // §1 elections — base is single-election (auto-implied voter journey).
  // test-election-2 is declared by the multi-election variant template at
  // tests/tests/setup/templates/variant-multi-election.ts.
  { table: 'elections', id: 'test-election-1' },

  // §1 constituencies — single base constituency (auto-implied). Additional
  // constituencies (-beta, -e2..-e5) live in the multi-election variant.
  { table: 'constituencies', id: 'test-constituency-alpha' },

  // §1 + §1.1 constituency_groups — single base group; the variant adds
  // test-cg-municipalities.
  { table: 'constituency_groups', id: 'test-cg-1' },

  // §1.1 organizations (voter-results.spec.ts:28 sums both datasets' orgs)
  { table: 'organizations', id: 'test-party-a' },
  { table: 'organizations', id: 'test-party-b' },
  { table: 'organizations', id: 'test-voter-party-a' },
  { table: 'organizations', id: 'test-voter-party-b' },

  // §4 rows "test-category-*" flagged keep-with-regenerable ids; preserved verbatim
  { table: 'question_categories', id: 'test-category-economy' },
  { table: 'question_categories', id: 'test-category-social' },
  { table: 'question_categories', id: 'test-category-info' },
  { table: 'question_categories', id: 'test-voter-cat-economy' },
  { table: 'question_categories', id: 'test-voter-cat-social' },

  // §1.1 default-dataset opinion questions (8 ordinal — matching spec 8-filter)
  { table: 'questions', id: 'test-question-1' },
  { table: 'questions', id: 'test-question-2' },
  { table: 'questions', id: 'test-question-3' },
  { table: 'questions', id: 'test-question-4' },
  { table: 'questions', id: 'test-question-5' },
  { table: 'questions', id: 'test-question-6' },
  { table: 'questions', id: 'test-question-7' },
  { table: 'questions', id: 'test-question-8' },
  // §1 row 3 — voter-detail.spec.ts:88 reads alphaAnswers['test-question-text']
  { table: 'questions', id: 'test-question-text' },
  // §1.1 voter-dataset opinion questions
  { table: 'questions', id: 'test-voter-q-1' },
  { table: 'questions', id: 'test-voter-q-2' },
  { table: 'questions', id: 'test-voter-q-3' },
  { table: 'questions', id: 'test-voter-q-4' },
  { table: 'questions', id: 'test-voter-q-5' },
  { table: 'questions', id: 'test-voter-q-6' },
  { table: 'questions', id: 'test-voter-q-7' },
  { table: 'questions', id: 'test-voter-q-8' },

  // §1 + §1.1 + §2.1 candidates (all 13 in audit §7 row-count summary)
  { table: 'candidates', id: 'test-candidate-alpha' },
  { table: 'candidates', id: 'test-candidate-beta' },
  { table: 'candidates', id: 'test-candidate-gamma' },
  { table: 'candidates', id: 'test-candidate-delta' },
  { table: 'candidates', id: 'test-candidate-epsilon' },
  { table: 'candidates', id: 'test-voter-cand-agree' },
  { table: 'candidates', id: 'test-voter-cand-close' },
  { table: 'candidates', id: 'test-voter-cand-neutral' },
  { table: 'candidates', id: 'test-voter-cand-oppose' },
  { table: 'candidates', id: 'test-voter-cand-mixed' },
  { table: 'candidates', id: 'test-voter-cand-partial' },
  { table: 'candidates', id: 'test-voter-cand-hidden' },
  { table: 'candidates', id: 'test-candidate-unregistered' },
  { table: 'candidates', id: 'test-candidate-unregistered-2' },

  // §3 nominations (18 total — see Test X: row-count assertion)
  { table: 'nominations', id: 'test-nom-alpha' },
  { table: 'nominations', id: 'test-nom-beta' },
  { table: 'nominations', id: 'test-nom-gamma' },
  { table: 'nominations', id: 'test-nom-delta' },
  { table: 'nominations', id: 'test-nom-epsilon' },
  { table: 'nominations', id: 'test-nom-org-party-a' },
  { table: 'nominations', id: 'test-nom-org-party-b' },
  { table: 'nominations', id: 'test-voter-nom-agree' },
  { table: 'nominations', id: 'test-voter-nom-close' },
  { table: 'nominations', id: 'test-voter-nom-neutral' },
  { table: 'nominations', id: 'test-voter-nom-oppose' },
  { table: 'nominations', id: 'test-voter-nom-mixed' },
  { table: 'nominations', id: 'test-voter-nom-partial' },
  { table: 'nominations', id: 'test-voter-nom-hidden' },
  { table: 'nominations', id: 'test-voter-nom-org-party-a' },
  { table: 'nominations', id: 'test-voter-nom-org-party-b' },
  { table: 'nominations', id: 'test-nom-unregistered' },
  { table: 'nominations', id: 'test-nom-unregistered-2' }
];

// ---------------------------------------------------------------------------
// Audit §4.1 — exclusion list. D-58-15 REJECTS carrying these forward from
// the legacy JSON fixtures. Their absence enforces "audit-driven, not
// mechanical port".
// ---------------------------------------------------------------------------

const FORBIDDEN_EXTERNAL_IDS: Array<string> = [
  // §4.1 — 0 spec hits; drop per audit's explicit recommendation
  'test-question-date',
  'test-question-number',
  'test-question-boolean'
];

// ---------------------------------------------------------------------------
// Helpers for fragment introspection. The Template type marks every field
// as optional, so we cast carefully to avoid masking real type errors in
// the template declaration.
// ---------------------------------------------------------------------------

type FragmentView = { fixed?: Array<Record<string, unknown>>; count?: number };

function fragmentOf(table: string): FragmentView | undefined {
  const val = (e2eTemplate as unknown as Record<string, unknown>)[table];
  // Top-level scalar fields (seed, externalIdPrefix, etc.) aren't fragments.
  // A fragment is an object with an optional `fixed` array.
  if (val && typeof val === 'object' && !Array.isArray(val) && 'fixed' in (val as object)) {
    return val as FragmentView;
  }
  return undefined;
}

function allExternalIds(): Array<string> {
  const ids: Array<string> = [];
  for (const key of Object.keys(e2eTemplate)) {
    const frag = fragmentOf(key);
    if (!frag) continue;
    for (const row of frag.fixed ?? []) {
      const id = row.external_id;
      if (typeof id === 'string') ids.push(id);
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('e2eTemplate — shape + schema validation', () => {
  it('passes validateTemplate without throwing', () => {
    expect(() => validateTemplate(e2eTemplate)).not.toThrow();
  });

  it('sets generateTranslationsForAllLocales: false (D-58-16)', () => {
    expect(e2eTemplate.generateTranslationsForAllLocales).toBe(false);
  });

  it('sets externalIdPrefix: "" so literal test- ids pass through unchanged', () => {
    expect(e2eTemplate.externalIdPrefix).toBe('');
  });

  it('sets a numeric seed for determinism', () => {
    expect(typeof e2eTemplate.seed).toBe('number');
  });
});

describe('e2eTemplate — §Section 1 positive inclusion list', () => {
  it.each(REQUIRED_EXTERNAL_IDS)(
    'table $table contains required external_id $id',
    ({ table, id }) => {
      const frag = fragmentOf(table);
      expect(frag, `missing fragment for table ${table}`).toBeDefined();
      const ids = (frag?.fixed ?? []).map((r) => r.external_id);
      expect(ids).toContain(id);
    }
  );
});

describe('e2eTemplate — §Section 4.1 exclusion list (D-58-15)', () => {
  it('does NOT contain any §4.1 forbidden external_id', () => {
    const present = allExternalIds();
    for (const forbidden of FORBIDDEN_EXTERNAL_IDS) {
      expect(present, `forbidden id '${forbidden}' should not appear`).not.toContain(forbidden);
    }
  });

  it('contains no singleChoiceOrdinal question other than the 16 audit-required ids', () => {
    // Stronger check — §1.1 matching-spec expects exactly 8 default + 8 voter
    // ordinal questions. Any extra ordinal question would throw off the
    // TOTAL_OPINION_QUESTIONS === 16 assertion at voter-matching.spec.ts.
    const qs = (fragmentOf('questions')?.fixed ?? []) as Array<{ external_id: string; type?: string }>;
    const ordinal = qs.filter((q) => q.type === 'singleChoiceOrdinal');
    const ordinalIds = ordinal.map((q) => q.external_id).sort();
    const expected = [
      'test-question-1',
      'test-question-2',
      'test-question-3',
      'test-question-4',
      'test-question-5',
      'test-question-6',
      'test-question-7',
      'test-question-8',
      'test-voter-q-1',
      'test-voter-q-2',
      'test-voter-q-3',
      'test-voter-q-4',
      'test-voter-q-5',
      'test-voter-q-6',
      'test-voter-q-7',
      'test-voter-q-8'
    ].sort();
    expect(ordinalIds).toEqual(expected);
  });
});

describe('e2eTemplate — §Section 2 + §2.1 display-text contracts', () => {
  it('test-election-1 name is "Test Election 2025" (§2)', () => {
    const e = (fragmentOf('elections')?.fixed ?? []).find(
      (r) => r.external_id === 'test-election-1'
    ) as { name?: { en?: string } } | undefined;
    expect(e?.name?.en).toBe('Test Election 2025');
  });

  // test-election-2 + test-cg-municipalities live in the multi-election
  // variant template now; their display-text contracts are covered by that
  // template's own test suite (tests/tests/setup/templates/variant-multi-election.ts).

  it('test-candidate-alpha has first_name "Test" and last_name "Candidate Alpha" (§2.1)', () => {
    const alpha = (fragmentOf('candidates')?.fixed ?? []).find(
      (c) => c.external_id === 'test-candidate-alpha'
    ) as { first_name?: string; last_name?: string } | undefined;
    expect(alpha?.first_name).toBe('Test');
    expect(alpha?.last_name).toBe('Candidate Alpha');
  });

  it('test-voter-cand-agree has first_name "Fully" and last_name "Agree" (§2.1)', () => {
    const c = (fragmentOf('candidates')?.fixed ?? []).find(
      (r) => r.external_id === 'test-voter-cand-agree'
    ) as { first_name?: string; last_name?: string } | undefined;
    expect(c?.first_name).toBe('Fully');
    expect(c?.last_name).toBe('Agree');
  });

  it('test-voter-cand-oppose has first_name "Fully" and last_name "Oppose" (§2.1)', () => {
    const c = (fragmentOf('candidates')?.fixed ?? []).find(
      (r) => r.external_id === 'test-voter-cand-oppose'
    ) as { first_name?: string; last_name?: string } | undefined;
    expect(c?.first_name).toBe('Fully');
    expect(c?.last_name).toBe('Oppose');
  });
});

describe('e2eTemplate — §2.2 ordering invariants + email contracts', () => {
  it('test-candidate-alpha is candidates[0] (testCredentials.ts:10 contract)', () => {
    const cands = fragmentOf('candidates')?.fixed ?? [];
    expect(cands[0]?.external_id).toBe('test-candidate-alpha');
  });

  it('test-candidate-alpha email is mock.candidate.2@openvaa.org (§6, load-bearing)', () => {
    const alpha = (fragmentOf('candidates')?.fixed ?? []).find(
      (c) => c.external_id === 'test-candidate-alpha'
    ) as { email?: string } | undefined;
    expect(alpha?.email).toBe('mock.candidate.2@openvaa.org');
  });

  it('test-candidate-unregistered precedes test-candidate-unregistered-2 (§2.2)', () => {
    const cands = fragmentOf('candidates')?.fixed ?? [];
    const idxUnreg = cands.findIndex((c) => c.external_id === 'test-candidate-unregistered');
    const idxUnreg2 = cands.findIndex((c) => c.external_id === 'test-candidate-unregistered-2');
    expect(idxUnreg).toBeGreaterThanOrEqual(0);
    expect(idxUnreg2).toBeGreaterThan(idxUnreg);
  });

  it('addendum candidate emails match fixture verbatim (§2.2)', () => {
    const cands = fragmentOf('candidates')?.fixed ?? [];
    const u1 = cands.find((c) => c.external_id === 'test-candidate-unregistered') as
      | { email?: string }
      | undefined;
    const u2 = cands.find((c) => c.external_id === 'test-candidate-unregistered-2') as
      | { email?: string }
      | undefined;
    expect(u1?.email).toBe('test.unregistered@openvaa.org');
    expect(u2?.email).toBe('test.unregistered2@openvaa.org');
  });
});

describe('e2eTemplate — §Section 3 relational triangles', () => {
  it('every candidate has an organization ref', () => {
    const cands = fragmentOf('candidates')?.fixed ?? [];
    for (const c of cands) {
      expect(c.organization, `candidate ${c.external_id} missing organization`).toBeDefined();
    }
  });

  it('every nomination carries exactly one polymorphic ref (candidate XOR organization XOR faction XOR alliance)', () => {
    const noms = fragmentOf('nominations')?.fixed ?? [];
    for (const n of noms) {
      const refCount =
        (n.candidate ? 1 : 0) +
        (n.organization ? 1 : 0) +
        (n.faction ? 1 : 0) +
        (n.alliance ? 1 : 0);
      expect(refCount, `nomination ${n.external_id} must carry exactly one polymorphic ref`).toBe(1);
    }
  });

  it('every nomination has election + constituency refs (triangle closure)', () => {
    const noms = fragmentOf('nominations')?.fixed ?? [];
    for (const n of noms) {
      expect(n.election, `nomination ${n.external_id} missing election`).toBeDefined();
      expect(n.constituency, `nomination ${n.external_id} missing constituency`).toBeDefined();
    }
  });

  it('every nomination points at test-election-1 + test-constituency-alpha (§3 base scope)', () => {
    const noms = fragmentOf('nominations')?.fixed ?? [];
    for (const n of noms) {
      const e = n.election as { external_id?: string };
      const c = n.constituency as { external_id?: string };
      expect(e.external_id).toBe('test-election-1');
      expect(c.external_id).toBe('test-constituency-alpha');
    }
  });

  it('every candidate nomination references a candidate that exists in candidates.fixed', () => {
    const noms = fragmentOf('nominations')?.fixed ?? [];
    const candIds = new Set(
      (fragmentOf('candidates')?.fixed ?? []).map((c) => c.external_id as string)
    );
    for (const n of noms) {
      if (n.candidate) {
        const ref = (n.candidate as { external_id: string }).external_id;
        expect(candIds.has(ref), `nomination ${n.external_id} -> unknown candidate ${ref}`).toBe(
          true
        );
      }
    }
  });

  it('every organization nomination references an organization that exists in organizations.fixed', () => {
    const noms = fragmentOf('nominations')?.fixed ?? [];
    const orgIds = new Set(
      (fragmentOf('organizations')?.fixed ?? []).map((o) => o.external_id as string)
    );
    for (const n of noms) {
      if (n.organization) {
        const ref = (n.organization as { external_id: string }).external_id;
        expect(orgIds.has(ref), `nomination ${n.external_id} -> unknown organization ${ref}`).toBe(
          true
        );
      }
    }
  });
});

describe('e2eTemplate — §Section 7 row-count minimums', () => {
  it('elections.fixed.length === 1 (single-election base; multi-election lives in variant)', () => {
    expect((fragmentOf('elections')?.fixed ?? []).length).toBe(1);
  });

  it('constituencies.fixed.length === 1 (single-constituency base; auto-implied)', () => {
    expect((fragmentOf('constituencies')?.fixed ?? []).length).toBe(1);
  });

  it('organizations.fixed.length === 4 (voter-results.spec.ts:28 totalPartyCount)', () => {
    expect((fragmentOf('organizations')?.fixed ?? []).length).toBe(4);
  });

  it('candidates.fixed.length === 14 (§7 breakdown: 5+6+1+2; audit header "13" is an arithmetic typo)', () => {
    // 58-E2E-AUDIT.md §7 row "candidates" states "13" in the count column
    // but the breakdown beneath it sums to 14 (5 default registered +
    // 6 voter registered + 1 voter hidden + 2 addendum unregistered). The
    // template implements the breakdown verbatim — all 14 candidates have
    // audit citations in §1 / §1.1 / §2.2. Documented in 58-08-SUMMARY.md.
    expect((fragmentOf('candidates')?.fixed ?? []).length).toBe(14);
  });

  it('exactly 11 registered candidates (terms_of_use_accepted set) — voter-results 11-card assertion', () => {
    const cands = (fragmentOf('candidates')?.fixed ?? []) as Array<{
      terms_of_use_accepted?: string;
    }>;
    const registered = cands.filter((c) => c.terms_of_use_accepted !== undefined);
    expect(registered).toHaveLength(11);
  });

  it('nominations.fixed.length === 18 (§7: 7 default + 9 voter + 2 addendum)', () => {
    expect((fragmentOf('nominations')?.fixed ?? []).length).toBe(18);
  });

  it('questions.fixed.length === 17 (§7: 8 default ordinal + 8 voter ordinal + 1 text)', () => {
    expect((fragmentOf('questions')?.fixed ?? []).length).toBe(17);
  });
});

describe('e2eTemplate — §Section 8 edge cases', () => {
  it('§8.3: test-voter-cand-hidden lacks terms_of_use_accepted (candidate-level hidden)', () => {
    const hidden = (fragmentOf('candidates')?.fixed ?? []).find(
      (c) => c.external_id === 'test-voter-cand-hidden'
    ) as { terms_of_use_accepted?: string } | undefined;
    expect(hidden).toBeDefined();
    expect(hidden?.terms_of_use_accepted).toBeUndefined();
  });

  it('§8.3: test-voter-nom-hidden carries unconfirmed: true (nomination-level hidden)', () => {
    const nom = (fragmentOf('nominations')?.fixed ?? []).find(
      (n) => n.external_id === 'test-voter-nom-hidden'
    ) as { unconfirmed?: boolean } | undefined;
    expect(nom?.unconfirmed).toBe(true);
  });

  it('§8.4: test-question-1 carries custom_data.allowOpen: true (candidate-questions.spec.ts:67-69)', () => {
    const q = (fragmentOf('questions')?.fixed ?? []).find(
      (r) => r.external_id === 'test-question-1'
    ) as { custom_data?: { allowOpen?: boolean } } | undefined;
    expect(q?.custom_data?.allowOpen).toBe(true);
  });

  it('§3.3: both addendum nominations carry unconfirmed: true', () => {
    const noms = fragmentOf('nominations')?.fixed ?? [];
    const u1 = noms.find((n) => n.external_id === 'test-nom-unregistered') as
      | { unconfirmed?: boolean }
      | undefined;
    const u2 = noms.find((n) => n.external_id === 'test-nom-unregistered-2') as
      | { unconfirmed?: boolean }
      | undefined;
    expect(u1?.unconfirmed).toBe(true);
    expect(u2?.unconfirmed).toBe(true);
  });

  it('audit §1 contract — test-candidate-alpha has answersByExternalId.test-question-text.value.en non-empty (voter-detail.spec.ts:88)', () => {
    const alpha = (fragmentOf('candidates')?.fixed ?? []).find(
      (c) => c.external_id === 'test-candidate-alpha'
    ) as
      | { answersByExternalId?: Record<string, { value?: { en?: string } }> }
      | undefined;
    const ans = alpha?.answersByExternalId?.['test-question-text'];
    expect(ans?.value?.en).toBeTruthy();
    expect(typeof ans?.value?.en).toBe('string');
    expect((ans?.value?.en ?? '').length).toBeGreaterThan(0);
  });

  it('audit §1 contract — test-candidate-alpha has >=1 opinion answer with non-empty info.en (voter-detail.spec.ts:107-112)', () => {
    const alpha = (fragmentOf('candidates')?.fixed ?? []).find(
      (c) => c.external_id === 'test-candidate-alpha'
    ) as
      | {
          answersByExternalId?: Record<string, { value?: unknown; info?: { en?: string } }>;
        }
      | undefined;
    const opinionKeys = Object.keys(alpha?.answersByExternalId ?? {}).filter((k) =>
      /^test-question-\d+$/.test(k)
    );
    const withInfo = opinionKeys.filter((k) => {
      const info = alpha?.answersByExternalId?.[k]?.info;
      return typeof info?.en === 'string' && info.en.length > 0;
    });
    expect(withInfo.length).toBeGreaterThanOrEqual(1);
  });
});
