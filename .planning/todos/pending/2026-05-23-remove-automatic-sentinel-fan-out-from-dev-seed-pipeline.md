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

## ⚠ Note added 2026-08-23 by Phase 144 (144-03 / 144-07) — this todo stays OPEN

**Phase 144 derived the sentinel key SET. It did not touch the fan-out POLICY, which is this todo's
territory.** The distinction matters, because a reader skimming `144-03`'s commits could easily
mistake one for the other.

**What `144-03` DID change.** `hasDeclaredScope` no longer carries a hand-written argument list; it
consumes the key list `LINK_SENTINELS` declares for the collection (`sentinelKeysFor`). The set of keys
that **suppresses** the fan-out is now byte-identical to the set the resolver **reads**, for all time,
because both read one declaration. That closed two latent defects for free, each with its in-tree
exploitation **measured at 0** across all 30 built-in templates:

- **`_constituency_groups` override hole.** `linkJoinTables` read `_constituency_groups` on an
  `elections` row, but `hasDeclaredScope` checked only `_constituencyGroups` / `constituencyGroups` /
  `constituency_groups`. An author scoping an election with `_constituency_groups` was therefore *not*
  recognised as having declared scope, `attachSentinels` overwrote the row with a full-fan-out
  `_constituencyGroups`, and the resolver's `??` chain preferred the fan-out — **the author's explicit
  scoping silently replaced by everything-wired-to-everything.**
- **The bare-`elections` phantom.** `hasDeclaredScope(qc, '_elections', 'elections')` treated a bare
  `elections` array on a `question_categories` row as declared scope and suppressed the fan-out, but
  `linkJoinTables` reads that key on no collection at all, so the row ended with
  `election_ids = null = "all"` anyway. The two outcomes agreed **only** because the fan-out would have
  listed every election; change the election set and they diverge.

Closing both changed no built-in's output — the golden link plan for `e2e/base` and `default` is
byte-identical across the change (`diff` exits 0).

**What `144-03` deliberately did NOT change — i.e. what is still owed here.** The fan-out *policy*
stays hand-written. Measured: of the **10** `(collection, key)` combinations `LINK_SENTINELS` declares,
only **3** receive a default at all —

| Gets a fan-out default | Gets none |
|---|---|
| `elections._constituencyGroups` | every `questions` pair |
| `constituency_groups._constituencies` | both `_constituencies` jsonb pairs |
| `question_categories._elections` | the remaining sentinel forms |

**3 of 10.** That asymmetry — and the opposite-defaults problem this todo describes between
`_elections` (fans out) and `_constituencies` (stays NULL) — is untouched and is exactly what this todo
asks for.

**Timing is also unchanged.** This todo is explicitly paired with the `jsonb` → `uuid[]` /
join-table column migration below, and Phase 144 did not do that migration either.

Reference: `.planning/phases/144-seed-template-strict-typing-unknown-prop-guard/144-NEGATIVE-CONTROL-LEDGER.md`
§ Residue (RES-10, RES-11, RES-17).

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
