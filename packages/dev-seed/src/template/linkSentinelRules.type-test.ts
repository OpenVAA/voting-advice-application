/**
 * Standing type-only negative control for `LinkSentinelRule`'s collection/target pairing.
 *
 * ## This file's only job is to be TYPE-CHECKED. It is never executed.
 *
 * `-test.ts`, not `.test.ts`: vitest's include glob is `*.{test,spec}.?(c|m)[jt]s?(x)`, which does not match this name, while `packages/dev-seed/tsconfig.json`'s `include` covers
 * `src/**` and therefore does. Same contract as `strictRowTypes.type-test.ts`; see its
 * header for the gate commands and for why deleting a line here turns the gate red (an unused `@ts-expect-error` is itself a diagnostic, `TS2578`).
 *
 * ## What it controls for
 *
 * Widen `LinkSentinelRule.collections` to `ReadonlyArray<CollectionKey>`, all eleven, and a rule naming a collection the resolvers cannot handle compiles clean: a `join` rule on a collection whose `bulk_import` items carry no link key has its links silently dropped, and a `jsonb` rule on a table with no scoping column makes `linkQuestionScopes` fail with a PostgREST error on a table nobody meant to touch.
 *
 * `LinkSentinelRule` is a union over the two target kinds, so `collections` and `target` are checked as a pair at the DECLARATION. The two illegal rules below are the control; the two legal ones beside them are what stops a green from meaning "the type rejects everything".
 */

import { LINK_SENTINELS } from './linkSentinels';
import type { LinkSentinelRule } from './linkSentinels';

/**
 * The shipped const still satisfies the tightened rule type. This line is not decoration: a pairing rule strict enough to reject the four real rules would be useless, and this is what says so on every gate run.
 */
export const shippedRulesStillSatisfy: ReadonlyArray<LinkSentinelRule> = LINK_SENTINELS;

/**
 * The exemplar: `organizations` items carry no `bulk_import` link key, so pairing the collection with a `join` target must fail HERE.
 */
export const illegalJoinRule = {
  // @ts-expect-error TS2322 — 'organizations' is not a JoinParentCollection; a `join` target may only be declared on 'elections' or 'constituency_groups'.
  collections: ['organizations'],
  keys: ['_foo'],
  target: { kind: 'join', linkKey: 'constituency_groups' }
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
  target: { kind: 'join', linkKey: 'constituencies' }
} as const satisfies LinkSentinelRule;

/** Legality case — a correctly paired `jsonb` rule, over BOTH collections the real one covers. */
export const legalJsonbRule = {
  collections: ['question_categories', 'questions'],
  keys: ['_elections'],
  refTable: 'elections',
  target: { kind: 'jsonb', column: 'election_ids' }
} as const satisfies LinkSentinelRule;
