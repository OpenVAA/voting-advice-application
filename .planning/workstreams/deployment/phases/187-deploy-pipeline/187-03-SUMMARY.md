---
phase: 187-deploy-pipeline
plan: "03"
subsystem: infra
tags: [build-push-image, git-archive, build-context, cr-01, self-test]

requires:
  - phase: 185
    provides: infra/scripts/build-push-image.sh with its refusals, its exit-3 tag_exists line and its stub self-test
provides:
  - "The image is built from `git archive` of the commit, extracted into the script's temporary directory, never from the live working tree (CR-01 closed in code)"
  - "Result line `failed=context` when the archive cannot be written or extracted; nothing is built or pushed then"
  - "Self-test cases ignored-file-absent-from-context, context-holds-the-commit, context-is-not-the-working-tree, context-failure-fails, context-failure-builds-nothing, context-failure-pushes-nothing, push-builds-the-commit-dockerfile"
  - "Header contract for a workflow caller: 0 prints image_tag= and image_digest=, 3 prints `tag_exists=yes image_digest=<digest>` and means deploy as it is"
affects: [187-04..05 deploy workflow build step, 187-12 real local build of a source-only archive]

actuals:
  tokens: 2600
  tasks: 2
  commits: 2
plan_head_before: 0eff77181d67c99e779359380d5c0db32a3b0d2f
plan_head_after: eabb741786c69146c16e83633979960a9e5e8a1c

tech-stack:
  added: []
  patterns:
    - "Build context = `git archive --format=tar -o <file>` of the commit, then `tar -x -f <file> -C <dir>`, each status read directly"
    - "A third command variable, TAR, that the self-test wraps to make an extraction fail"

key-files:
  created: []
  modified:
    - infra/scripts/build-push-image.sh
    - infra/scripts/build-push-image.test.ts

key-decisions:
  - "build-push-image.sh builds from git archive of the commit extracted into its temporary directory (-f <context>/apps/frontend/Dockerfile, context <WORK>/context); a write or extract failure prints failed=context and builds nothing (C-02, CR-01)"
  - "The script's exit 3 (`tag_exists=yes image_digest=<digest>`) is documented as: the registry already holds this commit's image, the caller deploys it as it is"

patterns-established:
  - "The docker stub records the context its build was given and what that context holds, so a self-test can assert on the build context itself"

requirements-completed: []

coverage:
  - id: D1
    description: "An ignored file in the working tree does not reach the build context; the context holds the commit's tracked file and lies in the script's temporary directory, not the clone"
    requirement: PIPE-05
    verification:
      - kind: unit
        ref: "bash infra/scripts/build-push-image.sh --self-test (cases=44 failed=0; ignored-file-absent-from-context, context-holds-the-commit, context-is-not-the-working-tree PASS); vitest infra/vitest.config.ts build-push-image 3/3"
        status: pass
      - kind: other
        ref: "Negative control: a scratch copy whose build uses --load \"$REPO\" fails ignored-file-absent-from-context and context-is-not-the-working-tree (failed=2)"
        status: pass
    human_judgment: false
  - id: D2
    description: "A failure to extract the archive prints failed=context and runs no build and no push"
    requirement: PIPE-05
    verification:
      - kind: unit
        ref: "self-test context-failure-fails, context-failure-builds-nothing, context-failure-pushes-nothing PASS"
        status: pass
    human_judgment: false
  - id: D3
    description: "The Dockerfile builds from a source-only archive on a real docker, and a runner builds that way"
    requirement: PIPE-05
    verification: []
    human_judgment: true
    rationale: "No real docker build is made in this plan; plan 187-12 builds a source-only archive locally and plans 187-14..25 observe the runner"

duration: 3min
completed: 2026-11-15
status: complete
---

# Phase 187 Plan 03: Build from the commit's archive Summary

`self_test summary cases=44 failed=0` (37 cases before the plan, 44 after)

**`build-push-image.sh` now builds from `git archive` of the commit, extracted into its own temporary directory, so no ignored or untracked file can enter the image. A self-test case plants an ignored file in the clone and shows that it is absent from the build context.**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-11-15T01:55:15Z
- **Completed:** 2026-11-15T01:57:30Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- A new `make_context` runs after the login and before the build. It creates `$WORK/context`, then runs `git -C "$REPO" archive --format=tar -o "$WORK/context.tar" "$SHA"`, then `"$TAR" -x -f "$WORK/context.tar" -C "$WORK/context"`. Each step's status is read directly, and a failure prints `failed=context`. The tar file is removed after extraction, and `on_exit` still removes `$WORK`.
- The build no longer uses the form `cd "$REPO" && … --load .`. It runs with `-f "$WORK/context/apps/frontend/Dockerfile"` and the context `"$WORK/context"`. Every flag is kept: `--platform`, `--target`, `--build-arg BUILD_SHA=`, `--provenance=false`, `--sbom=false`, `-t` and `--load`. `set -euo pipefail` and `set -f` are kept too.
- The docker stub now records, on `buildx`, `context=<last argument>`, `work=$WORK`, `context-holds-ignored=yes|no` and `context-holds-tracked=yes|no`. Its build-failure switch is unchanged.
- The self-test commits and pushes a `.gitignore` that names `planted-ignored.txt`, and plants that file in the clone, so the tree is still clean. The successful run then asserts the three new cases. `push-tags-the-commit` now expects `--load /` followed by a path, not `.`. The planted file is removed afterwards.
- The header's step 3 now describes the archive build, and that `.dockerignore` applies to the copy. `context` joins the `failed=` step list, with a sentence on what `failed=context` means. A new paragraph for workflow callers states the 0 / 3 / other-status contract, with the exit-3 line written verbatim.

## Task Commits

1. **Task 1 (tracer, tdd): Build from the commit's archive, with the self-test cases that plant an ignored file.** `eb97985e6` (feat). RED came first: the vitest wrapper failed on the five new names it lists. The tracer gate re-ran the verify on the committed tree and it passed (vitest 3/3, self-test failed=0, grep count 1).
2. **Task 2: The header states the archive build and the contract a workflow reads.** `eabb74178` (docs)

## Files Created/Modified

- `infra/scripts/build-push-image.sh`: adds `make_context`, the archive-context build, the `TAR` command variable, the stub's context recording, the `st_tar` wrapper, seven new self-test cases, and the header rewrite.
- `infra/scripts/build-push-image.test.ts`: the PASS list now names `ignored-file-absent-from-context`, `context-holds-the-commit`, `context-is-not-the-working-tree`, `context-failure-fails` and `context-failure-builds-nothing`.

## Decisions Made

- Followed C-02 as specified, and documented the autonomous exit-3 decision in the header.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] A self-test case for `failed=context`**
- **Found during:** Task 1
- **Issue:** The must-have truth "a failure to write or extract the archive prints `failed=context` and builds and pushes nothing" had no case to prove it.
- **Fix:** Added a `TAR` command variable, which defaults to `tar`, and a self-test wrapper `st_tar` that fails when `$ST/extract-fails` exists and otherwise calls the real `tar`. Added the cases `context-failure-fails`, `context-failure-builds-nothing` and `context-failure-pushes-nothing`, and named the first two in the vitest PASS list. The comment above the command variables now mentions the third command.
- **Files modified:** infra/scripts/build-push-image.sh, infra/scripts/build-push-image.test.ts
- **Commit:** eb97985e6

**2. [Rule 1 - Plan detail] The stub checks the tracked file's committed content, not the literal `one`**
- **Found during:** Task 1
- **Issue:** The plan's stub checks that `file.txt` holds `one`. By the time of the successful push run, the self-test has committed `three` into `file.txt`, so the literal `one` would fail even against a correct context.
- **Fix:** The stub compares against `ST_TRACKED`, which is set to `three` next to the commit the successful run builds. The behavior, "the tracked `file.txt` with its committed content", is what the case asserts.
- **Commit:** eb97985e6

**3. [Rule 2] An extra case, `push-builds-the-commit-dockerfile`**
- **Found during:** Task 1
- **Fix:** Asserts that the build's `-f` names the Dockerfile inside the archive context and not the working tree's.
- **Commit:** eb97985e6

## Verification

- `bash infra/scripts/build-push-image.sh --self-test` exits 0 with `cases=44 failed=0`, under Homebrew bash and under `/bin/bash` 3.2.
- `node_modules/.bin/vitest run --config infra/vitest.config.ts build-push-image` passes 3 of 3 (exit 0).
- `grep -c 'cd "$REPO" && "$DOCKER" buildx' infra/scripts/build-push-image.sh` prints 0. `grep -c 'ignored-file-absent-from-context' infra/scripts/build-push-image.test.ts` prints 1.
- `--help` exits 0. In its output, `git archive` appears once, `failed=context` once, and `tag_exists=yes image_digest=<digest>` once.
- Negative control: in a scratch copy whose build is given `"$REPO"` as context, `ignored-file-absent-from-context` and `context-is-not-the-working-tree` FAIL, with failed=2. The cases do detect the regression.
- Prettier check on the test file is clean. shellcheck is not installed on this host, so it was not run.
- No docker build, no AWS call and no network access were made.

## Issues Encountered

None.

## Known Stubs

None. The AWS, docker and tar stubs are self-test fixtures, not product stubs.

## Threat Flags

None. T-187-06 and T-187-07 are mitigated as the plan's threat register specifies, and no new surface was added.

## User Setup Required

None.

## Next Phase Readiness

- The deploy workflow's build step can parse status 0 (two lines) and status 3 (one line, `tag_exists=yes image_digest=<digest>`, deploy as it is). It reads the status directly and uses the `refused=` / `failed=` line for alert text.
- Plan 187-12 still has to prove, by a real local build of a source-only commit's archive, that the Dockerfile needs no ignored or untracked file. This is the plan's open assumption.
- PIPE-05 stays pending, as the operator notes require.

## Self-Check: PASSED

- Both modified files exist and hold the change.
- Commits `eb97985e6` and `eabb74178` are ancestors of HEAD, and `git rev-list --count 0eff77181..HEAD` is 2.

---
*Phase: 187-deploy-pipeline*
*Completed: 2026-11-15*
