/**
 * `planLinks` — the pure half of the join/JSONB sentinel resolver.
 *
 * ## What this file is for
 *
 * `SupabaseAdminClient.linkJoinTables` is split into a pure `planLinks` (this file's subject) and an I/O half — `linkJoinTables`' own `switch` over `entry.target.kind`, with its `upsertJoinRows` / `updateJsonbRefs` arms and a `never` exhaustiveness arm. The split exists so the resolution rules can be exercised with no database at all, and so `LINK_SENTINELS` becomes the array the resolver **iterates** rather than a list maintained beside four hand-written blocks.
 *
 * ## The six behaviour-preservation properties
 *
 * The rewrite had to change **no seeded byte**. Each `it` in the `behaviour preservation` block below pins one measured property of the pre-rewrite `linkJoinTables`, so a future rewrite cannot lose one silently — `yarn test:unit` could not see such a regression before this file existed; only the E2E suite could, loudly and late.
 */

import { describe, expect, it } from 'vitest';
import {
  JOIN_PARENT_COLLECTIONS,
  JSONB_PARENT_COLLECTIONS,
  LINK_SENTINELS,
  planLinks
} from '../../src/template/linkSentinels';
import type { LinkPlanEntry, LinkSentinelRule } from '../../src/template/linkSentinels';

/** Convenience: the `collection/key` pair strings a plan dispatched. */
function pairs(plan: ReadonlyArray<LinkPlanEntry>): Array<string> {
  return plan.map((entry) => `${entry.collection}/${entry.key}`);
}

describe('planLinks — behaviour preservation (the six measured properties)', () => {
  it('1. first-non-nullish key precedence: the sentinel form wins over the bare form', () => {
    const plan = planLinks({
      elections: [
        {
          external_id: 'el-1',
          _constituencyGroups: { externalId: ['cg-sentinel'] },
          constituency_groups: [{ external_id: 'cg-bare' }]
        }
      ]
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].key).toBe('_constituencyGroups');
    expect(plan[0].refExternalIds).toEqual(['cg-sentinel']);
  });

  it('1b. key order inside a rule is `??`-precedence order, not cosmetic', () => {
    const plan = planLinks({
      elections: [
        {
          external_id: 'el-1',
          constituencyGroups: [{ external_id: 'cg-camel' }],
          constituency_groups: [{ external_id: 'cg-snake' }]
        }
      ]
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].key).toBe('constituencyGroups');
    expect(plan[0].refExternalIds).toEqual(['cg-camel']);
  });

  it('2. two payload normalisers, one output — object form and bare-array form agree', () => {
    const fromObject = planLinks({
      constituency_groups: [{ external_id: 'cg-1', _constituencies: { external_id: ['co-1', 'co-2'] } }]
    });
    const fromArray = planLinks({
      constituency_groups: [{ external_id: 'cg-1', constituencies: [{ external_id: 'co-1' }, { externalId: 'co-2' }] }]
    });
    expect(fromObject[0].refExternalIds).toEqual(['co-1', 'co-2']);
    expect(fromArray[0].refExternalIds).toEqual(['co-1', 'co-2']);
  });

  it('2b. a bare-array ref carrying neither external_id nor externalId is skipped, not defaulted', () => {
    const plan = planLinks({
      constituency_groups: [{ external_id: 'cg-1', constituencies: [{ external_id: 'co-1' }, { name: 'nope' }] }]
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].refExternalIds).toEqual(['co-1']);
  });

  it('3. a malformed payload is SKIPPED, not thrown on — join sites and jsonb sites alike', () => {
    expect(() =>
      planLinks({
        elections: [{ external_id: 'el-1', constituency_groups: 'not-an-array' }],
        questions: [{ external_id: 'qu-1', _elections: 'not-an-object' }]
      })
    ).not.toThrow();
    expect(
      planLinks({
        elections: [{ external_id: 'el-1', constituency_groups: 'not-an-array' }],
        questions: [{ external_id: 'qu-1', _elections: 'not-an-object' }]
      })
    ).toEqual([]);
  });

  it('4. a row with neither externalId nor external_id is skipped, not defaulted and not thrown on', () => {
    const plan = planLinks({
      elections: [{ _constituencyGroups: { externalId: ['cg-1'] } }],
      questions: [{ _elections: { externalId: ['el-1'] } }]
    });
    expect(plan).toEqual([]);
  });

  it('5. an empty array is a no-op on a jsonb site — never a column clear', () => {
    const plan = planLinks({
      questions: [{ external_id: 'qu-1', _elections: { externalId: [] } }],
      question_categories: [{ external_id: 'qc-1', _constituencies: { external_id: [] } }]
    });
    expect(plan).toEqual([]);
  });

  it('5b. an empty array on a JOIN site still emits an entry — the parent lookup is preserved', () => {
    // `linkJoinTables` resolved the parent election UUID before iterating the
    // (zero) refs, so a missing parent still threw. Dropping the entry here would silently remove that failure mode.
    const plan = planLinks({ elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: [] } }] });
    expect(plan).toHaveLength(1);
    expect(plan[0].refExternalIds).toEqual([]);
  });

  it('6. rule dispatch order is preserved: elections → cgs → _elections(cat, qu) → _constituencies(cat, qu)', () => {
    const plan = planLinks({
      questions: [
        { external_id: 'qu-1', _elections: { externalId: ['el-1'] }, _constituencies: { externalId: ['co-1'] } }
      ],
      question_categories: [
        { external_id: 'qc-1', _elections: { externalId: ['el-1'] }, _constituencies: { externalId: ['co-1'] } }
      ],
      constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }],
      elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }]
    });
    expect(pairs(plan)).toEqual([
      'elections/_constituencyGroups',
      'constituency_groups/_constituencies',
      'question_categories/_elections',
      'questions/_elections',
      'question_categories/_constituencies',
      'questions/_constituencies'
    ]);
  });

  it('6b. plan order follows LINK_SENTINELS array order — reordering the const is observable', () => {
    const ruleTargets = LINK_SENTINELS.map((rule) => JSON.stringify(rule.target));
    const plan = planLinks({
      elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }],
      constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }],
      questions: [
        { external_id: 'qu-1', _elections: { externalId: ['el-1'] }, _constituencies: { externalId: ['co-1'] } }
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
      constituencyGroups: [{ external_id: 'cg-camel', _constituencies: { externalId: ['co-1'] } }],
      constituency_groups: [{ external_id: 'cg-snake', _constituencies: { externalId: ['co-1'] } }]
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].parentExternalId).toBe('cg-camel');
  });

  it('carries the rule refTable and target through to the entry', () => {
    const plan = planLinks({ elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }] });
    expect(plan[0]).toMatchObject({
      collection: 'elections',
      refTable: 'constituency_groups',
      target: {
        kind: 'join',
        table: 'election_constituency_groups',
        parentColumn: 'election_id',
        childColumn: 'constituency_group_id',
        onConflict: 'election_id,constituency_group_id'
      }
    });
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

  it('planLinks dispatches exactly the hand-enumerated pairs — no more, no fewer', () => {
    // One row per declared pair, each declaring ONLY its own key. Built FROM the const so a pair added there shows up in `observed`; compared AGAINST the hand-written list so it shows up as a FAILURE.
    const data: Record<string, Array<Record<string, unknown>>> = {};
    for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
      for (const collection of rule.collections) {
        for (const key of rule.keys) {
          (data[collection] ??= []).push({ external_id: `${collection}~${key}`, [key]: payloadFor(key) });
        }
      }
    }
    const observed = pairs(planLinks(data)).sort();
    expect(observed).toEqual([...EXPECTED_PAIRS].sort());
  });

  it('a pair the resolver does NOT read produces no plan entry — the must-NOT-fire control', () => {
    // The two exemplars, in executable form. `_constituencies` is read on constituency_groups and (via the jsonb rule) on question_categories / questions — never on elections. `_elections` is read on question_categories / questions — never on candidates.
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
// The collection is paired with the target kind, not laundered
// -----------------------------------------------------------------------------

/**
 * `linkJoinTables` used to launder `entry.collection` through two `as` casts — `as 'elections' | 'constituency_groups'` before the parent lookup and `as 'question_categories' | 'questions'` before the JSONB update — because TypeScript does not narrow a union from a NESTED discriminant, and the discriminant lived on `entry.target`. A rule declaring a collection outside `LINK_LOOKUP_ERRORS`' domain therefore compiled clean and died at seed time as `TypeError: LINK_LOOKUP_ERRORS[table] is not a function`, MASKING the real lookup failure. `tests/template/linkSentinels.test.ts` exercised only `planLinks`, so nothing caught it.
 *
 * The compile-time half is `linkSentinelRules.type-test.ts`. This is the runtime half: the top-level `kind` that makes the narrowing possible, and the pairing it carries.
 */
describe('planLinks — every entry carries a top-level kind paired with a legal parent collection', () => {
  /** One dataset exercising all four rules, so both arms are populated. */
  const plan = planLinks({
    elections: [{ external_id: 'el-1', _constituencyGroups: { externalId: ['cg-1'] } }],
    constituency_groups: [{ external_id: 'cg-1', _constituencies: { externalId: ['co-1'] } }],
    question_categories: [{ external_id: 'qc-1', _elections: { externalId: ['el-1'] } }],
    questions: [{ external_id: 'qu-1', _constituencies: { externalId: ['co-1'] } }]
  });

  it('populates BOTH arms — a green below cannot come from an empty plan', () => {
    expect(plan).toHaveLength(4);
    expect(plan.filter((entry) => entry.kind === 'join')).toHaveLength(2);
    expect(plan.filter((entry) => entry.kind === 'jsonb')).toHaveLength(2);
  });

  it('mirrors target.kind onto the entry, so `switch (entry.kind)` narrows the collection too', () => {
    for (const entry of plan) expect(entry.kind).toBe(entry.target.kind);
  });

  it('never emits a join entry for a collection LINK_LOOKUP_ERRORS cannot name', () => {
    // The exact hazard: `resolveExternalId(table)` indexes `LINK_LOOKUP_ERRORS` by the entry's collection, and an unmapped table makes the error reporter itself throw.
    for (const entry of plan.filter((e) => e.kind === 'join')) {
      expect(JOIN_PARENT_COLLECTIONS).toContain(entry.collection);
    }
  });

  it('never emits a jsonb entry for a collection that carries no scoping column', () => {
    for (const entry of plan.filter((e) => e.kind === 'jsonb')) {
      expect(JSONB_PARENT_COLLECTIONS).toContain(entry.collection);
    }
  });

  it('holds the shipped const to the same pairing, rule by rule', () => {
    // Read off LINK_SENTINELS rather than off the plan, so a rule that emits no entry for the fixture above is still covered.
    for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
      const legal: ReadonlyArray<string> =
        rule.target.kind === 'join' ? JOIN_PARENT_COLLECTIONS : JSONB_PARENT_COLLECTIONS;
      for (const collection of rule.collections as ReadonlyArray<string>) {
        expect(legal, `${collection}/${rule.target.kind}`).toContain(collection);
      }
    }
  });
});
