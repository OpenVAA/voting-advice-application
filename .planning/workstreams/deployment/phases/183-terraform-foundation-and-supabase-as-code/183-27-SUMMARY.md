---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 27
subsystem: infra
tags: [lint-check, format-check, terraform-validate, supa-11, criterion-5, final-gates]
status: complete

requires:
  - phase: 183-13
    provides: "the chain observation (attempt 13-1, Chain observation: made) and the gates' commit 5322ab1f6"
  - phase: 183-15
    provides: "the infra-validate job seen passing in run 39591102824 (attempt 15-3, Run observation: seen)"
  - phase: 183-23
    provides: "the import of the persistent project (attempt 23-3, Clause C5.1 import: seen)"
  - phase: 183-25
    provides: "the state read, the refused destroy, the apply and the empty second plan (attempt 25-2)"
  - phase: 183-26
    provides: "the parity guard's direct red controls (attempt 26-2, 12 of 12 as expected)"
provides:
  - "yarn lint:check, yarn format:check and yarn test:unit each exit 0 at de904bfff, tree 0/0 before and after, after the last edit to a guard, hosted-settings.json or a tracked variable file"
  - "both guards and self-tests, check-settings-types.sh, terraform fmt and init/validate of 8 roots, and the three gate specs exit 0 on the final tree"
  - "criterion 5 of phase 183, clause by clause: C5.1 to C5.6 all seen, each tied to a dated source naming its current attempt; SUPA-11: observed"
  - "evidence/183-27-final-gates.md"
affects: [183-28, phase-183-verification]

estimate:
  tokens: 40000
  tasks: 2
actuals:
  tokens: 2839     # chars/4 over the realized diff (11354 chars), before this SUMMARY
  tasks: 2
  commits: 3       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: de904bfff279f57d14f8481366ce5b1ffa3d64e8
plan_head_after: afd8943f0d78cd2216a11b4c3f57841fea167e2a

tech-stack:
  added: []
  patterns:
    - "Terraform validation without credentials runs each root with its own TF_DATA_DIR under a mktemp -d directory, so no root's .terraform is written or read"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-27-final-gates.md
  modified: []

key-decisions:
  - "SUPA-11 recorded as observed: lint:check and format:check exit 0 on the final tree (de904bfff, 0/0) and all six clauses of criterion 5 read seen from sources that name their current attempts"
  - "C5.6 rests on the CI run of 2026-10-21 at 18fdcd6ca; the infra edits since (183-14, 183-21, 183-23, 183-24) were validated with the job's commands locally on the final tree, not in CI"

requirements-completed: [SUPA-11]

duration: 7min
completed: 2026-10-25
---

# Phase 183 Plan 27: Final gates and criterion 5 Summary

**Both chains exited 0 on the final tree: `yarn lint:check` 0 and `yarn format:check` 0 at de904bfff, with the tree clean (0/0) before and after each run. Every clause of criterion 5, C5.1 to C5.6, is `seen`, so SUPA-11 is recorded as observed.**

## Performance

- **Duration:** about 7 min (07:56:50Z to 08:03Z)
- **Started:** 2026-10-25T07:56:50Z
- **Completed:** 2026-10-25
- **Tasks:** 2 of 2
- **Files created:** 1 (the evidence file)

## Accomplishments

- **Task 1, the chains on the final tree.** At de904bfff279f57d14f8481366ce5b1ffa3d64e8, HEAD was the same before and after every gate and the tree was 0/0, so nothing was re-run:
  - `lint:check` exited 0. The chain reached both of this phase's guards: the inline-policy guard found 0 findings in 42 `.tf` files, and the parity guard reported every key holding.
  - `format:check` exited 0.
  - `test:unit` exited 0 (frontend 5948 passed and 31 skipped, dev-seed 1207 passed, the tests workspace 189 passed).
  - The last edits to the guard and its inputs were 55802a1bc (183-24) and 839238881 (183-21). The last edits to the tracked variable files were b988931f3 (183-23) and 1d90d8ead (183-14). All four are ancestors of the gated commit.
- **Task 2, the guards, the roots and the specs on the same tree.** Everything exited 0:
  - both guards, each with its `--self-test`: 9 of 9 findings for the inline-policy guard, 66 cases for the parity guard;
  - `check-settings-types.sh`;
  - `terraform fmt -check -recursive infra`;
  - `init -backend=false -input=false -lockfile=readonly` and `validate` for all 8 roots;
  - the three gate specs (3 files, 36 tests).
- **Criterion 5, clause by clause.** All six clauses are `seen`. Each source file's `Attempt:` line matches the helper's `id` for its key, and each file carries its own observation line.

| Clause | Date | Source |
| --- | --- | --- |
| C5.1 | 2026-10-23 | 183-23 (key 23-3), with the state read of 183-25 (key 25-2) |
| C5.2 | 2026-10-23 | 183-25 (key 25-2) |
| C5.3 | 2026-10-23 | 183-25 (key 25-2) |
| C5.4 | 2026-10-25 | this plan (key 27-2). The parity guard found no second writer in 203 tracked files. A wider grep finds the command only in `.planning/` prose |
| C5.5 | 2026-10-19 | 183-13 (key 13-1), with 183-26 (key 26-2) |
| C5.6 | 2026-10-21 | 183-15 (key 15-3): run 39591102824 green, run 39591102968 red as intended |

## Task Commits

1. **Task 1: lint:check, format:check and test:unit on the final tree.** `bcf3483f3`
2. **Task 2: the guards, the roots and criterion 5 clause by clause.** `b66a3f02b`
3. **Correction: the measured end time of the verify re-run.** `afd8943f0`

## Files Created/Modified

- `.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-27-final-gates.md`: the dated record of the chains, the guards and the roots on the final tree, and where each clause of criterion 5 was observed.

## Decisions Made

- SUPA-11 is ticked. The plan's rule is met: both chains exited 0 on the final tree, and all six clauses read `seen` from sources that name their current attempts.

## Deviations from Plan

### Execution adjustments

**1. [Binding constraint] The validation loop used a throwaway `TF_DATA_DIR` for each root**
- **Found during:** Task 2, the validation run and verify command 2.
- **Issue:** As written, the verify command runs `terraform -chdir=<root> init` with no `TF_DATA_DIR`. That would write each root's own `.terraform`, which the orchestrator's constraints forbid.
- **Fix:** The commands were otherwise identical. Each root got its own `TF_DATA_DIR` under one `mktemp -d` directory in `$TMPDIR`, and that directory was removed afterwards (checked twice: `removed=yes`).
- **Files modified:** none.

**2. [Environment] Terraform on the workstation is v1.16.5**
- **Found during:** Task 2.
- **Issue:** The plan's execution rules say 1.14.7. The installed binary is v1.16.5, the version the `infra-validate` job pins.
- **Fix:** None needed. The version is recorded in the evidence file.

**3. [Rule 1 - Accuracy] The verify re-run's time was corrected**
- **Found during:** writing the SUMMARY.
- **Issue:** The evidence first said the verify re-run happened "around 08:03Z". The status files show it ended at 08:02:05Z.
- **Fix:** Corrected in the attempt file and in the evidence file.
- **Commit:** `afd8943f0`

**4. [Note] Verify commands re-run at bcf3483f3**
- The verify commands of Task 2 were run again at bcf3483f3, after Task 1's evidence commit. That commit differs from de904bfff only by the evidence file, which sits under `.planning/` and is excluded by `.prettierignore`. All three verify commands exited 0.

**Total deviations:** 2 execution adjustments, 1 accuracy fix and 1 note. None weakened a guard or narrowed a gate.

## Issues Encountered

- **C5.6 was observed in CI only on 2026-10-21's tree.** The CI run validated the branch as it stood at 18fdcd6ca. Since then, plans 183-14, 183-21, 183-23 and 183-24 edited `infra/`. Those edits were validated with the job's commands locally on the final tree, but no CI run of the job on the final tree has been observed. The clause is `seen` under the plan's rule, because its source says `Run observation: seen`. A verifier who wants the job seen in CI on the final tree would need a new `ci-evidence/**` push, which only the operator can make.
- **Turbo cache.** The turbo-run links (`turbo run lint`, the turbo typecheck, the app-shared build and 14 of the 25 unit tasks) replayed results keyed on their input hashes. Every other link ran live on this tree, including all 19 `assert:*` guards and `prettier --check .`.

## Known Stubs

None.

## User Setup Required

None.

## Next Phase Readiness

- This was the last plan of phase 183 (28 of 28 SUMMARYs). The phase is ready for verification.

## Self-Check: PASSED

- FOUND: evidence/183-27-final-gates.md
- FOUND: bcf3483f3, b66a3f02b, afd8943f0 (each is an ancestor of HEAD)
