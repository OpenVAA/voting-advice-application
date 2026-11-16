/**
 * Standing type-only negative control for `LinkSentinelRule`'s collection/target pairing.
 *
 * ## This file's only job is to be TYPE-CHECKED. It is never executed.
 *
 * `-test.ts`, not `.test.ts`: vitest's include glob is `*.{test,spec}.?(c|m)[jt]s?(x)`, which does not match this name, while `packages/dev-seed/tsconfig.json`'s `include` covers
 * `tests/**` and therefore does. Same contract as `strictRowTypes.type-test.ts`; see its
 * header for the gate commands and for why deleting a line here turns the gate red (an unused `@ts-expect-error` is itself a diagnostic, `TS2578`).
 *
 * ## What it controls for
 *
 * `linkJoinTables`' docblock claims "adding a pair to the const cannot leave it unresolved" and "a new `LinkTarget.kind` is a COMPILE error here". A `never` arm covers `target.kind` only. Widen `LinkSentinelRule.collections` to `ReadonlyArray<CollectionKey>`, all twelve, and `linkJoinTables` has to launder `entry.collection` through `as` casts — so a rule naming a collection the resolver cannot handle compiles clean and dies at seed time as `TypeError: LINK_LOOKUP_ERRORS[table] is not a function`, MASKING the real lookup failure instead of reporting it with the greppable message `LINK_LOOKUP_ERRORS` exists to preserve.
 *
 * `LinkSentinelRule` is a union over the two target kinds, so `collections` and `target` are checked as a pair at the DECLARATION. The two illegal rules below are the control; the two legal ones beside them are what stops a green from meaning "the type rejects everything".
 */

import { LINK_SENTINELS } from '../../src/template/linkSentinels';
import type { LinkSentinelRule } from '../../src/template/linkSentinels';

/**
 * The shipped const still satisfies the tightened rule type. This line is not decoration: a pairing rule strict enough to reject the four real rules would be useless, and this is what says so on every gate run.
 */
export const shippedRulesStillSatisfy: ReadonlyArray<LinkSentinelRule> = LINK_SENTINELS;

/**
 * The exemplar: `organizations` is not a table `linkJoinTables` can resolve a join parent UUID for — it is outside `LINK_LOOKUP_ERRORS`' domain — so pairing it with a `join` target must fail HERE.
 */
export const illegalJoinRule = {
  // @ts-expect-error TS2322 — 'organizations' is not a JoinParentCollection; a `join` target may only be declared on 'elections' or 'constituency_groups'.
  collections: ['organizations'],
  keys: ['_foo'],
  refTable: 'elections',
  target: {
    kind: 'join',
    table: 'election_constituency_groups',
    parentColumn: 'election_id',
    childColumn: 'constituency_group_id',
    onConflict: 'election_id,constituency_group_id'
  }
} as const satisfies LinkSentinelRule;

/**
 * The mirror case: a `jsonb` target on a table that carries no scoping column. `elections` has neither `election_ids` nor `constituency_ids`, so the update would have hit a real table with a nonexistent column — a PostgREST error on a table nobody meant to touch.
 */
export const illegalJsonbRule = {
  collections: ['elections'],
  keys: ['_constituencies'],
  refTable: 'constituencies',
  target: { kind: 'jsonb', column: 'constituency_ids' }
  // ⚠ The directive sits on the `satisfies` line, not beside `collections`, because that is where the compiler reports THIS one: a `jsonb` target carries too few properties to discriminate the union, so the mismatch surfaces as a whole-expression `TS1360` rather than as a per-property `TS2322` (which is where the join case above reports). Verified by running the gate both ways.
  // @ts-expect-error TS1360 — 'elections' is not a JsonbParentCollection; a `jsonb` target may only be declared on 'question_categories' or 'questions'.
} as const satisfies LinkSentinelRule;

/** Legality case — a correctly paired `join` rule carries no directive and must compile. */
export const legalJoinRule = {
  collections: ['constituency_groups'],
  keys: ['_constituencies'],
  refTable: 'constituencies',
  target: {
    kind: 'join',
    table: 'constituency_group_constituencies',
    parentColumn: 'constituency_group_id',
    childColumn: 'constituency_id',
    onConflict: 'constituency_group_id,constituency_id'
  }
} as const satisfies LinkSentinelRule;

/** Legality case — a correctly paired `jsonb` rule, over BOTH collections the real one covers. */
export const legalJsonbRule = {
  collections: ['question_categories', 'questions'],
  keys: ['_elections'],
  refTable: 'elections',
  target: { kind: 'jsonb', column: 'election_ids' }
} as const satisfies LinkSentinelRule;
