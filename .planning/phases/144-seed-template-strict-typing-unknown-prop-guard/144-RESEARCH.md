# Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard — Research

**Researched:** 2026-08-23
**HEAD:** `ee58a4be7e359862bfdc717318c178b80a0d5914` — `docs(144): discussion answers + re-measured CONTEXT.md`
**Branch:** `feat-gsd-roadmap`
**Domain:** `packages/dev-seed` — TypeScript mapped types, zod v4 object strictness, a pure runtime
allow-list guard, and a repo-wide `turbo run typecheck` gate.
**Confidence:** HIGH (every number below is a measurement taken in this session; the few
unmeasurable claims are flagged `[UNVERIFIED]` in place)

**Delta from CONTEXT.md's grounding HEAD:** CONTEXT.md was measured at `b3ba1621d`.
`git diff --stat b3ba1621d ee58a4be7` returns **two `.planning/` files, 693 insertions, zero source
changes** — so every source measurement in CONTEXT.md is directly comparable with mine, and any
disagreement is a disagreement about the same bytes, not about two different trees.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

All ten discussion items resolved at their ★ RECOMMENDED option, zero overrules, plus four
⚠ DERIVED decisions. Copied verbatim in substance from `144-CONTEXT.md` § Implementation Decisions:

- **D-01** — Criterion 1 is re-scoped: same proof shape, live exemplar. Criterion 4 governs. The
  permitted set is derived (D-03) and it includes `questions._elections`, so that pair stays legal
  **and a test asserts it stays legal**. Criterion 1's shape is preserved in full: author the row →
  TS error naming the row type → delete it → typechecks → **and the identical row is first confirmed
  to typecheck cleanly under the pre-change types**. Only the exemplar changes:
  **primary `_constituencies` on an `elections` row**; **secondary `_elections` on a `candidates`
  row**. ROADMAP criterion 1 and the todo are corrected in-phase, citing `4aeae0ace`.
- **D-01a ⚠ DERIVED** — Cite `4aeae0ace` by hash **and** by its real subject line
  — ``feat(data): promote `required` to first-class Question field + wire consumers`` — and, because
  that subject does not mention dev-seed at all, state what the commit did to this file: factored
  `electionResolve` out of the `question_categories` block and called it for both tables.
- **D-02** — A pure `assertKnownRowProps(dataset)`, called as Pass 0 of `Writer.write()`. **Not**
  inside `bulkImport`. A new pure module under `packages/dev-seed/src` — **no Supabase import** — so
  `yarn test:unit` exercises it directly with no DB. Called once from `Writer.write()` immediately
  before Pass 1 (`writer.ts:159`). Covers built-ins and `--template ./custom.ts` alike. Throws naming
  the row's `external_id`, the offending key, and the collection. `bulkImport`'s existing silent
  strips stay exactly where they are.
- **D-03** — One `LINK_SENTINELS` const that `linkJoinTables` drives its own loops from. The const is
  the thing the resolver **iterates**. The permitted key set per collection is the union of three
  derived sources: (1) DB columns from `@openvaa/supabase-types` `TablesInsert<T>`; (2) sentinels
  from `LINK_SENTINELS`; (3) non-column fields — one explicit per-collection const, one-line reason
  each. The TS row types **and** the runtime guard both consume this union.
- **D-03a ⚠ DERIVED** — Source (3) already exists (`COLLECTION_NON_COLUMNS`,
  `supabaseAdminClient.ts:141-146`) and is keyed by the **resolved table name**, whereas Pass 0 runs
  on the **template's collection key**. They are **moved**, not re-invented. The shared declaration
  must fix **one** canonical keying and make both consumers resolve into it; the phase must include a
  case that **fails** if the two keyings are confused.
- **D-04** — `.strict()` on `TemplateSchema` **and** `perEntityFragment`; `fixed[]` rows stay
  `z.record(z.string(), z.unknown())` at the zod layer. **One row-level authority.**
- **D-05** — Re-derive the corpus to **4 blind → failable**, **1 already-failable**
  (`latent.schema.test.ts:39`, recorded as such, not claimed as a fix), **1 scoped exception**
  (`latent.schema.test.ts:31`, `N/A — by construction`, repaired by conversion to the round-trip form
  `expect(validateTemplate({})).toEqual({})`). ASSERT-04 and the audit's F13 entry amended **in
  place, not by addendum**.
- **D-06** — Make "authoring time" a gated claim, in two moves. **(i)** Widen
  `packages/dev-seed/tsconfig.json` `include` to cover `tests/**` and `scripts/**`, drop `rootDir`,
  fixing the 3 measured pre-existing errors as owned fallout. **(ii)** Add `turbo run typecheck` to a
  root gate (a new `yarn typecheck`, chained into `lint:check`) **and** to the CI static job in
  `main.yaml`. A `// @ts-expect-error` fixture then becomes a real, gated two-run control.
- **D-06b ⚠ DERIVED** — The new `turbo run typecheck` gate is cache-bustable and must be
  cache-busted. **Every evidence-bearing typecheck run in this phase uses `TURBO_FORCE=true`.** The
  **gate as shipped** to `package.json` / CI need not force; the **measurement** always does.
- **D-07** — Built-in templates are validated too. Change `cli/resolve-template.ts:59` to
  `return validateTemplate(builtIn);`.
- **D-07a ⚠ DERIVED** — `resolve-template.ts:16` is a record target, not just a comment. D-07 makes
  its sentence true; it must be annotated with what changed and when, not silently left in place.
- **D-08** — Two negative-control fixture classes for criterion 2: **(1)** an unresolved
  `_`-prefixed sentinel — `_constituencies` on an `elections` row; **(2)** `answersByExternalId` on a
  `questions` row. Each run through a `--template ./custom.ts` load.
- **D-09** — A per-collection deny-list beside the allow-list, seeded from the RPC's own
  `skip_columns`, one-line reason per entry, throwing with the same message shape. *(Re-read the
  migration at execution time; do not copy the line number from CONTEXT.md.)*
- **D-10** — DELETE is the default disposition, with a per-field fallout table carrying **file,
  collection, `external_id`, key, why it was never read**. Adding pipeline support is out of scope
  and filed as a todo. **One exception:** if removing a field turns an E2E spec red, that field
  **was** being read and it stays.

### Claude's Discretion

None declared. CONTEXT.md records "all ten ★ RECOMMENDED options ticked, zero overrules, zero
free-text edits." The only latitude this research exercises is **how** to implement the locked
decisions, which is what R1–R9 below answer.

### Deferred Ideas (OUT OF SCOPE)

- The **11 packages beyond dev-seed** whose `tests/` sit outside their own tsconfig `include` — file
  as a standing todo (sibling of Phase 143's D-08 lint-script-scope todo).
- Removing the `attachSentinels` fan-out (2026-05-23 todo) — explicitly timed against the
  `jsonb`→`uuid[]` migration. This phase touches `attachSentinels` / `hasDeclaredScope` **only so far
  as consuming the derived key set requires**.
- Per-row M:N join tables replacing the `election_ids` / `constituency_ids` JSONB columns.
- Repairing the `default` template's dataset (TMPL-03 / TMPL-04) — **Phase 145**.
- Adding pipeline support for any field the tightening surfaces as unread (D-10).
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **TMPL-01** | Template `fixed[]` rows are typed per collection, so a sentinel or column the pipeline does not resolve is a **TypeScript error at authoring time**. | **R1** — the per-collection `Fragment<TablesInsert<T>>` types **already exist** (14 of them, one per generator); what is missing is that `Template` is `z.infer<TemplateSchema>` and types `fixed` as `Record<string, unknown>[]`. R1 gives the measured mapped-type construction, the measured TS2353 error message, and the measured EPC limitation. **R4** makes the error gated rather than IDE-only. |
| **TMPL-02** | The seed pipeline **throws** on an unknown row property, naming `external_id` + key + collection. | **R5** — exact module placement, exact `bulkData` shape at `writer.ts:158`, the four-collection deletion hazard, the no-`external_id` case (`feedback` has no such column), and the house message style. **R7** proves the guard's false-positive budget is **zero** across all 30 built-ins. |
| **ASSERT-04 (F13)** | `TemplateSchema` rejects unknown fields, so the "accepts field X" tests fail when the schema stops declaring that field. Fallout owned. | **R8 / § D-05 corpus** — the five zod probes re-run at zod 4.3.6, all five reproducing CONTEXT.md exactly; **all 30 built-ins measured passing the proposed strict schema (0 failures)**, so D-04 + D-07's runtime-reach fallout is zero. |

</phase_requirements>

---

## Summary

Three things this research found that change how the phase should be planned.

**First: the phase's fallout budget is zero, and that is measured, not hoped.** I ran all 30 built-in
templates through `runPipeline` + `fanOutLocales` and classified **every key on every one of the
1,481 emitted rows** against DB columns, sentinels, non-column fields and the RPC's own relationship
refs. **Zero unknown keys.** Criterion 5's "any field they lose to the tightening" list is empty —
*provided* the allow-list has **four** sources, not the three D-03 names. The missing fourth is the
`_bulk_upsert_record` RPC's per-table **relationship reference map** (`candidates.organization`,
`nominations.{candidate,organization,faction,alliance,election,constituency,parent_nomination}`,
`questions.category`, `constituencies.parent`). Those keys are not columns, are not sentinels, are not
in `COLLECTION_NON_COLUMNS`, and are **not stripped** by `bulkImport` — they pass through to the RPC,
which resolves them to FKs. A three-source allow-list throws on **2,955 rows** across the built-ins
and turns the entire E2E suite red, because every E2E setup project seeds through
`runPipeline` → `Writer.write` (`tests/tests/setup/shared/setupFromTemplate.ts:208`).

**Second: D-09's deny-list, seeded literally from `skip_columns`, would reject every row in the
repo.** The array is `'id', 'created_at', 'updated_at', 'project_id', 'entity_type'`
(`apps/supabase/supabase/schema/501-bulk-operations.sql:109-111` — note the doubled `supabase/`
directory; CONTEXT.md's `apps/supabase/migrations/…` path does not exist). **Every generator emits
`project_id` on every row — 1,481 of 1,481.** `id` appears in `writer.test.ts`'s `accounts`/`projects`
fixtures. Only `entity_type` can be deny-listed at zero cost (measured: 0 rows emit it, and it is a
real column on `nominations`, `question_categories` and `questions`). The other four belong in a
**documented exclusion table with reasons**, not in the throwing set.

**Third: the D-03a keying hazard as written does not arise, but a nastier one does.** Pipeline output
is keyed by `TOPO_ORDER` (`pipeline.ts:76-91`), which is entirely snake_case; the zod schema's
per-entity slots are snake_case too (`schema.ts:117-128`). So Pass 0 sees `question_categories`, not
`questionCategories`, from every in-tree path. The confusion is still real for *direct* `Writer.write`
callers, because `linkJoinTables` accepts `data.questionCategories ?? data.question_categories`
(`:503`) and `data.constituencyGroups ?? data.constituency_groups` (`:443`). The genuine keying
hazard, though, is at the **field** level: `resolveFieldName` is backed by `PROPERTY_MAP`, and
`COLUMN_MAP` maps **two** columns to `'organizationId'` — so `Object.fromEntries` last-wins gives
`organizationId → organization_id_nom`, a column that exists on no table anyone would expect. Any
allow-list that admits camelCase must admit exactly `Object.keys(FIELD_MAP)`, and must know that
`sort_order`'s only legal camel form is **`order`**, not `sortOrder`.

**Primary recommendation:** plan the derived declaration as **four sources plus one exclusion table**,
place Pass 0 at `writer.ts:158` but pass it the **pre-deletion `data`** (the parameter is still in
scope), name every per-collection row type with a **type alias** (measured: it changes the TS2353
message from a 20-line structural expansion to `does not exist in type 'ElectionsFixedRow'`), and
open the ledger with all 34 rows before the first byte of behaviour changes.

---

## Method and provenance

- **Read-only on `packages/`, `apps/`, `tests/`.** Three measurements required temporary edits: the
  tsconfig widening (B-21 re-measurement), and two untracked probe files under
  `packages/dev-seed/src/` and `packages/dev-seed/tests/`. **All three are restored and the restore
  is proven:**

  ```
  $ git status --porcelain packages/dev-seed      # (no output)
  $ git diff --stat packages/dev-seed             # (no output)
  $ git diff --exit-code -- packages/dev-seed/tsconfig.json && echo "tsconfig.json diff EMPTY (exit 0)"
  tsconfig.json diff EMPTY (exit 0)
  $ git status --porcelain                        # (no output — whole tree clean)
  ```

- All scratch probes (`survey.mts`, `pipeline-survey.mts`, `classify.mts`, `classify2.mts`,
  `zodprobe.mts`, `strictprobe.mts`, `probe-map.ts`) live in the session scratchpad, outside the
  repository. Nothing was left in-tree.
- **Every line number below was re-measured at `ee58a4be7`.** Where a CONTEXT.md citation did not
  survive, it is called out in § Corrections to CONTEXT.md and again at the point of use.

---

# R1 — Deriving per-collection row types from `TablesInsert<T>`

## R1.1 What `packages/supabase-types` exports

`packages/supabase-types/src/index.ts` (4 lines, verbatim):

```ts
export type { CompositeTypes, Database, Enums, Json, Tables, TablesInsert, TablesUpdate } from './database.js';
export { Constants } from './database.js';
export { COLUMN_MAP, PROPERTY_MAP, TABLE_MAP, COLLECTION_NAME_MAP } from './column-map.js';
export type { ColumnName, PropertyName, CollectionName, TableName } from './column-map.js';
```
[VERIFIED: packages/supabase-types/src/index.ts:1-4]

`TablesInsert<T>` is the standard `supabase gen types` conditional
(`packages/supabase-types/src/database.ts:1352-1373`) resolving to
`Database['public']['Tables'][T]['Insert']`. Measured Insert shapes for the three tables the phase
names, quoted verbatim from `database.ts`:

**`TablesInsert<'elections'>`** — 20 keys (`database.ts:528-547`):

```
color?: Json | null;            created_at?: string;            current_round?: number | null;
custom_data?: Json | null;      election_date?: string | null;  election_start_date?: string | null;
election_type?: string | null;  external_id?: string | null;    id?: string;
image?: Json | null;            info?: Json | null;             is_generated?: boolean | null;
multiple_rounds?: boolean | null; name?: Json | null;           project_id: string;
published?: boolean;            short_name?: Json | null;       sort_order?: number | null;
subtype?: string | null;        updated_at?: string;
```

**`TablesInsert<'questions'>`** — 25 keys (`database.ts:1037-1061`):

```
allow_open?: boolean | null;    category_id: string;            choices?: Json | null;
color?: Json | null;            constituency_ids?: Json | null; created_at?: string;
custom_data?: Json | null;      election_ids?: Json | null;     election_rounds?: Json | null;
entity_type?: Json | null;      external_id?: string | null;    id?: string;
image?: Json | null;            info?: Json | null;             is_generated?: boolean | null;
name?: Json | null;             project_id: string;             published?: boolean;
required?: boolean | null;      settings?: Json | null;         short_name?: Json | null;
sort_order?: number | null;     subtype?: string | null;
type: Database['public']['Enums']['question_type'];             updated_at?: string;
```

**`TablesInsert<'candidates'>`** — 21 keys (`database.ts:245-265`):

```
answers?: Json | null;          auth_user_id?: string | null;   color?: Json | null;
created_at?: string;            custom_data?: Json | null;      external_id?: string | null;
first_name: string;             id?: string;                    image?: Json | null;
info?: Json | null;             is_generated?: boolean | null;  last_name: string;
name?: Json | null;             organization_id?: string | null; project_id: string;
published?: boolean;            short_name?: Json | null;       sort_order?: number | null;
subtype?: string | null;        terms_of_use_accepted?: string | null;  updated_at?: string;
```

Three consequences worth carrying into the plan:

1. **`external_id` is `?: string | null` on every content table** — it is *not* required at the DB
   level. `Fragment<TRow>` already re-requires it (`src/types.ts:29`).
2. **`feedback` has no `external_id` column at all** (`database.ts:655-662`: `created_at`, `date`,
   `description`, `id`, `project_id`, `rating`, `url`, `user_agent`). Neither do `accounts` or
   `projects`. This decides R5's "rows without an `external_id`" question.
3. `nominations.entity_type` is a **required enum** in the Row type
   (`database.ts:696: entity_type: Database['public']['Enums']['entity_type'];`) yet is discarded by
   the RPC's `skip_columns`. That is D-09's cleanest exemplar. [VERIFIED: packages/supabase-types/src/database.ts:696,724]

## R1.2 Collection-name casing — `resolveCollectionName`

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:77-83
/**
 * Resolve a collection name: if it matches a COLLECTION_MAP entry, use that;
 * otherwise return as-is (already snake_case).
 */
function resolveCollectionName(collection: string): string {
  return COLLECTION_MAP[collection] ?? collection;
}
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:77-83]

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:46-51
const COLLECTION_MAP: Record<string, string> = {
  ...TABLE_MAP,
  // Legacy aliases
  parties: 'organizations',
  questionTypes: 'question_types'
};
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:46-51]

`TABLE_MAP`, verbatim from `packages/supabase-types/src/column-map.ts:92-100`:

```ts
export const TABLE_MAP = {
  constituencyGroups: 'constituency_groups',
  questionCategories: 'question_categories',
  appSettings: 'app_settings',
  adminJobs: 'admin_jobs',
  electionConstituencyGroups: 'election_constituency_groups',
  constituencyGroupConstituencies: 'constituency_group_constituencies',
  userRoles: 'user_roles'
} as const;
```

**So the complete set of collection-key aliases dev-seed accepts** is exactly those seven plus
`parties → organizations` and `questionTypes → question_types`; every other collection key passes
through unchanged. Runtime-verified: `npx tsx` printing `TABLE_MAP` returned exactly the nine-entry
`COLLECTION_MAP` composition above.

**But the template schema declares snake_case only.** `TemplateSchema`'s twelve per-entity slots are
`elections`, `constituency_groups`, `constituencies`, `organizations`, `alliances`, `factions`,
`candidates`, `question_categories`, `questions`, `nominations`, `app_settings`, `feedback`
(`packages/dev-seed/src/template/schema.ts:117-128` — quoted verbatim). And `TOPO_ORDER`
(`packages/dev-seed/src/pipeline.ts:76-91`) is:

```ts
export const TOPO_ORDER = [
  'accounts', 'projects', 'elections', 'constituency_groups', 'constituencies',
  'organizations', 'alliances', 'factions', 'question_categories',
  'questions', 'candidates', 'nominations', 'app_settings', 'feedback'
] as const;
```
[VERIFIED: packages/dev-seed/src/pipeline.ts:76-91]

`runPipeline` writes `output[table] = rows` for `table of TOPO_ORDER` (`pipeline.ts:179,191`). **So the
`data` map Pass 0 receives is always keyed snake_case from every in-tree path.** See R3.

## R1.3 Field casing — which casings a `fixed[]` row may legally use

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:85-91
/**
 * Convert a camelCase field name to snake_case using FIELD_MAP,
 * or fall through as-is if already snake_case.
 */
function resolveFieldName(field: string): string {
  return FIELD_MAP[field] ?? field;
}
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:85-91]

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:57-61
const FIELD_MAP: Record<string, string> = {
  ...PROPERTY_MAP,
  // Legacy aliases
  documentId: 'id'
};
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:57-61]

`PROPERTY_MAP` is built by reversing `COLUMN_MAP`
(`packages/supabase-types/src/column-map.ts:82-84`):

```ts
export const PROPERTY_MAP = Object.fromEntries(Object.entries(COLUMN_MAP).map(([k, v]) => [v, k])) as {
  [K in PropertyName]: ColumnName;
};
```

**Runtime-measured** (`npx tsx` printing every entry) — `COLUMN_MAP` has **40** entries, `PROPERTY_MAP`
has **39**, and the full camel→snake set is:

```
order → sort_order            shortName → short_name         customData → custom_data
isGenerated → is_generated    firstName → first_name         lastName → last_name
organizationId → organization_id_nom   ← ⚠ see below
categoryId → category_id      electionIds → election_ids     electionRounds → election_rounds
constituencyIds → constituency_ids     entityType → entity_type       allowOpen → allow_open
categoryType → category_type  candidateId → candidate_id     factionId → faction_id
allianceId → alliance_id      electionId → election_id       constituencyId → constituency_id
electionRound → election_round electionSymbol → election_symbol
parentNominationId → parent_nomination_id                    electionDate → election_date
electionStartDate → election_start_date                      electionType → election_type
multipleRounds → multiple_rounds       currentRound → current_round
projectId → project_id        accountId → account_id         defaultLocale → default_locale
createdAt → created_at        updatedAt → updated_at         parentId → parent_id
openAnswer → open_answer      questionId → question_id       authUserId → auth_user_id
published → published         termsOfUseAccepted → terms_of_use_accepted
externalId → external_id
```
plus the legacy alias `documentId → id`.

**Three hazards this exposes, all of which the allow-list construction must survive.**

1. **⚠ `organizationId` resolves to `organization_id_nom`.** `COLUMN_MAP` contains *two* entries whose
   value is `'organizationId'` — `organization_id: 'organizationId'` (`column-map.ts:17`) and
   `organization_id_nom: 'organizationId'` (`column-map.ts:32`). `Object.fromEntries` is last-wins, so
   the reverse map keeps only the second. Measured: `PROPERTY_MAP.organizationId === 'organization_id_nom'`.
   **A `candidates` row authoring `organizationId` therefore becomes `organization_id_nom`, which is a
   column on no table** — the RPC would reject it with `column "organization_id_nom" of relation
   "candidates" does not exist`. Not silent, but the derived allow-list must model the *actual*
   mapping, not the intuitive one, or it will "helpfully" permit `organizationId` on `candidates` and
   push the failure to Postgres. **Recommendation: derive from `FIELD_MAP` mechanically; never
   hand-write a camelCase alias.** File the `COLUMN_MAP` collision as a residue todo — fixing it is a
   cross-package change and is out of this phase's fence.
2. **`sort_order`'s only legal camel form is `order`, not `sortOrder`.** Measured:
   `PROPERTY_MAP.sortOrder === undefined`.
3. **`published: 'published'`** is an identity entry — harmless, but it means `FIELD_MAP` is not a
   pure camel→snake map and a "keys that differ" filter would drop it.

**The complete legality rule.** For a target column `c` of table `T`, the legal `fixed[]` row keys are:

```
legalKeys(T, c) = { c }  ∪  { k ∈ keys(FIELD_MAP) : FIELD_MAP[k] === c }
```

and the permitted key set for a collection is the union of `legalKeys` over all columns of `T`, plus
the sentinel/non-column/relationship-ref sources. **In-tree evidence that this is not over-engineering
and also not currently exercised:** across all 30 built-in templates and all 749 hand-authored
`fixed[]` rows, **not one key is in camelCase except `answersByExternalId`** (which is a non-column,
never resolved through `FIELD_MAP` because `bulkImport` strips it first at `:180`). Measured by
enumerating `Object.keys(row)` for every `fixed[]` row of every built-in.

**Consequence for planning:** admitting camelCase costs nothing today and protects the
`--template ./custom.ts` surface, which is exactly the surface TMPL-02 names. Admit it, derive it, and
add a unit test that asserts `permittedKeys('candidates')` contains `firstName` **and** does **not**
contain `sortOrder`.

## R1.4 The concrete `FixedRow<C>` construction

Below is real code, and every claim about its behaviour was measured by compiling it against
`packages/dev-seed/tsconfig.json` in this session.

```ts
// packages/dev-seed/src/template/permittedKeys.ts  (proposed)
import type { TablesInsert } from '@openvaa/supabase-types';

/** Template collection key → DB table name. Snake_case in, snake_case out. */
export type TableFor<C extends CollectionKey> = C;   // identity today; see R3

/** (2) sentinels — derived from LINK_SENTINELS, see R2. */
type SentinelKeysFor<C> = KeysOfRulesFor<C>;                       // e.g. '_constituencyGroups' | ...
/** (3) non-column fields — `answersByExternalId`, candidate `email`. */
type NonColumnKeysFor<C> = ...;
/** (4) RPC relationship refs — see R1.5. THE SOURCE D-03 DOES NOT NAME. */
type RelationshipRefKeysFor<C> = ...;

export type FixedRow<C extends CollectionKey> =
  Partial<TablesInsert<TableFor<C>>>
  & { external_id: string }
  & Partial<Record<SentinelKeysFor<C>, SentinelValue>>
  & Partial<Record<NonColumnKeysFor<C>, unknown>>
  & Partial<Record<RelationshipRefKeysFor<C>, ExternalRef>>;

export type SentinelValue = { externalId?: Array<string>; external_id?: Array<string> };
export type ExternalRef   = { externalId: string } | { external_id: string } | string;
```

and then, **critically, one named alias per collection**:

```ts
export type ElectionsFixedRow          = FixedRow<'elections'>;
export type ConstituencyGroupsFixedRow = FixedRow<'constituency_groups'>;
export type QuestionsFixedRow          = FixedRow<'questions'>;
export type CandidatesFixedRow         = FixedRow<'candidates'>;
// … 12 in total
```

### Measured: excess property checking fires, and the alias decides the message quality

Probe compiled at `packages/dev-seed/src/__probe144a.ts` and
`packages/dev-seed/src/__probe144b.ts` (both since deleted; restore proven above), run with
`npx tsc --noEmit -p packages/dev-seed/tsconfig.json`.

**Inline intersection (no alias):**

```
packages/dev-seed/src/__probe144a.ts(13,34): error TS2353: Object literal may only specify known
properties, and '_constituencies' does not exist in type 'Partial<{ color?: Json | undefined;
created_at?: string | undefined; current_round?: number | null | undefined; custom_data?: Json |
undefined; election_date?: string | null | undefined; ... 14 more ...; updated_at?: string |
undefined; }> & { ...; }'.
```

**Named type alias:**

```
packages/dev-seed/src/__probe144b.ts(21,34): error TS2353: Object literal may only specify known
properties, and '_constituencies' does not exist in type 'ElectionFixedRow'.
```

**Named interface (`interface ElectionRowI extends Partial<TablesInsert<'elections'>> { external_id: string }`):**

```
packages/dev-seed/src/__probe144b.ts(27,34): error TS2353: Object literal may only specify known
properties, and '_constituencies' does not exist in type 'ElectionRowI'.
```

Criterion 1 requires the error to **name the row type**. The inline form technically names a type; the
aliased form names it *readably*. **Use the alias.** Note the diagnostic code is **TS2353**, not the
TS2559 that CONTEXT.md B-21 mentions in a different context — the plan's assertion strings should say
TS2353.

### Measured: the EPC limitation, stated plainly

```ts
const rowVar = { external_id: 'el-1', _constituencies: { externalId: ['co-1'] } };
export const badIndirect: ElectionsFragment = { fixed: [rowVar] };
```

**Produced no error.** Excess property checking is a *fresh object literal* rule; assigning through an
intermediate `const` bypasses it entirely. **This is a real hole and it must be stated in the ledger
and in the fallout table, not discovered by a reader later.**

Does any in-tree template hit it? **No.** All 39 template files under
`packages/dev-seed/src/templates/` (`find … -name '*.ts' -not -name '*.test.ts' | wc -l` → **39**;
40 including `_helpers/buildMinimal.test.ts`) assign `fixed:` arrays as inline literals — 128
`fixed:` sites measured by `grep -rn "fixed:" packages/dev-seed/src/templates --include='*.ts' | wc -l`
→ **128**, matching CONTEXT.md B-14. The one structural exception is
`src/templates/_helpers/buildMinimal.ts`, which *constructs* rows programmatically for the 28 `perm-*`
templates; those rows are typed by the builder's own return type rather than checked at each call
site, so EPC does not apply there either. Mitigation is the runtime guard (R5), which is exactly why
TMPL-01 and TMPL-02 are one phase.

### Existing infrastructure — 80% of TMPL-01 is already in the tree

`packages/dev-seed/src/types.ts:27-30`, verbatim:

```ts
export type Fragment<TRow> = {
  count?: number;
  fixed?: Array<Partial<TRow> & { external_id: string }>;
};
```

and **fourteen** generators already instantiate it against `TablesInsert`:

```
src/generators/ElectionsGenerator.ts:27          ElectionsFragment          = Fragment<TablesInsert<'elections'>>
src/generators/ConstituencyGroupsGenerator.ts:16 ConstituencyGroupsFragment = Fragment<TablesInsert<'constituency_groups'>>
src/generators/ConstituenciesGenerator.ts:31     ConstituenciesFragment     = Fragment<TablesInsert<'constituencies'>>
src/generators/OrganizationsGenerator.ts:21      OrganizationsFragment      = Fragment<TablesInsert<'organizations'>>
src/generators/AlliancesGenerator.ts:17          AlliancesFragment          = Fragment<TablesInsert<'alliances'>>
src/generators/FactionsGenerator.ts:19           FactionsFragment           = Fragment<TablesInsert<'factions'>>
src/generators/CandidatesGenerator.ts:52         CandidatesFragment         = Fragment<TablesInsert<'candidates'>>
src/generators/QuestionCategoriesGenerator.ts:26 QuestionCategoriesFragment = Fragment<TablesInsert<'question_categories'>>
src/generators/QuestionsGenerator.ts:32          QuestionsFragment          = Fragment<TablesInsert<'questions'>>
src/generators/NominationsGenerator.ts:64        NominationsFragment        = Fragment<TablesInsert<'nominations'>>
src/generators/AppSettingsGenerator.ts:41        AppSettingsFragment        = Fragment<TablesInsert<'app_settings'>>
src/generators/FeedbackGenerator.ts:34           FeedbackFragment           = Fragment<TablesInsert<'feedback'>>
src/generators/AccountsGenerator.ts:32           AccountsFragment           = Fragment<TablesInsert<'accounts'>>
src/generators/ProjectsGenerator.ts:33           ProjectsFragment           = Fragment<TablesInsert<'projects'>>
```
[VERIFIED: `grep -rn "Fragment<" packages/dev-seed/src --include='*.ts'`]

**The gap is not the row types — it is that `Template` never sees them.**
`packages/dev-seed/src/template/types.ts:85` is one line:

```ts
export type Template = z.infer<typeof TemplateSchema>;
```

and `TemplateSchema`'s fragment is `z.array(z.record(z.string(), z.unknown()))` (`schema.ts:36`). So
templates annotated `: Template` get `Record<string, unknown>` rows. **TMPL-01's whole job is to make
`Template`'s per-entity slots use per-collection row types instead of `z.infer`'s loose ones.**

**Measured OLD half for D-01, taken on the untouched tree:** the identical rows compile with **zero
errors** under today's `Template`:

```ts
export const old2: Template = {
  elections: { fixed: [{ external_id: 'el-1', _constituencies: { externalId: ['co-1'] } }] }
};
```
→ `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` emitted no diagnostic for that line.

**Design consequence the planner must decide up front.** Once `Template` stops being `z.infer<…>`, the
"one source of truth" comment at `template/types.ts:4-5` becomes false. Two honest options:

- **(A, recommended)** Keep `TemplateSchema` as the *runtime* authority and declare `Template` as a
  hand-written type whose per-entity slots use the `FixedRow<C>` aliases, with a **compile-time
  conformance assertion** in the same file proving the two agree on the top-level key set:
  `type _Conforms = Expect<Equal<keyof Template, keyof z.infer<typeof TemplateSchema>>>`. That keeps
  D-04's "one row-level authority" (zod stays `z.unknown()` at row level) while making drift at the
  *collection* level a type error.
- **(B)** Keep `z.infer` and override only the fragments via a mapped type. Smaller diff, but the
  override is invisible from `schema.ts` and the next schema edit silently loses it.

Option A is the one that matches D-03's "one declaration, two enforcement layers".

## R1.5 ⚠ The fourth source D-03 does not name — the RPC's relationship reference map

`_bulk_upsert_record` defines, per table, a set of **non-column reference keys** it resolves to FKs.
Verbatim, `apps/supabase/supabase/schema/501-bulk-operations.sql:113-136`:

```sql
  -- Define relationship mappings per table
  relationships := '{}'::jsonb;
  CASE p_table_name
    WHEN 'candidates' THEN
      relationships := '{"organization": {"fk": "organization_id", "table": "organizations"}}'::jsonb;
    WHEN 'nominations' THEN
      relationships := '{
        "candidate": {"fk": "candidate_id", "table": "candidates"},
        "organization": {"fk": "organization_id", "table": "organizations"},
        "faction": {"fk": "faction_id", "table": "factions"},
        "alliance": {"fk": "alliance_id", "table": "alliances"},
        "election": {"fk": "election_id", "table": "elections"},
        "constituency": {"fk": "constituency_id", "table": "constituencies"},
        "parent_nomination": {"fk": "parent_nomination_id", "table": "nominations"}
      }'::jsonb;
    WHEN 'questions' THEN
      relationships := '{
        "category": {"fk": "category_id", "table": "question_categories"}
      }'::jsonb;
    WHEN 'constituencies' THEN
      relationships := '{"parent": {"fk": "parent_id", "table": "constituencies"}}'::jsonb;
    ELSE
      relationships := '{}'::jsonb;
  END CASE;
```
[VERIFIED: apps/supabase/supabase/schema/501-bulk-operations.sql:113-136]

**Ten (collection, key) pairs.** None of them is a column; none is stripped by `bulkImport`; none is in
`COLLECTION_NON_COLUMNS`. **Measured row counts across the 30 built-ins' pipeline output:**

| Collection | Ref key | Rows carrying it |
|---|---|---|
| `nominations` | `constituency` | 636 |
| `nominations` | `election` | 636 |
| `nominations` | `parent_nomination` | 497 |
| `nominations` | `candidate` | 453 |
| `candidates` | `organization` | 438 |
| `nominations` | `organization` | 164 |
| `questions` | `category` | 104 |
| `nominations` | `alliance` | 19 |
| `constituencies` | `parent` | 8 |
| `nominations` | `faction` | 0 (declared by the RPC, unused in-tree) |
| **Total** | | **2,955** |

**An allow-list built from D-03's three sources throws on 2,955 of 1,481 rows' key occurrences and
turns the whole E2E suite red on the first setup project.** This is the single most important finding
in this document. `bulkImport` also has a fifth, nomination-specific alias it reads —
`'candidateExternalId' in record` at `supabaseAdminClient.ts:178` — which must be admitted on
`nominations` too even though nothing in-tree authors it.

**Recommended derivation for source (4):** a single exported const mirroring the SQL, with a unit test
that reads `501-bulk-operations.sql` and asserts the const matches the `CASE` block. That is a
*parity* test, which criterion 4 forbids for **sentinels** — but the SQL is in a different language in
a different package, so there is no way to make Postgres iterate a TypeScript const. State the
limitation honestly: source (4) is parity-tested against the SQL, sources (1)–(3) are derived.
`[UNVERIFIED]` whether the migration copy at `apps/supabase/supabase/migrations/00001_initial_schema.sql`
and the schema copy can drift — they are separate files and I did not diff their `CASE` blocks in
full; I did verify their `skip_columns` arrays are byte-identical.

---

# R2 — `LINK_SENTINELS` as an iterated declaration

## R2.1 The four resolution sites, re-measured

CONTEXT.md B-3 says `supabaseAdminClient.ts:387-597`, sites at `:389-397`, `:442-450`, `:506-543`,
`:551-597`. **Re-measured at `ee58a4be7`:**

| Site | CONTEXT.md | Measured | Verdict |
|---|---|---|---|
| `linkJoinTables` body | `:387-597` | **`:387-592`** (method opens at `:387`, closes at `:592`) | ⚠ end is 5 lines high |
| 1 — elections → constituency_groups | `:389-397` | **`:389-441`** (`const elections` at `:389`; block closes `:441`). The *key reads* are `:393-398` | ⚠ range names only the key reads |
| 2 — constituency_groups → constituencies | `:442-450` | **`:443-497`** (`const cgs` at `:443`; key reads `:446-451`) | ⚠ off by one at the start |
| 3 — `electionResolve` | `:506-543` | **`:506-543`** (arrow at `:506`, calls at `:542`/`:543`) | ✅ exact |
| 4 — `constResolve` | `:551-597` | **`:550-591`** (arrow at `:550`, calls at `:590`/`:591`) | ⚠ start off by one, end 6 high |

`B-1` is exact: `supabaseAdminClient.ts:543` reads
`await electionResolve(data.questions as Array<Record<string, unknown>> | undefined, 'questions');`
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:543]

## R2.2 ⚠ B-4's permitted pair set is incomplete — the bare forms are missing

CONTEXT.md B-4 lists: `elections._constituencyGroups` / `._constituency_groups`;
`constituencyGroups._constituencies`; `questionCategories._elections` / `._constituencies`;
`questions._elections` / `._constituencies`. It **omits the two bare, non-underscore forms that
`linkJoinTables` genuinely reads**:

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:392-398
        const cgRefObj =
          (election._constituencyGroups as { externalId?: Array<string>; external_id?: Array<string> } | undefined) ??
          (election._constituency_groups as { externalId?: Array<string>; external_id?: Array<string> } | undefined);
        const cgRefs: Array<Record<string, string>> | undefined =
          (cgRefObj?.externalId ?? cgRefObj?.external_id)?.map((id: string) => ({ external_id: id })) ??
          (election.constituencyGroups as Array<Record<string, string>>) ??
          (election.constituency_groups as Array<Record<string, string>>);
```

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:446-451
        const constRefObj = cg._constituencies as
          | { externalId?: Array<string>; external_id?: Array<string> }
          | undefined;
        const constRefs: Array<Record<string, string>> | undefined =
          (constRefObj?.externalId ?? constRefObj?.external_id)?.map((id: string) => ({ external_id: id })) ??
          (cg.constituencies as Array<Record<string, string>> | undefined);
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:392-398, 446-451]

**These are not decorative.** Measured across the 30 built-ins' pipeline output:
`elections.constituency_groups` on **41 rows**, `constituency_groups.constituencies` on **35 rows** —
i.e. **every hand-authored election and constituency-group row in `e2e/base` and all 28 `perm-*`
templates uses the bare form, not the sentinel.** They survive today only because
`COLLECTION_NON_COLUMNS` (`:141-146`) strips them before the RPC. If the derived key set treats them
as "non-columns" (source 3) rather than as sentinel key forms (source 2), the const stops being the
single authority for what `linkJoinTables` reads — which is precisely criterion 4's failure mode.

**Corrected permitted `(collection, key)` set — twelve pairs:**

| Collection | Keys read by `linkJoinTables` | Site |
|---|---|---|
| `elections` | `_constituencyGroups`, `_constituency_groups`, `constituencyGroups`, `constituency_groups` | `:393-398` |
| `constituency_groups` | `_constituencies`, `constituencies` | `:446-451` |
| `question_categories` | `_elections` | `:512` (via `electionResolve`, call at `:542`) |
| `questions` | `_elections` | `:512` (call at `:543`) |
| `question_categories` | `_constituencies` | `:556` (via `constResolve`, call at `:590`) |
| `questions` | `_constituencies` | `:556` (call at `:591`) |

B-5 stands: `electionResolve`'s own signature is `table: 'question_categories' | 'questions'`
(`:508`), so `elections._constituencies` and `candidates._elections` are read by nothing. D-01's two
exemplars hold.

## R2.3 The proposed `LINK_SENTINELS` shape

The four sites are structurally different in exactly two ways: **(a)** two insert into join tables and
two update a JSONB column; **(b)** two accept a "bare array-of-refs" payload alongside the
`{ externalId | external_id: string[] }` sentinel payload. Both differences are data, not control
flow — so full unification is honest here.

```ts
// packages/dev-seed/src/template/linkSentinels.ts  (proposed)

/** The payload shapes a sentinel key may carry, both already accepted in-tree. */
export type SentinelPayload =
  | { externalId?: Array<string>; external_id?: Array<string> }   // the `_`-prefixed form
  | Array<{ external_id?: string; externalId?: string }>;         // the bare form

export type LinkTarget =
  | {
      kind: 'join';
      table: 'election_constituency_groups' | 'constituency_group_constituencies';
      parentColumn: string;
      childColumn: string;
      onConflict: string;
    }
  | { kind: 'jsonb'; column: 'election_ids' | 'constituency_ids' };

export interface LinkSentinelRule {
  /** Collection keys this rule applies to — snake_case, as emitted by TOPO_ORDER. */
  readonly collections: ReadonlyArray<CollectionKey>;
  /** Every key form the resolver reads, in `??`-precedence order. */
  readonly keys: ReadonlyArray<string>;
  /** Table whose external_ids the payload names. */
  readonly refTable: 'constituency_groups' | 'constituencies' | 'elections';
  readonly target: LinkTarget;
}

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
```

Every literal above is transcribed from the measured code: `onConflict` strings from `:433` and
`:488`, join-table names from `:430` and `:485`, JSONB column names from `:533` and `:580`.

### The split that makes the test possible: `planLinks` (pure) + `executePlan` (I/O)

```ts
// pure — no Supabase import, unit-testable with no DB
export interface LinkPlanEntry {
  collection: CollectionKey;
  key: string;                 // the key form actually matched on this row
  parentExternalId: string;
  refExternalIds: Array<string>;
  refTable: LinkSentinelRule['refTable'];
  target: LinkTarget;
}

export function planLinks(data: Record<string, Array<Record<string, unknown>>>): Array<LinkPlanEntry> {
  const plan: Array<LinkPlanEntry> = [];
  for (const rule of LINK_SENTINELS) {
    for (const collection of rule.collections) {
      const rows = pickCollection(data, collection);       // handles the camel alias, see R3
      if (!rows) continue;
      for (const row of rows) {
        const hit = firstDeclaredKey(row, rule.keys);      // the `??` chain, generalised
        if (!hit) continue;
        const parentExternalId = (row.externalId ?? row.external_id) as string | undefined;
        if (!parentExternalId) continue;
        plan.push({ collection, key: hit.key, parentExternalId, refExternalIds: hit.ids, refTable: rule.refTable, target: rule.target });
      }
    }
  }
  return plan;
}
```

and `linkJoinTables` becomes:

```ts
async linkJoinTables(data: Record<string, Array<unknown>>): Promise<void> {
  for (const entry of planLinks(data as Record<string, Array<Record<string, unknown>>>)) {
    const childIds = await this.resolveExternalIds(entry.refTable, entry.refExternalIds);
    switch (entry.target.kind) {
      case 'jsonb':  await this.updateJsonbRefs(entry, childIds); break;
      case 'join':   await this.upsertJoinRows(entry, childIds);  break;
      default: { const _exhaustive: never = entry.target; throw new Error(`unhandled target ${JSON.stringify(_exhaustive)}`); }
    }
  }
}
```

**Behaviour-preservation obligations the executor must honour** (each is a measured property of the
current code, and each is a place a naive rewrite silently changes behaviour):

1. The `??` chain is **first-non-nullish-wins**, and for `elections` the sentinel forms win over the
   bare forms (`:392-398`). `firstDeclaredKey` must preserve that precedence.
2. The `_`-prefixed payload is `{ externalId | external_id: string[] }`; the bare payload is
   `Array<{ external_id | externalId }>` (`:396-398`, `:450-451`). Two normalisers, one output.
3. `if (!cgRefs || !Array.isArray(cgRefs)) continue;` (`:399`, `:452`) — a malformed payload is
   **skipped**, not thrown. Preserve.
4. Rows without a parent external_id are skipped (`:401-402`, `:456-457`, `:515-516`, `:559-560`).
5. `electionResolve`/`constResolve` skip on `if (!electionExtIds?.length) continue;` (`:514`,
   `:558`) — an *empty* array is a no-op, not a "clear the column".
6. Ordering: today elections → constituency_groups → `electionResolve(categories)` →
   `electionResolve(questions)` → `constResolve(categories)` → `constResolve(questions)`. The
   `LINK_SENTINELS` array order above reproduces it exactly. Keep the rule order.

### The test that fails when a pair is added to the const without handling

The honest statement first: **because the loop iterates the const, adding a pair to the const cannot
leave it unhandled — the resolver will handle it.** Criterion 4's literal phrasing ("adding a sentinel
to the types without handling it in the pipeline fails a test") describes a *parallel-list* world.
D-03 chose the shape where that world does not exist. So what the test must catch is the *other*
direction: **the const growing silently.**

```ts
// packages/dev-seed/tests/template/linkSentinels.test.ts
import { LINK_SENTINELS, planLinks } from '../../src/template/linkSentinels';

/**
 * The expected set is HAND-ENUMERATED, deliberately. Deriving it from
 * LINK_SENTINELS would make this test tautological: it would pass for any
 * const at all. Hand-enumeration is what makes adding a pair to the const a
 * RED test that forces the author to state the addition here as well.
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

it('criterion 4: planLinks dispatches exactly the hand-enumerated (collection, key) pairs', () => {
  // Build one row per pair, each declaring only its own key.
  const data: Record<string, Array<Record<string, unknown>>> = {};
  for (const rule of LINK_SENTINELS)
    for (const collection of rule.collections)
      for (const key of rule.keys)
        (data[collection] ??= []).push({ external_id: `${collection}~${key}`, [key]: { externalId: ['x'] } });

  const observed = planLinks(data).map((e) => `${e.collection}/${e.key}`).sort();
  expect(observed).toEqual([...EXPECTED_PAIRS].sort());   // ← RED when the const grows
});

it('criterion 4: a pair the resolver does NOT read produces no plan entry', () => {
  expect(planLinks({ elections:  [{ external_id: 'el-1', _constituencies: { externalId: ['co-1'] } }] })).toEqual([]);
  expect(planLinks({ candidates: [{ external_id: 'ca-1', _elections:      { externalId: ['el-1'] } }] })).toEqual([]);
});

it('D-01: questions._elections IS still read — this pair is legal and must stay legal', () => {
  const plan = planLinks({ questions: [{ external_id: 'qu-1', _elections: { externalId: ['el-1'] } }] });
  expect(plan).toHaveLength(1);
  expect(plan[0]).toMatchObject({ collection: 'questions', key: '_elections', refTable: 'elections',
                                  target: { kind: 'jsonb', column: 'election_ids' } });
});
```

The second and third `it` blocks are the **must-NOT-fire control** and the **D-01 legality assertion**
respectively — the 143 row-`NC` analog.

Additionally, a type-level guard rides for free once R4's gate exists: the `switch (entry.target.kind)`
`never` arm is a **compile error** for any new `target.kind`, and `refTable` / `target.column` typed as
unions of literal table/column names makes a typo a compile error rather than a runtime 404.

**How the executor demonstrates rather than asserts it (D-03's two-run control):**
- **OLD half** — reconstruct the parallel-list shape in one uncommitted edit (a hand-written
  `PERMITTED_SENTINELS` beside the untouched `linkJoinTables`), add `elections/_constituencies` to it,
  run the derivation test → **GREEN (blind)**, because nothing connects the list to the resolver.
- **NEW half** — under the shipped const-driven code, add the same pair to `LINK_SENTINELS` → the
  hand-enumerated expectation no longer matches → **RED (catch)**. Revert; prove the revert.

## R2.4 `attachSentinels` / `hasDeclaredScope` — and two live bugs consuming the derived set closes

```ts
// packages/dev-seed/src/pipeline.ts:238-255
  if (allGroupExtIds.length > 0) {
    for (const el of output.elections ?? []) {
      if (hasDeclaredScope(el, '_constituencyGroups', 'constituencyGroups', 'constituency_groups')) continue;
      el._constituencyGroups = { externalId: allGroupExtIds };
    }
  }
  if (allConstituencyExtIds.length > 0) {
    for (const cg of output.constituency_groups ?? []) {
      if (hasDeclaredScope(cg, '_constituencies', 'constituencies')) continue;
      cg._constituencies = { externalId: allConstituencyExtIds };
    }
  }
  if (allElectionExtIds.length > 0) {
    for (const qc of output.question_categories ?? []) {
      if (hasDeclaredScope(qc, '_elections', 'elections')) continue;
      qc._elections = { externalId: allElectionExtIds };
    }
  }
```
[VERIFIED: packages/dev-seed/src/pipeline.ts:238-255]

Compare against the measured `linkJoinTables` key sets:

| Collection | `linkJoinTables` reads | `hasDeclaredScope` checks | Delta |
|---|---|---|---|
| `elections` | `_constituencyGroups`, **`_constituency_groups`**, `constituencyGroups`, `constituency_groups` | `_constituencyGroups`, `constituencyGroups`, `constituency_groups` | ⚠ **missing `_constituency_groups`** |
| `constituency_groups` | `_constituencies`, `constituencies` | `_constituencies`, `constituencies` | ✅ exact |
| `question_categories` | `_elections` | `_elections`, **`elections`** | ⚠ **extra `elections`** |

**Two live latent bugs, both closed for free by making `attachSentinels` consume `rule.keys`:**

1. **The `_constituency_groups` override hole.** A template authoring `_constituency_groups` on an
   election row is *not* recognised as having declared scope, so `attachSentinels` overwrites the row
   with a **full-fanout `_constituencyGroups`** — and `linkJoinTables`'s `??` chain then prefers the
   fanout (`_constituencyGroups` is checked first at `:393`). **The author's explicit scoping is
   silently replaced by "everything wired to everything."** This is the exact defect class the phase
   exists to eliminate, hiding one file away from the one it was chartered against. Measured
   exploitation in-tree: **zero** (`grep -rn "_constituency_groups" packages/dev-seed/src/templates`
   → no hits), so closing it changes no built-in's output.
2. **The bare-`elections` phantom.** `hasDeclaredScope(qc, '_elections', 'elections')` treats a bare
   `elections` array on a question-category row as declared scope and suppresses the fanout — but
   `linkJoinTables` never reads it, so the row ends with `election_ids = null = "all"` anyway, which
   happens to be the same observable outcome *only because* the fanout would have listed every
   election. Change the election set and the two diverge. Measured exploitation in-tree: **zero**.

**Scope-fence reading.** CONTEXT.md permits touching `attachSentinels` / `hasDeclaredScope` "only so
far as consuming the derived key set requires." Replacing the three literal argument lists with
`keysFor(collection)` derived from `LINK_SENTINELS` is exactly that, and it is the minimum edit that
makes the two files agree. **It is a behaviour change for two cases no template exercises** — record
both rows in the fallout table with the measured zero, and file nothing as a todo, because the todo
that stays open (2026-05-23) is about *removing* the fan-out, not about which keys suppress it.

**What this does and does not guarantee** — stated plainly, per the prompt:
- **Does guarantee:** the set of keys that suppress the fanout is byte-identical to the set the
  resolver reads, for all time, because both read `LINK_SENTINELS`.
- **Does not guarantee:** that `attachSentinels`' *fanout policy* (which collections get a default at
  all) is derived. Only three of the six collection/key combinations get a fanout default, and that
  asymmetry stays hand-written. It is the 2026-05-23 todo's territory. Say so in the ledger.

---

# R3 — The D-03a keying-confusion hazard

## R3.1 ⚠ The stated premise does not hold; the underlying risk does

D-03a says Pass 0 "runs on the **template's collection key**, pre-resolution — and the two differ
(`questionCategories` vs `question_categories`)". **Measured: from every in-tree path, they do not
differ.**

- `TemplateSchema` declares its twelve per-entity slots in **snake_case only**
  (`schema.ts:117-128`) — there is no `questionCategories` slot to author into.
- `runPipeline` writes `output[table]` for `table of TOPO_ORDER`, and `TOPO_ORDER`
  (`pipeline.ts:76-91`) is **entirely snake_case**.
- `Writer.write(data)` receives that output verbatim (`writer.ts:140-144`).
- Therefore `resolveCollectionName(k) === k` for every key Pass 0 sees from the CLI, from
  `tests/seed-test-data.ts:30`, and from `tests/tests/setup/shared/setupFromTemplate.ts:208`.

**The risk is nevertheless real, for two reasons that are not the stated one:**

1. `Writer.write` is a public export (`@openvaa/dev-seed` barrel) and can be handed an arbitrary map;
   `linkJoinTables` explicitly accommodates camelCase collection keys at `:443`
   (`data.constituencyGroups ?? data.constituency_groups`) and `:503`
   (`data.questionCategories ?? data.question_categories`). A guard that rejected those would break a
   supported shape.
2. `COLLECTION_NON_COLUMNS` really is keyed post-resolution — `extraStrip` is looked up **after**
   `resolveCollectionName`:

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:166-170
    for (const [collection, records] of Object.entries(data)) {
      // Convert collection name to snake_case table name
      const tableName = resolveCollectionName(collection);
      const extraStrip = COLLECTION_NON_COLUMNS[tableName];
      const isPublishable = PUBLISHABLE_TABLES.has(tableName);
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:166-170]

```ts
// packages/dev-seed/src/supabaseAdminClient.ts:140-145
    const NON_COLUMN_FIELDS = new Set(['answersByExternalId']);
    const COLLECTION_NON_COLUMNS: Record<string, Set<string>> = {
      candidates: new Set(['email']),
      elections: new Set(['constituencyGroups', 'constituency_groups']),
      constituency_groups: new Set(['constituencies'])
    };
```
[VERIFIED: packages/dev-seed/src/supabaseAdminClient.ts:140-145] — B-9 exact, including the line range.

## R3.2 The canonical keying, and how both consumers resolve into it

**Canonical keying: the resolved snake_case table name.** Three reasons, in order of weight:

1. It is what `COLLECTION_NON_COLUMNS` already uses (`:169`), so D-03a's "moved, not re-invented"
   instruction costs zero re-keying.
2. It is what `TablesInsert<T>` is parameterised by, so source (1) needs no adapter.
3. It is what `TOPO_ORDER`, `TemplateSchema` and the RPC's `p_table_name` all use.

Both consumers resolve into it by calling the **same exported** function. `resolveCollectionName` is
currently module-private (`function`, not `export function`, at `:81`). **Export it from the shared
declaration and have `bulkImport` import it back**, so there is exactly one implementation:

```ts
// permittedKeys.ts
export function resolveCollectionName(collection: string): string { return COLLECTION_MAP[collection] ?? collection; }
export function permittedKeys(collection: string): ReadonlySet<string> {
  const table = resolveCollectionName(collection);
  const set = PERMITTED_BY_TABLE[table];
  if (!set) throw new Error(`assertKnownRowProps: no permitted-key set for collection '${collection}' (resolved to table '${table}').`);
  return set;
}
```

**The design rule that makes the confusion loud instead of silent, and it must be locked:** an
unrecognised *collection* **throws**. If `permittedKeys` returned an empty set or `undefined` on a
miss, a keying confusion would make the guard permit everything — a fake guard of exactly the kind
this milestone exists to eliminate.

## R3.3 The case that FAILS if the two keyings are confused

```ts
// packages/dev-seed/tests/assertKnownRowProps.test.ts
describe('D-03a — one canonical keying, both consumers resolve into it', () => {
  const sentinelRow = { external_id: 'qc-1', _elections: { externalId: ['el-1'] } };

  it('accepts the camelCase collection key (FAILS if the allow-list is keyed pre-resolution)', () => {
    // A map keyed only `question_categories`, looked up with the raw key
    // `questionCategories`, misses → the unknown-collection throw fires → RED.
    expect(() => assertKnownRowProps({ questionCategories: [sentinelRow] })).not.toThrow();
  });

  it('accepts the snake_case collection key — the same entry, not a second one', () => {
    expect(() => assertKnownRowProps({ question_categories: [sentinelRow] })).not.toThrow();
  });

  it('reports the RESOLVED table name when it throws, so the message is greppable', () => {
    expect(() => assertKnownRowProps({ questionCategories: [{ external_id: 'qc-1', bogus: 1 }] }))
      .toThrow(/bogus.*qc-1.*question_categories/s);
  });

  it('an unrecognised collection is LOUD, never silently permissive', () => {
    expect(() => assertKnownRowProps({ nonsense_collection: [{ external_id: 'x' }] }))
      .toThrow(/no permitted-key set for collection 'nonsense_collection'/);
  });

  it('COLLECTION_NON_COLUMNS resolves the same way — candidates.email is permitted under either key', () => {
    expect(() => assertKnownRowProps({ candidates:  [{ external_id: 'c1', first_name: 'A', last_name: 'B', email: 'a@b.c' }] })).not.toThrow();
    expect(() => assertKnownRowProps({ constituencyGroups: [{ external_id: 'cg1', constituencies: [{ external_id: 'co1' }] }] })).not.toThrow();
  });
});
```

Case 1 is the required **real failing case**: under a confused (pre-resolution) keying it throws
`no permitted-key set for collection 'questionCategories'` and the test goes RED. Case 5 is its
`COLLECTION_NON_COLUMNS` twin, exercising the `constituency_groups` entry through its camel alias —
the one entry whose lookup key genuinely differs from its collection key today.

**Two-run control for D-03a:** OLD half = the allow-list keyed by the raw template key with no
resolution step, case 1 observed **RED**; NEW half = resolved keying, case 1 observed **GREEN**, with
cases 3 and 4 both **RED-when-injected**. Note this pair is *inverted* relative to the others (the OLD
half is a red, the NEW half a green) — 143's ledger had exactly one such inverted pair (rows
`E-OLD`/`E-NEW`) and flagged it in a ⚠ THE INVERSION section. Do the same.

---

# R4 — The D-06 gated two-run typecheck control

## R4.1 The current tsconfig, verbatim

```jsonc
// packages/dev-seed/tsconfig.json — verbatim at ee58a4be7
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@openvaa/shared-config/ts",
  "compilerOptions": {
    "lib": ["es2022"],
    "rootDir": "./src",
    "outDir": "./dist",
    "noEmit": true,
    "composite": false,
    "declarationMap": false,
    "types": ["node"]
  },
  "include": ["src/**/*"]
}
```
[VERIFIED: packages/dev-seed/tsconfig.json:1-13] — B-20 exact.

**Measured blindness (D-06's OLD half, taken on the untouched tree):** with a file
`packages/dev-seed/tests/__probe144/ctrl.ts` containing `export const x: number = 'not a number';`,
`npx tsc --noEmit -p packages/dev-seed/tsconfig.json` exited **0**.

## R4.2 Does `@openvaa/shared-config/ts` constrain the widening?

`packages/shared-config/package.json` exports `{"./ts": "./tsconfig.base.json"}`.
`packages/shared-config/tsconfig.base.json`, verbatim:

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "allowJs": true, "checkJs": true, "composite": true, "declarationMap": true,
    "esModuleInterop": true, "forceConsistentCasingInFileNames": true,
    "lib": ["es2022"], "module": "ESNext", "moduleResolution": "Bundler",
    "resolveJsonModule": true, "skipLibCheck": true, "strict": true, "target": "es2020"
  }
}
```
[VERIFIED: packages/shared-config/tsconfig.base.json:1-17]

**No.** The base sets `composite: true`, which normally requires `rootDir` to contain every input —
but dev-seed already overrides `composite: false`, so dropping `rootDir` is legal. Proven empirically:
the widened config produced **only** the three pre-existing errors, no `TS6059`/`TS6307` project-
reference complaints. `allowJs`/`checkJs` are `true`, so adding `scripts/**` type-checks
`scripts/download-portraits.ts` too — measured clean.

## R4.3 B-21 re-measured — three errors, identical lines

Widened `include` to `["src/**/*", "tests/**/*", "scripts/**/*"]` and dropped `rootDir`; ran
`npx tsc --noEmit -p packages/dev-seed/tsconfig.json`. **Exactly three errors, at exactly B-21's
lines.** Verbatim:

```
packages/dev-seed/tests/determinism.test.ts(99,25): error TS2559: Type '{ seed: number; elections: { count: number; fixed: { external_id: string; name: { en: string; }; }[]; }; }' has no properties in common with type '{ generateTranslationsForAllLocales?: boolean | undefined; }'.

packages/dev-seed/tests/latent/latentEmitter.test.ts(122,35): error TS2493: Tuple type '[]' of length '0' has no element at index '0'.

packages/dev-seed/tests/templates/nominations-override.test.ts(83,13): error TS2352: Conversion of type '{ candidates: …; constituencies: …; elections: …; organizations: …; alliances: never[]; factions: never[]; question_categories: never[]; questions: never[]; }' to type '{ accounts: …; projects: …; elections: …; constituency_groups: …; … 9 more …; feedback: …; }' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
  … is missing the following properties …: accounts, projects, constituency_groups, nominations, and 2 more.
```

**Restored and proven** — see § Method and provenance.

### Concrete fix for each

**(1) `tests/determinism.test.ts:99`** — the site is:

```ts
// tests/determinism.test.ts:93-102
  it('locale fan-out is a no-op when generateTranslationsForAllLocales is undefined (behavior preserved)', () => {
    const template = {
      seed: 42,
      elections: { count: 0, fixed: [{ external_id: 'e1', name: { en: 'Demo' } }] }
    };
    const rows = runPipeline(template);
    fanOutLocales(rows, template, 42);
```

`fanOutLocales`'s second parameter is `template: { generateTranslationsForAllLocales?: boolean }`
(`src/locales.ts:140-144`), an all-optional object — TypeScript's "weak type" rule then requires at
least one property in common, and this literal has none. The sibling test at `:81-90` compiles only
because it sets `generateTranslationsForAllLocales: true`.
**Fix: annotate the literal `const template: Template = { … }`.** That is the *right* fix rather than a
workaround: it turns the fixture into a real conformance check against the new strict row types, and
the row `{ external_id: 'e1', name: { en: 'Demo' } }` is legal under `ElectionsFixedRow`
(`external_id` string, `name` Json). One-line change, no cast, and the fixture becomes evidence.

**(2) `tests/latent/latentEmitter.test.ts:122`** — the site is:

```ts
// tests/latent/latentEmitter.test.ts:114-123
  it('dimensions hook receives template as arg (argument forwarding)', () => {
    const dimsHook = vi.fn(() => ({ dims: 2, eigenvalues: [1, 1 / 3] }));
    …
    expect(dimsHook.mock.calls[0][0]).toBe(tpl);
```

`vi.fn(() => …)` infers a zero-parameter signature, so `mock.calls[0]` is the empty tuple `[]` and
index `0` is out of range. **Fix: declare the parameter the assertion reads —
`const dimsHook = vi.fn((_template: Template) => ({ dims: 2, eigenvalues: [1, 1 / 3] }));`.** This is
strictly better than a cast: the assertion at `:122` is *about* the first argument, so typing it makes
the test say what it checks. Cross-check the `LatentHooks['dimensions']` signature
(`src/emitters/latent/latentTypes.ts`) and use its real parameter list if it takes more than one.

**(3) `tests/templates/nominations-override.test.ts:83`** — the site is a hand-built `Ctx` fixture:

```ts
// tests/templates/nominations-override.test.ts:83-101
      refs: {
        candidates: …, constituencies: …, elections: …, organizations: …,
        alliances: [], factions: [], question_categories: [], questions: []
      } as Ctx['refs']
    } as Ctx;
```

`Ctx['refs']` (`src/ctx.ts:34-49`) declares **fourteen** keys; the fixture supplies eight. **Fix: add
the six missing keys as empty arrays —**
`accounts: [], projects: [], constituency_groups: [], nominations: [], app_settings: [], feedback: []`
— and then the `as Ctx['refs']` cast can be deleted outright. Again the honest fix beats
`as unknown as`: the fixture becomes structurally complete and stays valid when `Ctx['refs']` grows.

**Owned-fallout framing for the ledger:** all three are *pre-existing* type errors that no gate has
ever seen; none is caused by this phase. Record them as a fallout row with the measured before/after,
not as regressions.

## R4.4 The `@ts-expect-error` fixture, measured both ways

Probe file `packages/dev-seed/tests/__probe144/ctrl.ts`, compiled under the **widened** config:

**Fixture present (offending row in place):**

```ts
import type { TablesInsert } from '@openvaa/supabase-types';
type ElectionsFixedRow = Partial<TablesInsert<'elections'>> & { external_id: string };
// @ts-expect-error — `_constituencies` is not a permitted key on an elections row.
export const row: ElectionsFixedRow = { external_id: 'el-1', _constituencies: { externalId: ['co-1'] } };
```
→ **0 diagnostics.** Gate green.

**Offending row deleted (the `@ts-expect-error` now unused):**

```ts
// @ts-expect-error — `_constituencies` is not a permitted key on an elections row.
export const row: ElectionsFixedRow = { external_id: 'el-1' };
```
→
```
packages/dev-seed/tests/__probe144/ctrl.ts(3,1): error TS2578: Unused '@ts-expect-error' directive.
```
Gate **red**.

**TS2578 is verified, not assumed** — `typescript@5.9.3`, this tree's version, under
`packages/dev-seed/tsconfig.json` extended from `@openvaa/shared-config/ts`. The control works exactly
as D-06 designs it.

**Placement recommendation:** put the fixture in a *named* spec, e.g.
`packages/dev-seed/tests/template/strictRowTypes.type-test.ts`, with a file-header comment stating
that its only job is to be type-checked and that deleting any line turns the gate red. Keep the two
D-01 exemplars (`elections._constituencies`, `candidates._elections`) and the D-01 legality case
(`questions._elections`, **no** `@ts-expect-error` — it must compile clean) in the same file, so the
three live side by side and the legality case cannot rot.

## R4.5 The exact `package.json` and CI edits

**Root `package.json`.** Current lines 33-34, verbatim:

```json
    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests",
    "typecheck:tests": "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit",
```
[VERIFIED: package.json:33-34] — B-18 confirmed; note the script body is
`node_modules/.bin/tsc -p tests/tsconfig.json --noEmit`, slightly fuller than CONTEXT.md's paraphrase.

**Proposed:**

```json
    "typecheck": "turbo run typecheck",
    "lint:check": "turbo run lint && eslint --flag v10_config_lookup_from_file tests && yarn typecheck:tests && yarn typecheck",
    "typecheck:tests": "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit",
```

Place `yarn typecheck` **last** in the chain so a lint failure still reports first (matching the
existing ordering intent), and keep `typecheck:tests` — it covers the Playwright tree, which has its
own `tests/tsconfig.json` and no turbo task.

**`.github/workflows/main.yaml`.** Surrounding steps, verbatim at `:60-79`:

```yaml
      - name: "Build all shared modules"
        run: yarn build

      - name: "Run Prettier check globally"
        run: yarn format:check

      - name: "Run ESlint check on frontend"
        run: yarn lint:check

      - name: "Run Frontend and shared module tests"
        run: yarn test:unit

      - name: "Configure frontend environment using the repo root .env.example file"
        run: cp .env.example apps/frontend/.env

      - name: "Type-check frontend (svelte-check, 0 errors / 0 warnings)"
        run: yarn workspace @openvaa/frontend check

      - name: "Build frontend"
        run: yarn workspace @openvaa/frontend build
```
[VERIFIED: .github/workflows/main.yaml:60-79] — B-19 confirmed: no `turbo run typecheck` anywhere.

**Step to add** (matching the surrounding quoted-name + `run:` style), inserted **after** the ESLint
step and **before** `yarn test:unit`:

```yaml
      - name: "Type-check all packages (turbo run typecheck, 22 tasks)"
        run: yarn typecheck
```

Because `lint:check` now chains `yarn typecheck`, this step is technically redundant in CI — but
naming it as its own step is the Phase-142.1 precedent (`yarn workspace @openvaa/frontend check` is a
named step even though `yarn build` runs in the same job), and a named step is what makes the gate
legible in the Actions UI when it fails. **Add both.** State in the plan that the redundancy is
deliberate.

## R4.6 D-06b — where each form of the command belongs

| Context | Command | Reason |
|---|---|---|
| **Every evidence run in this phase** — every ledger row, every two-run half, the phase-close gate set | `TURBO_FORCE=true yarn typecheck` (or `TURBO_FORCE=true npx turbo run typecheck`) | `turbo.json:18-22` gives `typecheck` **no** `"cache": false` (verbatim below). A replayed green is a claim about a *previous* tree, and the D-06 control's two halves differ by one line in one file. |
| **The gate as shipped** to `package.json` and `main.yaml` | `turbo run typecheck` (unforced) | Caching there is a feature; CI cold-starts anyway. |

```jsonc
// turbo.json:18-22 — verbatim
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [],
      "inputs": ["$TURBO_DEFAULT$", "tsconfig.json", "tsconfig.*.json"]
    }
```
[VERIFIED: turbo.json:18-22] — B-16 confirmed, exact lines. Contrast `test:unit` at `:9-12` which sets
`"cache": false`, and `lint` at `:13-17` which does not.

**Baseline re-measured today:**

```
$ TURBO_FORCE=true npx turbo run typecheck
…
@openvaa/frontend:typecheck: cache bypass, force executing 9540e6a6e94d2338
@openvaa/frontend:typecheck: svelte-check found 0 errors and 0 warnings

 Tasks:    22 successful, 22 total
Cached:    0 cached, 22 total
  Time:    19.267s
```

B-17 confirmed (22/22, 0 cached; 19.3 s here vs 17.5 s in CONTEXT.md — wall-clock variance, not a
delta). Note the verdict string is **`cache bypass, force executing`**, the stronger of the two forms —
143 recorded the same string and explained why it is stronger than `cache miss, executing`. Use it as
the ledger's acceptance grep.

**B-15 re-measured:** `grep -l '"typecheck"' packages/*/package.json apps/*/package.json | wc -l` → **12**.
The twelve are `apps/docs`, `apps/frontend`, `packages/app-shared`, `argument-condensation`, `core`,
`data`, `dev-seed`, `dev-tools`, `filters`, `llm`, `matching`, `question-info`. CONTEXT.md B-15 is
correct; the roadmap's/discussion's "11" and "10 other packages" are the stale figures.
**Deferred-idea arithmetic correction: it is 11 packages beyond dev-seed, not 10.**

---

# R5 — The Pass 0 runtime guard (D-02)

## R5.1 Placement and signature

```ts
// packages/dev-seed/src/assertKnownRowProps.ts  (proposed — NO Supabase import)
import { permittedKeys, deniedKeys, resolveCollectionName } from './template/permittedKeys';

/**
 * Pass 0 of the write path. Pure: no network, no Supabase client, no env.
 * Throws on the FIRST unknown or denied property, naming external_id + key + collection.
 */
export function assertKnownRowProps(data: Record<string, Array<Record<string, unknown>>>): void;
```

Placement, per D-02 ("called once from `Writer.write()` immediately before Pass 1"):

```ts
// packages/dev-seed/src/writer.ts — proposed, showing the exact current lines 144-160
    const bulkData: Record<string, Array<Record<string, unknown>>> = { ...data };   // :144

    delete bulkData.accounts;                                                        // :148
    delete bulkData.projects;                                                        // :149
    const feedbackRows = bulkData.feedback;                                          // :152
    delete bulkData.feedback;                                                        // :153
    const appSettingsRows = bulkData.app_settings;                                   // :156
    delete bulkData.app_settings;                                                    // :157

    // Pass 0: unknown-property guard (TMPL-02). Runs on `data`, NOT `bulkData` —
    // see the note below on the four deleted collections.
    assertKnownRowProps(data);                                                       // ← NEW, at :158

    // Pass 1: bulk_import (10 tables, single PL/pgSQL transaction per).
    await this.client.bulkImport(bulkData);                                          // :159-160
```

## R5.2 ⚠ Before or after the four deletions — and why the answer is "before, by argument"

`Writer.write()` deletes four collections from `bulkData` **before** Pass 1
(`writer.ts:148,149,153,157`, verbatim above). So a guard reading `bulkData` at `:158` **cannot see**
`accounts`, `projects`, `feedback` or `app_settings` at all.

**Which is correct?** Neither placement alone. The right answer is: keep D-02's *placement* (line 158,
immediately above Pass 1) but pass the **pre-deletion `data`**, which is still in scope as the method
parameter. Evidence:

- **`app_settings` is a first-class, template-authorable fragment.** `TemplateSchema:127` declares it;
  measured, **30 of 30 built-ins emit exactly one `app_settings` row**, all carrying `external_id` and
  `settings`. Reading `bulkData` would leave the phase's headline guard blind to a collection every
  single template uses. Its permitted keys are small and derivable: `TablesInsert<'app_settings'>`
  = `created_at, customization, external_id, id, project_id, settings, updated_at`
  (`database.ts:193-199`), and `Writer` reads only `row.settings` (`writer.ts:185`). Guarding it is
  cheap and correct.
- **`feedback` is a declared fragment too** (`TemplateSchema:128`), and its rows are *skipped with a
  warning* (`writer.ts:194-199`). A template author who writes `feedback: { fixed: [{ rating: 5 }] }`
  today gets a silent no-op — arguably out of scope, but guarding its **keys** costs nothing and the
  "skipped" warning already exists to explain the rest.
- **`accounts` / `projects` are NOT in `TemplateSchema` at all** and measured **0 rows across all 30
  built-ins**. They exist only as `TOPO_ORDER` entries with pass-through generators. Guard them
  against `TablesInsert<'accounts'>` / `<'projects'>` and they cost nothing — *except* that
  `writer.test.ts:192` passes `accounts: [{ id: 'x' }]` and `:204` passes `projects: [{ id: 'y' }]`,
  and `id` is on the RPC's `skip_columns`. That is a **deny-list** interaction, not an allow-list one
  (see R5.5), and it is the reason `id` must not be in the throwing deny set.

**Record the decision explicitly in the ledger**, with the measured consequence: guarding `data`
covers **12 of 14** collections that ever carry rows (all 12 template-declarable ones) and adds
`accounts`/`projects` for free; guarding `bulkData` covers 10 and silently exempts `app_settings`.

## R5.3 Rows without an `external_id`

**Measured facts:** `feedback`, `accounts` and `projects` have **no `external_id` column**
(`database.ts:655-662`, `:38-42`, `:906-912`). `writer.test.ts` passes rows with no `external_id` at
`:192` (`accounts: [{ id: 'x' }]`), `:216` (`feedback: [{ rating: 5 }]`), `:228`
(`app_settings: [{ settings: { key: 'value' } }]`) and `:278`. The RPC itself hard-requires it for the
ten bulk-import tables:

```sql
  ext_id := p_item ->> 'external_id';
  IF ext_id IS NULL THEN
    RAISE EXCEPTION 'external_id is required for bulk import (table: %)', p_table_name;
  END IF;
```
[VERIFIED: apps/supabase/supabase/schema/501-bulk-operations.sql:139-142]

**Recommendation:** the guard does **not** require `external_id` — that is the RPC's job and it already
does it by name. When a row lacks one, the message falls back to the **row index**:

```
… (row external_id: <none> — index 3 of collection 'feedback')
```

Do *not* let the guard throw "missing external_id", or it will pre-empt the RPC's own clearer error
and change the failure mode for every `feedback` row in `writer.test.ts`.

## R5.4 The throw message — matching house style

Measured dev-seed error phrasings:

```
`bulkImport failed: ${error.message}`                                                   (:205)
`linkJoinTables: failed to find election ${electionExtId}: ${eError.message}`           (:411)
`linkJoinTables: failed to update ${table} ${rowExtId} election_ids: ${…}`              (:537)
`Template validation failed:\n${msg}`                                       (schema.ts:147)
`Unknown template: '${arg}'. Built-in templates: ${builtInList}. …`  (resolve-template.ts:55)
`SUPABASE_SERVICE_ROLE_KEY env var is required but not set. Run \`supabase status\` …`  (writer.ts:101)
```

House style: `<function>: <what went wrong>`, with the offending identifier interpolated and, where
useful, a remediation sentence. Note the CLI wraps everything as `Error: ${message}`
(`cli/seed.ts:145`), so the message should read well after that prefix.

**Proposed, TMPL-02-conformant (external_id + key + collection all present):**

```
assertKnownRowProps: unknown property 'answersByExternalId' on collection 'questions'
(row external_id: 'test-e2e-base-qu-opin-base-1-likert5'). The seed pipeline never reads it, so it
would be silently dropped. Permitted keys for 'questions': _constituencies, _elections, allow_open,
category, category_id, … (25 columns + 2 sentinels + 1 relationship ref). If the pipeline is meant
to read it, add it to LINK_SENTINELS or COLLECTION_NON_COLUMNS in
packages/dev-seed/src/template/permittedKeys.ts.
```

and the deny-list variant, sharing the shape per D-09:

```
assertKnownRowProps: property 'entity_type' on collection 'questions' (row external_id: 'qu-1') is a
real column but is discarded by the bulk_import RPC's skip_columns
(apps/supabase/supabase/schema/501-bulk-operations.sql:109-111), so setting it has no effect. Remove it.
```

**Throw on the first offence** (not an aggregate). Rationale: `bulkImport`'s and `linkJoinTables`'
existing errors are all first-failure, and an aggregate over 1,481 rows would bury the signal.
`[ASSUMED]` — this is a style judgement, not a measurement; the planner may prefer an aggregated
report and should say so explicitly if it does.

## R5.5 Fallout: what Pass 0 would throw on today

Measured by running `runPipeline` + `fanOutLocales` over all 30 built-ins and classifying every key of
every one of the **1,481** emitted rows.

| Allow-list composition | Rows/keys that would throw |
|---|---|
| 4 sources (columns + sentinels **incl. bare forms** + non-columns + RPC relationship refs), deny-list = `{entity_type}` | **0** |
| 3 sources (D-03 as written — no relationship refs) | **2,955** key occurrences across `nominations`, `candidates`, `questions`, `constituencies` |
| 4 sources but deny-list = full `skip_columns` | **1,481** — every row, on `project_id` |
| 4 sources, sentinels **without** the bare forms | **+76** — 41 `elections.constituency_groups` + 35 `constituency_groups.constituencies` |

**And a second reach that must not be missed:** `writer.test.ts` calls `writer.write()` with a mocked
admin client **thirty-plus times**, and those fixtures are not pipeline output. Measured shapes at
`:183, 191-193, 203-205, 215-217, 227-229, 244-254, 278, 285, 299-301, 317, 325, 346, 376, 392, 404,
421-423, 443-445, 463, 471`. All content rows are `{ external_id, project_id }`; the exceptions are
`accounts: [{ id: 'x' }]`, `projects: [{ id: 'y' }]`, `feedback: [{ rating: 5 }]` /
`[{ rating: 5, description: 'test' }]`, and `app_settings: [{ settings: { … } }]`. **Under the
recommended composition every one of these passes**, because `id` is a real column on
`accounts`/`projects` and is not in the throwing deny set, and `rating`/`description`/`settings` are
real columns. Verify this in the plan rather than trusting it — it is the difference between a green
`yarn test:unit` and thirty red tests.

**E2E reach is real, not theoretical.** All three in-tree `Writer.write` call sites outside the CLI
are E2E infrastructure:

```
tests/seed-test-data.ts:30                                await writer.write(rows, prefix);
tests/tests/setup/shared/setupFromTemplate.ts:208         await writer.write(rows, prefix);
```
[VERIFIED: `grep -rn "\.write(" tests --include='*.ts'`]

`setupFromTemplate` is the shared helper every `perm-*` setup project uses, and it imports
`runPipeline`, `fanOutLocales` and `Writer` straight from `@openvaa/dev-seed`
(`setupFromTemplate.ts:14-23`). **A single false positive in Pass 0 fails every E2E setup project at
once.** CLAUDE.md's cardinal rule then blocks the phase. This is why the fallout measurement above is
the phase's most load-bearing number.

**`fanOutLocales` adds no keys** — it iterates `LOCALIZED_FIELDS` and rewrites existing values in place
(`src/locales.ts:156-166`). Confirmed by re-running the classification with `fanOutLocales` applied:
still **0 unknown keys**.

---

# R6 — D-09 deny-list source

## R6.1 The RPC's `skip_columns`, verbatim, with the measured line number

**The file is `apps/supabase/supabase/schema/501-bulk-operations.sql`** — note the **doubled
`supabase/`**. CONTEXT.md D-09 writes `apps/supabase/migrations/…501-bulk-operations.sql`; that path
does not exist (`ls apps/supabase/migrations/` → *No such file or directory*).

```sql
-- apps/supabase/supabase/schema/501-bulk-operations.sql:108-111
  -- Columns to skip (managed by DB, not by import)
  skip_columns text[] := ARRAY[
    'id', 'created_at', 'updated_at', 'project_id', 'entity_type'
  ];
```
[VERIFIED: apps/supabase/supabase/schema/501-bulk-operations.sql:108-111 — the `ARRAY[` opens at
**`:109`**, the five literals are on **`:110`**, the close is `:111`]

The applied migration carries a byte-identical copy:

```sql
-- apps/supabase/supabase/migrations/00001_initial_schema.sql:2615-2617
  skip_columns text[] := ARRAY[
    'id', 'created_at', 'updated_at', 'project_id', 'entity_type'
  ];
```
[VERIFIED: apps/supabase/supabase/migrations/00001_initial_schema.sql:2614-2617]

Consumed at `501-bulk-operations.sql:148-150`:

```sql
    -- Skip project_id (already added) and managed columns
    IF item_key = ANY(skip_columns) THEN
      CONTINUE;
    END IF;
```

with `project_id` re-added unconditionally from the RPC's own parameter at `:96-97`
(`col_names text[] := ARRAY['project_id']; col_values text[] := ARRAY[quote_literal(p_project_id)];`).
**That is why generators may safely emit `project_id`: the RPC drops the payload's copy and
substitutes its own.**

## R6.2 Which of the five are real columns on which tables

Parsed from `packages/supabase-types/src/database.ts` Insert blocks (19 tables):

| skip column | Real `Insert` column on | Rows emitting it in-tree | Deny-list disposition |
|---|---|---|---|
| `id` | **all 19 tables** | 0 from generators; **2 in `writer.test.ts`** (`accounts:192`, `projects:204`) | **EXCLUDE from throwing set.** A `TablesInsert`-legal key that two existing tests supply. Document with reason. |
| `created_at` | all 19 | 0 | **EXCLUDE.** Zero cost either way; excluded for symmetry with `updated_at`, and because a template legitimately might want to set a creation timestamp the DB then overrides — worth a warning, not a throw. `[ASSUMED]` |
| `updated_at` | all 19 | 0 | **EXCLUDE**, same reason. |
| `project_id` | 17 of 19 (**not** `accounts`, which has none; `projects` has `account_id` instead) | **1,481 of 1,481** — every generator emits it | **MUST EXCLUDE.** Including it turns every seed run and every E2E setup red. |
| `entity_type` | **3 tables**: `nominations` (`database.ts:724`, required-enum in Row at `:696`), `question_categories` (`:963`, `Json \| null`), `questions` (`:1047`, `Json \| null`) | **0** | **INCLUDE — the one honest deny-list entry.** Zero fallout, and it is exactly D-09's stated exemplar. |

**Recommended shape:** a `DENIED_BY_TABLE` map with **one** entry per (table, column) actually denied —
today `nominations.entity_type`, `question_categories.entity_type`, `questions.entity_type` — plus a
**separate, documented, non-throwing** `SKIP_COLUMNS_NOT_DENIED` table with the four exclusions and
their one-line reasons, so the delta from the RPC's array is stated rather than silent. A unit test
should assert `DENIED ∪ SKIP_COLUMNS_NOT_DENIED === skip_columns` (parsed from the SQL, or
hand-transcribed with a comment naming `:110`), so a future `skip_columns` addition cannot be
un-noticed.

**D-09's own two-run control:** OLD half — a `--template ./custom.ts` carrying `entity_type` on a
`questions` row seeds successfully and the column stays `null` in the DB (queryable proof); NEW half —
the same run throws with the deny message. This is a *third* runtime fixture class beyond D-08's two;
D-08 explicitly declined it as a criterion-2 fixture (option C, unticked), but the standing acceptance
rule still applies to the guard D-09 builds. Include it as its own ledger pair.

---

# R7 — Fallout inventory (criterion 5 / D-10)

## R7.1 Method

Two surveys, both run this session, both over the **live registry** rather than by grep:

1. **Authored `fixed[]` keys.** Imported `BUILT_IN_TEMPLATES` and walked every fragment's `fixed[]`
   array. Measured: **30 built-in templates, 749 hand-authored `fixed[]` rows.** (B-13 confirmed at 30;
   `find packages/dev-seed/src/templates -name '*.ts' -not -name '*.test.ts' | wc -l` → **39** files;
   `grep -rn "fixed:" … | wc -l` → **128** sites. All three match CONTEXT.md.)
2. **Pipeline-output keys.** Ran `runPipeline(tpl, BUILT_IN_OVERRIDES[name] ?? {})` then
   `fanOutLocales` for each of the 30, and classified every key on every emitted row. Measured
   emission: `{elections: 42, constituency_groups: 36, constituencies: 57, organizations: 67,
   alliances: 4, factions: 0, question_categories: 66, questions: 104, candidates: 439,
   nominations: 636, app_settings: 30, accounts: 0, projects: 0, feedback: 0}` — **1,481 rows**.
   Survey 2 is the one that matters, because Pass 0 runs on pipeline output, not on `fixed[]`.

## R7.2 The complete non-column key inventory (pipeline output, all 30 built-ins)

Every key that is **not** a `TablesInsert` column of its collection:

| Collection | Key | Class | Rows | Read by |
|---|---|---|---|---|
| `candidates` | `organization` | RPC relationship ref | 438 | `501-bulk-operations.sql:117` |
| `candidates` | `answersByExternalId` | non-column | 438 | `importAnswers`, `supabaseAdminClient.ts:246-257` |
| `organizations` | `answersByExternalId` | non-column | 1 (`perm-org-matching`) | same |
| `constituencies` | `parent` | RPC relationship ref | 8 | `:133` |
| `constituency_groups` | `constituencies` | **sentinel, bare form** | 35 | `linkJoinTables:451` |
| `constituency_groups` | `_constituencies` | sentinel | 1 (`default`, via `attachSentinels`) | `linkJoinTables:446` |
| `elections` | `constituency_groups` | **sentinel, bare form** | 41 | `linkJoinTables:398` |
| `elections` | `_constituencyGroups` | sentinel | 1 (`default`, via `attachSentinels`) | `linkJoinTables:393` |
| `nominations` | `constituency` | RPC relationship ref | 636 | `:125` |
| `nominations` | `election` | RPC relationship ref | 636 | `:124` |
| `nominations` | `parent_nomination` | RPC relationship ref | 497 | `:126` |
| `nominations` | `candidate` | RPC relationship ref | 453 | `:120` |
| `nominations` | `organization` | RPC relationship ref | 164 | `:121` |
| `nominations` | `alliance` | RPC relationship ref | 19 | `:123` |
| `question_categories` | `_elections` | sentinel | 66 (1 authored + 65 via `attachSentinels`) | `linkJoinTables:512` |
| `question_categories` | `_constituencies` | sentinel | 1 (`e2e/base`, authored) | `linkJoinTables:556` |
| `questions` | `category` | RPC relationship ref | 104 | `:130` |
| `questions` | `_constituencies` | sentinel | 5 (`e2e/base`, authored) | `linkJoinTables:556` |
| `questions` | `_elections` | sentinel | 1 (`e2e/base`, authored) | `linkJoinTables:512` |
| *all 12* | `project_id` | column, in `skip_columns` | 1,481 | RPC re-supplies from `p_project_id` |

## R7.3 ⚠ The fallout table is EMPTY — and that is the finding

> **Candidate fallout: zero fields, zero files, zero `external_id`s.**
>
> Under the recommended allow-list composition (four sources; deny-list `= {entity_type}`), **not one
> key on any of the 1,481 rows emitted by any of the 30 built-in templates is unknown.** Criterion 5's
> "any field they lose to the tightening is listed with the reason" is satisfied by an empty table
> with the measurement above stated as its discharge.

D-10's DELETE-default and its E2E-red exception therefore never fire. **Say so explicitly rather than
leaving the table blank** — a blank table cannot be distinguished from an unrun survey, which is the
same failure mode CONTEXT.md's Runtime State Inventory guidance warns about.

The two authored-key classes that *would* have been fallout under a narrower allow-list, and their
dispositions, are worth recording as the table's content:

| Would-be fallout under | Key class | Rows | Disposition |
|---|---|---|---|
| 3-source allow-list (D-03 as written) | 10 RPC relationship refs | 2,955 occurrences | **NOT deleted** — add source (4). Deleting them would break every FK in every seeded dataset. |
| sentinels without bare forms | `elections.constituency_groups`, `constituency_groups.constituencies` | 76 | **NOT deleted** — B-4 corrected; they are read at `:398` / `:451`. |
| full `skip_columns` deny-list | `project_id` | 1,481 | **NOT deleted** — the RPC re-supplies it; generators are correct to emit it. |

**B-14 re-verified.** `grep -n "_constituencies:\|_elections:\|_constituencyGroups:" packages/dev-seed/src/templates/e2e/base.ts`
returns 11 lines, of which **3 are doc-comment lines** (`:60`, `:63`, `:68`) and 8 are authored rows:
`_elections` at `:628`, `:785` (**2**) and `_constituencies` at `:636`, `:796`, `:807`, `:980`,
`:993`, `:1006` (**6**). **CONTEXT.md's "6 × `_constituencies`, 2 × `_elections`" is exact** — a raw
`grep -c` returns 8/3 and would have been a false correction. `e2e/base.ts` is the only template file
containing any of the three sentinel names.

## R7.4 Two *unread-key* defects the survey surfaced that the fallout table does not cover

These are not template fields lost to the tightening; they are pipeline inconsistencies the derivation
closes (R2.4). Record them in the phase's residue section, with the measured zero-exploitation:

| # | Defect | Measured in-tree exploitation |
|---|---|---|
| 1 | `elections._constituency_groups` is read by `linkJoinTables:394` but **not** recognised by `hasDeclaredScope` (`pipeline.ts:240`), so an author's explicit scoping is overwritten by full fanout | 0 templates author it |
| 2 | `question_categories.elections` (bare) suppresses the fanout via `hasDeclaredScope` (`pipeline.ts:252`) but is read by **nothing** | 0 templates author it |

---

# R8 — Negative-control fixtures (D-08) and the ledger

## R8.1 How a `--template ./custom.ts` run works end to end

Path: `yarn db:seed --template ./x.ts` → `yarn workspace @openvaa/dev-seed seed`
(`package.json:20`) → `tsx src/cli/seed.ts` (`packages/dev-seed/package.json:19`).

1. `cli/seed.ts:47-51` loads the **repo-root `.env`** via `process.loadEnvFile`, and `:55-57` falls
   back `SUPABASE_URL ← PUBLIC_SUPABASE_URL`.
2. `:80-81` `loadBuiltIns()` then `resolveTemplate(templateArg, builtIns.templates)`.
3. `resolve-template.ts:42-47`: `isPath('./x.ts')` → true → `resolve(arg)` **against `process.cwd()`**
   → `loadModuleTemplate` → `await import(pathToFileURL(abs).href)` → `mod.default ?? mod.template` →
   **`validateTemplate(candidate)` at `:111`**.
4. `:104` `new Writer()` — **throws** unless `SUPABASE_URL` **and** `SUPABASE_SERVICE_ROLE_KEY` are set
   (`writer.ts:93-105`).
5. `:114-115` `runPipeline(template, overrides)` then `fanOutLocales`.
6. `:123-126` `writer.write(rows, prefix)` → `bulkImport` → `importAnswers` → `linkJoinTables` →
   portraits → `updateAppSettings`. **All five hit the network.**

**⚠ cwd gotcha, measured:** `yarn workspace @openvaa/dev-seed exec pwd` →
`/Users/…/voting-advice-application-gsd/packages/dev-seed`. So `--template ./x.ts` resolves relative
to **`packages/dev-seed/`**, not the repo root, even when the command is typed at the root. **Use an
absolute path in the fixture invocation**, or place the fixture at
`packages/dev-seed/tests/fixtures/negctl-*.ts` and pass `./tests/fixtures/negctl-*.ts`. Record whichever
form the plan chooses, verbatim, in the ledger's command column.

## R8.2 Does the OLD half need a live Supabase? Yes.

Criterion 2 requires the pre-change run to **complete successfully and silently drop the key**.
"Completes successfully" is `process.exit(0)` after `writer.write` returns, and `writer.write` performs
five real RPC round-trips. There is no dry-run flag and no `--no-write` path. So:

**Cheapest honest procedure — three tiers, all of which the phase owes.**

| Tier | What it proves | Infrastructure |
|---|---|---|
| **T1 — pure unit** (`assertKnownRowProps` called directly on a fixture dataset) | The guard throws / does not throw, with the exact message | none — `yarn test:unit`, no DB |
| **T2 — mocked Writer** (`writer.test.ts` style, `vi.mock('../src/supabaseAdminClient')`) | Pass 0 is wired into `Writer.write()` at the right point and fires before `bulkImport` | none — no DB |
| **T3 — live CLI, `--template ./custom.ts`** | **Criterion 2 as written**: the run completes / throws on the real entry path | **live local Supabase** |

**T3 procedure, both halves.** Local Supabase is confirmed running at this HEAD (`yarn db:status`
returns a full service table at `http://127.0.0.1:54321`), so this is feasible today.

```bash
# once, before either half
yarn db:reset                      # clean DB; the OLD half writes rows

# OLD half (untouched tree, plan 01) — expect exit 0 and a silent drop
yarn db:seed --template "$PWD/packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts"; echo "exit=$?"
#   → exit 0, summary printed
#   → proof of the DROP, not just of the exit code: query the DB.
#     class (1): the join table must be empty for that election —
#       select count(*) from election_constituency_groups ecg
#         join elections e on e.id = ecg.election_id
#        where e.external_id = 'negctl-el-1';                      -- expect 0
#     class (2): the questions row's `answers`-adjacent effect is absent —
#       select answers from candidates where external_id = '…';    -- unchanged
yarn db:seed:teardown              # remove the fixture's rows before the next half

# NEW half (post-change) — expect exit 1 and the three-part message
yarn db:seed --template "$PWD/packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts"; echo "exit=$?"
#   → exit 1, stderr: Error: assertKnownRowProps: unknown property '_constituencies' on collection
#     'elections' (row external_id: 'negctl-el-1'). …
```

**A crucial detail for the OLD half of class (1).** `_constituencies` on an `elections` row is
stripped by `key.startsWith('_')` (`supabaseAdminClient.ts:180`) — but `attachSentinels`
(`pipeline.ts:238-243`) will *also* attach a full-fanout `_constituencyGroups` to that same row unless
the fixture declares scope. **If the fixture's only election has no constituency groups in the
dataset, `allGroupExtIds.length === 0` and no fanout happens**, so the join table stays empty and the
drop is cleanly observable. Design the fixture that way: one election, one constituency, **no
constituency_groups**, `_constituencies` on the election. Otherwise the fanout writes join rows and
muddies the "silently dropped" evidence.

For class (2) — `answersByExternalId` on a `questions` row — the drop is observable as: the run
completes, and `importAnswers` (`supabaseAdminClient.ts:246-257`) never reads `data.questions`, so no
`answers` JSONB is written anywhere. Assert `select answers from questions where external_id = …` is
`null` **and** that the run's summary reports the question row as created.

**Use each fixture's own `externalIdPrefix`** (e.g. `negctl144-`) so `yarn db:seed:teardown` and the
Playwright teardown prefixes cannot collide — the ASSERT-10 duplicate-prefix guard
(`tests/playwright.config.ts`) is prefix-sensitive and a shared prefix is a known race
(REQUIREMENTS ASSERT-10 provenance).

## R8.3 The `144-NEGATIVE-CONTROL-LEDGER.md` row schema

Modelled on `143-NEGATIVE-CONTROL-LEDGER.md:249-261`, which uses **nine columns** and the standing rule
that "any extra sub-fact goes *inside* an existing cell, never as an unannounced tenth column." Phase
144's instrument set is wider than 143's (lint only) — it spans `tsc`, `vitest`, the seed CLI and
turbo — so the `Command` and `turbo verdict` columns need a small generalisation:

```
| Row | Site | Injection / fixture | Instrument + command | HEAD | Cache verdict | Exit | Assertion outcome | Outcome |
```

- **`Instrument + command`** — one of `tsc` / `vitest` / `seed-cli` / `turbo`, then the verbatim
  command. 143 folded the instrument into the command; naming it makes the four-instrument register
  readable.
- **`Cache verdict`** — `cache bypass, force executing <hash>` for every turbo-mediated row (the
  measured string, stronger than `cache miss, executing`); `n/a — direct tsc` or `n/a — vitest` or
  `n/a — seed CLI` for the rest. **A turbo-mediated row that cannot show `executing` is void and must
  be re-run** — 143's rule, inherited verbatim.
- **`Assertion outcome`** — the diagnostic code / test count / thrown message, not just the exit code.
  143's analog was `Errors`, which counted lint errors specifically; here it holds `TS2353`,
  `1 failed | 29 passed`, or the first 80 chars of the thrown message.
- **`Outcome`** — `GREEN (blind)` / `RED (catch)` / `GREEN (catch)` for the inverted pairs, plus the
  restore assertions where a row carries them.

Header fields to carry over from 143 verbatim in spirit: phase, requirement, opened-by plan, corpus
count, protocol source, baseline-for-OLD-halves statement, HEAD at ledger creation, machine +
resolved `$TMPDIR`, restoration blob hashes (pre- and post-change, for `tsconfig.json`,
`supabaseAdminClient.ts`, `pipeline.ts`, `schema.ts`, `package.json`, `main.yaml`), decisions
discharged, precedent chain (**append**: `144 → 143 → 142.1 → 142 → 141 → 138 → 137 → 136`), and a
⚠ THE INVERSION section.

## R8.4 Every OLD/NEW half this phase owes — the full enumeration

| # | Row ID | Owed by | OLD (blind) half | NEW (catching) half |
|---|---|---|---|---|
| 1 | `T1` | D-01 primary exemplar | `elections._constituencies` compiles clean under today's `Template` — **measured this session, exit 0** | `TURBO_FORCE=true yarn typecheck` → `TS2353 … 'ElectionsFixedRow'` |
| 2 | `T2` | D-01 secondary exemplar | `candidates._elections` compiles clean under today's `Template` | → `TS2353 … 'CandidatesFixedRow'` |
| 3 | `G` | Truth #2 / D-06 | narrow tsconfig blind to a deliberate `tests/` error — **measured this session, exit 0** | widened tsconfig + `TURBO_FORCE=true turbo run typecheck` → exit 1 |
| 4 | `X` | D-06 `@ts-expect-error` control | fixture present → gate green (**measured: 0 diagnostics**) | offending row deleted → `TS2578` (**measured**) |
| 5 | `R1` | D-08 class (1) | `--template ./custom.ts` with `elections._constituencies` → exit 0, join table empty | → exit 1, message names `_constituencies` + `negctl-el-1` + `elections` |
| 6 | `R2` | D-08 class (2) | `--template ./custom.ts` with `questions.answersByExternalId` → exit 0, `answers` null | → exit 1, three-part message |
| 7 | `Z1` | D-05 site `template.test.ts:46` | remove `seed`/`externalIdPrefix`/`projectId` from the schema → test still **passes** (blind) | with `.strict()` → test **fails** |
| 8 | `Z2` | D-05 site `template.test.ts:56` | remove `fixed` from `perEntityFragment` → test still passes (blind) | with `perEntityFragment.strict()` → fails |
| 9 | `Z3` | D-05 site `template.test.ts:74` | remove one of the 12 entity slots → test still passes (blind) | with `.strict()` → fails |
| 10 | `Z4` | D-05 site `latent.schema.test.ts:35` | remove `latent` from the schema → test still passes (blind) | with `.strict()` → fails |
| 11 | `DRV` | D-03 / criterion 4 | parallel-list shape: add `elections/_constituencies` to a hand list → derivation test **green** | const-driven: same addition → derivation test **red** |
| 12 | `K` | D-03a | allow-list keyed pre-resolution → `questionCategories` case **RED** *(inverted pair)* | resolved keying → case **GREEN**, unknown-collection case red-when-injected |
| 13 | `DENY` | D-09 | `entity_type` on a `questions` row seeds, column stays `null` | → exit 1, deny message |
| 14 | `V` | D-07 | unknown top-level key injected into a built-in → seed run completes (built-ins unvalidated) | → `Template validation failed: template: Unrecognized key: "…"` |

**Totals: 14 OLD/NEW pairs = 28 measured halves.** (CONTEXT.md § What-Must-Be-TRUE mandates 13 of
them; row `X` is the *gated* form of rows `T1`/`T2` and is separated here because it is measured with a
different instrument and is what Truth #2 actually names.)

Plus the **non-pair rows**, following 143's register conventions:

| Row ID | Kind | Content |
|---|---|---|
| `L` | must-NOT-fire / D-01 legality | `questions._elections` compiles clean under the NEW types **and** `planLinks` emits one entry for it |
| `NC` | must-NOT-fire | all 30 built-ins' pipeline output passes `assertKnownRowProps` — **0 throws, 1,481 rows** |
| `A` | clean baseline | `TURBO_FORCE=true npx turbo run typecheck` → 22/22, 0 cached (**measured: 19.267 s at `ee58a4be7`**) |
| `AF` | already-failable | `latent.schema.test.ts:39` re-measured as already-failable, **not** claimed as a fix |
| `NA` | scoped exception | `latent.schema.test.ts:31`, `N/A — by construction`, converted to `expect(validateTemplate({})).toEqual({})` |
| `F` | fallout measurement | the R7 zero, with the four alternative compositions and their costs |
| `P` | pre-existing errors | the 3 tsconfig-widening errors, before → after |
| `C` | restore proof | blob hashes + `git status` + `git diff` + untracked-fixture `find`, in **both** glob forms |
| `Z` | closing revert | tree back to `A` at phase close |

**Register total: 28 half-rows + 9 non-pair rows = 37 rows.** (Under a pair-per-row schema instead:
14 + 9 = **23 rows**. State whichever the plan chooses and assert the count in the ledger's own
completeness table, as 143 did at `:984-992`.)

## R8.5 The D-05 corpus, re-measured

| Site (assertion line) | `it(` line | Status today | Under criterion 3 |
|---|---|---|---|
| `tests/template.test.ts:46` | `:39` — `accepts valid top-level fields (seed, externalIdPrefix, projectId)` | blind | **→ failable** via `TemplateSchema.strict()` |
| `tests/template.test.ts:56` | `:49` — `accepts nested fixed[] with arbitrary partial row shapes` | blind | **→ failable only if `perEntityFragment` is strict too** (probe C) |
| `tests/template.test.ts:74` | `:59` — `accepts per-entity fragment for every expected key (12 …)` | blind | **→ failable** via `.strict()` |
| `tests/template/latent.schema.test.ts:35` | `:34` — `accepts empty latent block` | blind | **→ failable** via `.strict()` |
| `tests/template/latent.schema.test.ts:39` | `:38` — `accepts matching dimensions + eigenvalues` | **already failable** — `latentBlock` is `.strict()` at `schema.ts:64` | already green; re-measured, not "fixed" |
| `tests/template/latent.schema.test.ts:31` | `:30` — `accepts an empty template (regression)` | **unfailable by construction** — `validateTemplate({})` | **scoped exception**; round-trip repair |

**4 + 1 + 1, confirmed.** The round-trip repair form already exists in-tree at `template.test.ts:24`
(`expect(validateTemplate({})).toEqual({});`) — CONTEXT.md cites `:23-24`; the round-trip assertion is
specifically **`:24`**, with `:23` being the `.not.toThrow()` it complements.

## R8.6 The zod probes, re-run at zod 4.3.6

`node -e "require('zod/package.json').version"` → **4.3.6**. All five reproduce CONTEXT.md exactly:

| Probe | Question | Measured |
|---|---|---|
| A | `.strict()` **before** `.extend()` | `A.safeParse({bogus: 1}).success` → **false** (rejected) |
| B | `.extend()` then `.strict()` | → **false** (rejected) |
| C | Does top-level `.strict()` reach `perEntityFragment`? | → **`success: true`**, and the parsed data is `{"candidates":{"fixed":[{"external_id":"x"}]}}` — **`bogus` silently stripped** |
| D | Strict fragment + nested unknown | → rejected; issue path **`["candidates"]`**, message `Unrecognized key: "bogus"` |
| E | Strict fragment, arbitrary key **inside** a `fixed[]` row | → **accepted** — correct per D-04 |
| F (extra) | Does `.strict()`-then-`.extend()` still accept the extended field? | `A.safeParse({latent:{dimensions:2}}).success` → **true** |

Probe D's issue path matters for the executor's assertion regex: `validateTemplate`'s formatter
(`schema.ts:146`) produces `  template.candidates: Unrecognized key: "bogus"`, so the test regex is
`/template\.candidates:.*Unrecognized key.*"bogus"/` — the same shape already used at
`latent.schema.test.ts:58-60`.

## R8.7 ⚠ D-04 + D-07 fallout is zero — measured against all 30 built-ins

I rebuilt `TemplateSchema` with `.strict()` on **both** objects exactly as D-04 specifies, and validated
every registered built-in:

```
strict validation: 30 pass / 0 fail of 30
```

No built-in carries an unknown top-level key or an unknown fragment key. **D-07's change to
`resolve-template.ts:59` therefore costs zero runtime fallout** — every `perm-*`, `default` and
`e2e/base` will pass `validateTemplate` on the first seed after the change. This is the single biggest
de-risking measurement for the ASSERT-04 half of the phase, and it means D-07 can land in the same
plan as D-04 without a separate fallout budget.

`cli/resolve-template.ts` re-measured: the false doc comment is at **`:16`** (`* - Every resolved
template runs through `validateTemplate()` before return.`), the unvalidated return at **`:59`**
(`return builtIn;`), and the two validating paths at **`:88`** (`return validateTemplate(raw);`) and
**`:111`** (`return validateTemplate(candidate);`). **B-12 exact.**

---

# R9 — Plan decomposition

Granularity is `fine` (`.planning/config.json`). Three constraints shape the cut:

1. **The commit-graph constraint.** The standing acceptance rule (`REQUIREMENTS.md:7-13`) requires OLD
   (blind) halves measured on the untouched tree, and Phase 143's SC-2 made the ordering a *property
   of the commit graph* — `143-01` Task 1's commit precedes every injection. That forces all
   ledger-opening and all 14 OLD halves into **plan 01**, and forbids plan 01 from touching any
   product byte.
2. **The one-HEAD gate constraint.** The seven gates run at one HEAD at phase close, E2E last, under
   the dev-server + `db:reset` prereq. That forces a dedicated closing plan.
3. **The record-flip constraint.** Checkboxes and record corrections flip **after** the gates
   (142.1-02 reverted a premature tick; ASSERT-07's early flip is the avoided pattern). Same plan as
   the gates, after them.

## Recommended breakdown — 7 plans

| # | Goal (one line) | Depends on | Owns (ledger halves / rows) |
|---|---|---|---|
| **144-01** | Open `144-NEGATIVE-CONTROL-LEDGER.md` with all rows `pending`; measure **every OLD (blind) half** on the untouched tree; take the fallout inventory, the 3 pre-existing tsconfig errors, and every record-target line number at this HEAD | — | **All 14 OLD halves** (`T1`,`T2`,`G`,`X`-old,`R1`,`R2`,`Z1`–`Z4`,`DRV`,`K`,`DENY`,`V`) + rows `A`, `F`, `P` |
| **144-02** | Land the derived declaration + the type layer: `permittedKeys.ts` (4 sources + exclusion table), `linkSentinels.ts`, 12 named `XFixedRow` aliases, `Template` rewired, `COLLECTION_NON_COLUMNS`/`NON_COLUMN_FIELDS` **moved** and imported back by `bulkImport`; widen `tsconfig.json`, drop `rootDir`, fix the 3 pre-existing errors | 01 | `T1`-NEW, `T2`-NEW, row `L` (D-01 legality, type half) |
| **144-03** | Make `linkJoinTables` iterate `LINK_SENTINELS` (extract pure `planLinks`, `executePlan` with the `never` arm); make `attachSentinels`/`hasDeclaredScope` consume `rule.keys`; land the hand-enumerated derivation spec | 02 | `DRV`-NEW, row `L` (plan half), the two R7.4 residue rows |
| **144-04** | Land Pass 0: pure `assertKnownRowProps`, called at `writer.ts:158` on the pre-deletion `data`; the deny-list (`entity_type` only) + the documented exclusion table; unit + mocked-writer specs incl. the D-03a keying cases | 02, 03 | `R1`-NEW, `R2`-NEW, `K`-NEW, `DENY`-NEW, row `NC` |
| **144-05** | Land the zod layer: `.strict()` on `TemplateSchema` **and** `perEntityFragment`; `resolveTemplate` validates built-ins; correct `resolve-template.ts:16`; convert `latent.schema.test.ts:31` to the round-trip form | 02 | `Z1`–`Z4`-NEW, `V`-NEW, rows `AF`, `NA` |
| **144-06** | Wire the gate: root `yarn typecheck` chained into `lint:check`, the named CI step in `main.yaml`, the `@ts-expect-error` type-test fixture; run the D-06 two-run control with `TURBO_FORCE=true` | 02, 05 | `G`-NEW, `X`-NEW |
| **144-07** | Seven gates at one HEAD (E2E last, under the dev-server + `db:reset` prereq); the empty-with-discharge fallout table; six record corrections (R-1…R-6) citing `4aeae0ace` per D-01a; ledger completion with counts derived once; REQUIREMENTS evidence clauses; **checkbox flips after the gates**; residue todos | 01–06 | Rows `C`, `Z`; the gate section |

## Dependency edges, with the reason for each

| Edge | Strictly serial? | Reason |
|---|---|---|
| 01 → 02 | **Yes** | The commit that changes behaviour must not precede the commit that records the blind halves. Structural, not stylistic. |
| 02 → 03 | **Yes** | 03 imports `LINK_SENTINELS` and `CollectionKey` from 02's module; without 02 there is nothing to iterate. |
| 02 → 04 | **Yes** | Pass 0 consumes `permittedKeys()`. |
| 03 → 04 | **Yes** | The **final** sentinel key set (including the bare forms and the `attachSentinels` reconciliation) must be settled before the guard asserts against it; otherwise 04's `NC` row measures a set 03 then changes, and the row is void. |
| 02 → 05 | **Yes** | 05's `.strict()` interacts with how `Template` is derived (R1.4 option A vs B). If 02 stops using `z.infer`, 05's conformance assertion must target 02's shape. |
| 02 → 06 | **Yes** | The gate cannot go green until the 3 pre-existing errors are fixed and the tsconfig is widened (both in 02). |
| 05 → 06 | **Soft** | Only so `lint:check`'s new chain link is never observed red mid-phase. Could be dropped if 06 lands the script edit last. |
| 01–06 → 07 | **Yes** | One HEAD, gates last, flips after gates. |

**Parallelisable:** **03 ∥ 05** — disjoint file sets (`supabaseAdminClient.ts` + `pipeline.ts` vs
`template/schema.ts` + `cli/resolve-template.ts` + the two spec files), both depending only on 02.
That is the only genuine parallel edge. **04 cannot join them** (it depends on 03), and **06 should
not** (soft edge above).

**Recommendation: run 03 ∥ 05, everything else serial.** Two cautions. First, both write to
`144-NEGATIVE-CONTROL-LEDGER.md`, and the known failure mode in this repo is parallel agents clobbering
uncommitted shared `.planning` docs — give each an explicitly disjoint row block and have 07 derive the
counts once. Second, 143 chose *fully serial* waves and its D-03 made the ordering structural; if the
executor has any doubt, serial is the precedent and costs one wave.

---

## Project Constraints (from CLAUDE.md)

| Directive | Bearing on this phase |
|---|---|
| **E2E Hard Rule — failing E2E is a CARDINAL FAILURE.** No known-flaky exemptions; "did not run" counts as a failure. Prefer running the **whole** suite. | Pass 0 executes inside every E2E setup project via `setupFromTemplate.ts:208`. A single false positive fails the suite. The R7 zero-fallout measurement is what makes the gate survivable — verify it in-plan, do not trust it. |
| **E2E preflight** — aborts unless the served app proves it came from this checkout; no skip flag. `FRONTEND_PORT` is the only escape hatch. | One fresh dev server on `:5173`, started and stopped by the closing plan. |
| **Use TypeScript strictly — avoid `any`, prefer explicit types.** | The three tsconfig fixes must be real fixes, not `as unknown as` (R4.3 gives a real fix for each). `permittedKeys` must not use `any`. |
| **Never commit sensitive data.** | The D-08 fixtures carry no credentials; `SUPABASE_SERVICE_ROLE_KEY` stays in the root `.env`. |
| **Localization** — user-facing strings support multiple locales. | Not applicable: `assertKnownRowProps` messages are developer-facing CLI output, same class as the existing `bulkImport failed:` strings. |
| **Code Review Checklist** (`.agents/code-review-checklist.md`) | Run at phase close per the standing convention. |
| **Turbo caching** (CONTEXT.md § Constraints) | `yarn lint:check --force` is **forbidden** — yarn appends the argument past the `&&` chain. Use `TURBO_FORCE=true yarn lint:check`. |

---

## Validation Architecture

`.planning/config.json` has no `workflow.nyquist_validation` key → treated as **enabled**.

### Test Framework

| Property | Value |
|---|---|
| Framework | `vitest` **3.2.4** (root workspace file discovers `packages/dev-seed/vitest.config.ts`, which is an intentional empty stub) |
| Config file | `packages/dev-seed/vitest.config.ts` (empty export; discovery lives in the root `vitest.workspace.ts`) |
| Typecheck | `tsc` **5.9.3** via `packages/dev-seed/tsconfig.json`, extending `@openvaa/shared-config/ts` |
| Quick run command | `yarn workspace @openvaa/dev-seed test:unit` |
| Full suite command | `yarn test:unit` (runs `yarn assert:unit-coverage` then `turbo run test:unit`) |
| Typecheck gate | `TURBO_FORCE=true npx turbo run typecheck` (22 tasks; **not** in any gate today — D-06 adds it) |

### Phase Requirements → Test Map

| Req | Behaviour | Type | Automated command | Exists? |
|---|---|---|---|---|
| TMPL-01 | `elections._constituencies` / `candidates._elections` are type errors; `questions._elections` is not | typecheck (`@ts-expect-error` + a clean case) | `TURBO_FORCE=true npx turbo run typecheck` | ❌ Wave 0 — `tests/template/strictRowTypes.type-test.ts` |
| TMPL-01 | Every legal field casing is admitted (`firstName` yes, `sortOrder` no) | unit | `yarn workspace @openvaa/dev-seed test:unit tests/template/permittedKeys.test.ts` | ❌ Wave 0 |
| TMPL-02 | Unknown row prop throws with external_id + key + collection | unit (pure) | `… test:unit tests/assertKnownRowProps.test.ts` | ❌ Wave 0 |
| TMPL-02 | Pass 0 is wired ahead of `bulkImport` | unit (mocked writer) | `… test:unit tests/writer.test.ts` | ✅ file exists; new cases needed |
| TMPL-02 | All 30 built-ins pass the guard (must-NOT-fire) | unit | `… test:unit tests/assertKnownRowProps.builtins.test.ts` | ❌ Wave 0 |
| TMPL-02 | Criterion 2 on the real `--template ./custom.ts` entry path | manual, DB-backed | `yarn db:seed --template "$PWD/…"` | ❌ Wave 0 fixtures; **manual-only — the CLI writes to a live DB and there is no dry-run flag** |
| criterion 4 | `planLinks` dispatches exactly the hand-enumerated pairs | unit (pure) | `… test:unit tests/template/linkSentinels.test.ts` | ❌ Wave 0 |
| D-03a | Both collection keyings resolve to one entry | unit | `… test:unit tests/assertKnownRowProps.test.ts` | ❌ Wave 0 |
| ASSERT-04 | 4 blind sites fail on schema-field removal | unit (two-run, injected) | `… test:unit tests/template.test.ts tests/template/latent.schema.test.ts` | ✅ files exist; both directions must be *observed*, per site |
| ASSERT-04 | All 30 built-ins pass the strict schema | unit | `… test:unit tests/cli/resolve-template.test.ts` (extend) | ✅ file exists |

### Sampling Rate

- **Per task commit:** `yarn workspace @openvaa/dev-seed test:unit` (fast, no DB) **+**
  `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` once 144-02 lands.
- **Per wave merge:** `yarn test:unit` + `TURBO_FORCE=true yarn lint:check`.
- **Phase gate (144-07, one HEAD, in order):** `yarn test:unit` · `TURBO_FORCE=true yarn lint:check` ·
  `yarn format:check` · `yarn build` · `yarn workspace @openvaa/frontend check` ·
  `TURBO_FORCE=true turbo run typecheck` · `yarn test:e2e` (0 failed / 0 flaky / 0 skipped / 0 "did
  not run"), after `yarn db:reset` against exactly one fresh dev server.

### Wave 0 Gaps

- [ ] `packages/dev-seed/tests/template/permittedKeys.test.ts` — TMPL-01 derivation + casing
- [ ] `packages/dev-seed/tests/template/strictRowTypes.type-test.ts` — the `@ts-expect-error` control + the D-01 legality case
- [ ] `packages/dev-seed/tests/template/linkSentinels.test.ts` — criterion 4 derivation, hand-enumerated
- [ ] `packages/dev-seed/tests/assertKnownRowProps.test.ts` — TMPL-02 + D-03a keying + deny-list
- [ ] `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` — the 30-template must-NOT-fire control
- [ ] `packages/dev-seed/tests/fixtures/negctl-elections-sentinel.ts` and `negctl-questions-answers.ts` — D-08 fixtures
- [ ] `packages/dev-seed/tests/fixtures/negctl-questions-entity-type.ts` — D-09 fixture
- [ ] No framework install needed. **`packages/dev-seed/package.json:14`'s lint script is `eslint … src/`** — the new `tests/` specs are unlinted, the same class of gap as Phase 143's D-08; file as residue.

---

## Security Domain

`security_enforcement` is absent from `.planning/config.json` → enabled.

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---|---|---|
| V2 Authentication | no | dev-tooling only; the seed CLI uses the local service_role key from `.env` |
| V3 Session Management | no | — |
| V4 Access Control | no | `bulk_import` is `SECURITY INVOKER` and the CLI runs as service_role by construction |
| **V5 Input Validation** | **yes** | This phase *is* a V5 control: zod `.strict()` at the template boundary + a per-collection allow-list at the row boundary. |
| V6 Cryptography | no | — |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation | Status here |
|---|---|---|---|
| **SQL injection via dynamically built column names** | Tampering | The RPC builds `col_names` from `jsonb_each(p_item)` keys and interpolates them into `sql_text` (`501-bulk-operations.sql:170,175`). Values go through `quote_literal`; **keys do not**. | ⚠ **Pre-existing.** An unknown key today reaches Postgres as an identifier. The RPC is service_role-only and the input is a developer-authored template, so the trust model matches `tsx` itself (`resolve-template.ts:19-23`). **This phase narrows that surface substantially** — Pass 0 rejects any key not on a derived allow-list *before* it reaches the RPC. Worth stating as a security benefit of TMPL-02; **not** worth expanding scope to fix the RPC. File as residue. |
| Arbitrary code execution via `--template ./x.ts` | Tampering | Documented and accepted (`resolve-template.ts:19-23`) — same trust model as `tsx`. | unchanged |
| Silent data loss (dropped fields) | Repudiation | The whole phase. | closed by TMPL-01/02 |

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|---|---|---|
| A1 | Throwing on the **first** offence (rather than aggregating) matches house style | R5.4 | Cosmetic; an aggregate report may be preferred. Planner should state the choice. |
| A2 | `created_at` / `updated_at` are safe to exclude from the throwing deny-list | R6.2 | Low — 0 rows emit them; a template setting one gets a DB-overridden value rather than an error. |
| A3 | The migration copy and the schema copy of the `relationships` `CASE` block cannot drift | R1.5 | Medium — I verified only that the two `skip_columns` arrays are byte-identical, not the full `CASE` blocks. **Diff them in-plan.** |
| A4 | `nominations.faction` (declared by the RPC, 0 in-tree rows) should be admitted anyway | R1.5 | Low — admitting it costs nothing; omitting it would break any future template that uses factions. |
| A5 | The D-08 class-(1) fixture can observe the drop cleanly by omitting `constituency_groups` so `attachSentinels` cannot fan out | R8.2 | Medium — if the fanout does fire, the join table is non-empty and the "silently dropped" evidence is muddied. **Verify the fixture's row counts before recording the OLD half.** |

---

## § Corrections to CONTEXT.md

**This section is not empty.** Seven items did not survive re-measurement; two of them are
substantive enough to change the implementation.

### ⚠ SUBSTANTIVE — these change what gets built

| # | CONTEXT.md says | Measured at `ee58a4be7` | Consequence |
|---|---|---|---|
| **C-1** | **D-03**: "The permitted key set per collection is the union of **three** derived sources" (columns / sentinels / non-column fields) | There is a **fourth**, unnamed source: the `_bulk_upsert_record` RPC's per-table **relationship reference map** (`501-bulk-operations.sql:113-136`) — 10 `(collection, key)` pairs, present on **2,955 key occurrences** across the 30 built-ins' 1,481 rows | A three-source allow-list throws on every `nominations`, `candidates.organization`, `questions.category` and `constituencies.parent` row → **every E2E setup project fails** → cardinal failure. **The plan must add source (4).** |
| **C-2** | **B-4**: the permitted `(collection, sentinel)` set is the six `_`-prefixed pairs | `linkJoinTables` **also reads two bare, non-underscore forms** — `elections.{constituencyGroups,constituency_groups}` at `:397-398` and `constituency_groups.constituencies` at `:451` — which are used by **41 + 35 = 76 rows**, i.e. every hand-authored election / cg row in `e2e/base` and all 28 `perm-*` | ⚠ **This cell read "12 pairs" and that was wrong** — it contradicted this row's own enumeration and R2.2's table. Re-derived at HEAD `83a375e1c`: **10** distinct `(collection, key)` pairs = 7 `_`-prefixed + 3 bare, under D-03a's canonical resolved-table keying. Omitting the bare forms still breaks 76 rows and moves them out of `LINK_SENTINELS`' authority, defeating criterion 4. |
| **C-3** | **D-09**: "A small per-collection deny-list … seeded with the RPC's `skip_columns`" | `skip_columns` is `'id','created_at','updated_at','project_id','entity_type'` — and **every generator emits `project_id` on all 1,481 rows** (the RPC drops the payload copy and re-supplies its own at `:96-97`); `id` appears in two `writer.test.ts` fixtures | Seeding the deny-list literally rejects **every row in the repo**. Only `entity_type` can be denied at zero cost. The other four need a documented, non-throwing exclusion table. |
| **C-4** | **D-03a**: "Pass 0 (D-02) runs on the **template's collection key**, pre-resolution — and the two differ (`questionCategories` vs `question_categories`)" | From every in-tree path they do **not** differ: `TemplateSchema:117-128` declares snake_case only, `TOPO_ORDER` (`pipeline.ts:76-91`) is snake_case only, and `runPipeline` writes `output[table]` for `table of TOPO_ORDER`. The camel form reaches `Writer.write` only from a **direct external caller** — a shape `linkJoinTables` supports at `:443` and `:503` | The hazard is real but its *mechanism* is different. **The keying-confusion test must still exist** (R3.3 gives one that genuinely fails), and the guard must **throw on an unrecognised collection** rather than silently permit — otherwise the confusion is invisible. The genuine field-level analogue is `PROPERTY_MAP`'s `organizationId → organization_id_nom` collision (R1.3). |

### ⚠ CITATION — line numbers and paths that moved or were never right

| # | CONTEXT.md says | Measured | Note |
|---|---|---|---|
| C-5 | **D-09**: the RPC's list is at `apps/supabase/migrations/…501-bulk-operations.sql` | **`apps/supabase/supabase/schema/501-bulk-operations.sql:108-111`** (doubled `supabase/`). `ls apps/supabase/migrations/` → *No such file or directory*. Applied copy at `apps/supabase/supabase/migrations/00001_initial_schema.sql:2615-2617` | CONTEXT.md deliberately withheld the line number; it did not withhold the path, and the path is wrong. |
| C-6 | **B-3**: `linkJoinTables` spans `:387-597`; sites at `:389-397`, `:442-450`, `:506-543`, `:551-597` | Span is **`:387-592`**. Sites: **`:389-441`** (key reads `:393-398`), **`:443-497`** (key reads `:446-451`), **`:506-543`** (exact ✅), **`:550-591`** | Four of five ranges are off by 1–6 lines. `:543` (B-1) is exact. |
| C-7 | **R-1**: `.planning/ROADMAP.md:665` + `:667-671` | Criterion 1 is at **`:666`**; the five criteria are **`:666-670`**; `**Plans**: TBD` is **`:672`**. `:665` is blank | R-2 (`REQUIREMENTS.md:57`), R-3 (`:149,157,158,179`), R-4 (audit `:46` and `:665`), R-6 (`resolve-template.ts:16`) are all **exact**. |
| C-8 | **B-18**: `typecheck:tests` is `tsc -p tests/tsconfig.json` | `"typecheck:tests": "node_modules/.bin/tsc -p tests/tsconfig.json --noEmit"` (`package.json:34`) | Paraphrase, not error. Reproduce verbatim in the plan. |
| C-9 | Deferred ideas: "the **10** other packages" / "**11** packages beyond dev-seed" | **12** packages define `typecheck`; **11** beyond dev-seed | B-15 already says 12; the deferred-idea line in § Deferred Ideas says 11 and the D-06 option-B line says 10. **11 is correct.** |

### ✅ SURVIVED re-measurement, verbatim

B-1 (`:543`), B-2 (todo dated 2026-05-31), B-5, B-6 (`4aeae0ace`'s real subject is
``feat(data): promote `required` to first-class Question field + wire consumers`` — `git log -1
--format=%s 4aeae0ace`, dated **2026-06-01**), B-7 (`:180`), B-8 (`:140`, `:246`), B-9 (`:141-146`,
`:178`) — note `extraStrip` is assigned at **`:169`** and *used* at `:180`, and CONTEXT.md's `:178` is
the neighbouring `hasCandidateRef` line, B-10, B-11 (`writer.ts:140`, `:159-160`), B-12 (`:16`, `:59`,
`:88`, `:111`), B-13 (**30** built-ins), B-14 (**6 × `_constituencies`, 2 × `_elections`** in
`e2e/base.ts` — a raw `grep -c` returns 8/3 because three hits are doc comments; **39** template
files, **128** `fixed:` sites), B-15 (**12**), B-16 (`turbo.json:18-22`, no `"cache": false`), B-17
(**22/22, 0 cached, 19.267 s**), B-19 (`main.yaml:60-79`, no typecheck), B-20 (`include:
["src/**/*"]`, `rootDir: "./src"`, a deliberate `tests/` error exits **0**), B-21 (**exactly 3
errors, identical lines**), B-22 (`:126` still `async bulkImport`; `:365` stale → `:387`;
`templates/baseV1.ts` gone, moved by `d783e81fc` — *`refactor(93-02): move baseV1→e2e/base, retire
e2e template, relocate perms to e2e/perm`*, 2026-06-03). All five zod probes (A–E) reproduce at zod
**4.3.6**. The D-05 corpus is **4 + 1 + 1**.

---

## § Recommended plan breakdown

Repeated here as the consumable list. Full dependency reasoning in R9.

1. **144-01 — Open the ledger; measure every OLD half on the untouched tree.**
   Edges: none inbound. Outbound: everything. *(Reason: the standing acceptance rule makes the
   ordering a property of the commit graph, per 143 SC-2.)*
   Owns: all 14 OLD halves + rows `A` (clean baseline), `F` (fallout inventory), `P` (3 pre-existing
   errors). **Writes zero product bytes.**

2. **144-02 — The derived declaration + the type layer (TMPL-01, D-03, D-03a-shared, D-06(i)).**
   Edges: `01 → 02` *(commit-graph)*.
   Owns: `T1`-NEW, `T2`-NEW, row `L` (type half).

3. **144-03 — `linkJoinTables` iterates `LINK_SENTINELS`; `attachSentinels` consumes the derived keys.**
   Edges: `02 → 03` *(imports the const)*.
   Owns: `DRV`-NEW, row `L` (plan half), the two R7.4 residue rows.

4. **144-04 — Pass 0 `assertKnownRowProps` + the deny-list (TMPL-02, D-02, D-09).**
   Edges: `02 → 04` *(consumes `permittedKeys`)*, `03 → 04` *(the final key set must be settled or row
   `NC` measures a set 03 then changes)*.
   Owns: `R1`-NEW, `R2`-NEW, `K`-NEW, `DENY`-NEW, row `NC`.

5. **144-05 — The zod layer (ASSERT-04, D-04, D-05, D-07, D-07a).**
   Edges: `02 → 05` *(the `Template` derivation decision)*. **Parallel with 03 and 04** — disjoint
   files.
   Owns: `Z1`–`Z4`-NEW, `V`-NEW, rows `AF`, `NA`.

6. **144-06 — The gate (D-06(ii), D-06b).**
   Edges: `02 → 06` *(the widened tsconfig must be clean first)*, `05 → 06` *(soft — so the new
   `lint:check` chain link is never observed red)*.
   Owns: `G`-NEW, `X`-NEW.

7. **144-07 — Gates at one HEAD, records, ledger completion, flips after the gates.**
   Edges: `01–06 → 07` *(one HEAD; E2E last; flips after)*.
   Owns: rows `C` (restore proof, both glob forms), `Z` (closing revert), the gate section.

**Parallel edge:** `03 ∥ 05` only. Give each a disjoint ledger row block; 07 derives every count once.

---

## § Open risks

1. **A false positive in Pass 0 is a cardinal E2E failure, not a unit-test failure.** Every E2E setup
   project seeds through `setupFromTemplate.ts:208` → `Writer.write`. The R7 measurement says the
   budget is zero, but it was taken against the built-in registry as it stands; a `perm-*` template
   edited between now and execution invalidates it. **Re-run the 30-template classification as the
   first task of 144-04**, and keep it as a standing spec (row `NC`).

2. **`writer.test.ts` calls `write()` about twenty times with hand-built fixtures**, including
   `accounts: [{ id: 'x' }]`, `projects: [{ id: 'y' }]`, `feedback: [{ rating: 5 }]` and
   `app_settings: [{ settings: {…} }]` — none with an `external_id`. If the deny-list includes `id`,
   or the guard requires `external_id`, twenty tests go red for the wrong reason and the executor will
   read it as a product defect.

3. **The EPC hole is not closable at the type layer.** `const row = {…}; fixed: [row]` bypasses excess
   property checking entirely (measured). `buildMinimal.ts` constructs the 28 `perm-*` templates'
   rows programmatically, so TMPL-01's guarantee genuinely does not reach them. **The runtime guard is
   the only cover there** — say so in the ledger rather than letting criterion 1's success imply more
   than it delivers.

4. **`planLinks` must preserve six measured behaviours** (R2.3) — `??` precedence, two payload
   normalisers, skip-on-malformed, skip-on-missing-parent-id, empty-array-is-a-no-op, and rule order.
   A rewrite that gets any of them wrong changes seeded data shape in a way `yarn test:unit` will not
   see and only the E2E suite will. Consider a **golden-output test**: snapshot `planLinks(output)` for
   `e2e/base` before the rewrite and assert equality after.

5. **`attachSentinels` consuming `rule.keys` is a behaviour change** for two cases (R7.4). Both are
   measured at zero in-tree exploitation, but the fanout default is what makes `default` and most
   `perm-*` templates work at all — a mistake here silently changes which elections a question
   category is scoped to, which the E2E suite *would* catch, loudly and late.

6. **The D-08 OLD half writes to a live DB and must be torn down between halves**, or the NEW half
   runs against a dirty database and its exit code is about the wrong thing. Use a dedicated
   `externalIdPrefix` (`negctl144-`) and `yarn db:seed:teardown` between halves. The ASSERT-10
   duplicate-prefix guard makes a shared prefix a known race class.

7. **`COLUMN_MAP`'s `organizationId` collision** (`organization_id` and `organization_id_nom` both map
   to it; last-wins gives `organization_id_nom`) is in `packages/supabase-types`, outside this phase's
   fence. Deriving the allow-list mechanically from `FIELD_MAP` is safe; hand-writing a camelCase
   alias is not. **File the collision as residue** — fixing it touches the frontend adapter too.

8. **The RPC's `relationships` map is parity-tested, not derived** (R1.5) — Postgres cannot iterate a
   TypeScript const. Criterion 4's derivation guarantee therefore covers sources (1)–(3) and **not**
   source (4). State the limit; do not let the ledger imply otherwise.

9. **`packages/dev-seed`'s lint script is `eslint … src/`** (`package.json:14`), so every new spec in
   `tests/` is unlinted — the same class as Phase 143's D-08 residue todo. Not a blocker; file it.

10. **Turbo caching on `typecheck`.** Every evidence run needs `TURBO_FORCE=true`, and the acceptance
    grep should look for `executing` in the **`@openvaa/dev-seed:typecheck`** task line specifically —
    the measured string is `cache bypass, force executing <hash>` plus an aggregate
    `Cached: 0 cached, 22 total`.

---

## Sources

### Primary (HIGH confidence — read this session, quoted verbatim)

- `packages/dev-seed/src/{supabaseAdminClient,writer,pipeline,types,locales}.ts`,
  `src/template/{schema,types}.ts`, `src/cli/{seed,resolve-template}.ts`, `src/templates/index.ts`,
  `src/templates/e2e/base.ts`, `tsconfig.json`, `package.json`, `vitest.config.ts`
- `packages/dev-seed/tests/{template,writer,determinism}.test.ts`,
  `tests/template/latent.schema.test.ts`, `tests/latent/latentEmitter.test.ts`,
  `tests/templates/nominations-override.test.ts`
- `packages/supabase-types/src/{index,column-map,database}.ts`
- `packages/shared-config/{package.json,tsconfig.base.json}`
- `apps/supabase/supabase/schema/501-bulk-operations.sql`,
  `apps/supabase/supabase/migrations/00001_initial_schema.sql`
- `tests/tests/setup/shared/setupFromTemplate.ts`, `tests/seed-test-data.ts`
- root `package.json`, `turbo.json`, `.github/workflows/main.yaml`, `scripts/assert-unit-test-coverage.mjs`
- `.planning/phases/144-…/144-CONTEXT.md`, `144-DISCUSSION-POINTS.md`,
  `.planning/phases/143-…/143-CONTEXT.md`, `143-NEGATIVE-CONTROL-LEDGER.md`,
  `.planning/ROADMAP.md`, `.planning/REQUIREMENTS.md`,
  `.planning/audits/2026-08-11-fake-guard-sweep.md`,
  `.planning/todos/pending/2026-05-31-edit-the-seed-utility-to-use-strict-typing-for-the-templates.md`

### Executed measurements (HIGH confidence — commands run this session)

- `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` — narrow (exit 0 with a deliberate `tests/`
  error), widened (3 errors), TS2353 with and without a named alias, TS2578 both ways
- `TURBO_FORCE=true npx turbo run typecheck` — 22/22, 0 cached, 19.267 s, `cache bypass, force executing`
- `npx tsx` probes: `PROPERTY_MAP` full enumeration, `BUILT_IN_TEMPLATES` `fixed[]` key survey (749
  rows), `runPipeline` + `fanOutLocales` key classification (1,481 rows, 0 unknown), zod probes A–F at
  4.3.6, strict-schema validation of all 30 built-ins (30/0)
- `git log -1 --format=%s` on `4aeae0ace`, `d783e81fc`, `7c47b35b7`, `b3ba1621d`;
  `git diff --stat b3ba1621d ee58a4be7`
- `grep -l '"typecheck"' packages/*/package.json apps/*/package.json | wc -l` → 12
- `yarn workspace @openvaa/dev-seed exec pwd`; `yarn db:status`
- Restore proofs: `git status --porcelain`, `git diff --stat`, `git diff --exit-code`

### Secondary (MEDIUM confidence)

- None. Every claim in this document is either a direct file read or an executed command in this
  session; nothing was taken from training knowledge or the web.

---

## Metadata

**Confidence breakdown:**

| Area | Level | Reason |
|---|---|---|
| Standard stack | HIGH | No new dependencies. Everything is `typescript` 5.9.3, `zod` 4.3.6, `vitest` 3.2.4, `turbo` 2.8.17 — all already in the tree, all version-checked. |
| Architecture (4-source allow-list, `planLinks` split, Pass 0 placement) | HIGH | Every input to the design is a measured fact; the two structural recommendations (named aliases, guard `data` not `bulkData`) each rest on an executed probe. |
| Fallout (criterion 5) | HIGH | 1,481 rows classified programmatically over the live registry, twice (with and without `fanOutLocales`). |
| Pitfalls | HIGH | Each pitfall below is a measurement, not a prediction: `project_id` on all rows, 2,955 relationship-ref occurrences, 76 bare-form rows, the EPC hole, the two `attachSentinels` mismatches. |
| D-08 procedure | MEDIUM | The command sequence is derived from reading the CLI end to end and from `yarn db:status` confirming a live Supabase; **the runs themselves were deliberately not executed** (read-only mandate, and the OLD half must be measured inside plan 01's commit). |

**Research date:** 2026-08-23
**Valid until:** 7 days — `supabaseAdminClient.ts` is ~600 lines and this phase edits it; every line
citation above is stated for `ee58a4be7` and must be re-measured at execution HEAD.
