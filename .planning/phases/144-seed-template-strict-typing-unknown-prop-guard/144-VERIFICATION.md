---
phase: 144-seed-template-strict-typing-unknown-prop-guard
verified: 2026-08-23T22:40:00Z
status: passed
score: 9/9 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 144: Seed-Template Strict Typing + Unknown-Prop Guard Verification Report

**Phase Goal:** A template row that declares something the pipeline does not read is impossible to author and impossible to run.
**Verified:** 2026-08-23T22:40:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Method

This phase's own subject is guards that must not be fake. The SUMMARY.md files and
`144-NEGATIVE-CONTROL-LEDGER.md` claims were treated as narrative only. Every claim below was
re-derived independently against the live tree at current HEAD `9ea8a1fea`:

- Read the three enforcement layers' source directly (`permittedKeys.ts`, `assertKnownRowProps.ts`,
  `schema.ts`, `linkSentinels.ts`, `supabaseAdminClient.ts`, `resolve-template.ts`).
- Re-ran the relevant vitest files myself (not the ledger's logs) and observed the pass counts directly.
- Wrote two throwaway `.ts` fixtures under `packages/dev-seed/tests/` (deleted immediately after) and
  ran `tsc --noEmit` against them to independently reproduce the `TS2353` errors for both TMPL-01
  exemplars, and the must-NOT-fire compile for `questions._elections`.
- Ran `TURBO_FORCE=true yarn lint:check` and `TURBO_FORCE=true npx tsc --noEmit` (dev-seed) live,
  myself, rather than trusting the ledger's recorded exit codes.
- Read every one of the 9 code-review findings (`144-REVIEW.md`) against the current source to confirm
  each fix commit (`6fe28f9c3`, `3c8a6b60e`, `fe04431ca`, `df4bec7e6`, `21e544597`, `82e3b8b13`,
  `04d6ca456`, `e06404a0f`) actually changed the flagged code, not just that the commit exists.
- Confirmed all fix commits are ancestors of HEAD via `git merge-base --is-ancestor`.

Per the task's explicit instruction, the full `yarn test:e2e` suite (135/0/0/0/0, claimed at both
HEAD `47ee50054` and the post-fix HEAD `df4bec7e6`) was **not** re-run — it requires exclusive
port 5173 and the local DB is currently left repopulated by the dev-seed integration test (a disclosed,
known residue item, not a new gap). This is treated as taken evidence per the task brief.

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | TMPL-01: `_constituencies` on an `elections` row and `_elections` on a `candidates` row are TypeScript errors at authoring time, naming the row type | ✓ VERIFIED | Independently reproduced: `tsc --noEmit` on a throwaway fixture gave `error TS2353: ... does not exist in type 'ElectionsFixedRow'` and `... 'CandidatesFixedRow'` |
| 2 | TMPL-01 must-NOT-fire: `questions._elections` stays legal (re-scoped exemplar per D-01) | ✓ VERIFIED | Independently reproduced: identical-shape fixture with `_elections` on a `QuestionsFixedRow` compiled clean (`tsc --noEmit`, no errors) |
| 3 | TMPL-01: the type error is caught by a gate (`turbo run typecheck`), wired into `package.json` and CI | ✓ VERIFIED | `package.json:34` `"typecheck": "turbo run typecheck"`; `.github/workflows/main.yaml:88-89` runs it as a named step; `packages/dev-seed/tsconfig.json` includes `tests/**/*`; own live run: `TURBO_FORCE=true npx turbo run typecheck` exit 0 |
| 4 | TMPL-02: seeding an unknown row property throws, naming the row's `external_id`, the offending key, and the collection | ✓ VERIFIED | `assertKnownRowProps.ts:67-90` — message includes all three facts; live-ran `assertKnownRowProps.test.ts` (30/30 pass) which asserts this against real fixtures |
| 5 | TMPL-02: the guard runs before the pipeline can silently drop the key (Pass 0, before Pass 1) | ✓ VERIFIED | `writer.ts:181` calls `assertKnownRowProps(data)` before Pass 1; `writer.test.ts` (27/27 pass, live-run) |
| 6 | ASSERT-04/F13: `TemplateSchema` and `perEntityFragment` are both `.strict()` | ✓ VERIFIED | `schema.ts:59,86,164` — three `.strict()` calls, both top-level and per-entity fragment; live-ran the two blind-site tests in `template.test.ts` — both throw `Unrecognized key` |
| 7 | ASSERT-04: built-in templates now route through `validateTemplate()` (previously bypassed for built-ins) | ✓ VERIFIED | `resolve-template.ts:75` `return validateTemplate(builtIn);` — the pre-144 bare `return builtIn;` is gone |
| 8 | CR-01 fix: the `entity_type` deny-list is no longer bypassed by its camelCase form `entityType` | ✓ VERIFIED | `permittedKeys.ts:890-897` `deriveDeniedKeys` mirrors the permitted-set's camel derivation; live-ran `assertKnownRowProps.test.ts` including the new camel-arm test (`derived.sort()).toEqual(['entityType','entity_type'])`) — passes |
| 9 | Seven gates green at one HEAD, including the post-review fix pass at a second HEAD | ✓ VERIFIED | Live-ran unit tests (552/552 dev-seed), lint:check (exit 0, 0 errors), typecheck (exit 0, 0 `error TS`) myself at current HEAD; E2E treated as taken per task brief (not re-run) |

**Score:** 9/9 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/dev-seed/src/assertKnownRowProps.ts` | Pure Pass-0 runtime guard | ✓ VERIFIED | Exists, substantive (129 lines, real logic), wired into `writer.ts:181` |
| `packages/dev-seed/src/template/permittedKeys.ts` | Derived allow-list + deny-list, per-collection row types | ✓ VERIFIED | Exists, substantive (~1000+ lines), exports `ElectionsFixedRow`/`CandidatesFixedRow`/`QuestionsFixedRow`/etc., `permittedKeys`/`deniedKeys` used by the guard |
| `packages/dev-seed/src/template/linkSentinels.ts` | `LINK_SENTINELS` const + pure `planLinks` | ✓ VERIFIED | Exists; `planLinks` is pure (no Supabase import), iterated by `linkJoinTables` in `supabaseAdminClient.ts:429` |
| `packages/dev-seed/src/template/schema.ts` | `.strict()` `TemplateSchema` + `perEntityFragment` | ✓ VERIFIED | 3 `.strict()` calls confirmed at lines 59, 86, 164 |
| `packages/dev-seed/tsconfig.json` | Widened `include` to see `tests/**/*` | ✓ VERIFIED | `"include": ["src/**/*", "tests/**/*", "scripts/**/*"]` |
| `.github/workflows/main.yaml` | Named typecheck CI step, ordered before lint | ✓ VERIFIED | Step at line 88-89, runs before `Run ESlint check on frontend` at line 91-92 — order verified with `grep -n` and by the standing `ciTypecheckGate.test.ts` spec |
| `packages/dev-seed/tests/assertKnownRowProps.builtins.test.ts` | Standing 30-built-in must-NOT-fire control | ✓ VERIFIED | Exists, iterates `BUILT_IN_TEMPLATES` registry (not a name list), floor-asserted; live-ran, 4/4 pass |
| `packages/dev-seed/tests/fixtures/negctl-questions-entity-type-camel.ts` | 4th negative-control fixture (CR-01 fix) | ✓ VERIFIED | Exists, carries the camel `entityType` key, imported by `assertKnownRowProps.test.ts` (not merely a manual-run-only fixture) |
| `packages/dev-seed/tests/ciTypecheckGate.test.ts` | Regression test for the CI step order (WR-03 fix) | ✓ VERIFIED | Exists, asserts `indexOf(TYPECHECK_STEP) < indexOf(ESLINT_STEP)` on the raw workflow text — a genuine structural check, not a text-presence check |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `writer.ts` `Writer.write()` | `assertKnownRowProps.ts` | direct call before Pass 1 | ✓ WIRED | `writer.ts:181`, confirmed by reading source and by `writer.test.ts` passing |
| `permittedKeys.ts` (`derivePermittedKeys`, source 2) | `linkSentinels.ts` `LINK_SENTINELS` | import + iteration | ✓ WIRED | `permittedKeys.ts:58` imports `LINK_SENTINELS`; used in `derivePermittedKeys` loop at lines ~805-808 |
| `supabaseAdminClient.ts` `linkJoinTables` | `linkSentinels.ts` `planLinks` | direct call, `entry.kind` switch with `never` exhaustiveness | ✓ WIRED | `supabaseAdminClient.ts:429-448`; casts removed (WR-04 fix), confirmed via `grep` showing zero `entry.collection as` occurrences |
| `resolve-template.ts` `resolveTemplate` (built-in branch) | `schema.ts` `validateTemplate` | direct call | ✓ WIRED | `resolve-template.ts:75`, confirmed — this closes the "built-ins bypass zod" hole (row `V-OLD`/`V-NEW`) |
| `assertKnownRowProps.ts` | `permittedKeys.ts` `permittedKeys`/`deniedKeys` | import + call | ✓ WIRED | `assertKnownRowProps.ts:50,114-115` |
| `.github/workflows/main.yaml` typecheck step | `package.json` `"typecheck"` script | `run: yarn typecheck` | ✓ WIRED | Confirmed at `main.yaml:89`; `package.json:34` `"typecheck": "turbo run typecheck"` |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `assertKnownRowProps`, `permittedKeys`, `writer` unit specs | `npx vitest run tests/assertKnownRowProps.test.ts tests/template/permittedKeys.test.ts tests/writer.test.ts` | 85/85 passed | ✓ PASS |
| Full dev-seed package unit suite | `npx vitest run` (in `packages/dev-seed`) | 48 files / 552 tests passed | ✓ PASS |
| `dev-seed` package typecheck | `npx tsc --noEmit -p tsconfig.json` | exit 0 | ✓ PASS |
| Root lint gate (includes chained `yarn typecheck`) | `TURBO_FORCE=true yarn lint:check` | exit 0, 0 errors (warnings only, pre-existing) | ✓ PASS |
| TMPL-01 exemplar 1: `_constituencies` on `ElectionsFixedRow` | throwaway fixture + `tsc --noEmit` | `TS2353 ... 'ElectionsFixedRow'` | ✓ PASS |
| TMPL-01 exemplar 2: `_elections` on `CandidatesFixedRow` | throwaway fixture + `tsc --noEmit` | `TS2353 ... 'CandidatesFixedRow'` | ✓ PASS |
| TMPL-01 must-NOT-fire: `_elections` on `QuestionsFixedRow` | throwaway fixture + `tsc --noEmit` | clean compile, no errors | ✓ PASS |
| CR-01 fix regression | `npx vitest run tests/assertKnownRowProps.builtins.test.ts` | 4/4 passed | ✓ PASS |
| CI step-order regression (WR-03) | `npx vitest run` (included in full suite above) | `ciTypecheckGate.test.ts` 4/4 passed | ✓ PASS |

### Probe Execution

Not applicable — this phase's "probes" are the negative-control ledger's rows, which are TypeScript/vitest/seed-CLI/turbo invocations, not `scripts/*/tests/probe-*.sh` shell probes. These were exercised directly above rather than via the probe-discovery convention.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|--------------|--------|----------|
| TMPL-01 | 144-01, 144-02, 144-03, 144-04, 144-06, 144-07 | Per-collection `fixed[]` row types make an unresolved sentinel/column a TS error at authoring time | ✓ SATISFIED | `ElectionsFixedRow`/`CandidatesFixedRow` TS2353 errors reproduced independently; typecheck gate wired into `package.json` + CI, order-enforced by `ciTypecheckGate.test.ts` |
| TMPL-02 | 144-01, 144-02, 144-03, 144-04, 144-07 | The seed pipeline throws on an unknown row property, naming `external_id`, key, collection | ✓ SATISFIED | `assertKnownRowProps.ts` message format confirmed; wired into `Writer.write()` before Pass 1; 30/30 + 4/4 relevant specs pass live |
| ASSERT-04 (F13) | 144-01, 144-05, 144-07 | `TemplateSchema` and `perEntityFragment` reject unknown fields; the 4 structurally-blind sites now fail | ✓ SATISFIED | 3 `.strict()` calls confirmed; both blind-site tests throw `Unrecognized key`; built-in templates now route through `validateTemplate()` |

No orphaned requirements: `.planning/REQUIREMENTS.md`'s Phase → requirement rollup table lists exactly `TMPL-01, TMPL-02, ASSERT-04` for Phase 144 (Count 3), matching every plan's `requirements:` frontmatter field exactly.

### Anti-Patterns Found

`git diff --stat 61209c9ff HEAD` (the full phase diff) scanned for `TBD|FIXME|XXX|HACK|TODO|PLACEHOLDER` across every file touched (`src/`, `tests/`, `package.json`, `.github/workflows/main.yaml`): **zero matches**. No stub returns, no hardcoded-empty data flowing to output, no console.log-only implementations found in the reviewed source.

The code-review-flagged issues (1 blocker `CR-01`, 8 warnings `WR-01`..`WR-08`) were all independently re-verified fixed in the current source (see Observable Truths #8 and the Method section) — none of the review's own findings remain open.

### Human Verification Required

None. Every must-have truth resolved to a codebase-level, independently-reproduced check (type errors reproduced via my own throwaway `tsc` fixtures, throw messages read from source and exercised via live vitest runs, CI ordering read from the workflow file and enforced by a standing regression spec). No visual, real-time, or external-service behavior is in scope for this phase.

### Gaps Summary

None. All three requirement IDs (TMPL-01, TMPL-02, ASSERT-04) are satisfied with evidence independently reproduced against the current tree, not merely cited from SUMMARY.md or the ledger. The one blocker and eight warnings the code review found were all fixed in commits `6fe28f9c3` through `e06404a0f` (plus `df4bec7e6`), all confirmed ancestors of HEAD `9ea8a1fea`, and each fix was read in the live source and confirmed to actually change the flagged behavior — not merely to add a comment claiming it does.

Two items are worth naming as pre-existing residue, not phase gaps (per the task brief's explicit "known-and-accepted" list): (a) `yarn test:unit` repopulates the local DB via the integration test's `beforeAll`-only teardown, so a fresh `db:reset` is needed before the next E2E run; (b) `importAnswers`/`planLinks` still read `row.externalId ?? row.external_id` — left open deliberately, recorded in the ledger's final section.

`STATE.md` was not observed to mention the post-review fix pass in its "last activity" summary (it reflects the pre-review-fix state at `47ee50054`/`144-07` completion). This is a documentation-freshness note, not a goal-achievement gap — the actual code and gates are current at HEAD `9ea8a1fea`.

---

_Verified: 2026-08-23T22:40:00Z_
_Verifier: Claude (gsd-verifier)_
