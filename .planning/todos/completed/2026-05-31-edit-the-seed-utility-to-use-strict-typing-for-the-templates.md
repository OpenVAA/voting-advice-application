---
created: 2026-05-31T13:08:13.088Z
title: Edit the seed utility to use strict typing for templates and throw on unknown props
area: packages
files:
  - packages/dev-seed/src/template/types.ts
  - packages/dev-seed/src/templates/e2e/base.ts   # corrected 2026-08-23: was `templates/baseV1.ts`, moved by `d783e81fc` (Phase 93-02) on 2026-06-03
  - packages/dev-seed/src/supabaseAdminClient.ts:122   # corrected 2026-08-23: `bulkImport`, re-measured at the closing HEAD (the todo said :126)
  - packages/dev-seed/src/supabaseAdminClient.ts:380   # corrected 2026-08-23: `linkJoinTables`, re-measured at the closing HEAD (the todo said :365)
  - packages/dev-seed/src/pipeline.ts
resolves_phase: 144
status: completed
completed: 2026-08-23
completed_by: Phase 144 (TMPL-01, TMPL-02, ASSERT-04)
---

## ⚠ Corrections applied on retirement — 2026-08-23

This todo was **satisfied in substance** by Phase 144, but three of its own statements had gone stale
between filing and closing, and all three are corrected **in place** here rather than left standing:

1. **It names a template file that has not existed since Phase 93.** `packages/dev-seed/src/templates/baseV1.ts`
   was moved to `templates/e2e/base.ts` by `d783e81fc` —
   *`refactor(93-02): move baseV1→e2e/base, retire e2e template, relocate perms to e2e/perm`*, 2026-06-03 —
   which also retired `templates/e2e.ts` and relocated the perm templates under `templates/e2e/perm/`.
   The registry today holds **30** built-in templates: `default`, `e2e/base` and 28 others.
2. **Its `supabaseAdminClient.ts` line citations had drifted.** Re-measured at the closing HEAD
   `47ee50054` in a 746-line file: `bulkImport` is at **:122** (the todo said `:126`) and
   `linkJoinTables` at **:380** (the todo said `:365`). Two documents in this phase disagreed with each
   other about this file, which is why the numbers were re-measured rather than copied.
3. **⚠ Its motivating example was already fixed, one day after this todo was filed.** The todo's
   concrete case — `_elections: { external_id: [...] }` on a `questions` row having no effect because
   `linkJoinTables` handled the sentinel only for `question_categories` — was closed by `4aeae0ace`,
   *``feat(data): promote `required` to first-class Question field + wire consumers``*, **2026-06-01**.
   That subject does not mention dev-seed at all, which is exactly why the citation must also state
   what the commit did to *this* file: it factored the `_elections` sentinel resolver `electionResolve`
   out of the `question_categories` block and called it for **both** tables. Its own body says so:
   *"dev-seed: extend election_ids JSONB scoping to questions (not just categories) via shared
   `_elections` sentinel resolver."* This todo was filed **2026-05-31 — one day before**.
   **`questions._elections` is therefore LEGAL and must not be re-introduced as an error.** Phase 144
   re-scoped the exemplar (D-01) rather than abandoning the requirement — the primary exemplar became
   `_constituencies` on an `elections` row, the secondary `_elections` on a `candidates` row — and
   added a **must-NOT-fire** control (ledger row `L`) asserting that `questions._elections` still
   compiles under the new types *and* that `planLinks` emits exactly one entry for it.

## How Phase 144 satisfied the substance

Both prongs of the Solution below shipped, each proven by a two-run negative control before it was
claimed:

- **Prong 1 — strict types per collection.** `Template` is rewired to twelve named per-collection row
  types. Blind halves `T1-OLD` / `T2-OLD` typecheck **clean** at exit 0 under the old
  `Array<Record<string, unknown>>` shape; `T1-NEW` / `T2-NEW` are `TS2353` naming the row type. The
  gate that makes this blocking was itself proven blind first — the package's tsconfig `include` was
  `["src/**/*"]` and could not see `tests/` at all (rows `G-OLD` / `G-NEW`).
- **Prong 2 — runtime unknown-prop guard.** `assertKnownRowProps` (Pass 0) throws naming the
  `external_id`, the offending key and the collection. Blind halves ran the seed CLI to exit 0 **and
  the key was proven absent from the database by SQL** — accepted, stripped, dropped on the floor —
  and the new halves exit 1 with all three facts.
- **The todo's own open question is answered: a single registry, not per-generator.** The allow-list
  is **derived** from 4 sources (3 of them TypeScript and genuinely derived; the RPC's PL/pgSQL
  relationship map is parity-tested in both directions because Postgres cannot iterate a TypeScript
  const), and the sentinel source of truth is `LINK_SENTINELS`, which `linkJoinTables` now **iterates**
  — so the loop that permits a pair is the loop that resolves it.
- **`--template ./custom.ts` is covered**, as the todo asked: that path bypasses the type layer
  entirely (the file is in no `tsconfig`), and Pass 0 is what reaches it.

**Evidence:** `.planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md`
— 37 rows, 28 measured halves, 0 borrowed observations, fallout 0, seven gates green at one HEAD with
the full E2E suite last (135 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run).

**Deliberately NOT done, and filed as standing todos instead:** the `COLUMN_MAP` `organizationId`
collision (cross-package), `quote_ident` hardening inside the RPC, the per-package tsconfig `include`
audit, `packages/dev-seed`'s `src/`-only lint scope, and the 2026-05-23 sentinel fan-out removal —
which stays **open**, because Phase 144 derived the sentinel key *set* and never touched the fan-out
*policy*.

---

## Problem

The dev-seed `Template` type is loose enough that misspelled or unsupported
properties on `fixed[]` rows are silently accepted. Concrete example surfaced
2026-05-31: `_elections: { external_id: ['test-el-mun'] }` on a `questions`
row in the then-`baseV1.ts` (now `templates/e2e/base.ts`) had no effect because
`linkJoinTables` only handled the sentinel for `question_categories`, not
`questions`. **⚠ This specific hole was closed by `4aeae0ace` on 2026-06-01, one
day after this todo was filed — see the corrections section at the top. The
example below is retained as the historical motivation, NOT as a live defect.** There was no type error
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
- `packages/dev-seed/src/supabaseAdminClient.ts:122` (`bulkImport`; `:126` as filed) — add
  whitelist + throw on unknown keys (currently silently strips `_`-prefixed
  + `NON_COLUMN_FIELDS` + `COLLECTION_NON_COLUMNS`)
- `packages/dev-seed/src/supabaseAdminClient.ts:380` (`linkJoinTables`; `:365` as filed) —
  ensure each sentinel that the type system allows is actually resolved here
- `packages/dev-seed/src/pipeline.ts` — `attachSentinels`/`hasDeclaredScope`
  should also be updated to match the whitelist
- `packages/dev-seed/src/templates/e2e/base.ts` (filed as `baseV1.ts`), `default.ts` and
  every `e2e/perm/*` template (`e2e.ts` was retired by `d783e81fc`) — must
  still typecheck under the new strict types

Open questions:
- Should the whitelist live next to the generator (per-collection) or in a
  single registry? A single registry mirrors the snake/camel resolution map
  already in `resolveFieldName`.
- For sentinels, the source of truth should be `linkJoinTables` — encode the
  set of `(collection, sentinel)` pairs it processes and reuse it from
  bulkImport's whitelist + the Template types via mapped types.
