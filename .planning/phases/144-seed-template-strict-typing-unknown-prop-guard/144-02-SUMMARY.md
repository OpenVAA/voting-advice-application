---
phase: 144-seed-template-strict-typing-unknown-prop-guard
plan: "02"
subsystem: testing
tags: [dev-seed, typescript, tsconfig, turborepo, supabase, zod, negative-control, permitted-keys]

requires:
  - phase: 144-seed-template-strict-typing-unknown-prop-guard
    provides: "144-01 — the opened ledger with all 37 rows placeholdered, the 17 measured OLD halves, the three negctl fixtures, and RES-1 (the source-(3)/source-(2) overlap)"
provides:
  - "packages/dev-seed/src/template/linkSentinels.ts — LINK_SENTINELS, 4 rules flattening to 10 (collection, key) pairs, declared `as const satisfies`"
  - "packages/dev-seed/src/template/permittedKeys.ts — the four-source permitted-key union, canonical resolved-table keying, a throwing lookup miss, and FixedRow<C> plus the 12 named row-type aliases"
  - "A strict hand-written Template whose 12 per-entity slots carry the row types, held to TemplateSchema's top-level key set by a compile-time conformance assertion"
  - "A widened packages/dev-seed/tsconfig.json — its own tests/ and scripts/ are inside tsc for the first time since the workspace was scaffolded"
  - "packages/dev-seed/tests/template/permittedKeys.test.ts — 20 cases including the two-directional source-(4) SQL parity spec and the schema-vs-migration CASE diff"
  - "Ledger rows T1-NEW, T2-NEW (RED, naming the alias), L's type half (GREEN), and row P's after-half at 0 errors"
affects: [144-03, 144-04, 144-05, 144-06, 144-07]

actuals:
  tokens: 22464
  tasks: 3
  commits: 7

tech-stack:
  added: []
  patterns:
    - "Value-level column mirror held to the generated types in BOTH directions: `as const satisfies` rejects a non-column, an `Exclude`-based assertion rejects a missing column"
    - "Earned narrowing instead of a cast at the schema-to-type seam: check the one structural property the stricter type adds, then use an `asserts x is T` predicate"
    - "Immutable memoized allow-list sets — one instance per resolved table, mutating members throw"
    - "Pair integrity outranks the action text: a NEW half runs the OLD half's byte-identical command, so the pair differs only by the tree"

key-files:
  created:
    - packages/dev-seed/src/template/linkSentinels.ts
    - packages/dev-seed/src/template/permittedKeys.ts
    - packages/dev-seed/tests/template/permittedKeys.test.ts
  modified:
    - packages/dev-seed/src/template/types.ts
    - packages/dev-seed/src/template/schema.ts
    - packages/dev-seed/src/template/index.ts
    - packages/dev-seed/src/index.ts
    - packages/dev-seed/src/supabaseAdminClient.ts
    - packages/dev-seed/tsconfig.json
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - packages/dev-seed/src/templates/e2e/base.ts
    - packages/dev-seed/src/templates/e2e/perm/shared.ts
    - packages/dev-seed/tests/determinism.test.ts
    - packages/dev-seed/tests/latent/latentEmitter.test.ts
    - packages/dev-seed/tests/templates/nominations-override.test.ts
    - .planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md

key-decisions:
  - "Sentinel pair count re-derived at execution HEAD as 10 — agreeing with CONTEXT B-4 as corrected and with RESEARCH R2.2's table, and disagreeing with R2.2's own headline word 'twelve'"
  - "COLLECTION_MAP and FIELD_MAP moved alongside resolveCollectionName rather than duplicated — the resolver cannot move without its map, and the camel derivation must read the same map that does the renaming"
  - "Source (1) is a value-level column list held to TablesInsert in both directions by two compile-time assertions, because types are erased and the runtime guard needs a value"
  - "Option A for the Template derivation: TemplateSchema stays the runtime authority, Template becomes hand-written, and a top-level key-set conformance assertion holds them together"
  - "validateTemplate EARNS its narrowing by checking external_id on every fixed[] row rather than casting across the schema-to-type seam"
  - "Rows T1-NEW / T2-NEW measured with the OLD halves' byte-identical tsc command, not the action text's turbo command, on pair integrity — and recorded at the exit code tsc actually returns (2, not the predicted 1)"
  - "The three pre-existing `as unknown as` casts in dev-seed/tests were removed rather than exempted from Task 2's zero-cast criterion"

patterns-established:
  - "A permitted-key set that throws on an unrecognised collection — an empty set would make a keying confusion permit everything"
  - "Source (4) parity-tested in both directions against the SQL it transcribes, with the derivation limit stated on the ledger's face"
  - "Retyping programmatic row builders to the row-type aliases as the way to narrow the excess-property-checking hole"

requirements-completed: [TMPL-01, TMPL-02]

coverage:
  - id: D1
    description: "LINK_SENTINELS encodes every (collection, key) pair the four resolution sites read — bare non-underscore forms included — with key order preserved as ??-precedence order"
    requirement: "TMPL-02"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#flattens to exactly the ten hand-enumerated (collection, key) pairs"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#includes the three bare non-underscore forms — 76 in-tree rows depend on them"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#preserves `??`-precedence key order inside the elections rule"
        status: pass
    human_judgment: false
  - id: D2
    description: "permittedKeys unions all four sources, resolves the collection name first, and throws on a lookup miss"
    requirement: "TMPL-02"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts (20 cases; log vt-permittedKeys-1.log)"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#THROWS for an unrecognised collection, naming both the raw key and the resolved table"
        status: pass
    human_judgment: false
  - id: D3
    description: "Source (4)'s ten relationship-reference pairs are admitted and parity-tested against 501-bulk-operations.sql in both directions; the schema and migration copies of the CASE block are byte-identical (assumption A3)"
    requirement: "TMPL-02"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#RELATIONSHIP_REFS equals the 501-bulk-operations.sql CASE block in BOTH directions"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#the schema copy and the applied migration copy of the CASE block agree (assumption A3)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Camel forms derived mechanically from FIELD_MAP — firstName admitted, sortOrder not, organizationId modelled as the mapping actually resolves it"
    requirement: "TMPL-01"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#does NOT admit sortOrder — sort_order’s only legal camel form is `order`"
        status: pass
      - kind: unit
        ref: "packages/dev-seed/tests/template/permittedKeys.test.ts#models organizationId as the mapping actually resolves it, not as intuition suggests"
        status: pass
    human_judgment: false
  - id: D5
    description: "The two non-column consts were MOVED, not duplicated, and bulkImport's stripping behaviour is unchanged"
    requirement: "TMPL-02"
    verification:
      - kind: integration
        ref: "git diff of supabaseAdminClient.ts — the strip loop, the key.startsWith('_') rule, the candidateExternalId read and the nomination branch are untouched"
        status: pass
      - kind: unit
        ref: "packages/dev-seed tests/supabaseAdminClient.test.ts + tests/writer.test.ts (44 files / 466 tests pass)"
        status: pass
      - kind: integration
        ref: "packages/dev-seed/tests/integration/default-template.integration.test.ts — seeds the default template against the live local database, exit 0"
        status: pass
    human_judgment: false
  - id: D6
    description: "packages/dev-seed type-checks its own tests/ and scripts/; rootDir dropped; row P's after-half is 0 errors on a non-replayed run"
    requirement: "TMPL-01"
    verification:
      - kind: integration
        ref: "TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed (log tc-P-after-1.log) => exit 0, 0 error TS, 7 successful / 0 cached"
        status: pass
    human_judgment: false
  - id: D7
    description: "Both D-01 exemplars now produce a TS2353 naming the row-type alias, and deleting the offending key typechecks clean"
    requirement: "TMPL-01"
    verification:
      - kind: integration
        ref: "npx tsc --noEmit -p packages/dev-seed/tsconfig.json (logs tc-T1-NEW-1.log, tc-T2-NEW-1.log) => exit 2, one TS2353 each"
        status: pass
      - kind: integration
        ref: "same command with the offending key deleted (logs tc-T1-NEW-deleted-1.log, tc-T2-NEW-deleted-1.log) => exit 0, 0 diagnostics"
        status: pass
    human_judgment: false
  - id: D8
    description: "Row L's type half — questions._elections, a feature shipped in 4aeae0ace, still compiles clean under the strict row types"
    requirement: "TMPL-01"
    verification:
      - kind: integration
        ref: "npx tsc --noEmit -p packages/dev-seed/tsconfig.json (log tc-L-type-1.log) => exit 0, 0 diagnostics for both probe forms"
        status: pass
    human_judgment: false
  - id: D9
    description: "Repository-wide gates green at plan close on the widened config"
    verification:
      - kind: integration
        ref: "TURBO_FORCE=true npx turbo run typecheck (log tc-02-close.log) => 22 successful / 0 cached"
        status: pass
      - kind: unit
        ref: "yarn test:unit (log vt-repo-02-close.log) => 25 successful"
        status: pass
      - kind: integration
        ref: "yarn lint:check and yarn format:check => exit 0"
        status: pass
    human_judgment: false
  - id: D10
    description: "The excess-property-checking hole is stated in the ledger together with what this plan narrowed of it — and the judgment of whether the narrowing is described accurately rather than flatteringly"
    verification: []
    human_judgment: true
    rationale: "Retyping the perm-* row builders to the FixedRow aliases moved the boundary the plan described as fixed: rows constructed inside a builder ARE now checked, rows reaching a fixed: array through an already-loose variable still are not. Whether the ledger's new section draws that line where the code actually draws it is a reading a human should make before 144-04 designs the runtime guard around it."
  - id: D11
    description: "The full Playwright E2E suite was NOT run in this plan"
    verification: []
    human_judgment: true
    rationale: "This plan's runtime deltas are three, all argued rather than measured against the browser suite: the two non-column consts moved with byte-identical contents, `as const` to `satisfies Json` on two app-settings objects (type-level only, values unchanged), and a new external_id check on a code path E2E does not use (built-ins bypass validateTemplate per B-12). The live seed path is covered by the dev-seed integration test, which seeds the default template against the local database and passes. A human should decide whether that substitution is acceptable here or whether the suite must run before 144-03; 144-04 runs live-DB rows and 144-06 owns the gate."

duration: 33 min
completed: 2026-08-23
status: complete
---

# Phase 144 Plan 02: The four-source permitted-key declaration and the type layer Summary

**One derived declaration now carries every key a seed template row may hold — DB columns with their mechanically-derived camel forms, the ten sentinel pairs, the two moved non-column consts and the ten RPC relationship refs — and `Template` stops being `z.infer<…>`, so `_constituencies` on an `elections` row is a `TS2353` naming `ElectionsFixedRow` while `_elections` on a `questions` row still compiles clean.**

## Performance

- **Duration:** 33 min
- **Started:** 2026-08-23T14:29:00Z
- **Completed:** 2026-08-23T15:02:00Z
- **Tasks:** 3
- **Files created:** 3 · **modified:** 13

## Accomplishments

- **The declaration exists and is derived, not maintained in parallel.** Source (1) is a value-level column list the compiler holds to `TablesInsert<…>` in **both** directions; a migration that adds a column breaks the build here and names it. Source (2) is the const the resolver will read. Source (3) was **moved** out of `bulkImport`, not copied. Source (4) is the one un-derivable source and says so in its own file header.
- **TMPL-01 stopped being an IDE-only claim.** `packages/dev-seed/tests/` entered `tsc` for the first time since `4fc1abb2d`, and `TURBO_FORCE=true npx turbo run typecheck` is green at **22/22, 0 cached** with the widened config.
- **The asymmetry the phase set out to buy is measured.** `candidates._elections` → `TS2353`; `questions._elections` → 0 diagnostics. Same command, same tree, same run window.
- **Not a single cast escape was added, and three pre-existing ones were removed.** `grep -nw 'any'` and `grep -c 'as unknown as'` are 0 across both new modules; `packages/dev-seed/tests/latent/latentEmitter.test.ts` lost the three it had been carrying unseen.
- **Two disagreements with the plan were reported, not reconciled.** The instrument (register's `tsc` vs action text's `turbo`) and the exit code (measured **2**, predicted 1) are both recorded with the reasoning and with `144-01`'s own corroborating rows.

## Task Commits

1. **Task 1 (RED) — the failing four-source derivation spec** — `23055a81f` (test)
2. **Task 1 (GREEN) — linkSentinels.ts, permittedKeys.ts, the two consts moved, the barrels** — `edf06ea8a` (feat)
3. **Task 2 — widen the tsconfig, drop rootDir, fix the three pre-existing errors** — `7a6c34f35` (fix)
4. **Task 2 — remove the three pre-existing cast escapes in latentEmitter.test.ts** — `64b728c97` (fix)
5. **Task 2 — row P's after-half in the ledger** — `df4e04a3a` (docs)
6. **Task 3 — rewire Template to the per-collection row types** — `7ca1a260d` (feat)
7. **Task 3 — rows T1-NEW, T2-NEW, L's type half, the EPC hole, three corrections, RES-7…9** — `5031acd85` (docs)

## The sentinel pair count, re-derived rather than cited

**Derived here: 10 `(collection, key)` pairs across 4 rules.** Method — read the four resolution
sites in `packages/dev-seed/src/supabaseAdminClient.ts` at execution HEAD (`linkJoinTables` at `:387`;
the elections join block at `:392-398`; the constituency-group join block at `:446-451`; the shared
`electionResolve` / `constResolve` helpers, each called for **both** `question_categories` and
`questions`), then flatten rule × collection × key:

| Rule | Collections | Keys | Pairs |
|---|---|---|---|
| 1 | `elections` | `_constituencyGroups`, `_constituency_groups`, `constituencyGroups`, `constituency_groups` | 4 |
| 2 | `constituency_groups` | `_constituencies`, `constituencies` | 2 |
| 3 | `question_categories`, `questions` | `_elections` | 2 |
| 4 | `question_categories`, `questions` | `_constituencies` | 2 |
| | | | **10** |

Asserted mechanically in `tests/template/permittedKeys.test.ts` against a hand-enumerated list of the
same ten strings, plus a length assertion, so the count is checked and not merely stated.

**Beside the source documents:**

| Source | Says | Agrees with this run? |
|---|---|---|
| `144-CONTEXT.md` B-4, as corrected in `a264a972e` | **10** (7 underscore + 3 bare) | **yes** |
| `144-RESEARCH.md` R2.2, its measured table | **10** (6 table rows summing to 4+2+1+1+1+1) | **yes** |
| `144-RESEARCH.md` R2.2, its own headline sentence | *"twelve pairs"* | **no** |
| `144-02-PLAN.md` § derivation_spec | *"`144-CONTEXT.md` B-4's headline says 12"* | **stale** |

⚠ **Two things to state plainly.** First, `R2.2`'s **headline still says "twelve pairs" while the
table immediately beneath it enumerates ten** — the same internal contradiction that produced the bad
"12", left uncorrected in RESEARCH. Second, the **plan's own claim that CONTEXT says 12 is out of
date**: commit `a264a972e` ("correct the sentinel pair count to 10 — the '12' was mine and wrong")
landed before this plan was written, and B-4 now reads 10 with the correction annotated. The plan
instructed the executor to report disagreement rather than reconcile silently; the disagreement is
with the plan's description of CONTEXT and with RESEARCH's headline, not with either document's
substance.

## Source (4) — the ten relationship refs and the parity result

**Ten `(collection, key)` pairs**, transcribed from the `CASE p_table_name` block of
`_bulk_upsert_record` read at execution time:

- `candidates` → `organization` (1)
- `nominations` → `candidate`, `organization`, `faction`, `alliance`, `election`, `constituency`, `parent_nomination` (7)
- `questions` → `category` (1)
- `constituencies` → `parent` (1)

`nominations.faction` is admitted although nothing in-tree emits it. `candidateExternalId` is admitted
on `nominations` separately, in `RPC_ADJACENT_REFS` rather than in `RELATIONSHIP_REFS`, so the parity
test stays exact — `bulkImport` reads it by name at `supabaseAdminClient.ts:178`
(`'candidate' in record || 'candidateExternalId' in record`), but the SQL does not declare it.

**Parity spec result: PASS, in both directions.** The spec reads
`apps/supabase/supabase/schema/501-bulk-operations.sql` from disk, extracts the `CASE` block, parses
each `WHEN '<table>' THEN relationships := '<json>'::jsonb;` arm, and then asserts:

1. table-name sets equal;
2. per-table key sets equal;
3. per-key `{ fk, table }` objects equal;
4. `expect(fromTs).toEqual(fromSql)` on the whole structure, so an extra entry on **either** side fails;
5. the parsed total is exactly **10**.

**Assumption A3 — resolved, and it holds.** RESEARCH verified only that the two copies' `skip_columns`
arrays are byte-identical, not their relationship `CASE` blocks. Measured here:
`awk '/CASE p_table_name/,/END CASE;/'` over
`apps/supabase/supabase/schema/501-bulk-operations.sql` and over
`apps/supabase/supabase/migrations/00001_initial_schema.sql` yields **22 lines each** and `diff`
reports **no difference**. The assertion is now a permanent test case, so a future migration that
edits one copy and not the other fails here.

## Row P — the pre-existing error set, before and after

**`144-01` measured three.** **This plan surfaced exactly those three, fixed exactly those three, and
nothing else appeared** — in particular, the new `tests/template/permittedKeys.test.ts` contributed
zero diagnostics, and `scripts/**/*` again contributed zero.

| # | Diagnostic `144-01` measured | Fix applied here | Cast escapes |
|---|---|---|---|
| 1 | `tests/determinism.test.ts(99,25)` `TS2559` | **Both** fixture literals annotated `: Template`. Only the second errored (the first shares `generateTranslationsForAllLocales` with `fanOutLocales`' all-optional parameter, so the weak-type rule was satisfied); annotating both makes each a live conformance check against the new row types rather than leaving a matched pair half-typed | none |
| 2 | `tests/latent/latentEmitter.test.ts(122,35)` `TS2493` | `vi.fn((_template: Template) => …)`. Parameter list cross-checked against `LatentHooks['dimensions']` (`latentTypes.ts:90`), which takes exactly one argument | none — **and 3 pre-existing ones removed** |
| 3 | `tests/templates/nominations-override.test.ts(83,13)` `TS2352` | The six missing `Ctx['refs']` keys added as empty arrays (`accounts`, `projects`, `constituency_groups`, `nominations`, `app_settings`, `feedback`); the `as Ctx['refs']` cast **deleted outright** | none — the cast is gone, not replaced |

**After half:** `TURBO_FORCE=true npx turbo run typecheck --filter=@openvaa/dev-seed` at HEAD
`64b728c97` on a clean tree → exit **0**, `grep -c 'error TS'` → **0**, cache verdict
`cache bypass, force executing` on **7 of 7**, `0 cached`. A non-zero after-half would have meant a
fix was cosmetic; it is zero.

## Rows T1-NEW, T2-NEW and L (type half)

| Row | Exit | Diagnostic | Outcome |
|---|---|---|---|
| `T1-NEW` | **2** | `src/__probe144_t1.ts(4,47): error TS2353: … '_constituencies' does not exist in type 'Partial<ElectionsFixedRow> & { external_id: string; }'.` | **RED (catch)** |
| `T1-NEW` delete-clause | **0** | — (0 diagnostics with `_constituencies` removed) | criterion 1's "deleting it typechecks" |
| `T2-NEW` | **2** | `src/__probe144_t2.ts(5,80): error TS2353: … '_elections' does not exist in type 'Partial<CandidatesFixedRow> & { external_id: string; }'.` | **RED (catch)** |
| `T2-NEW` delete-clause | **0** | — | same |
| `L` type half | **0** | — (0 diagnostics, **both** probe forms) | **GREEN** — the shipped feature survives |

**Diagnostic code: `TS2353` on both**, as R1.4 predicted and not the `TS2559` that CONTEXT B-21
mentions in a different context.

⚠ **Three corrections, each recorded in the ledger with its reasoning.**

1. **Instrument.** The plan's Task-3 action text says to run turbo for these rows; the register's own
   `Instrument + command` cell says `npx tsc --noEmit -p packages/dev-seed/tsconfig.json`, which is
   byte-identical to what `T1-OLD` and `T2-OLD` ran. **The register wins, on pair integrity** — a NEW
   half measured with a different instrument is not a control of its OLD half. Turbo is on record
   twice anyway: the first `T1-NEW` attempt through turbo exited 2 with the same single `TS2353`, and
   the clean-tree close run is `tc-02-close.log`.
2. **Exit code.** The plan expects **1**; `tsc --noEmit` returns **2** when diagnostics are present.
   `144-01` already recorded 2 for row `X-OLD` and for row `P`'s before-half, both `tsc` runs with
   errors. The measured 2 is recorded. Writing the predicted 1 would have put a number in the register
   that no command produced.
3. **Type name.** R1.4 predicted `does not exist in type 'ElectionsFixedRow'`. Measured, the alias
   appears **inside `Fragment`'s one-line intersection**, because the plan requires the slots to be
   `Fragment<…>` and `Fragment<TRow>` is `{ fixed?: Array<Partial<TRow> & { external_id: string }> }`.
   Criterion 1 holds — the diagnostic names the row type, legibly, on one line; R1.4's contrast was
   with a twenty-line structural expansion, which this is not.

## The `Template` derivation — option A, and the assertion's shape

`TemplateSchema` remains the **runtime** authority (its `fixed[]` rows stay
`z.record(z.string(), z.unknown())`, so D-04's single row-level authority is still the runtime guard).
`Template` becomes the **authoring** authority: hand-written, twelve slots of
`Fragment<{Collection}FixedRow>`, plus the top-level scalars and `latent` (whose shape is read off
`z.infer<typeof TemplateSchema>['latent']` so it cannot drift). Option B — a mapped-type override on
`z.infer` — was rejected on the plan's stated grounds: invisible from `schema.ts`, silently lost at
the next schema edit.

**The conformance assertion, verbatim:**

```ts
type SlotsMissingFromTemplate = Exclude<keyof SchemaShape, keyof Template>;
type SlotsMissingFromSchema = Exclude<keyof Template, keyof SchemaShape>;

const TEMPLATE_KEYS_MATCH_SCHEMA: [SlotsMissingFromTemplate, SlotsMissingFromSchema] extends [never, never]
  ? true
  : ['Template and TemplateSchema disagree on the top-level key set', SlotsMissingFromTemplate, SlotsMissingFromSchema] =
  true;
```

Both directions, and a failure names the offending slot in the reported type rather than merely
failing. Row-level agreement is deliberately **not** asserted.

The file's doc comment was rewritten in the same edit. It had claimed `Template` "is the single source
of truth … mirrors `TemplateSchema` exactly without hand-written duplication", which stopped being
true here; leaving it would have added a second false in-tree record beside the one at
`resolve-template.ts:16` this phase partly exists to correct.

## `bulkImport`'s stripping behaviour is unchanged — how that is known

The `git diff` of `packages/dev-seed/src/supabaseAdminClient.ts` touches exactly three things: the
import line, the two module-level map declarations (deleted, imported back), and the comment block
above the two moved consts. **The strip loop itself is byte-unchanged** —
`if (key.startsWith('_') || NON_COLUMN_FIELDS.has(key) || extraStrip?.has(key)) continue;`, the
`isNomination && key === 'organization' && hasCandidateRef` branch, the `candidateExternalId` read,
the `resolveFieldName` call, the nested-`externalId` conversion and the `published` default all sit
where they sat. The moved consts' contents are asserted byte-equivalent by
`tests/template/permittedKeys.test.ts` ("keeps the moved consts byte-equivalent to what bulkImport
declared"), and `COLLECTION_NON_COLUMNS` is still keyed by the **resolved** table name, which is how
`bulkImport` has always looked it up.

Behavioural evidence beyond inspection: `tests/supabaseAdminClient.test.ts` and `tests/writer.test.ts`
pass, and `tests/integration/default-template.integration.test.ts` **seeds the default template
against the live local database** and passes (reporting a ~5.6 s seed step), which exercises
`bulkImport` → `importAnswers` → `linkJoinTables` end to end.

## Files Created/Modified

- `packages/dev-seed/src/template/linkSentinels.ts` — `SentinelPayload`, `LinkTarget`, `LinkSentinelRule`, `LINK_SENTINELS` (new)
- `packages/dev-seed/src/template/permittedKeys.ts` — the four-source union, `resolveCollectionName`, the moved maps and consts, `RELATIONSHIP_REFS`, `permittedKeys`, `FixedRow<C>` + 12 aliases (new)
- `packages/dev-seed/tests/template/permittedKeys.test.ts` — 20 cases, the derivation spec (new)
- `packages/dev-seed/src/template/types.ts` — `Template` rewritten; doc comment replaced; conformance assertion added
- `packages/dev-seed/src/template/schema.ts` — `validateTemplate` returns `Template`, earning it via the `external_id` check
- `packages/dev-seed/src/template/index.ts`, `packages/dev-seed/src/index.ts` — the new public surface exported
- `packages/dev-seed/src/supabaseAdminClient.ts` — imports the moved maps and consts back
- `packages/dev-seed/tsconfig.json` — `include` widened to `src` + `tests` + `scripts`; `rootDir` removed
- `packages/dev-seed/src/templates/_helpers/buildMinimal.ts`, `.../e2e/perm/shared.ts` — row builders and local row arrays retyped to the `FixedRow` aliases
- `packages/dev-seed/src/templates/e2e/base.ts`, `.../e2e/perm/shared.ts` — the two app-settings constants are `satisfies Json` rather than `as const`
- `packages/dev-seed/tests/determinism.test.ts`, `.../latent/latentEmitter.test.ts`, `.../templates/nominations-override.test.ts` — the three row-P fixes, plus three cast escapes removed
- `.planning/.../144-NEGATIVE-CONTROL-LEDGER.md` — rows `T1-NEW`, `T2-NEW`, `L` (type half), row `P`'s after-half, the EPC-hole section, the three corrections, RES-7…RES-9

## Decisions Made

- **`COLLECTION_MAP` and `FIELD_MAP` moved too, beyond the plan's list of two consts.** `resolveCollectionName` cannot move without `COLLECTION_MAP`, and the camel-form derivation must read the *same* `FIELD_MAP` that `resolveFieldName` uses — a second copy would be free to drift, which the code-review checklist's no-duplication item forbids and which is the exact failure this phase is about.
- **Source (1) is a value-level list, held to the generated types by two compile-time assertions.** Types are erased and the runtime guard needs a value; `as const satisfies { [C in CollectionKey]: ReadonlyArray<keyof TablesInsert<C> & string> }` rejects a name that is not a column, and an `Exclude`-based probe rejects a column missing from the list.
- **`permittedKeys` returns an immutable, memoized set.** One instance per resolved table, so `permittedKeys('questionCategories') === permittedKeys('question_categories')`; `add` / `delete` / `clear` throw, because a shared mutable allow-list handed to every caller is a guard anyone can widen.
- **`external_id` and `externalId` are admitted on every collection.** `Fragment<TRow>` requires `external_id` on every authored row, and that holds even for `feedback`, whose table genuinely has no such column (`107-feedback.sql`) and whose rows the writer skips (`writer.ts:151`). Documented as an authoring key with that reason rather than smuggled into the column list.
- **The full Playwright E2E suite was not run** — see the deviation note and coverage entry D11 for the reasoning and what covers the seed path instead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The strict `Template` produced 14 diagnostics the plan did not budget for**
- **Found during:** Task 3
- **Issue:** `Template`'s per-entity slots stopped accepting `Record<string, unknown>`, which is what the `perm-*` row builders return and what `buildMinimal.ts`'s local arrays were declared as. Three further diagnostics came from `as const` on the two app-settings objects, whose readonly nested arrays are not assignable to the mutable `Json` the `settings` column takes.
- **Fix:** Retyped the builders' return types and the local row arrays to the `FixedRow` aliases (`templates/e2e/perm/shared.ts`, `templates/_helpers/buildMinimal.ts`), and replaced `as const` with `satisfies Json` on `BASE_APP_SETTINGS` and `MINIMAL_BASE_APP_SETTINGS`. `satisfies` is type-level only — **the emitted values are unchanged**. `customDataByQuestion` was tightened from `Record<string, Record<string, unknown>>` to `Record<string, Json>`, which is what the column actually accepts.
- **Files modified:** `templates/e2e/perm/shared.ts`, `templates/_helpers/buildMinimal.ts`, `templates/e2e/base.ts`
- **Verification:** `npx tsc --noEmit -p packages/dev-seed/tsconfig.json` → 0; 466 unit tests pass; the live integration seed passes
- **Committed in:** `7ca1a260d`
- **Note:** this **narrowed the EPC hole the plan asked to be declared**. Rows written inside a builder are now fresh literals checked against a declared return type, so an illegal key there is an error. The residue — a row reaching a `fixed:` array through an already-loose variable — is what the ledger's new section states, and it is still the runtime guard's to cover.

**2. [Rule 3 - Blocking] `validateTemplate`'s output is not assignable to the strict `Template`**
- **Found during:** Task 3 (`cli/resolve-template.ts:88` and `:111`)
- **Issue:** `TemplateSchema` keeps rows at `z.record(z.string(), z.unknown())` by design (D-04), so its parsed output has rows of `Record<string, unknown>` — never assignable to a row type requiring `external_id: string`. Every bridge across that seam is either a cast or an earned narrowing.
- **Fix:** Earned it. `validateTemplate` now calls `assertFixedRowsCarryExternalId`, an `asserts parsed is Template` predicate that checks the one structural property `Template` adds and throws with a field path (`template.<slot>.fixed[<i>].external_id`) otherwise. Slots are discovered from the parsed value rather than a hand-kept list. **No cast at the seam.** The function's doc comment states plainly what it does not prove (per-column value conformance, unknown keys — both the runtime guard's).
- **Files modified:** `packages/dev-seed/src/template/schema.ts`
- **Verification:** typecheck 0; 466 unit tests pass, including `tests/template.test.ts`
- **Committed in:** `7ca1a260d`; recorded as **RES-9** for `144-05`, which owns B-12 / D-07a
- **Blast radius:** the filesystem/JSON template path only. Built-ins bypass `validateTemplate` entirely (B-12), and that is the path every E2E setup project uses. The RPC raises on the same condition three passes later, so this only moves an existing failure earlier.

**3. [Rule 2 - Missing critical] Three pre-existing `as unknown as` casts made Task 2's zero-cast criterion unsatisfiable**
- **Found during:** Task 2
- **Issue:** `tests/latent/latentEmitter.test.ts` already carried three cast escapes at `:52`, `:106` and `:122`. Task 2's criterion asks for **zero** in each of the three files it fixes. Two of them were `as unknown as Template` — working counter-examples to TMPL-01 inside the package that owns it.
- **Fix:** Removed all three. The two `Template` casts became plain annotated literals; `questions as unknown as Array<{ external_id: string }>` became a `.map` projection, which is what `Ctx['refs'].questions` already declares.
- **Files modified:** `packages/dev-seed/tests/latent/latentEmitter.test.ts`
- **Verification:** `grep -c 'as unknown as'` → 0 on all three files; typecheck 0; tests pass
- **Committed in:** `64b728c97`; recorded as **RES-8**

**4. [Rule 1 - Bug] The `SentinelKeysFor` mapped type over the `LINK_SENTINELS` tuple was illegal**
- **Found during:** Task 1
- **Issue:** `{ [I in keyof typeof LINK_SENTINELS]: (typeof LINK_SENTINELS)[I]['collections'][number] … }[number]` produced four `TS2536` errors — `keyof` over the tuple carries the array members, so the index expression is not valid.
- **Fix:** Replaced with a distributive conditional over `(typeof LINK_SENTINELS)[number]` through a helper whose rule parameter is naked, with the reason recorded in the file so the shape is not "simplified" back.
- **Verification:** typecheck 0
- **Committed in:** `edf06ea8a`

**5. [Rule 3 - Blocking] Type-parameter and type-alias names violated the shared ESLint naming convention**
- **Found during:** Task 1
- **Issue:** `@typescript-eslint/naming-convention` requires type parameters to match `/^T[A-Z]/` and type aliases to be PascalCase. `FixedRow<C>`, `IsNever<T>`, `KeysWhenRuleCovers<R, C>` and `_NoMissingColumns` all failed.
- **Fix:** Renamed to `TCollection` / `TValue` / `TRule`; the completeness probe became the const `COLUMN_COVERAGE_IS_COMPLETE`. Type-parameter names do not appear in the `TS2353` diagnostics, so nothing measurable changed.
- **Verification:** `yarn lint:check` → exit 0
- **Committed in:** `edf06ea8a`

---

**Total deviations:** 5 auto-fixed (1 Rule 1 bug, 1 Rule 2 missing-critical, 3 Rule 3 blockers).
**Impact on plan:** No scope creep. Deviations 1 and 2 are the tightening's own fallout — the plan asked for `Template` to become strict without predicting what would stop compiling, and every fix is a real fix with no cast escapes, exactly the standard Task 2 set for its own three errors. Deviation 1 improved on the plan by narrowing the hole the plan asked only to declare, and the ledger says where the narrowing stops. Deviations 3–5 are hygiene the plan's own acceptance criteria demanded.

## Issues Encountered

- **A `git commit -m` with backticks in the message ran shell commands** and silently dropped `` `satisfies Json` `` and `` `as const` `` from the Task-3 commit body. Caught by reading the message back, and amended via `-F` with a quoted heredoc (`7ca1a260d`). No file content was affected.
- **`yarn format` touched two unrelated Playwright files** (`tests/tests/specs/candidate/candidate-bank-auth-journey.spec.ts`, `tests/tests/support/mockOidcIssuerEntry.ts`) carrying pre-existing formatting drift. Reverted with `git checkout --` on those two paths; out of this plan's scope. Both remain unformatted in the tree, as they were before.

## Known Stubs

None. Every symbol this plan declares is fully implemented and exercised by the derivation spec.

The one **stated limitation**, which is a design boundary rather than a stub: `RELATIONSHIP_REFS` is
transcribed from PL/pgSQL rather than derived from it, because Postgres cannot iterate a TypeScript
const. It is parity-tested in both directions and the limit is written into the module's own header
and onto the ledger's face.

## Threat Flags

None. No network endpoint, auth path, file-access pattern or schema change is introduced. The one new
file read is `readFileSync` of two in-repo SQL files inside a unit test, at paths resolved from
`import.meta.url`.

Threat-model dispositions this plan was asked to mitigate, and how: **T-144-09** (source 4 omitted) —
transcribed from the SQL read at execution time and parity-tested both ways; **T-144-10** (bare
sentinel forms omitted) — present and asserted against `LINK_SENTINELS` specifically per RES-1;
**T-144-11** (`organizationId` collision) — derived mechanically so it is admitted nowhere, asserted,
and filed as RES-7 for `144-07`; **T-144-12** (stripping changed) — strip loop byte-unchanged, consts
asserted byte-equivalent, live seed passes; **T-144-13** (cache replay recorded as a measurement) —
`TURBO_FORCE=true` on every evidence-bearing turbo run, `0 cached` recorded; **T-144-14** (negctl
fixtures turned into type errors) — `git diff --exit-code -- packages/dev-seed/tests/fixtures` is
clean and they remain unannotated; **T-144-15** (stale doc comment) — rewritten in the same edit;
**T-144-16** (probe files) — three created, each removed inside its own iteration, `find` and
`git status` both empty at close.

## User Setup Required

None.

## Next Phase Readiness

**Ready for `144-03`.** `LINK_SENTINELS` exists for `linkJoinTables` to iterate, `permittedKeys` exists
for Pass 0 to consult, and the typecheck gate `144-06` will make blocking is green on the widened
config.

**Four things `144-03` … `144-07` should not rediscover:**

1. **RES-1 still governs the derivation test.** This plan's spec asserts the three bare pairs against
   `LINK_SENTINELS` **specifically**, exactly as `144-01` required. `144-03`'s resolver test must keep
   that shape — an assertion against the four-source union cannot see a regression that empties them.
2. **Row `L`'s `Outcome` cell is the only one left placeholdered for `144-03`.** Its `HEAD`,
   `Cache verdict`, `Exit` and the type half of `Assertion outcome` are filled; the plan half is owed.
3. **RES-9 — `validateTemplate` now throws for a `fixed[]` row without a string `external_id`.**
   Filesystem/JSON templates only; built-ins bypass it (B-12), which is `144-05`'s territory.
4. **The exit code for `tsc --noEmit` with diagnostics is 2, not 1.** Three rows in this ledger now
   say so. A later plan that pre-registers 1 will be pre-registering a number no command produces.

**One caution.** The full **Playwright E2E suite has not been run since this plan's changes landed**.
The argument that it is unaffected is in coverage entry D11 and is an argument, not a measurement.
`144-04` runs live-DB rows and is the natural place to take that measurement; it should not be
deferred past `144-06`, which makes the typecheck gate blocking.

## Self-Check: PASSED

All three created files verified present on disk. All seven commit hashes verified in `git log`.
Plan-level verification re-run at close: 37 register rows with **86** placeholders (100 → 86, the
predicted drop); `T1-NEW` names `ElectionsFixedRow` and `T2-NEW` names `CandidatesFixedRow`, both
`RED (catch)`; `buildMinimal` named in the ledger; `grep -c 'FixedRow'` in `types.ts` = 27 (≥12) and
`grep -c 'FixedRow ='` in `permittedKeys.ts` = 12; all five evidence logs non-empty;
`TURBO_FORCE=true npx turbo run typecheck` → 22/22, 0 cached; `yarn test:unit` → 25/25;
`yarn lint:check` → 0; `yarn format:check` → 0; no `__probe144*` file anywhere;
`git status --porcelain -- packages apps tests` empty.

---
*Phase: 144-seed-template-strict-typing-unknown-prop-guard*
*Completed: 2026-08-23*
