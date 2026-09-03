/**
 * `LINK_SENTINELS` — the declarative description of every M:N / JSONB link sentinel that `SupabaseAdminClient.linkJoinTables` resolves.
 *
 * ## What this const is for
 *
 * `linkJoinTables` drives its loops from THIS array, through {@link planLinks} below, rather than from hard-coded resolution blocks. That is what makes the derivation guarantee real: **a `(collection, key)` pair cannot be permitted without also being handled**, because the same loop that permits it is the loop that resolves it. Adding a pair here without teaching the resolver about it is a test failure, not a silent drop.
 *
 * ## Where the resolution now lives
 *
 * The planning half — {@link planLinks}, {@link pickCollection}, {@link firstDeclaredKey} — is in THIS file, deliberately. Keeping the const and the loop that reads it in one module is what makes "adding a pair without handling it is impossible" a structural fact rather than a convention. The planner is **pure**: no Supabase import, no network, no env, so `yarn test:unit` exercises every rule with no database.
 * `SupabaseAdminClient.linkJoinTables` supplies only the I/O.
 *
 * ## Two invariants that are easy to break by accident
 *
 * 1. **Key order inside a rule is `??`-precedence order and is observable.**
 *    `linkJoinTables` reads `_constituencyGroups ?? _constituency_groups ??
 *    constituencyGroups ?? constituency_groups`; a row carrying two forms resolves the first. Re-ordering `keys` changes behaviour for such a row.
 * 2. **The three bare, non-underscore forms are not decorative.** 76 in-tree
 *    rows use `elections.constituency_groups` (41) and `constituency_groups.constituencies` (35) — every hand-authored election and constituency-group row in `e2e/base` and all 28 `perm-*` templates.
 *    They survive today only because `COLLECTION_NON_COLUMNS` strips them before the RPC sees them. Dropping them here moves them outside this const's authority — permitted somewhere no loop resolves.
 *
 * Every literal below was transcribed from the four hand-written resolution blocks `linkJoinTables` used to carry, and re-verified against them immediately before they were deleted: the two join-table names and their `onConflict` strings from the election and constituency-group blocks, the two JSONB column names from the `electionResolve` / `constResolve` helpers (each dispatched for BOTH `question_categories` and `questions`), and the key sets from the two `??`
 * chains. Line numbers are deliberately omitted — they drifted with the very rewrite this const enabled; locate the history by identifier.
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
  | { externalId?: Array<string>; external_id?: Array<string> }
  | Array<{ external_id?: string; externalId?: string }>;

/**
 * The collections a `join`-target rule may declare — the tables `linkJoinTables` resolves a PARENT `external_id` to a UUID for.
 *
 * ⚠ This list is not decoration: it is the domain of `LINK_LOOKUP_ERRORS` (`supabaseAdminClient.ts`). Widen `LinkSentinelRule.collections` back to `ReadonlyArray<CollectionKey>` — all twelve — and a rule declaring a collection outside this list compiles clean, then dies at seed time as `TypeError: LINK_LOOKUP_ERRORS[table] is not a function`, MASKING the real lookup failure instead of reporting it with the greppable message the const exists to preserve.
 */
export const JOIN_PARENT_COLLECTIONS = ['elections', 'constituency_groups'] as const;

/**
 * The collections a `jsonb`-target rule may declare — the tables that carry a scoping column `linkJoinTables` writes with `.from(...).update(...)`.
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

/**
 * Where a resolved sentinel's UUIDs are written.
 *
 * Discriminated on `kind` so the resolver can switch exhaustively: `join` inserts association rows, `jsonb` updates a column on the row itself.
 */
export type LinkTarget =
  | {
      /** Association rows in a dedicated join table. */
      readonly kind: 'join';
      readonly table: 'election_constituency_groups' | 'constituency_group_constituencies';
      /** Column naming the row that declared the sentinel. */
      readonly parentColumn: string;
      /** Column naming the referenced row. */
      readonly childColumn: string;
      /** `onConflict` string, verbatim, for the idempotent upsert. */
      readonly onConflict: string;
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
  /** Table whose `external_id`s the payload names. */
  readonly refTable: 'constituency_groups' | 'constituencies' | 'elections';
}

/**
 * One resolution rule: which collections, which key forms, which target.
 *
 * ⚠ **A UNION, so `collections` and `target` are checked as a PAIR.** Collapse it back into one interface with `collections: ReadonlyArray<CollectionKey>` and a new rule such as `{ collections: ['organizations'], target: { kind: 'join', … } }` satisfies `as const satisfies ReadonlyArray<LinkSentinelRule>` and compiles clean — `linkJoinTables` then launders the collection through `as` casts and the run dies at `LINK_LOOKUP_ERRORS[table] is not a function`, masking the real failure. An exhaustiveness `never` arm does not cover this: it covers `target.kind` only, never the collection.
 *
 * As a union, a mismatched pair matches neither member and fails at the DECLARATION, which is where such errors belong.
 * `tests/template/strictRowTypes.type-test.ts` holds a `@ts-expect-error` on exactly that shape.
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
    refTable: 'constituency_groups',
    target: {
      kind: 'join',
      table: 'election_constituency_groups',
      parentColumn: 'election_id',
      childColumn: 'constituency_group_id',
      onConflict: 'election_id,constituency_group_id'
    }
  },
  {
    collections: ['constituency_groups'],
    keys: ['_constituencies', 'constituencies'],
    refTable: 'constituencies',
    target: {
      kind: 'join',
      table: 'constituency_group_constituencies',
      parentColumn: 'constituency_group_id',
      childColumn: 'constituency_id',
      onConflict: 'constituency_group_id,constituency_id'
    }
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
 * One resolution the executor must perform: "this row, under this key form, names these referenced `external_id`s, to be written at this target".
 *
 * Produced by {@link planLinks} with no database access at all; `SupabaseAdminClient.linkJoinTables` turns each entry into UUID lookups plus either a join-table upsert or a JSONB column update.
 */
interface LinkPlanEntryBase {
  /** The key form actually matched on this row — not the rule's whole key list. */
  readonly key: string;
  /** `external_id` of the row that declared the sentinel. */
  readonly parentExternalId: string;
  /** Referenced `external_id`s, normalised from either payload shape. */
  readonly refExternalIds: Array<string>;
  /** Table whose `external_id`s {@link LinkPlanEntry.refExternalIds} names. */
  readonly refTable: LinkSentinelRule['refTable'];
}

/**
 * ⚠ **`kind` is a TOP-LEVEL discriminant, mirroring `target.kind`, and it is there for a reason the type checker makes unavoidable:** TypeScript does not narrow a union from a NESTED discriminant. Switching on `entry.target.kind` narrowed `entry.target` and left `entry.collection` at its full width, which is why a nested discriminant forces `as` casts in `linkJoinTables` — and those casts are what let a mis-declared rule reach `LINK_LOOKUP_ERRORS[table]` undefined. With the discriminant at the top level, `switch (entry.kind)` narrows `collection` and `target` together and no cast is needed.
 */
export type LinkPlanEntry =
  | (LinkPlanEntryBase & {
      readonly kind: 'join';
      /** Canonical snake_case collection the declaring row belongs to. */
      readonly collection: JoinParentCollection;
      /** Where the resolved UUIDs go. */
      readonly target: Extract<LinkTarget, { kind: 'join' }>;
    })
  | (LinkPlanEntryBase & {
      readonly kind: 'jsonb';
      /** Canonical snake_case collection the declaring row belongs to. */
      readonly collection: JsonbParentCollection;
      /** Where the resolved UUIDs go. */
      readonly target: Extract<LinkTarget, { kind: 'jsonb' }>;
    });

/** A matched key together with the external ids its payload normalised to. */
interface KeyHit {
  readonly key: string;
  readonly ids: Array<string>;
}

/**
 * The rows of one canonical collection, accepting the camelCase alias.
 *
 * `linkJoinTables` read `data.constituencyGroups ?? data.constituency_groups` and `data.questionCategories ?? data.question_categories` — the camelCase alias WINS, and a dataset supplying both forms was read once, not twice. Both properties are preserved here. Aliases are derived through {@link resolveCollectionName} rather than hand-listed, so the set of accepted spellings cannot drift from the set the admin client renames with.
 *
 * @param data - The dataset handed to `bulkImport` / `linkJoinTables`.
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
 * Plan every link the dataset declares, in `LINK_SENTINELS` order.
 *
 * Pure — no Supabase import, no network, no env. The order of the returned entries is observable in the database, and it is the const's rule order: elections → constituency groups → `_elections` (categories, then questions) → `_constituencies` (categories, then questions).
 *
 * ## The two skips, exactly as `linkJoinTables` had them
 *
 *  - A row with neither `externalId` nor `external_id` is skipped.
 *  - An **empty** id list on a `jsonb` target is a no-op, NOT a column clear — `electionResolve` / `constResolve` both bailed on `!ids?.length`, and a rewrite that wrote `[]` instead would change every affected row's scoping from "all" to "none". A `join` target keeps emitting the entry, because the original resolved the parent UUID before iterating the (zero) references and therefore still failed loudly on a missing parent.
 *
 * @param data - The dataset handed to `bulkImport` / `linkJoinTables`.
 * @returns The ordered plan.
 */
export function planLinks(data: Record<string, Array<Record<string, unknown>>>): Array<LinkPlanEntry> {
  const plan: Array<LinkPlanEntry> = [];
  for (const rule of LINK_SENTINELS as ReadonlyArray<LinkSentinelRule>) {
    const target = rule.target;
    for (const collection of rule.collections) {
      const rows = pickCollection(data, collection);
      if (!rows) continue;
      for (const row of rows) {
        const hit = firstDeclaredKey(row, rule.keys);
        if (!hit) continue;
        if (target.kind === 'jsonb' && hit.ids.length === 0) continue;
        const parentExternalId = (row.externalId ?? row.external_id) as string | undefined;
        if (!parentExternalId) continue;
        const base = { key: hit.key, parentExternalId, refExternalIds: hit.ids, refTable: rule.refTable };
        // ⚠ The two membership checks below are the RUNTIME half of the guard.
        // `LinkSentinelRule`'s union makes a mis-declared rule a compile error at the declaration, so neither branch can be taken by any rule in this file. They are kept as narrowing type guards — this is the ONE place a collection is paired with a target kind, so a spelling that slipped past the compiler (a `--template ./custom.ts` module reaching in, a future `as` cast) fails HERE with a message naming the offending pair, rather than thirty lines later as `LINK_LOOKUP_ERRORS[table] is not a function` with the real lookup failure masked.
        if (target.kind === 'join') {
          if (!isJoinParentCollection(collection)) throw illegalParentError(collection, 'join');
          plan.push({ kind: 'join', collection, ...base, target });
        } else {
          if (!isJsonbParentCollection(collection)) throw illegalParentError(collection, 'jsonb');
          plan.push({ kind: 'jsonb', collection, ...base, target });
        }
      }
    }
  }
  return plan;
}

/** Is `collection` a table `linkJoinTables` can resolve a join parent UUID for? */
function isJoinParentCollection(collection: string): collection is JoinParentCollection {
  return (JOIN_PARENT_COLLECTIONS as ReadonlyArray<string>).includes(collection);
}

/** Is `collection` a table carrying a JSONB scoping column `linkJoinTables` writes? */
function isJsonbParentCollection(collection: string): collection is JsonbParentCollection {
  return (JSONB_PARENT_COLLECTIONS as ReadonlyArray<string>).includes(collection);
}

/** The message a mis-declared `(collection, target kind)` pair fails with. */
function illegalParentError(collection: string, kind: LinkTarget['kind']): Error {
  const legal = kind === 'join' ? JOIN_PARENT_COLLECTIONS : JSONB_PARENT_COLLECTIONS;
  return new Error(
    `planLinks: LINK_SENTINELS declares collection '${collection}' with a '${kind}' target, ` +
      `but linkJoinTables can only resolve a '${kind}' parent for: ${legal.join(', ')}.`
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
