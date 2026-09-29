---
phase: 164-returns-table-nullability-audit-single-override-mechanism
verified: 2026-09-03T13:20:00Z
status: passed
score: 4/4 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 164: `RETURNS TABLE` Nullability — Audit + Single Override Mechanism Verification Report

**Phase Goal:** A null-guard against an RPC column that really is null is not flagged as dead code, and the next consumer does not have to know a folk rule to write one.
**Verified:** 2026-09-03
**Status:** passed
**Re-verification:** No — initial verification

**Method:** Every command below was re-run independently against the live tree at HEAD `3a4b84ad4` (four docs-only commits ahead of the phase's own gate HEAD `57204c21b` — confirmed by `git diff --stat` showing zero changes under `apps/`, `packages/`, `scripts/`, `tests/`, `.github/` between the two). Mutation-based claims from `164-NEGATIVE-CONTROL.md` (NC-1, NC-7a) were independently reproduced — not re-read — including capturing my own pre-mutation `git hash-object` and confirming byte-identical revert. No claim below rests solely on a SUMMARY's word.

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Every `RETURNS TABLE` RPC in the schema tree is enumerated (exactly 3), derived from the schema files (not hand-maintained prose), with a recorded remedy per RPC including every "no change needed" | ✓ VERIFIED | `grep -rn "RETURNS TABLE" apps/supabase/supabase/schema/` → exactly 3 hits (`502-email-helpers.sql:20`, `503-entity-rpcs.sql:15`, `503-entity-rpcs.sql:96`). Independent sweep of **every** `CREATE OR REPLACE FUNCTION` in the schema tree (27 functions total) confirms no 4th `RETURNS TABLE` candidate exists. `node scripts/assert-rpc-return-nullability.mjs` → exit 0, reports the same 3 RPCs (4/32/15 columns). `packages/supabase-types/RPC-NULLABILITY.md` has 51 numbered disposition rows (`grep -c "^| [0-9]"` → 51); 31 say "No change needed", so 20 are overridden — matches the claimed 51/20/31 split exactly. |
| 2 | `parent_nomination_id` reads as `string \| null` at the consumer, and a root nomination is exercised by a test that FAILS if the null-guard is removed — proven at the type level, not merely the unit suite | ✓ VERIFIED | Independently reproduced NC-1: deleted the ternary at `supabaseDataProvider.ts:361-362` (pre-mutation hash `2f9dc1225ee3a627ef882efd2f9cd0f6bd6bcfec`, matching the recorded value exactly), ran `yarn check` in `apps/frontend` → **exit 1**, `TS2345 … Argument of type 'string \| null' is not assignable to parameter of type 'string'` at `361:59` — identical position to the recorded proof. Reverted with `git checkout --`; `git diff --exit-code`, `git hash-object` (re-matches), and `git status --porcelain` all confirm byte-identical restore. The committed root-nomination unit test exists at `supabaseDataProvider.test.ts:2047`. Consistent with the phase's own documented and disclosed limitation (NC-2): that unit test alone does *not* fail if the guard is deleted (the guarded/unguarded expressions both evaluate to `null` for this input) — the type-level proof is what the criterion is actually discharged by, and that proof was independently confirmed here, not merely read. |
| 3 | One documented mechanism, not per-site casts: the Phase-126 cast is removed, and a grep for ad-hoc nullability casts on RPC returns is empty | ✓ VERIFIED | `grep -rn "parent_nomination_id as string" apps/frontend/src/` → 0 hits (cast is gone). `scripts/assert-rpc-return-nullability.mjs` run standalone → `0 cast hit(s); … 0 violation(s)`. Naive wide grep (`grep -rn " as .*\| null" apps/frontend/.../supabase/`) → 16 hits, none of which is the guard's check — verified the one deliberately-wider-grep hit at `supabaseDataProvider.ts:422` (`entityObj.subtype as string \| null \| undefined`) is a mapper-output cast on `entityObj` (constructed at `:411` from `toDataObject()`), not an RPC row — correctly out of scope. Mechanism confirmed as exactly one locus: `packages/supabase-types/src/database.overrides.ts` (the hand-maintained `FunctionReturnOverrides`) merged in `database.merged.ts` (`export type Database = Omit<GeneratedDatabase,...> & {... FunctionReturnOverrides}`), re-exported through the barrel `packages/supabase-types/src/index.ts:1` (`export type { Database } from './database.merged'`). |
| 4 | Re-running `yarn db:types` does not silently revert the guarantee — proven by regenerating and observing the outcome (not merely reasoned about) | ✓ VERIFIED | Per instructions, `yarn db:types` was **not** re-run here. Verified from the recorded artifact instead: `164-03-SUMMARY.md` records `yarn db:types` was actually run against a live local Supabase (migrations `00001`-`00004` applied), `git diff --exit-code -- packages/supabase-types/src/database.ts` returned exit 0 (sha256 unchanged), and two probes proved the instrument can report failure — probe R1 (a real schema addition makes the scoped diff exit 1, then reverts to exit 0) and probe R2 (a renamed override key produces `TS2344` at compile time, exit 2, rather than a silent no-op). `database.overrides.ts`'s `Nullable<F, K>` type is built on `K extends keyof ReturnsRow<F>`, which is exactly the mechanism that makes a renamed/dropped column a compile error. Independently confirmed the CI job exists in `.github/workflows/main.yaml` (`supabase-types-drift`, regenerates and fails on path-scoped diff) and that `packages/dev-seed/tests/rpcNullabilityGate.test.ts` pins its existence and wiring (ran as part of `yarn test:unit`, passing — see gates below). Confirmed `.github/workflows/main.yaml`'s `on:` block triggers only on `push`/`pull_request` to `main`; this branch (`integration/ship-12-squash`) is 766 commits ahead of `origin/main` and has never been pushed, so **no CI run of `supabase-types-drift` has ever executed** — this is recorded honestly as unobserved-in-CI in the phase's own artifacts (`164-03`/`164-05` coverage `D6`, WINDOWS 242/252) and is *not* claimed as CI-verified anywhere I could find. |

**Score:** 4/4 truths verified (0 present-but-behavior-unverified)

### Operator-Authorised Addition (164-05, beyond the four ROADMAP criteria)

The barrel-bypass guard (check 6 of `scripts/assert-rpc-return-nullability.mjs`) was independently verified:

- `grep -n "check 6\|barrel" scripts/assert-rpc-return-nullability.mjs` confirms check 6 exists and asserts **both** links of the delivery chain: `packages/supabase-types/src/index.ts` must re-export `Database` from `./database.merged`, and `database.merged.ts` must declare `export type Database =` applying `FunctionReturnOverrides`.
- Confirmed wired into `lint:check`: `package.json:48`'s `lint:check` script chain ends with `yarn assert:rpc-nullability`, and a live `yarn lint:check` run (below) shows the guard's banner line firing as the last step.
- Independently reproduced NC-7a: rewired `packages/supabase-types/src/index.ts` from `./database.merged` to `./database` (pre-mutation hash `d29905c7bd71839a9bd64f3e15bab7db5c337972`, matching the recorded value exactly) → `node scripts/assert-rpc-return-nullability.mjs` → **exit 1**, error message matching the recorded text verbatim (names the file, names both modules, explains the bypass). Reverted; hash, `git diff --exit-code`, and `git status --porcelain` all confirm clean restore.
- The `.planning/todos/pending/2026-09-03-nothing-guards-the-supabase-types-barrel-wiring.md` finding (filed by 164-04) is confirmed moved to `.planning/todos/done/` — consistent with WINDOWS entry 247's `fixed` disposition (the only WINDOWS-164 entry with a `closed_at` timestamp; all others are correctly recorded as `open`/carried).

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/assert-rpc-return-nullability.mjs` | Enumeration derived by script, 6 checks including barrel-bypass | ✓ VERIFIED | Exists, runs, exit 0 on clean tree, exit 1 on all 6 tested mutation classes (NC-1 analog confirmed via `yarn check`; NC-4/NC-5/NC-7a classes confirmed present in source and NC-7a independently re-run) |
| `packages/supabase-types/RPC-NULLABILITY.md` | Per-RPC, per-column disposition with evidence | ✓ VERIFIED | 51 rows, 20 override / 31 no-change, derived block present with `<!-- BEGIN DERIVED -->` sentinel |
| `packages/supabase-types/src/database.overrides.ts` | Single hand-maintained override locus | ✓ VERIFIED | `FunctionReturnOverrides` type present, `Nullable<F,K>` fail-closed on renamed keys (`K extends keyof ReturnsRow<F>`) |
| `packages/supabase-types/src/database.merged.ts` | Mechanical merge applying overrides to generated schema | ✓ VERIFIED | `export type Database = Omit<GeneratedDatabase,'public'> & {...FunctionReturnOverrides}` |
| `packages/supabase-types/src/index.ts` | Barrel re-points `Database` export to the merged type | ✓ VERIFIED | Line 1: `export type { Database } from './database.merged';` — exact |
| `apps/frontend/.../supabaseDataProvider.ts` | Phase-126 ad-hoc cast removed | ✓ VERIFIED | `grep -n "parent_nomination_id as string"` → 0 hits; guard ternary present at `:361-362`, unchanged from the type it now requires |
| `apps/frontend/.../supabaseDataProvider.test.ts` | Root-nomination behavioural pin | ✓ VERIFIED | Test present at `:2047`; `yarn test:unit` green |
| `packages/dev-seed/tests/rpcNullabilityGate.test.ts` | Pins the guard's wiring into `lint:check` | ✓ VERIFIED | Present, exercised in `yarn test:unit` (part of the 25/25 successful tasks) |
| `.github/workflows/main.yaml` `supabase-types-drift` job | Regeneration-drift CI check | ✓ VERIFIED (unobserved in CI) | Job present (`grep -n "supabase-types-drift"` → line 247); never run on this branch (see criterion 4 above) — correctly recorded as such, not claimed otherwise |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `packages/supabase-types/src/index.ts` | `database.merged.ts` | `Database` re-export | ✓ WIRED | Confirmed by reading + by NC-7a mutation reproduction (rewiring it produces a red gate) |
| `database.merged.ts` | `database.overrides.ts` | `FunctionReturnOverrides` import + intersection | ✓ WIRED | Confirmed by reading; NC-7e (documented, not independently re-run here) shows a merge-module bypass is also caught |
| `scripts/assert-rpc-return-nullability.mjs` | `yarn lint:check` | `assert:rpc-nullability` script chain link | ✓ WIRED | `package.json:48` chain ends with `yarn assert:rpc-nullability`; live `yarn lint:check` run shows the guard's banner firing |
| `supabaseDataProvider.ts` consumer read | `database.overrides.ts` widened type | TypeScript compile-time enforcement | ✓ WIRED | Independently reproduced: deleting the guard produces `TS2345` under `yarn check` |

### Behavioral Spot-Checks (independently run, not read from SUMMARY)

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Enumeration is exactly 3, script-derived | `node scripts/assert-rpc-return-nullability.mjs` | exit 0, `3 RETURNS TABLE RPC(s) … 0 violation(s)` | ✓ PASS |
| Deleting the null-guard ternary reddens type-check | mutate `supabaseDataProvider.ts:361-362`, run `yarn check` | exit 1, `TS2345` at `361:59`; reverted, hash-verified clean | ✓ PASS |
| Rewiring the barrel bypass reddens the guard | mutate `index.ts:1`, run the assert script | exit 1, verbatim message naming both modules; reverted, hash-verified clean | ✓ PASS |
| Phase-126 cast is gone; no ad-hoc RPC-return casts remain | `grep -rn "parent_nomination_id as string"` | 0 hits | ✓ PASS |
| Mechanism is a single locus | read `database.overrides.ts` + `database.merged.ts` + `index.ts` | one `FunctionReturnOverrides`, one merge, one re-pointed barrel | ✓ PASS |

### Gates (re-run directly, exit codes read from `$?`, never through a pipe)

| Gate | Command | Exit | Notes |
|------|---------|------|-------|
| Typecheck | `yarn typecheck` | **0** | 23/23 tasks successful (cached — unchanged tree) |
| Lint | `yarn lint:check` | **0** | 23/23 typecheck + all standing guards including `assert:rpc-nullability`'s own banner line, 0 violations |
| Format | `yarn format:check` | **0** | `All matched files use Prettier code style!` ×2 |
| Unit tests | `yarn test:unit` | **0** | 25/25 tasks successful, includes `@openvaa/frontend` 88 files / 1591 tests, all passed |
| Full E2E suite | **not re-run** (per instructions) | — | Verified from artifact instead: `tests/e2e-runs/164-05-cardinal-gate/run.log` exists on disk, `grep -oE '[0-9]+ passed'` → `155 passed`, `grep -cE 'flaky'` → 0, `grep -cE '[0-9]+ failed'` → 0, `grep -oE 'Running [0-9]+ tests using [0-9]+ workers'` → `Running 155 tests using 6 workers`. Matches the recorded claim (155 passed / 0 failed / 0 flaky / 0 skipped / 0 did-not-run, 10.9m) exactly. `dev-server.log` confirms `E2E PREFLIGHT OK` for this checkout. |

### Requirements Coverage

| Requirement | Source | Description | Status | Evidence |
|-------------|--------|-------------|--------|----------|
| CIGATE-04 | Phase 164 | Every `RETURNS TABLE` RPC enumerated against nullable columns, recorded remedy per RPC | ✓ SATISFIED | Criterion 1 above; `RPC-NULLABILITY.md`, `assert-rpc-return-nullability.mjs` |
| CIGATE-05 | Phase 164 | Consumers keep null-guards without TS flagging them dead code, via one documented override layer | ✓ SATISFIED | Criteria 2 and 3 above; `database.overrides.ts` / `database.merged.ts` / barrel |

REQUIREMENTS.md marks both as `Complete` — consistent with the evidence above.

### Anti-Patterns Found

None. `grep -nE "TBD|FIXME|XXX|TODO|HACK|PLACEHOLDER"` over every phase-modified source file (`supabaseDataProvider.ts`, `supabaseDataProvider.test.ts`, `rpcNullabilityGate.test.ts`, `RPC-NULLABILITY.md`, `database.merged.ts`, `database.overrides.ts`, `index.ts`, `assert-rpc-return-nullability.mjs`, `main.yaml`, `supabase-types/package.json`) returns zero hits across the whole set.

### Known Open Items (recorded, not gaps)

Confirmed present and correctly recorded — not re-flagged as failures per phase instructions:

- **`supabase-types-drift` CI job never observed running.** `.github/workflows/main.yaml` triggers only on `push`/`pull_request` to `main`; `integration/ship-12-squash` has never been pushed (766 commits ahead of `origin/main`). Carried as `164-03`/`164-05` coverage `D6`, a STATE blocker, and WINDOWS 242/252. Operator decision to open a draft PR is correctly routed to Phase 163, not this phase. **Confirmed never recorded anywhere in this phase's artifacts as "verified in CI."**
- **164-03 Task 1 precondition (`db:lint:sql` in `main.yaml`) unmet** because Phase 163 hasn't landed — proceeded on operator override, additions-only. Recorded in `164-03-SUMMARY.md`.
- **Stale line-anchors across the phase** (`:300`→`:360`, `:301-302`→`:360-362`, stale 32/33 cast counts→16, stale Phase-157 cast anchors, non-existent `.js` barrel extension) — all measured, corrected, and filed as WINDOWS 240/243/244/245/246. Independently re-confirmed several of these during this verification (e.g. the `:360-362` anchor, the 16-hit naive grep, the exact-match `index.ts:1`).
- **`packages/supabase-types/tsconfig.tsbuildinfo` restore is a no-op.** Confirmed gitignored/untracked (`.gitignore:29`), so the prescribed `git checkout --` errors; substance (clean tree) holds regardless. Three independent confirmations across 164-03/04/05, not re-run here as it's a documented, understood non-issue.
- **WINDOWS 241 and 248** ("E2E not run for 164-02 / 164-04") remain formally `open` in the WINDOWS.md table with no `closed_at` — a minor bookkeeping gap, since 164-05's gate 7 (full E2E, 155/0/0/0/0) supersedes both concerns in substance. Not a functional gap; noted for administrative completeness only.
- **The original triggering todo, `.planning/todos/pending/2026-07-16-rpc-returns-table-nullability-audit.md`** (`resolves_phase: 150`, this phase's earlier number), remains in `pending/` rather than moved to `done/`, despite this phase fully discharging its stated problem and all three of its proposed solution options being subsumed by the shipped override-layer mechanism (option 3). This is a small housekeeping gap in the todo lifecycle — not a functional deficiency — and does not affect any of the four ROADMAP criteria.
- **Two new adjacent findings filed as pending todos** (`2026-09-03-datawriter-row-erasure-absorbs-rpc-nullability.md`, `2026-09-03-deno-edge-functions-do-not-consume-supabase-types.md`) are correctly out-of-scope discoveries, filed rather than fixed, consistent with the phase's stated boundary (COVERAGE.md).

### Human Verification Required

None. All four ROADMAP success criteria are independently verifiable and were independently verified against the live tree — no visual, real-time, or subjective judgment was required.

### Gaps Summary

No blocking gaps. All four ROADMAP success criteria are met, independently confirmed against the codebase rather than taken from SUMMARY claims — including reproducing two of the phase's own mutation-based negative-control proofs (NC-1's type-level failure proof, NC-7a's barrel-bypass proof) from scratch and confirming byte-identical reverts. The four cheap gates (`typecheck`, `lint:check`, `format:check`, `test:unit`) all pass at exit 0 on the current tree. The full E2E suite was not re-run per instructions; its logged evidence on disk (`tests/e2e-runs/164-05-cardinal-gate/`) matches the claimed 155/0/0/0/0 result exactly. The only genuinely outstanding item is the never-run `supabase-types-drift` CI job, which the phase's own artifacts already and correctly record as unobserved rather than verified — this is explicitly out of this phase's scope (routed to Phase 163) and is not a phase-164 gap.

---

_Verified: 2026-09-03T13:20:00Z_
_Verifier: Claude (gsd-verifier)_
