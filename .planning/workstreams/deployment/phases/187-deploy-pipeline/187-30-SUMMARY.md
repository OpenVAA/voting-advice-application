---
phase: 187-deploy-pipeline
plan: "30"
subsystem: infra
status: complete
tags: [terraform, provider-locks, linux_arm64, workflow-guards, deploy-evidence, gap-closure]
requires:
  - 187-29 (the last rebuild of the evidence commits and the gate runner)
  - 187-21 attempt 1 (run 44165083175, approved, red at the plan step)
provides:
  - eight root provider locks with one h1 hash per provider for linux_amd64, linux_arm64, darwin_arm64 and darwin_amd64
  - the rules arm-lock and lock-platforms in infra/scripts/workflows.test.ts
  - attempt 1 of the green push recorded under A1_ lines, its earlier lines superseded
  - rebuilt evidence commits refs/evidence/187/green 9d6a55ca3 and refs/evidence/187/red 1a3ee822f
affects:
  - 187-21 (attempt 2 pushes 9d6a55ca3 as deploy-evidence/187-green-2)
  - 187-22 (reads 187-21's evidence, now with no current attempt-1 value)
tech-stack:
  added: []
  patterns:
    - "Provider locks written only by terraform providers lock with four -platform= flags, in a git archive copy, then cp'd back"
    - "A cross-file guard derives the roots an ARM job initialises from the workflows at test time"
key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-30-arm64-lock.md
  modified:
    - infra/scripts/workflows.test.ts
    - infra/bootstrap/.terraform.lock.hcl
    - infra/envs/example/aws/.terraform.lock.hcl
    - infra/envs/example/dns-mail/.terraform.lock.hcl
    - infra/envs/example/supabase/.terraform.lock.hcl
    - infra/envs/scratch/supabase/.terraform.lock.hcl
    - infra/envs/staging/aws/.terraform.lock.hcl
    - infra/envs/staging/dns-mail/.terraform.lock.hcl
    - infra/envs/staging/supabase/.terraform.lock.hcl
    - infra/README.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-21-green-run.md
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-12-evidence-commits.md
decisions:
  - "The deploy job stays on ubuntu-24.04-arm; the locks gain the linux_arm64 hashes instead (C-02)"
  - "Every root lock carries the same four platforms, not only the staging AWS root's"
  - "The three Supabase locks keep the constraints line providers lock wrote (1.11.0, ~> 1.11) rather than a hand-restored ~> 1.11, since hand edits are forbidden and the line reflects the roots' existing = 1.11.0 pin"
metrics:
  duration: 19min
  completed: 2026-11-17
actuals:
  tokens: 28000
  tasks: 5
  commits: 5
plan_head_before: 0c10029196407b786116e51217ae66ea0f9d4d6d
plan_head_after: 35e9fab77883f11ff29e482e4539a020556eb5bf
---

# Phase 187 Plan 30: The provider locks gain linux_arm64 hashes Summary

```
ARM_LOCK_RED_AT_START=2
ARM64_RED_VALIDATE_EXIT=1
ARM64_ROOTS_GREEN=8
GREEN_COMMIT=9d6a55ca36ea56a5d3883ad95a10b4619c2472ad
READY_FOR_187_21_ATTEMPT_2=yes
```

Every root lock now carries one `h1:` hash per provider for linux_amd64, linux_arm64, darwin_arm64 and darwin_amd64, written by `terraform providers lock` 1.16.5. Two new rules in `workflows.test.ts` guard this: `arm-lock` finds the roots an ARM job initialises by reading the workflows, and `lock-platforms` checks every root lock and requires the same hashes across roots for the same provider version. On linux/arm64 the runner's checksum failure was reproduced on HEAD's lock and is green on the fixed one, for all 8 roots.

## What was done

- **Task 1 (`f62faf522`).** Added `arm-lock`, `LOCK_PLATFORMS`, `lockProviders`, `terraformInits` and `armLockViolations`, with three red copies and one control.
  - Red first: 2 violations, for `hashicorp/aws` 6.68.0 and `hashicorp/random` 3.9.1 of `infra/envs/staging/aws`.
  - In an `alpine:latest` linux/arm64 container, with the checksum-verified Terraform 1.16.5 linux_arm64 binary, HEAD's lock reproduced the runner: init exited 0 and warned `Provider lock file not updated`; validate exited 1 with the checksum error for both providers.
  - The staging AWS lock gained 2 `h1:` lines. They equal the diagnosis (`h1:s5EXu9Et…`, `h1:nozfr4CZ…`). In the container, init then printed no warning and validate passed.
- **Task 2 (`704fd2926`).** Added `lock-platforms`, `rootLockFiles` and `lockPlatformViolations`, with two red copies.
  - Red first: 10 violations, 8 count and 2 sameness.
  - The seven other locks were rewritten by `providers lock` in an archive copy. All 8 roots pass a read-only init and validate on linux/arm64, and on darwin_arm64 as well.
- **Task 3 (`3337b8442`).**
  - README § Guards now names both rules and the `providers lock` command. § Reading a red run now explains the checksum error.
  - All five repository gates exit 0, as do infra vitest (13 files, 380 tests) and `terraform fmt`. No E2E project is affected.
- **Task 4 (`f2b279747`).** Attempt 1 was recorded read-only under `A1_*` lines, from gh GETs, the health GET and the read-only `running-image-digest.sh` (the SSO session was valid).
  - The run was approved, then went red at the plan step after 1 s. All later stages were skipped, and the alert went out with `alert_stage=plan`.
  - Staging still serves `712947a1b` on task definition `:6`.
  - All 32 lines of 187-21's § Task 1 and § Task 3 are renamed `*_SUPERSEDED=`.
- **Task 5 (`35e9fab77`).**
  - Green `9d6a55ca3` builds (68 s).
  - Red `1a3ee822f` fails at `shared 2/2 RUN yarn build` on `Failed: @openvaa/frontend#build`, naming `does-not-exist-187-red`.
  - The stack was stopped for the builds and started again, and the builder cache was pruned.
  - The E2E-tree gate holds. The plan 187-19 lines are superseded.

## Deviations from Plan

### 1. [Rule 3 - Blocking] The three Supabase locks also rewrote their `constraints` line

- **Found during:** Task 2.
- **Issue:** `providers lock` rewrote `constraints = "~> 1.11"` to `"1.11.0, ~> 1.11"` in `infra/envs/{example,scratch,staging}/supabase/.terraform.lock.hcl`.
  - Each Supabase root pins `version = "= 1.11.0"`, a pin added in `39df97fbd` after these locks were written, and `infra/modules/supabase` asks for `~> 1.11`. The recorded line had been stale since that pin, and a read-only init never rewrites it.
  - The plan assumed every lock diff would only add `h1:` lines, and that assumption failed for these three locks. Its prohibition forbids putting the line back by hand.
- **Fix:** Kept the lock exactly as Terraform wrote it.
  - The version stays 1.11.0, and every existing hash is kept.
  - All 8 roots pass a read-only init with no warning, and validate, on both linux_arm64 and darwin_arm64.
  - `LOCKS_ADDED_ONE_H1_PER_PROVIDER` and `LOCK_VERSIONS_UNCHANGED` are recorded `no`. Four precise lines say what does hold: `LOCK_H1_ADDED_ONE_PER_PROVIDER=yes`, `LOCK_HASHES_REMOVED=0`, `LOCK_VERSION_LINES_UNCHANGED=yes` and `LOCK_CONSTRAINTS_REWRITTEN=<the three roots>`.
- **Effect on verification:** The plan's own Task 2 `<automated>` verify exits 1 at `failed: removed-infra/envs/example/supabase/.terraform.lock.hcl` (script in `tmp/187-30/verify-t2.sh`, log in `tmp/187-30/verify-t2.log`).
  - An adapted copy sets aside only that one constraints line and passes (`tmp/187-30/verify-t2-adapted.sh`, `VERIFY_T2_ADAPTED_OK`).
  - The verifies of Tasks 1, 3, 4 and 5 pass as written. Task 1's verify passed at its own commit; its "other locks unchanged" check fails by design once Task 2 changes them.
  - The must-have truth "no version or constraints line changes" is therefore not met as worded for these three locks. I wrote `READY_FOR_187_21_ATTEMPT_2=yes` and flagged the deviation in the hand-off for 187-21's reviewer. The orchestrator may withhold it.
- **Files modified:** the three Supabase locks.
- **Commit:** `704fd2926`.

### 2. [Rule 1 - Bug] The README "Workflow guards" row was a broken table row

- **Found during:** Task 3.
- An unescaped `||` inside a code span split the row into four cells. While extending the row, I rewrote it with `\|\|`. Prettier then realigned the column widths of § Guards, so the diff touches every row of that table.
- **Commit:** `3337b8442`.

### 3. [Minor] `terraformInits` also falls back to the workflow's own `defaults.run.working-directory`

- The plan says to use the job's `defaults.run.working-directory`. The code also falls back to the workflow-level default, because a root set there is initialised just the same.
- **Commit:** `f62faf522`.

## Authentication gates

None. `gh auth status` and `AWS_PROFILE=openvaa-admin aws sts get-caller-identity` both exited 0 before Task 4's reads.

## Known Stubs

None.

## Not done, by design

- I pushed nothing, opened no pull request, approved nothing and re-ran nothing. The only hosted reads were GETs. I made no full E2E run, and no targeted one was due.
- `MIGRATIONS_CALLTIME_PRIVILEGE_CHECKED=no` stays open, as accepted in 187-21 § Task 2.
- STATE.md and ROADMAP.md were not updated, per the orchestrator's instruction.

## Self-Check: PASSED

- FOUND: evidence/187-30-arm64-lock.md, infra/scripts/workflows.test.ts, all 8 locks, infra/README.md
- FOUND commits: f62faf522, 704fd2926, 3337b8442, f2b279747, 35e9fab77 (`git rev-list --count 0c1002919..HEAD` = 5)
- FOUND refs: refs/evidence/187/green = 9d6a55ca3, refs/evidence/187/red = 1a3ee822f, each held by that ref alone
