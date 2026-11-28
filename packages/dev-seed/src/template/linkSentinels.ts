/**
 * `LINK_SENTINELS` — the declarative description of every M:N / JSONB link sentinel a seed writes.
 *
 * The two `join` rules, an election's constituency groups and a constituency group's constituencies, are sent to `bulk_import` by `SupabaseAdminClient.bulkImport` as link keys of the declaring item ({@link importLinkFor}), so that `bulk_import` writes the join rows before any nomination. The two `jsonb` rules are planned by {@link planLinks} and written by `SupabaseAdminClient.linkQuestionScopes` after the import.
 *
 * ## What this const is for
 *
 * `linkQuestionScopes` and `bulkImport` drive their loops from THIS array, through {@link planLinks} (the `jsonb` rules) and {@link importLinkFor} (the `join` rules) below, rather than from hard-coded resolution blocks. That is what makes the derivation guarantee real: **a `(collection, key)` pair cannot be permitted without also being handled**, because the same loop that permits it is the loop that resolves it. Adding a pair here without teaching the resolver about it is a test failure, not a silent drop.
 *
 * ## Where the resolution now lives
 *
 * The planning half — {@link planLinks}, {@link pickCollection}, {@link firstDeclaredKey} — is in THIS file, deliberately. Keeping the const and the loop that reads it in one module is what makes "adding a pair without handling it is impossible" a structural fact rather than a convention. The planner is **pure**: no Supabase import, no network, no env, so `yarn test:unit` exercises every rule with no database.
 * `SupabaseAdminClient.linkQuestionScopes` supplies only the I/O.
 *
 * ## Two invariants that are easy to break by accident
 *
 * 1. **Key order inside a rule is `??`-precedence order and is observable.**
 *    `importLinkFor` reads `_constituencyGroups ?? _constituency_groups ??
 *    constituencyGroups ?? constituency_groups`; a row carrying two forms resolves the first. Re-ordering `keys` changes behaviour for such a row.
 * 2. **The three bare, non-underscore forms are not decorative.** Every
 *    hand-authored election and constituency-group row in the built-in templates uses `elections.constituency_groups` or `constituency_groups.constituencies`.
 *    They survive today only because `COLLECTION_NON_COLUMNS` strips them before the RPC sees them. Dropping them here moves them outside this const's authority — permitted somewhere no loop resolves.
 *
 * The literals below are the two `bulk_import` link keys of the election and constituency-group links, the two JSONB column names the election and constituency resolvers write (each for BOTH `question_categories` and `questions`), and the accepted key sets of each link.
 *
 * Declared `as const satisfies ReadonlyArray<LinkSentinelRule>` so every table and column name stays a narrow literal: a typo becomes a compile error here rather than a PostgREST 404 at seed time.
 */

import { COLLECTION_MAP, resolveCollectionName } from './collectionNames';
import type { CollectionKey } from './permittedKeys';

/**
 * The payload shapes a sentinel key may carry. Both are already accepted in-tree, so this union is a description rather than a new contract.
 *
 * - The `_`-prefixed form carries an object of external-id string arrays.
 * - The bare form carries an array of reference objects.
 */
export type SentinelPayload =
  { externalId?: Array<string>; external_id?: Array<string> } | Array<{ external_id?: string; externalId?: string }>;

/**
 * The collections a `join`-target rule may declare — the collections whose `bulk_import` items carry a link key.
 *
 * ⚠ This list is not decoration: `bulk_import` reads a link key only on these two collections' items. Widen `LinkSentinelRule.collections` back to `ReadonlyArray<CollectionKey>` — all eleven — and a rule declaring a collection outside this list compiles clean, then sends a link key `bulk_import` ignores, so the declared links are silently dropped.
 */
export const JOIN_PARENT_COLLECTIONS = ['elections', 'constituency_groups'] as const;

/**
 * The collections a `jsonb`-target rule may declare — the tables that carry a scoping column `linkQuestionScopes` writes with `.from(...).update(...)`.
 *
 * Same hazard as {@link JOIN_PARENT_COLLECTIONS} from the other direction: a rule naming a collection with no such column produced a PostgREST error on a table nobody meant to touch.
 */
export const JSONB_PARENT_COLLECTIONS = ['question_categories', 'questions'] as const;

/** A collection a `join`-target rule may declare. */
export type JoinParentCollection = (typeof JOIN_PARENT_COLLECTIONS)[number];
/** A collection a `jsonb`-target rule may declare. */
export type JsonbParentCollection = (typeof JSONB_PARENT_COLLECTIONS)[number];

/** Every collection that may declare a link sentinel, under either target kind. */
export type LinkParentCollection = JoinParentCollection | JsonbParentCollection;

/** The link keys `bulk_import` reads: `constituency_groups` on an election item, `constituencies` on a constituency-group item. */
export type ImportLinkKey = 'constituency_groups' | 'constituencies';

/**
 * Where a resolved sentinel's UUIDs are written.
 *
 * Discriminated on `kind`: `join` names association rows `bulk_import` writes, `jsonb` a column `linkQuestionScopes` updates on the row itself.
 */
export type LinkTarget =
  | {
      /** Association rows in a dedicated join table, which `bulk_import` writes from a link key of the declaring row's item. */
      readonly kind: 'join';
      /** The key of the declaring row's `bulk_import` item that carries the references. */
      readonly linkKey: ImportLinkKey;
    }
  | {
      /** A JSONB array column updated on the declaring row itself. */
      readonly kind: 'jsonb';
      readonly column: 'election_ids' | 'constituency_ids';
    };

/** The half of a rule that does not vary with the target kind. */
interface LinkSentinelRuleBase {
  /** Every key form the resolver reads, in `??`-precedence order. */
  readonly keys: ReadonlyArray<string>;
}

/** Table whose `external_id`s a `jsonb` rule's payload names — the tables `linkQuestionScopes` looks up. */
export type JsonbRefTable = 'elections' | 'constituencies';

/**
 * One resolution rule: which collections, which key forms, which target.
 *
 * ⚠ **A UNION, so `collections` and `target` are checked as a PAIR.** Collapse it back into one interface with `collections: ReadonlyArray<CollectionKey>` and a new rule such as `{ collections: ['organizations'], target: { kind: 'join', … } }` satisfies `as const satisfies ReadonlyArray<LinkSentinelRule>` and compiles clean — `bulkImport` then sends a link key `bulk_import` ignores, or `linkQuestionScopes` updates a table with no scoping column.
 *
 * As a union, a mismatched pair matches neither member and fails at the DECLARATION, which is where such errors belong.
 * `strictRowTypes.type-test.ts` holds a `@ts-expect-error` on exactly that shape.
 */
export type LinkSentinelRule =
  | (LinkSentinelRuleBase & {
      /** Collections this rule applies to — canonical resolved snake_case table names. */
      readonly collections: ReadonlyArray<JoinParentCollection>;
      /** Where the resolved UUIDs go. */
      readonly target: Extract<LinkTarget, { kind: 'join' }>;
    })
  | (LinkSentinelRuleBase & {
      /** Collections this rule applies to — canonical resolved snake_case table names. */
      readonly collections: ReadonlyArray<JsonbParentCollection>;
      /** Table whose `external_id`s the payload names. */
      readonly refTable: JsonbRefTable;
      /** Where the resolved UUIDs go. */
      readonly target: Extract<LinkTarget, { kind: 'jsonb' }>;
    });

/**
 * The four rules, in today's dispatch order: elections → constituency groups → `_elections` (categories then questions) → `_constituencies` (categories then questions). Flattened, they are ten `(collection, key)` pairs.
 *
 * Rule order is preserved deliberately — the resolver iterates this array and the order in which links are written is observable in the database.
 */
export const LINK_SENTINELS = [
  {
    collections: ['elections'],
    keys: ['_constituencyGroups', '_constituency_groups', 'constituencyGroups', 'constituency_groups'],
    target: { kind: 'join', linkKey: 'constituency_groups' }
  },
  {
    collections: ['constituency_groups'],
    keys: ['_constituencies', 'constituencies'],
    target: { kind: 'join', linkKey: 'constituencies' }
  },
  {
    collections: ['question_categories', 'questions'],
    keys: ['_elections'],
    refTable: 'elections',
    target: { kind: 'jsonb', column: 'election_ids' }
  },
  {
    collections: ['question_categories', 'questions'],
    keys: ['_constituencies'],
    refTable: 'constituencies',
    target: { kind: 'jsonb', column: 'constituency_ids' }
  }
] as const satisfies ReadonlyArray<LinkSentinelRule>;

// -----------------------------------------------------------------------------
// The pure planning half
// -----------------------------------------------------------------------------

/**
 * One JSONB scoping write the executor must perform: "this row, under this key form, names these referenced `external_id`s, to be written to this column".
 *
 * Produced by {@link planLinks} with no database access at all; `SupabaseAdminClient.linkQuestionScopes` turns each entry into UUID lookups plus a JSONB column update.
 */
export interface LinkPlanEntry {
  /** The key form actually matched on this row — not the rule's whole key list. */
  readonly key: string;
  /** `external_id` of the row that declared the sentinel. */
  readonly parentExternalId: string;
  /** Referenced `external_id`s, normalised from either payload shape. */
  readonly refExternalIds: Array<string>;
  /** Table whose `external_id`s {@link LinkPlanEntry.refExternalIds} names. */
  readonly refTable: JsonbRefTable;
  /** Canonical snake_case collection the declaring row belongs to. */
  readonly collection: JsonbParentCollection;
  /** The column the resolved UUIDs are written to. */
  readonly target: Extract<LinkTarget, { kind: 'jsonb' }>;
}

/** A matched key together with the external ids its payload normalised to. */
interface KeyHit {
  readonly key: string;
  readonly ids: Array<string>;
}

/**
 * The rows of one canonical collection, accepting the camelCase alias.
 *
 * The resolver reads `data.constituencyGroups ?? data.constituency_groups` and `data.questionCategories ?? data.question_categories` — the camelCase alias WINS, and a dataset supplying both forms was read once, not twice. Both properties are preserved here. Aliases are derived through {@link resolveCollectionName} rather than hand-listed, so the set of accepted spellings cannot drift from the set the admin client renames with.
 *
 * @param data - The dataset handed to `bulkImport` / `linkQuestionScopes`.
 * @param collection - A canonical snake_case collection name.
 * @returns The rows, or `undefined` when the dataset carries no such collection.
 */
export function pickCollection(
  data: Record<string, Array<Record<string, unknown>>>,
  collection: CollectionKey
): Array<Record<string, unknown>> | undefined {
  const aliases = Object.keys(COLLECTION_MAP).filter(
    (key) => key !== collection && resolveCollectionName(key) === collection
  );
  for (const key of [...aliases, collection]) {
    const rows = data[key];
    if (rows != null) return rows as Array<Record<string, unknown>>;
  }
  return undefined;
}

/**
 * The `??` chain, generalised over a rule's key list.
 *
 * Walks `keys` in array order — which is why key order inside a rule is `??`-precedence order and not cosmetic — and stops at the first key whose payload normalises to a list of external ids. Two normalisers, one output:
 *
 *  - a `_`-prefixed key carries `{ externalId | external_id: string[] }`;
 *  - a bare key carries `Array<{ external_id | externalId }>`, and a reference object carrying neither is SKIPPED rather than defaulted.
 *
 * A key present but not normalising to an array yields nothing and the walk continues — mirroring the original chain, where a `_`-prefixed object without an id array fell through to the bare forms. A malformed payload is therefore skipped, never thrown on.
 *
 * @param row - The declaring row.
 * @param keys - The rule's key forms, in precedence order.
 * @returns The matched key and its ids, or `undefined` when no key matched.
 */
export function firstDeclaredKey(row: Record<string, unknown>, keys: ReadonlyArray<string>): KeyHit | undefined {
  for (const key of keys) {
    const raw = row[key];
    if (raw == null) continue;
    if (key.startsWith('_')) {
      const payload = raw as { externalId?: Array<string>; external_id?: Array<string> };
      const ids = payload.externalId ?? payload.external_id;
      if (!Array.isArray(ids)) continue;
      return { key, ids: [...ids] };
    }
    if (!Array.isArray(raw)) continue;
    const refs = raw as Array<{ external_id?: string; externalId?: string }>;
    const ids: Array<string> = [];
    for (const ref of refs) {
      const id = ref?.external_id ?? ref?.externalId;
      if (!id) continue;
      ids.push(id);
    }
    return { key, ids };
  }
  return undefined;
}

/**
 * Plan every JSONB scoping link the dataset declares, in `LINK_SENTINELS` order.
 *
 * Only the `jsonb` rules are planned: the `join` rules reach the database as `bulk_import` link keys, through {@link importLinkFor}.
 *
 * Pure — no Supabase import, no network, no env. The order of the returned entries is observable in the database, and it is the const's rule order: `_elections` (categories, then questions) → `_constituencies` (categories, then questions).
 *
 * ## The two skips
 *
 *  - A row with neither `externalId` nor `external_id` is skipped.
 *  - An **empty** id list is a no-op, NOT a column clear: writing `[]` instead would change the row's scoping from "all" to "none".
 *
 * @param data - The dataset handed to `bulkImport` / `linkQuestionScopes`.
 * @returns The ordered plan.
 */
export function planLinks(data: Record<string, Array<Record<string, unknown>>>): Array<LinkPlanEntry> {
  const plan: Array<LinkPlanEntry> = [];
  for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
    if (!isJsonbRule(rule)) continue;
    const { target, refTable } = rule;
    for (const collection of rule.collections) {
      const rows = pickCollection(data, collection);
      if (!rows) continue;
      for (const row of rows) {
        const hit = firstDeclaredKey(row, rule.keys);
        if (!hit || hit.ids.length === 0) continue;
        const parentExternalId = (row.externalId ?? row.external_id) as string | undefined;
        if (!parentExternalId) continue;
        // ⚠ The RUNTIME half of the guard. `LinkSentinelRule`'s union makes a mis-declared rule a compile error at the declaration, so this branch cannot be taken by any rule in this file. It is kept as a narrowing type guard, so a spelling that slipped past the compiler (a `--template ./custom.ts` module reaching in, a future `as` cast) fails HERE with a message naming the offending pair, rather than as a PostgREST error on a table with no scoping column.
        if (!isJsonbParentCollection(collection)) throw illegalParentError(collection);
        plan.push({ collection, key: hit.key, parentExternalId, refExternalIds: hit.ids, refTable, target });
      }
    }
  }
  return plan;
}

/**
 * The `bulk_import` link key and references a row is sent with, when a `join` rule covers its collection.
 *
 * `bulk_import` writes the two constituency join tables itself, before any nomination, from the link key of the declaring item. This is the one reader of the `join` rules, and it reads the row through the same key precedence as {@link planLinks}, so the key form a template may write is the key form that is sent. A row that names no link, or an empty list of them, answers `undefined` and is sent without a link key.
 *
 * @param collection - Canonical snake_case collection of the row.
 * @param row - The row as the template wrote it.
 * @returns The link key with its references by external id, or `undefined`.
 */
export function importLinkFor(
  collection: string,
  row: Record<string, unknown>
): { key: ImportLinkKey; refs: Array<{ external_id: string }> } | undefined {
  for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
    if (rule.target.kind !== 'join') continue;
    if (!(rule.collections as ReadonlyArray<string>).includes(collection)) continue;
    const hit = firstDeclaredKey(row, rule.keys);
    if (!hit || hit.ids.length === 0) return undefined;
    return { key: rule.target.linkKey, refs: hit.ids.map((id) => ({ external_id: id })) };
  }
  return undefined;
}

/** A rule whose target is a JSONB scoping column. A type guard because TypeScript does not narrow `rule` from the nested `rule.target.kind`. */
function isJsonbRule(rule: LinkSentinelRule): rule is Extract<LinkSentinelRule, { target: { kind: 'jsonb' } }> {
  return rule.target.kind === 'jsonb';
}

/** Is `collection` a table carrying a JSONB scoping column `linkQuestionScopes` writes? */
function isJsonbParentCollection(collection: string): collection is JsonbParentCollection {
  return (JSONB_PARENT_COLLECTIONS as ReadonlyArray<string>).includes(collection);
}

/** The message a `jsonb` rule declared on a collection without a scoping column fails with. */
function illegalParentError(collection: string): Error {
  return new Error(
    `planLinks: LINK_SENTINELS declares collection '${collection}' with a 'jsonb' target, ` +
      `but linkQuestionScopes can only write a scoping column on: ${JSONB_PARENT_COLLECTIONS.join(', ')}.`
  );
}

/**
 * The full key list of the rule that declares `(collection, key)`.
 *
 * This is the derivation `pipeline.ts`'s `attachSentinels` consumes, so the set of keys that **suppresses** the full-fanout default is byte-identical to the set the resolver **reads** — for all time, because both read this array.
 * Two hand-written lists instead drift: they had already done so in two places (the `_constituency_groups` override hole and the bare-`elections` phantom; see `attachSentinels`' comment).
 *
 * ⚠ This derives the key SET only. Which collections get a fanout default at all is `attachSentinels`' own hand-written policy and stays that way — it is the open "remove the fan-out" todo's territory, not this const's.
 *
 * Throws on a miss rather than returning an empty list: an empty list would make `hasDeclaredScope` always report "not declared" and silently replace every author's explicit scoping with full fanout.
 *
 * @param collection - Canonical snake_case collection.
 * @param key - Any one key form the rule declares.
 * @returns The rule's complete key list, in `??`-precedence order.
 * @throws Error if no rule declares the pair.
 */
export function sentinelKeysFor(collection: CollectionKey, key: string): ReadonlyArray<string> {
  const rule = (LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>).find(
    // `collections` is now a union of two narrower arrays (see LinkSentinelRule), so the widening read is what lets a CollectionKey be looked up against either member. It is a read, not a construction: nothing is admitted here that the declaration did not already declare.
    (candidate) => (candidate.collections as ReadonlyArray<string>).includes(collection) && candidate.keys.includes(key)
  );
  if (!rule) throw new Error(`sentinelKeysFor: no LINK_SENTINELS rule declares ${collection}/${key}`);
  return rule.keys;
}
