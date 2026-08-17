---
created: 2026-05-23T00:00:00.000Z
title: Remove automatic sentinel fan-out from dev-seed pipeline (explicit links only)
area: packages
files:
  - packages/dev-seed/src/pipeline.ts:227-256
  - packages/dev-seed/src/pipeline.ts:258-269
  - packages/dev-seed/src/supabaseAdminClient.ts:333-485
  - packages/dev-seed/src/templates/baseV1.ts
  - packages/dev-seed/src/templates/e2e.ts
  - packages/dev-seed/src/templates/default.ts
related:
  - 2026-05-16-extend-e2e-tests-to-cover-election-and-constituency-scoped-q.md
---

## Problem

`packages/dev-seed/src/pipeline.ts:227-256` (`attachSentinels`) auto-fans-out three M:N sentinels whenever a row doesn't explicitly declare scoping:

1. `election._constituencyGroups = { externalId: <all CG external_ids> }` — every election gets linked to every constituency_group.
2. `constituency_group._constituencies = { externalId: <all C external_ids> }` — every CG gets linked to every constituency.
3. `question_category._elections = { externalId: <all election external_ids> }` — every category gets linked to every election (writes to `question_categories.election_ids`).

The fan-out is the Phase 56 "everything wired to everything" default that the comment at lines 222-225 documents. It made early templates simple, but creates two problems for Phase 88 onward:

- **Implicit linkage masks template authoring errors.** A template that forgets to declare scope still seeds successfully, hiding the gap. When the operator writes `_elections: { external_id: ['test-el-reg'] }` they get the explicit scoping they asked for; when they forget it, they silently get a fanned-out "all elections" link with no warning. The fail-loud alternative (require explicit declaration; fail at pipeline time if a relationship is missing) would catch the bug at authoring time.
- **The fan-out makes the new constituency-scoping behaviour harder to reason about.** Plan 88-01 added a NEW `_constituencies` sentinel on `question_categories` + `questions` that writes to the `constituency_ids` JSONB column (mirrors `_elections` → `election_ids` but without fan-out — explicit scoping only). The two scoping conventions inside `question_categories` now have OPPOSITE defaults: missing-`_elections` = "match all elections" (fanned out); missing-`_constituencies` = "match all constituencies" (column stays NULL). Aligning both to "explicit only" would remove this asymmetry.

## Solution

Three coordinated changes:

1. **Delete or gate the fan-out blocks** at `pipeline.ts:238-255`. Either:
   - **(a) Hard delete.** Templates must declare every scope link explicitly. `attachSentinels` becomes a no-op (or is removed entirely from `runPipeline`). Templates that previously inherited the fan-out — `default.ts`, `e2e.ts`, any variant template currently relying on implicit scoping — must add the declarations.
   - **(b) Opt-in flag.** Add a `Template['autoFanoutScopes']: boolean` (default `false`). Existing templates that depend on the fan-out flip it to `true`; new templates (baseV1 onward) leave it off.

   **Recommendation:** (a) hard delete. The opt-in flag preserves cruft.

2. **Audit existing templates.** Grep for `e2e.ts`, `default.ts`, `variant-*.ts` (filesystem variants under `tests/tests/setup/templates/`) — any row that doesn't currently declare a sentinel needs an explicit declaration. Many of the variant templates may legitimately want "all elections" or "all constituencies" — they should declare it explicitly via `_elections: { external_id: <listed-ids> }`.

3. **Update template authoring docs** at `packages/dev-seed/README.md` to spell out: every election must declare its constituency_groups; every constituency_group must declare its constituencies; every question_category must declare its elections (and optionally its constituencies); every question that's constituency-scoped must declare its constituencies.

## Cross-reference: filter-column type migration

This is paired with the **blocker section** in [`2026-05-16-extend-e2e-tests-to-cover-election-and-constituency-scoped-q.md`](./2026-05-16-extend-e2e-tests-to-cover-election-and-constituency-scoped-q.md) — the four scoping columns on `question_categories` / `questions` (`election_ids`, `election_rounds`, `constituency_ids`, `entity_type`) are currently `jsonb` arrays-of-UUIDs. The cleaner long-term schema is PostgreSQL `uuid[]` arrays (or a per-row M:N join table). When that migration lands:

- `linkJoinTables` switches from `.update({ election_ids: <array> })` on the JSONB column to either `.update({ election_ids: <array> })` on a `uuid[]` column (same call, different column type) OR upserts into a join table.
- The fan-out removal lands cleanly at the same time: removing the implicit "match all" default + introducing a typed array column both push the codebase toward explicit, well-typed scoping.

If both changes land in the same milestone, the `default.ts` / `e2e.ts` template overhauls can be done once instead of twice.

## Timing

Not blocking v2.10 close. Not blocking v2.11 rune migration. **Should land alongside the jsonb→uuid[] / join-table migration** referenced above — both touch the same templates and the same writer logic; doing them in one phase amortises the migration cost.

Plan 88-01's `baseV1.ts` already uses the explicit-only pattern (every election declares `_constituencyGroups`; every CG declares `_constituencies`; every category that scopes declares either `_elections` or `_constituencies`). So baseV1 is a working precedent and a safe template to cite as the post-migration target shape.

## Out of scope

- Per-row M:N join tables for `question_categories.election_ids` / `questions.constituency_ids` — that's a deeper schema-shape decision than just typed-array-vs-jsonb. Address as a sibling todo if needed.
- Retiring the `customData.constituencyExternalIds` pattern from any non-baseV1 template — that pattern was a workaround for the missing `_constituencies` sentinel and is obsolete now that the sentinel landed in Plan 88-01 (`packages/dev-seed/src/supabaseAdminClient.ts` `constResolve` block).
