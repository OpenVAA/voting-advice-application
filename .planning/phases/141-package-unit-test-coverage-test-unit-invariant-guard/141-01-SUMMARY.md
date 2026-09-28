---
phase: 141-package-unit-test-coverage-test-unit-invariant-guard
plan: 01
subsystem: testing
tags: [turbo, vitest, monorepo, ci, github-actions, negative-control, evidence]

# Dependency graph
requires:
  - phase: 140-blind-matcher-remediation-teardowns-null-matchers-positive-c
    provides: the two-run ledger format (140-NEGATIVE-CONTROL.md) and the committed evidence-record format (140-GATES.md) reused verbatim here
provides:
  - "141-MEASUREMENT.md — the UNIT-03 record: five candidate workspaces measured green at HEAD 8b565af22 (18 test files, 140 tests, exit 0), committed before any package.json is touched"
  - "The git-ancestry anchor for plan 02's five wiring commits: `git merge-base --is-ancestor <record> <wiring>` plus hash inequality, over a fixed lexicographic iteration order"
  - "Wiring authorisation for all five candidates (argument-condensation, core, llm, matching, question-info); no skip contract issued"
  - "141-NEGATIVE-CONTROL.md — three BLINDNESS halves captured while the tree is still unwired (UNIT-01, UNIT-04, UNIT-02), none of which can be observed again after plan 02 lands"
  - "The naive-GREEN vs discriminating-RED delta from ONE --dry=json payload, which plan 03's Check 2 must reproduce"
  - "A six-file CI invocation inventory retiring research assumption A2 (CONFIRMED)"
affects: [141-02 wiring, 141-03 guard script, 141-05 phase gates, any future package added under packages/]

actuals:
  tokens: 6735
  tasks: 3
  commits: 3

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Measure-before-wire as a plan-shape constraint: the measurement record is its own plan in its own wave, so wiring is structurally unable to precede it"
    - "Ancestry-plus-hash-inequality as the ordering oracle, never timestamps (two commits in the same second carry equal timestamps)"
    - "Two-run ledger opened by the plan that can observe the blindness half, appended to by the plans that produce the catch halves"
    - "Turbo --dry=json discrimination: filter on `command !== '<NONEXISTENT>'`; presence in tasks[] is not execution"

key-files:
  created:
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-MEASUREMENT.md
    - .planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md
  modified: []

key-decisions:
  - "All five candidate workspaces measured green (exit 0) in this phase's own runs, so UNIT-02's skip-contract branch is unused — plan 02 is authorised to wire all five"
  - "Research assumption A2 is CONFIRMED across all six workflow files: main.yaml:70 and :197 are the only CI unit-test invocations; the third test:unit hit at main.yaml:119 is a comment"
  - "main.yaml:197 (yarn workspace @openvaa/dev-seed test:unit) is a deliberate bypass and not a coverage-hole vector — it names one already-covered workspace and enumerates nothing, so it cannot drift as workspaces are added"
  - "vitest.workspace.ts and test:unit:watch are explicitly out of scope as wiring surfaces (deprecated in Vitest 3.2.4, bypasses turbo's dependsOn build, replaces a per-workspace contract with a glob)"
  - "The cross-check runner used for the discrimination proof is a transient scratch script, not committed — this plan ships zero code; plan 03 owns the permanent implementation"

patterns-established:
  - "Evidence-integrity prohibition honoured: every verdict traces to a command executed inside this phase; no row cites 141-RESEARCH.md or 141-CONTEXT.md as its source"
  - "Injection isolation: transient plants reverted by targeted rm of the exact created paths; cleanliness asserted only over `git status --porcelain -- packages` so plan 141-04's concurrent live injections under tests/ are untouched"

requirements-completed: [UNIT-03]

coverage:
  - id: D1
    description: "Committed per-package pass/fail record for all five candidate workspaces, whose commit touches no package.json and therefore strictly precedes every wiring commit (UNIT-03's git-order property)"
    requirement: UNIT-03
    verification:
      - kind: other
        ref: "node -e (section + five-workspace presence check over 141-MEASUREMENT.md)"
        status: pass
      - kind: other
        ref: "git log --format='%H %s' -- 141-MEASUREMENT.md | git show --stat -> 0 package.json files in either commit"
        status: pass
      - kind: unit
        ref: "cd packages/{argument-condensation,core,llm,matching,question-info} && npx vitest run -> 5x exit 0, 18 files, 140 tests"
        status: pass
    human_judgment: false
  - id: D2
    description: "Three BLINDNESS halves recorded as runs on the still-unwired tree: UNIT-01 (two live failing assertions leave yarn test:unit at exit 0, zz-plant count 0), UNIT-04 (a test-bearing scratch workspace with no test:unit script leaves exit 0 while present in turbo's graph), UNIT-02 (naive cross-check GREEN, discriminating RED naming five workspaces, from one payload)"
    verification:
      - kind: other
        ref: "yarn test:unit with plants -> EXIT=0, 'Tasks: 21 successful, 21 total', grep -c zz-plant = 0"
        status: pass
      - kind: other
        ref: "npx turbo run test:unit --dry=json with packages/zz-scratch -> 16 tasks, scratch present with command '<NONEXISTENT>'; yarn test:unit -> EXIT=0"
        status: pass
      - kind: other
        ref: "crosscheck over dry-head.json -> NAIVE 0 unaccounted (GREEN) vs DISCRIMINATING 5 unaccounted (RED)"
        status: pass
      - kind: other
        ref: "git status --porcelain -- packages -> 0 lines after every revert"
        status: pass
    human_judgment: false
  - id: D3
    description: "Six-file CI invocation inventory resolving research assumption A2, including explicit zeroes for the five workflow files with no hits"
    verification:
      - kind: other
        ref: "grep -rn 'test:unit|vitest|turbo run test' .github/workflows/ -> 3 hits, all in main.yaml (:70, :119 comment, :197)"
        status: pass
      - kind: other
        ref: "node -e (inventory section + CONFIRMED/CORRECTED verdict + main.yaml:197 named)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-08-18
status: complete
---

# Phase 141 Plan 01: Measure Before Wire Summary

**Five candidate workspaces measured green in-phase and committed as a git-ancestry anchor, plus the three blindness halves (UNIT-01, UNIT-04, UNIT-02) captured on the last tree state where they are observable at all.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-18T15:43:00Z
- **Completed:** 2026-08-18T15:55:17Z
- **Tasks:** 3
- **Files modified:** 2 created, 0 modified

## Accomplishments

- **UNIT-03's actual property established as a git fact.** `141-MEASUREMENT.md` records five per-workspace verdicts produced by runs executed inside this phase (`argument-condensation` 6/30, `core` 3/8, `llm` 2/39, `matching` 5/43, `question-info` 2/20 — 18 files, 140 tests, every exit code 0), and its commit `6c10d63d0` touches zero `package.json` files. Plan 02's wiring commits are now structurally unable to precede it. The ancestry check is written into the record as ancestry **plus hash inequality** over a fixed lexicographic iteration order — never a timestamp comparison.
- **The skip-contract branch retired on measurement, not assumption.** All three Experimental packages ran green with no network and no API key, re-established here by three checks: local-filesystem prompt loading in both `tests/setup.ts` files, all four `apiKey` occurrences being the literal `'test-api-key'`, and zero executable `process.env` reads across the five packages (the single `question-info` hit is a line inside a JSDoc example). This independently retires research assumption A5.
- **Three blindness halves captured before they became uncapturable.** Two live failing assertions planted in `packages/core` and `packages/matching` left `yarn test:unit` at **exit 0** reporting `21 successful, 21 total`, with `zz-plant` appearing **0 times** in the full output. A scratch `packages/zz-scratch/` holding a test file and no `test:unit` script was named in turbo's own `Packages in scope` line (16 packages) and then silently skipped — again **exit 0**.
- **The UNIT-02 cross-check proven to need its filter.** From one `--dry=json` payload at HEAD, the naive variant reports **0 unaccounted (GREEN)** while the discriminating variant reports **5 unaccounted (RED)** — `@openvaa/argument-condensation`, `@openvaa/core`, `@openvaa/llm`, `@openvaa/matching`, `@openvaa/question-info`. Same payload, so the entire delta is attributable to the `command !== '<NONEXISTENT>'` filter. The census (7 executed / 8 unwired / 11 test-bearing) was re-derived from that payload rather than quoted.
- **Assumption A2 CONFIRMED across all six workflow files.** Three `test:unit` hits, all in `main.yaml`: `:70` (the root script), `:197` (the deliberate dev-seed bypass) and `:119` (a comment). Zero hits for `vitest` and zero for `turbo run test` anywhere in `.github/workflows/`.
- **Zero product code shipped; the tree under `packages/` ends byte-identical to how it started.** Every injection was reverted by a targeted `rm` of the exact created paths, and `git status --porcelain -- packages` returned 0 lines at every boundary.

## Task Commits

Each task was committed atomically:

1. **Task 1: Measure all five candidate packages and commit the UNIT-03 record** — `6c10d63d0` (docs)
2. **Task 2: Capture the three blindness halves on the still-unwired tree** — `227b0a9b7` (docs)
3. **Task 3: Resolve research assumption A2 — the complete CI unit-test invocation inventory** — `0ab014b30` (docs)

## Files Created/Modified

- `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-MEASUREMENT.md` — the UNIT-03 record (per-package verdicts, verbatim commands, the ancestry check, why no skip contract, wiring authorisation) plus the six-file CI invocation inventory appended by Task 3.
- `.planning/phases/141-package-unit-test-coverage-test-unit-invariant-guard/141-NEGATIVE-CONTROL.md` — this phase's two-run ledger, opened with three BLINDNESS rows and a status table naming plan 02 and plan 03 as owners of the three owed CATCH halves.

Transient, created and removed inside their own task, never committed: `packages/core/src/zz-plant.test.ts`, `packages/matching/tests/zz-plant.test.ts`, `packages/zz-scratch/` (`package.json` + `src/a.test.ts`).

## Decisions Made

- **Wire all five, skip-contract none.** The Verdict column is 5/5 PASS, so `141-MEASUREMENT.md` § Wiring authorisation names all five workspaces and no others. UNIT-02's second branch is documented as a backstop this phase does not exercise.
- **A2 CONFIRMED rather than corrected.** The statement stands as written; what changed is its basis — a measurement over six files rather than an extrapolation from one — so its medium risk rating is retired.
- **`main.yaml:197` classified as a non-vector, with a reason.** It names exactly one already-covered workspace and enumerates nothing, so a newly added package cannot be silently omitted from it. The hole UNIT-04 guards is unreachable through that invocation.
- **The discrimination runner stays uncommitted.** This plan ships zero code (D-14), so the cross-check was run from a scratch `.cjs` outside the repository. Both predicates are stated verbatim in the ledger and the full `tasks[]` projection is embedded, so the two verdicts remain auditable against one another; plan 03 owns the permanent `scripts/assert-unit-test-coverage.mjs`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Task 2's automated verify command fails on macOS due to `wc -l` left-padding**

- **Found during:** Task 2 (Capture the three blindness halves)
- **Issue:** The plan's verbatim verify ends `git status --porcelain -- packages | tee /dev/stderr | wc -l | grep -qx '0'`. BSD `wc -l` emits `       0` with leading whitespace, so `grep -qx '0'` never matches and the command exits 1 even when the tree is provably clean. Running it verbatim produced `verbatim_verify_exit=1` against a `packages` tree with zero porcelain lines — a false failure in the verification, not in the artifact.
- **Fix:** Ran the functionally equivalent `git status --porcelain -- packages | wc -l | tr -d ' ' | grep -qx '0'`, which exits 0. The node ledger-content half of the same verify passed verbatim (`OK`). Both halves of the plan's intent are therefore satisfied.
- **Files modified:** None — this is a defect in the plan's shell command, not in any committed file.
- **Verification:** `git status --porcelain -- packages | wc -l | tr -d ' '` → `0`, re-confirmed after Task 3 and after the closing `yarn test:unit` baseline run.
- **Committed in:** No code change; recorded here.

---

**Total deviations:** 1 auto-fixed (1 bug, in a verification command rather than in a deliverable)
**Impact on plan:** None on scope or content. Every acceptance criterion is met by the committed artifacts; only the shell idiom used to confirm one of them changed.

## Issues Encountered

None. The measurement, both injections and their reverts all behaved as the plan predicted, and every recorded exit code matched the expected "before" state.

## Verification

Plan-level verification, all green:

| Check | Result |
|---|---|
| `141-MEASUREMENT.md` and `141-NEGATIVE-CONTROL.md` exist and are committed | ✅ `6c10d63d0`, `227b0a9b7`, `0ab014b30` |
| `git log … -- 141-MEASUREMENT.md` returns commits; `git show --stat` lists no `package.json` | ✅ both commits: 0 `package.json` files |
| `git status --porcelain -- packages` empty | ✅ 0 lines |
| `yarn test:unit` exits 0 on the untouched tree (baseline unchanged) | ✅ EXIT=0, `21 successful, 21 total`, 15.7 s |
| Task 1 automated verify (five rows + four sections) | ✅ `OK` |
| Task 2 automated verify (ledger terms + tree cleanliness) | ✅ `OK` + clean (see Deviations #1 for the `wc -l` idiom) |
| Task 3 automated verify (inventory section + A2 verdict + `main.yaml:197` named) | ✅ `OK`, 3 workflow hits |

**`.agents/code-review-checklist.md` discharge.** The checklist's three sections — *Supabase Backend*, *Supabase Adapter*, *Edge Functions* — apply to **no file this plan touches**. This plan created two Markdown documents under `.planning/` and shipped zero product code: no migration, no RLS policy, no adapter, no Edge Function, no TypeScript source. The item is discharged as not-applicable rather than skipped, per the plan's explicit instruction to record it.

## User Setup Required

None — no external service configuration required. This plan ran no installs (the scratch workspace was deliberately created without `yarn install`, leaving the lockfile untouched) and required no keys or network access.

## Next Phase Readiness

**Plan 02 (wiring) is unblocked and authorised.** `141-MEASUREMENT.md` § Wiring authorisation names all five workspaces; the record's commit `6c10d63d0` is the ancestry anchor its five `package.json` commits must descend from. The ancestry check is written into the record as a runnable snippet.

**Three CATCH halves are owed and tracked.** `141-NEGATIVE-CONTROL.md` § Ledger status carries a table naming the owner of each: UNIT-01 → plan 02, UNIT-02 → plan 03, UNIT-04 → plan 03. Until each pair is complete, no UNIT-* guard in this phase may be described as proven.

**Concrete targets handed to plan 03.** Its Check 2 must reproduce RED-at-HEAD naming the same five workspaces, and turn GREEN only after plan 02's scripts land; the post-wiring executed/unwired split should be 12/3 (`dev-tools`, `shared-config`, `supabase-types` — the three legitimately test-free packages). Its guard script must fail by name on the recorded `packages/zz-scratch/` shape.

No blockers. No concerns.

---
*Phase: 141-package-unit-test-coverage-test-unit-invariant-guard*
*Completed: 2026-08-18*

## Self-Check: PASSED

All created files present on disk (`141-MEASUREMENT.md`, `141-NEGATIVE-CONTROL.md`,
`141-01-SUMMARY.md`) and all three task commits present in `git log --all`
(`6c10d63d0`, `227b0a9b7`, `0ab014b30`). No missing items.
