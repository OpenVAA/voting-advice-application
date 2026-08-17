---
created: 2026-05-31T13:08:13.088Z
title: Edit the seed utility to use strict typing for templates and throw on unknown props
area: packages
files:
  - packages/dev-seed/src/template/types.ts
  - packages/dev-seed/src/templates/baseV1.ts
  - packages/dev-seed/src/supabaseAdminClient.ts:126
  - packages/dev-seed/src/supabaseAdminClient.ts:365
  - packages/dev-seed/src/pipeline.ts
resolves_phase: 144
---

## Problem

The dev-seed `Template` type is loose enough that misspelled or unsupported
properties on `fixed[]` rows are silently accepted. Concrete example surfaced
2026-05-31: `_elections: { external_id: ['test-el-mun'] }` on a `questions`
row in `baseV1.ts` had no effect because `linkJoinTables` only handled the
sentinel for `question_categories`, not `questions`. There was no type error
at authoring time and no runtime warning — the row was accepted by
`bulkImport` (which strips `_`-prefixed keys via `key.startsWith('_')`) and
the sentinel was simply dropped on the floor.

Loose typing + permissive runtime stripping = silent data-loss bugs. Every
new sentinel or column we add to a generator becomes another opportunity for
a template to declare something the pipeline doesn't read.

## Solution

Two-pronged fix:

1. **Strict types per collection.** Replace the generic `Record<string,
   unknown>`-shaped rows in `packages/dev-seed/src/template/types.ts` with
   per-collection row types — `ElectionFixedRow`, `ConstituencyGroupFixedRow`,
   `QuestionCategoryFixedRow`, `QuestionFixedRow`, `CandidateFixedRow`, etc.
   — that enumerate the exact set of allowed columns + sentinels + non-column
   fields. TS should refuse `_elections` on rows where the pipeline doesn't
   resolve it.

2. **Runtime unknown-prop guard.** In `bulkImport` (and ideally also in
   `attachSentinels`/pipeline normalize), maintain an explicit per-collection
   whitelist of (a) DB columns, (b) sentinels processed by `linkJoinTables`,
   and (c) non-column fields handled separately (`answersByExternalId`,
   `email`, `password`, etc.). Any key not in the union → throw with a
   message naming the row's `external_id`, the unknown key, and the
   collection. This is the runtime backstop for the type-system fix and
   catches templates loaded via `--template ./custom.ts` that bypass the
   built-in template imports.

Touch points:
- `packages/dev-seed/src/template/types.ts` — tighten Template / fixed[] types
- `packages/dev-seed/src/supabaseAdminClient.ts:126` (`bulkImport`) — add
  whitelist + throw on unknown keys (currently silently strips `_`-prefixed
  + `NON_COLUMN_FIELDS` + `COLLECTION_NON_COLUMNS`)
- `packages/dev-seed/src/supabaseAdminClient.ts:365` (`linkJoinTables`) —
  ensure each sentinel that the type system allows is actually resolved here
- `packages/dev-seed/src/pipeline.ts` — `attachSentinels`/`hasDeclaredScope`
  should also be updated to match the whitelist
- `packages/dev-seed/src/templates/baseV1.ts`, `default.ts`, `e2e.ts` — must
  still typecheck under the new strict types

Open questions:
- Should the whitelist live next to the generator (per-collection) or in a
  single registry? A single registry mirrors the snake/camel resolution map
  already in `resolveFieldName`.
- For sentinels, the source of truth should be `linkJoinTables` — encode the
  set of `(collection, sentinel)` pairs it processes and reuse it from
  bulkImport's whitelist + the Template types via mapped types.
