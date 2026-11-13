---
phase: 180-edge-functions-typecheck-shared-modules
plan: 01
subsystem: docs
tags: [deno, edge-functions, spike-findings, e2e-instruments, skill-routing]

requires:
  - phase: spike/deno-edge-typecheck (796e610a7)
    provides: the deno-edge-typecheck reference and the sources of spikes 037-040
provides:
  - the Deno edge-typecheck skill reference and its 13 sources on this branch, byte-identical to 796e610a7 but for one added section
  - the reference's section "On `feat/entity-signup-multi-grant`" with this tree's facts, void steps and history-only patches
  - the spike-findings SKILL.md index entries and the CLAUDE.md routing entry for the fourth domain
  - 180-totals.mjs, 180-run-checks.mjs and 180-E2E-DELTAS.md, the instruments plan 02's targeted run and plan 03's full run are judged with
affects: [180-02, 180-03]

actuals:
  tokens: 38700
  tasks: 2
  commits: 2
plan_head_before: 9276a726e31ef77c3ff197bd23d33d30f3768f40
plan_head_after: 411280fc3c47704fc8cefa5453d2d697ebe1f424

tech-stack:
  added: []
  patterns:
    - "A spike record brought over verbatim, with the branch's state in one added section rather than edits to the record"

key-files:
  created:
    - .claude/skills/spike-findings-voting-advice-application-gsd/references/deno-edge-typecheck.md
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/037-deno-check-functions/ (3 files)
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/038-editor-blast-radius/ (2 files)
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/039-shared-module/ (3 files)
    - .claude/skills/spike-findings-voting-advice-application-gsd/sources/040-toolchain-wiring/ (5 files)
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-totals.mjs
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-run-checks.mjs
    - .planning/phases/180-edge-functions-typecheck-shared-modules/180-E2E-DELTAS.md
  modified:
    - .claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md
    - CLAUDE.md

key-decisions:
  - "The SKILL.md description joins clause (4) with 'and', so '(2) …, and (3)' became '(2) …, (3)'; the three existing clauses' text is unchanged"
  - "The spike SKILL.md's <context> paragraph and session line for 037-040 were not brought over: the plan's step 3 lists description, Feature Areas, requirements, Source Files and Processed Spikes only"

patterns-established:
  - "Run-of-record checks for phase 180: 180-totals.mjs (--slice targeted, --full plan 03) and 180-run-checks.mjs (--projects <record of `project: <name>` lines>)"

requirements-completed: []

coverage:
  - id: D1
    description: "Spike reference and the 13 sources of 037-040 on the branch, byte-identical to 796e610a7 except the added section"
    requirement: E2E-03
    verification:
      - kind: other
        ref: "tests/e2e-runs/180-unit/180-01-t1-verify.sh (git diff --quiet 796e610a7 HEAD over the four directories; the reference with the section cut out equals the spike's bytes)"
        status: pass
    human_judgment: false
  - id: D2
    description: "SKILL.md index and CLAUDE.md routing name the fourth (Deno) domain"
    requirement: E2E-03
    verification:
      - kind: other
        ref: "tests/e2e-runs/180-unit/180-01-t1-verify.sh; yarn prettier --check CLAUDE.md (exit 0)"
        status: pass
      - kind: unit
        ref: "UNIT_STACKFREE, tests/e2e-runs/180-unit/180-01-gate-unit-stackfree.log (e2eDocPreconditionGate.test.ts reads CLAUDE.md)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The added section's restated facts are accurate for this tree"
    verification: []
    human_judgment: true
    rationale: "The section restates 180-CONTEXT.md facts 3-13 measured at 7c4aa88e5; module counts, file locations and lint-finding functions were re-read, but the deno check, deno lint and deno fmt figures were not re-run (no deno on PATH in this plan)"
  - id: D4
    description: "Roadmap criteria 1 and 3 read as amended by D-02"
    requirement: E2E-03
    verification:
      - kind: other
        ref: "tests/e2e-runs/180-unit/180-01-t2-verify.sh (the ROADMAP § Phase 180 clause check)"
        status: pass
    human_judgment: false
  - id: D5
    description: "180-totals.mjs, 180-run-checks.mjs and 180-E2E-DELTAS.md exist and bite"
    requirement: E2E-03
    verification:
      - kind: other
        ref: "tests/e2e-runs/180-unit/180-01-{totals-green,totals-red,totals-rows-read,totals-rows-scoped,totals-unreadable,runchecks-green,runchecks-red-restore,runchecks-red-project,runchecks-unreadable}.exit = 0,1,0,1,2,0,1,1,2"
        status: pass
    human_judgment: false

duration: ~10min
completed: 2026-11-12
status: complete
---

# Phase 180 Plan 01: Spike reference, sources and E2E instruments Summary

**The Deno edge-typecheck blueprint of spikes 037–040 is on the branch byte for byte with a dated "On `feat/entity-signup-multi-grant`" section (three functions, 26 modules, 0 baseline errors, the void steps and history-only patches). It is routed from CLAUDE.md as the skill's fourth domain. The phase's totals check, run checks and empty deltas table are each shown red and green against 179.2-final-3 and 179.2-final-4.**

## Performance

- **Duration:** about 10 min. The start time was not recorded; the first scratch file is from 2026-11-12T20:35Z, and the plan began a few minutes before that.
- **Completed:** 2026-11-12T20:40Z
- **Tasks:** 2 of 2
- **Files:** 19 (16 created, 2 modified, 1 SUMMARY)

## Accomplishments

- `git checkout 796e610a7 --` brought over `references/deno-edge-typecheck.md` and the 13 files under `sources/037-deno-check-functions` (3), `038-editor-blast-radius` (2), `039-shared-module` (3) and `040-toolchain-wiring` (5). `git diff --quiet 796e610a7 HEAD` exits 0 over the four directories, and `sources/` now holds 72 files in 20 directories.
- One section, `## On \`feat/entity-signup-multi-grant\``, was inserted between the intro paragraph and `## Requirements`. With it cut out, the reference equals the spike's file byte for byte. The section has five parts: this tree, void on this branch, history only, what phase 180 does, and running the scripts.
- Spike-findings `SKILL.md`:
  - the description now says "four domains" and has a (4) clause;
  - the `Deno Edge Function Typecheck` Feature Areas row was added, its last sentence replaced as the plan says;
  - the spike's `deno-edge-typecheck` requirements block was copied verbatim;
  - a Source Files paragraph and the four Processed Spikes entries were added.
- In CLAUDE.md § Skill Routing, the spike-findings entry now says "four domains:" and has a Deno sub-bullet. Nothing else in CLAUDE.md changed, and `yarn prettier --check CLAUDE.md` exits 0.
- The A1 amendment is in place: criterion 1 contains "measured 0 on Deno 2.9.6" and "supabaseAdmin: any", without "fixed, not suppressed". Criterion 3 contains "`callerAuthority.ts` (1 copy, 1 consumer)", "`entityGrant.ts` no longer exists" and "287a2b97d". ROADMAP.md was not changed.
- `180-totals.mjs` differs from `179.2-totals.mjs` only in its name, the two defaults and `DELTA_ROW` (checked with `diff`). `180-run-checks.mjs` follows the execution rules' contract. `180-E2E-DELTAS.md` holds the header and no row.

## Task Commits

1. **Task 1 (tracer): reference, sources, index, router.** `ce76f0fc0` (docs)
2. **Task 2: A1 check, totals check, run checks, deltas table.** `411280fc3` (docs)

**Plan metadata:** the SUMMARY commit, which follows these.

## Evidence (all in `tests/e2e-runs/180-unit/`, gitignored)

| Gate / control | Exit | Expected | Telling line |
|---|---|---|---|
| `180-01-gate-prettier-claude` | 0 | 0 | All matched files use Prettier code style! |
| `180-01-gate-unit-stackfree` (UNIT_STACKFREE, lone `--filter='!@openvaa/dev-seed'` form) | 0 | 0 | turbo `24 successful, 24 total`; dev-seed non-integration `79 files / 1254 tests`; `test:unit:tests` `13 files / 224 tests`; `@openvaa/supabase:test:unit` 41 lines, `@openvaa/frontend:test:unit` 356 lines, `@openvaa/dev-seed:test:unit` 0 lines |
| `180-01-t1-verify.sh` (the plan's `<automated>`, byte for byte) | 0 | 0 | — (also 0 when re-run on the final HEAD) |
| `180-01-t2-verify.sh` | 0 | 0 | — |
| `totals-green` (final-4 `--full`) | 0 | 0 | `180-totals: OK (full, 129 projects, 729 tests)` |
| `totals-red` (final-3 `--full`) | 1 | 1 | `project admin-account-flows: total 19, expected 22 (baseline 22, delta 0)` |
| `totals-rows-read` (final-3 + a `180-99` row of −3) | 0 | 0 | `180-totals: OK (full, 129 projects, 726 tests)` |
| `totals-rows-scoped` (the same row under `179.2-99`) | 1 | 1 | the `admin-account-flows` mismatch line |
| `totals-unreadable` | 2 | 2 | `cannot read …/no-such-run/summary.json` |
| `runchecks-green` (final-4, bank-auth + contestant-identity-provider) | 0 | 0 | `functions: account-access, identity-callback, send-email; served: the same; 2 projects checked` |
| `runchecks-red-restore` (restore.txt without `OPTIONS send-email: 200`) | 1 | 1 | ``restore: no line `OPTIONS send-email: 200` `` |
| `runchecks-red-project` (`project: no-such-project`) | 1 | 1 | `project no-such-project: absent from the run` |
| `runchecks-unreadable` | 2 | 2 | `cannot read …/no-such-run/restore.txt` |

The five totals-check statuses are 0, 1, 0, 1, 2.

## Observed and inferred

- **Observed in this plan:**
  - the byte identity of the 13 sources and the cut-out reference;
  - every exit status in the table above;
  - the A1 clauses;
  - the module counts per function (9/7, 12/13, 5/5);
  - which files exist, and that `entityGrant.ts` does not;
  - that nothing under `apps/` or `scripts/` changed between `7c4aa88e5` and the plan's base (`git diff --quiet`);
  - that the four `require-await` lines of fact 13 are `callerMayOnProject`, `callerMayOnEntity`, `issueSignInLink` and `issueRecoveryLink`.
- **Restated, not re-measured:** the section's `deno check` exits (2.9.6, 2.7.8), the planted TS2322/TS2345 pair, the `deno lint` count and the `deno fmt --check` 26-of-27 figure. These come from `180-CONTEXT.md` facts 3–13, measured at `7c4aa88e5`. `deno` is not on `PATH` before plan 02 installs it, and the tree has not changed since that measurement, so they are expected to hold.

## Decisions Made

- The description clause (4) is joined with "and". Its "(2) …, and (3)" became "(2) …, (3)"; the text of the three existing clauses is unchanged.
- The spike SKILL.md's `<context>` paragraph and its session line for 037–040 were not brought over. The plan's step 3 names only five places.

## Deviations from Plan

None. The plan was executed as written.

## E2E

- **Deltas:** none (`180-E2E-DELTAS.md` holds its header only).
- **Title pins:** none touched. No spec changed, including the two bank-auth spec files `contestant-bank-auth.spec.ts` and `contestant-identity-provider.spec.ts`.
- **Run:** none. Plan 01 is docs only (D-23); no stack, `db:*`, `supabase` or E2E command was run, and nothing was pushed.

## Issues Encountered

None.

## Next Phase Readiness (for plan 02)

- **`deno` and the tree:** `deno` is not installed in this worktree yet. The tree's function code is unchanged from `7c4aa88e5`, so the CONTEXT facts still hold.
- **The project record:** `180-run-checks.mjs --projects <record>` reads only lines of the exact form `project: <name>` (trimmed) and ignores every other line, so prose and tables can sit beside them. A record without such a line is a mismatch. `$P/180-function-projects.md` must list one `project: <name>` line per project.
- **The function set:** the run checks take it from `git ls-files` at run time (directories with a tracked `index.ts`, none starting with `_`). After the `_shared/` move it stays the same three functions. A `restore.txt` line naming `_shared` is a mismatch.
- **Judging the targeted run:** use `node $P/180-totals.mjs <run> --slice`, which defaults to `179.2-final-4` and `180-E2E-DELTAS.md`.
- **What the section promises plan 02:**
  - the four-key `deno.json`, byte-identical to `sources/040-toolchain-wiring/deno.json`;
  - `_shared/` holds `envConfig.ts` and `placeholderAddress.ts` (`identity-callback`'s copy kept) with their tests;
  - `callerAuthority.ts` stays in `send-email/`;
  - `jwtSegment` is deleted;
  - the guard summary reads `2 of 2 (env-default; vitest-reachability)`;
  - the editor setting is documented in `apps/supabase/README.md` and the docs edge-functions page.

  Plan 03 updates the section with the post-phase counts. No other plan edits it.
- **CLAUDE.md:** it is now settled for the phase, and plan 02 does not edit it (execution rules § Commits).
- **The logs:** `tests/e2e-runs/180-unit/` exists and is gitignored.

## Self-Check: PASSED

- All 16 created paths exist on disk: `FOUND`.
- `ce76f0fc0` and `411280fc3` are ancestors of HEAD: `FOUND`.
- `git rev-list --count 9276a726e..411280fc3` is 2, and both commits change no path under `apps/`, `packages/`, `tests/` or `scripts/`.
