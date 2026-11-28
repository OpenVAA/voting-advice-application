/**
 * `planLinks` and `importLinkFor` — the pure halves of the link-sentinel resolver.
 *
 * ## What this file is for
 *
 * `LINK_SENTINELS` is read by two pure readers: `importLinkFor` turns the two `join` rules into the `bulk_import` link key `SupabaseAdminClient.bulkImport` sends, and `planLinks` turns the two `jsonb` rules into the scoping writes of `SupabaseAdminClient.linkQuestionScopes`. Both exist so the resolution rules can be exercised with no database at all, and so `LINK_SENTINELS` is the array the resolvers **iterate** rather than a list maintained beside hand-written blocks.
 *
 * ## The behaviour-preservation properties
 *
 * Each `it` in the `behaviour preservation` block below pins one property of the resolution the seed depends on, so a rewrite cannot lose one silently — only the E2E suite would otherwise see such a regression, loudly and late.
 */

import { describe, expect, it } from 'vitest';
import { importLinkFor, JSONB_PARENT_COLLECTIONS, LINK_SENTINELS, planLinks } from './linkSentinels';
import type { LinkPlanEntry, LinkSentinelRule } from './linkSentinels';

/** Convenience: the `collection/key` pair strings a plan dispatched. */
function pairs(plan: ReadonlyArray<LinkPlanEntry>): Array<string> {
  return plan.map((entry) => `${entry.collection}/${entry.key}`);
}

describe('importLinkFor and planLinks — behaviour preservation', () => {
  it('1. first-non-nullish key precedence: the sentinel form wins over the bare form', () => {
    const link = importLinkFor('elections', {
      external_id: 'el-1',
      _constituencyGroups: { externalId: ['cg-sentinel'] },
      constituency_groups: [{ external_id: 'cg-bare' }]
    });
    expect(link).toEqual({ key: 'constituency_groups', refs: [{ external_id: 'cg-sentinel' }] });
  });

  it('1b. key order inside a rule is `??`-precedence order, not cosmetic', () => {
    const link = importLinkFor('elections', {
      external_id: 'el-1',
      constituencyGroups: [{ external_id: 'cg-camel' }],
      constituency_groups: [{ external_id: 'cg-snake' }]
    });
    expect(link?.refs).toEqual([{ external_id: 'cg-camel' }]);
  });

  it('2. two payload normalisers, one output — object form and bare-array form agree', () => {
    const fromObject = importLinkFor('constituency_groups', {
      external_id: 'cg-1',
      _constituencies: { external_id: ['co-1', 'co-2'] }
    });
    const fromArray = importLinkFor('constituency_groups', {
      external_id: 'cg-1',
      constituencies: [{ external_id: 'co-1' }, { externalId: 'co-2' }]
    });
    expect(fromObject).toEqual({ key: 'constituencies', refs: [{ external_id: 'co-1' }, { external_id: 'co-2' }] });
    expect(fromArray).toEqual(fromObject);
  });

  it('2b. a bare-array ref carrying neither external_id nor externalId is skipped, not defaulted', () => {
    const link = importLinkFor('constituency_groups', {
      external_id: 'cg-1',
      constituencies: [{ external_id: 'co-1' }, { name: 'nope' }]
    });
    expect(link?.refs).toEqual([{ external_id: 'co-1' }]);
  });

  it('3. a malformed payload is SKIPPED, not thrown on — join sites and jsonb sites alike', () => {
    expect(importLinkFor('elections', { external_id: 'el-1', constituency_groups: 'not-an-array' })).toBeUndefined();
    expect(planLinks({ questions: [{ external_id: 'qu-1', _elections: 'not-an-object' }] })).toEqual([]);
  });

  it('4. a row with neither externalId nor external_id is skipped, not defaulted and not thrown on', () => {
    const plan = planLinks({ questions: [{ _elections: { externalId: ['el-1'] } }] });
    expect(plan).toEqual([]);
  });

  it('5. an empty array is a no-op on a jsonb site — never a column clear', () => {
    const plan = planLinks({
      questions: [{ external_id: 'qu-1', _elections: { externalId: [] } }],
      question_categories: [{ external_id: 'qc-1', _constituencies: { external_id: [] } }]
    });
    expect(plan).toEqual([]);
  });

  it('5b. an empty array on a join site sends no link key', () => {
    expect(
      importLinkFor('elections', { external_id: 'el-1', _constituencyGroups: { externalId: [] } })
    ).toBeUndefined();
  });

  it('6. rule dispatch order is preserved: _elections(cat, qu) → _constituencies(cat, qu)', () => {
    const plan = planLinks({
      questions: [
        { external_id: 'qu-1', _elections: { externalId: ['el-1'] }, _constituencies: { externalId: ['co-1'] } }
      ],
      question_categories: [
        { external_id: 'qc-1', _elections: { externalId: ['el-1'] }, _constituencies: { externalId: ['co-1'] } }
      ]
    });
    expect(pairs(plan)).toEqual([
      'question_categories/_elections',
      'questions/_elections',
      'question_categories/_constituencies',
      'questions/_constituencies'
    ]);
  });

  it('6b. plan order follows LINK_SENTINELS array order — reordering the const is observable', () => {
    const ruleTargets = LINK_SENTINELS.map((rule) => JSON.stringify(rule.target));
    const plan = planLinks({
      questions: [
        { external_id: 'qu-1', _constituencies: { externalId: ['co-1'] }, _elections: { externalId: ['el-1'] } }
      ]
    });
    const observedTargets = plan.map((entry) => JSON.stringify(entry.target));
    // Every emitted target appears in the const's own order.
    expect(observedTargets).toEqual(
      observedTargets.slice().sort((a, b) => ruleTargets.indexOf(a) - ruleTargets.indexOf(b))
    );
  });

  it('collection-key aliasing survives: camelCase and snake_case maps produce the same entries', () => {
    const row = { external_id: 'qc-1', _elections: { externalId: ['el-1'] } };
    const fromCamel = planLinks({ questionCategories: [{ ...row }] });
    const fromSnake = planLinks({ question_categories: [{ ...row }] });
    expect(fromCamel).toEqual(fromSnake);
    expect(fromCamel[0].collection).toBe('question_categories');
  });

  it('a collection supplied under BOTH forms is read once, camelCase winning', () => {
    const plan = planLinks({
      questionCategories: [{ external_id: 'qc-camel', _elections: { externalId: ['el-1'] } }],
      question_categories: [{ external_id: 'qc-snake', _elections: { externalId: ['el-1'] } }]
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].parentExternalId).toBe('qc-camel');
  });

  it('carries the rule refTable and target through to the entry', () => {
    const plan = planLinks({
      question_categories: [{ external_id: 'qc-1', _constituencies: { externalId: ['co-1'] } }]
    });
    expect(plan[0]).toMatchObject({
      collection: 'question_categories',
      refTable: 'constituencies',
      target: { kind: 'jsonb', column: 'constituency_ids' }
    });
  });

  it('names the bulk_import link key each join rule is sent under', () => {
    expect(
      importLinkFor('elections', { external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } })?.key
    ).toBe('constituency_groups');
    expect(
      importLinkFor('constituency_groups', { external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } })?.key
    ).toBe('constituencies');
  });

  it('plans no join rule: the constituency links reach the database through importLinkFor only', () => {
    const plan = planLinks({
      elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }],
      constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }]
    });
    expect(plan).toEqual([]);
  });
});

// -----------------------------------------------------------------------------
// The derivation guarantee
// -----------------------------------------------------------------------------

/**
 * ⚠ **`EXPECTED_PAIRS` is HAND-ENUMERATED, deliberately, and must stay so.**
 *
 * Deriving it from `LINK_SENTINELS` would make every assertion below TAUTOLOGICAL — they would pass for any const at all, including an empty one.
 * Hand-enumeration is the whole mechanism: adding a pair to the const turns these RED and forces the author to state the addition here as well.
 *
 * ## The guarantee's honest scope, stated rather than implied
 *
 * The obvious phrasing — "adding a sentinel to the types without handling it in the pipeline fails a test" — describes a PARALLEL-LIST world.
 * The shape chosen makes that world impossible: `planLinks` ITERATES `LINK_SENTINELS`, so **adding a pair to the const cannot leave it unhandled — the resolver will handle it.** There is no test to write for that direction, because the failure mode is structurally impossible.
 *
 * What these cases catch is the OTHER direction: **the const growing (or shrinking) silently.** That is a real and reachable regression, and the hand-enumerated expectation is the only thing standing between it and a green suite. Read the cases as policing the declaration, not the dispatch.
 *
 * ## The three bare non-underscore forms
 *
 * They MUST be asserted against `LINK_SENTINELS` SPECIFICALLY, never against the four-source permitted-key union: `COLLECTION_NON_COLUMNS` supplies `elections: {constituencyGroups, constituency_groups}` and `constituency_groups: {constituencies}` independently, so a regression that empties the bare forms out of this const alone rejects **0** key occurrences and is invisible from the union — and from Pass 0. The first case below reads the const directly for exactly that reason.
 *
 * Count re-derived from `LINK_SENTINELS` at this HEAD, not copied: 4 + 2 + 2 + 2 = **10** distinct pairs (7 `_`-prefixed + 3 bare).
 */
const EXPECTED_PAIRS: ReadonlyArray<string> = [
  'elections/_constituencyGroups',
  'elections/_constituency_groups',
  'elections/constituencyGroups',
  'elections/constituency_groups',
  'constituency_groups/_constituencies',
  'constituency_groups/constituencies',
  'question_categories/_elections',
  'questions/_elections',
  'question_categories/_constituencies',
  'questions/_constituencies'
];

/** The payload shape a key form actually accepts — see `firstDeclaredKey`. */
function payloadFor(key: string): unknown {
  return key.startsWith('_') ? { externalId: ['x'] } : [{ external_id: 'x' }];
}

describe('LINK_SENTINELS is the array the resolver iterates', () => {
  it('flattens to exactly the hand-enumerated ten (collection, key) pairs — asserted against the CONST', () => {
    const flattened: Array<string> = [];
    for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
      for (const collection of rule.collections) {
        for (const key of rule.keys) flattened.push(`${collection}/${key}`);
      }
    }
    expect([...flattened].sort()).toEqual([...EXPECTED_PAIRS].sort());
    expect(flattened).toHaveLength(10);
  });

  it('importLinkFor and planLinks between them dispatch exactly the hand-enumerated pairs — no more, no fewer', () => {
    // One row per declared pair, each declaring ONLY its own key. Built FROM the const so a pair added there shows up in `observed`; compared AGAINST the hand-written list so it shows up as a FAILURE.
    const data: Record<string, Array<Record<string, unknown>>> = {};
    const observed: Array<string> = [];
    for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
      for (const collection of rule.collections) {
        for (const key of rule.keys) {
          const row = { external_id: `${collection}~${key}`, [key]: payloadFor(key) };
          (data[collection] ??= []).push(row);
          if (importLinkFor(collection, row)) observed.push(`${collection}/${key}`);
        }
      }
    }
    observed.push(...pairs(planLinks(data)));
    expect(observed.sort()).toEqual([...EXPECTED_PAIRS].sort());
  });

  it('a pair the resolver does NOT read produces no plan entry — the must-NOT-fire control', () => {
    // The two exemplars, in executable form. `_constituencies` is read on constituency_groups and (via the jsonb rule) on question_categories / questions — never on elections. `_elections` is read on question_categories / questions — never on candidates.
    expect(
      importLinkFor('elections', { external_id: 'el-1', _constituencies: { externalId: ['co-1'] } })
    ).toBeUndefined();
    expect(planLinks({ elections: [{ external_id: 'el-1', _constituencies: { externalId: ['co-1'] } }] })).toEqual([]);
    expect(planLinks({ candidates: [{ external_id: 'ca-1', _elections: { externalId: ['el-1'] } }] })).toEqual([]);
  });

  it('questions._elections IS still read, and targets the election_ids jsonb column', () => {
    // This pair is a first-class feature, not an accident: `electionResolve` is dispatched for `questions` as well as `question_categories`.
    const plan = planLinks({ questions: [{ external_id: 'qu-1', _elections: { externalId: ['el-1'] } }] });
    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      collection: 'questions',
      key: '_elections',
      parentExternalId: 'qu-1',
      refExternalIds: ['el-1'],
      refTable: 'elections',
      target: { kind: 'jsonb', column: 'election_ids' }
    });
  });
});

// -----------------------------------------------------------------------------
// The collection is paired with the target kind
// -----------------------------------------------------------------------------

/**
 * `linkQuestionScopes` updates `entry.collection` with no cast, so every plan entry must name a table that carries a scoping column.
 *
 * The compile-time half is `linkSentinelRules.type-test.ts`. This is the runtime half.
 */
describe('planLinks — every entry names a collection that carries a scoping column', () => {
  /** One dataset exercising all four rules. */
  const plan = planLinks({
    elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }],
    constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }],
    question_categories: [{ external_id: 'qc-1', _elections: { externalId: ['el-1'] } }],
    questions: [{ external_id: 'qu-1', _constituencies: { externalId: ['co-1'] } }]
  });

  it('plans the two jsonb links and no join link — a green below cannot come from an empty plan', () => {
    expect(plan).toHaveLength(2);
    for (const entry of plan) expect(entry.target.kind).toBe('jsonb');
  });

  it('never emits an entry for a collection that carries no scoping column', () => {
    for (const entry of plan) {
      expect(JSONB_PARENT_COLLECTIONS).toContain(entry.collection);
    }
  });
});
