---
phase: 187-deploy-pipeline
plan: "06"
subsystem: infra
tags: [ecs, ecr, image-digest, runbook, staging-aws]

requires:
  - phase: 187-02
    provides: the required `image_digest` input of the frontend-service module and both AWS roots
provides:
  - "`infra/scripts/running-image-digest.sh --cluster <c> --service <s>`: prints `running_task_definition=`, `running_image_reference=digest|tag`, `running_image_digest=`; `failed=<step>` and exit 1 on a failure; exit 2 on a usage error"
  - "Its vitest suite against a stub `aws` on PATH (13 tests, no credential, no network)"
  - "The staging AWS runbook passes `-var \"image_digest=$DIGEST\"` in all 16 of its plans of the root; no step writes or reads an image value in terraform.tfvars"
affects: [187-07, 187-08, 187-09, 187-10, 187-11, infra-plan workflow, destroy workflow]

actuals:
  tokens: 11650
  tasks: 2
  commits: 3
plan_head_before: 74c67bffa89b54722241b37e8596a3a6bff2bbb5
plan_head_after: 42ec6c35078cb3577e711684a4ddf88d60d57796

tech-stack:
  added: []
  patterns:
    - "A read-only infra script tested by an executable stub CLI written into a mkdtemp directory placed first on the child's PATH, answering from STUB_* variables and logging its arguments"

key-files:
  created:
    - infra/scripts/running-image-digest.sh
    - infra/scripts/running-image-digest.test.ts
  modified:
    - infra/envs/staging/aws/README.md

key-decisions:
  - "running-image-digest.sh reads only `taskDefinition.containerDefinitions[0].image` through --query, so a task definition's environment never leaves the CLI call; the AWS error message is never printed, only its error code on stderr"
  - "Every plan of the staging AWS root in the runbook passes -var image_digest: Step 5 by the commit the operator names (read from ECR by tag), Steps 8 to 12 and Election day by the running digest read in each step's item 1, Steps 16 and 17 by the digest Step 15 read before the destroy"
  - "Step 16 re-reads the running digest before the destroy and stops if it differs from Step 15's, so a pipeline deploy between the two steps cannot slip a different image into the destroy and re-apply"

patterns-established:
  - "Hand plans of a running stack get the running digest from running-image-digest.sh, never from a file"

requirements-completed: []

coverage:
  - id: D1
    description: "running-image-digest.sh prints the running digest for a digest image (no ECR call) and for a tag image (read from ECR by tag), and reports each failure as one failed=<step> line with exit 1"
    requirement: PIPE-05
    verification:
      - kind: unit
        ref: "node_modules/.bin/vitest run --config infra/vitest.config.ts running-image-digest (13 passed); whole infra suite 6 files / 129 tests passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "The staging AWS runbook names the image by digest in every plan and says how hand work and the pipeline share the root (no hand apply during a run, force-unlock after a cut-short apply)"
    requirement: PIPE-02
    verification:
      - kind: other
        ref: "prettier --check exit 0; grep -c 's/^image_tag' = 0; grep -c running-image-digest.sh = 8; grep -c \"printf 'image_\" = 0; grep -c force-unlock = 1; every `terraform -chdir=\"$T\" plan` line (16) is followed by the -var image_digest line"
        status: pass
    human_judgment: false
  - id: D3
    description: "The script reads the real staging service (tag form before the first digest apply, digest form after), and the first plan after the switch shows 1 to add, 1 to change, 1 to destroy on the task definition and the service alone"
    requirement: PIPE-08
    verification: []
    human_judgment: true
    rationale: "Only a read of the hosted staging account shows it; that belongs to plans 187-14..25. Recorded in the runbook's 'Not yet observed' table"

duration: 6min
completed: 2026-11-15
status: complete
---

# Phase 187 Plan 06: The running digest and the runbook by digest Summary

**A read-only `running-image-digest.sh` names the image the staging service runs by its sha256 digest, reading ECR by tag when the task definition still names a tag. Every plan in the staging AWS runbook now gets `-var image_digest`, and no step writes or reads an image value in `terraform.tfvars`.**

The six cases of the behaviour list, each a passing vitest case:

1. `prints the digest a digest image names, with no registry call`: exit 0, `running_image_reference=digest`, no `ecr` call.
2. `reads the digest of a tag image from the registry by its tag`: exit 0, `running_image_reference=tag`, the call `ecr describe-images --repository-name openvaa-frontend --image-ids imageTag=<tag>`.
3. `fails at describe-services when the service cannot be read`: exit 1, `failed=describe-services`.
4. `fails at describe-images when the registry does not hold the tag`: the stub prints `None`, exit 1, `failed=describe-images`.
5. `fails at digest-form when the registry returns something that is not a digest`: exit 1, `failed=digest-form`.
6. `exits 2 without --cluster, without --service and on an unknown flag, before any call`.

Seven more cases go beyond the list: the image field is read alone (`--query taskDefinition.containerDefinitions[0].image`, and a stub value on stderr never reaches the output), describe-services naming no task definition (`None`), a failed describe-task-definition, ECR refusing the read (`ImageNotFoundException`), a malformed digest in the definition itself (`failed=digest-form`, no ECR call), an image with neither a digest nor a tag (`failed=image-form`), and `--help`.

## Performance

- **Duration:** about 6 min
- **Started:** 2026-11-15T02:20:43Z
- **Completed:** 2026-11-15T02:27Z
- **Tasks:** 2
- **Files:** 3 (2 created, 1 modified)

## Accomplishments

- `infra/scripts/running-image-digest.sh` follows `build-push-image.sh`'s conventions: a header with usage, environment and exit codes, `set -euo pipefail`, `LC_ALL=C`, `AWS_PAGER=""`, `name=value` results on stdout and progress on stderr. Each status is read directly. Only the error code of a failed AWS call is printed, never its message.
- `infra/scripts/running-image-digest.test.ts` writes a stub `aws` into a `mkdtemp` directory, puts it first on `PATH`, and runs the script with `spawnSync('bash', …)` in a minimal environment.
- In the staging AWS runbook:
  - **Step 4, item 10:** no longer appends and commits `image_tag`. It prints `s4_source_commit=` and `s4_image_digest=`.
  - **Step 5:** prompts for the commit, reads its digest from ECR by tag, and checks `s5_image_digest_form=ok`. Both plans pass `-var image_digest`, and the health check compares against the commit. It also gains the paragraph on the expected first plan after the switch (1/1/1 on `module.frontend.aws_ecs_task_definition.app` and `module.frontend.aws_ecs_service.app`).
  - **Steps 8 to 12:** item 1 of each reads the running digest with the script, and every plan in them passes it.
  - **Step 15:** a new item 6 reads `s15_running_image_digest=`.
  - **Steps 16 and 17:** both prompt for that digest. Step 16 re-reads the running digest and must find it unchanged, then checks that the image survives by digest. Step 17 derives the commit from the image's tag to check the health build.
  - **Rules of this root:** two new bullets. Every plan is given the digest and no file names an image. Once the pipeline runs, no hand apply happens while a run is waiting or running, and a cut-short apply is recovered with `terraform force-unlock <lock id>` after confirming no run is active.
  - **Introduction and Election day:** the opening paragraph and the Election day items now use the digest.
  - **"Not yet observed":** three new rows.

## Task Commits

1. **Task 1 (tracer, TDD): the running-digest script and its test.**
   - RED `b85de23a7` (test): 13 of 13 failed because the script did not exist yet.
   - GREEN `cf1e414ca` (feat): 13 of 13 pass, and `--help` exits 0.
   - The tracer gate re-ran the verify on the committed tree and it passed.
2. **Task 2: the staging AWS runbook plans by digest.** `42ec6c350` (docs)

## Files Created/Modified

- `infra/scripts/running-image-digest.sh` (created, mode 100755): the read-only digest reader.
- `infra/scripts/running-image-digest.test.ts` (created): 13 cases against a stub `aws`.
- `infra/envs/staging/aws/README.md` (modified): the introduction, the rules, Steps 4, 5, 8 to 12, 15 to 17, Election day, and "Not yet observed".

## Decisions Made

- The script uses `--region "$REGION"` on every call and literal arguments for everything else. The test asserts the exact `describe-services`, `describe-task-definition` and `describe-images` argument strings.
- The runbook uses the literal names `--cluster openvaa-staging --service openvaa-staging-frontend` in every step, as the plan gives them for Step 15. They match `local.name` and the service name in `infra/modules/frontend-service/service.tf`.
- Values the operator gives (the commit in Step 5, the digest in Steps 16 and 17) are typed at `read -r` prompts, the way the runbook already takes operator values. Neither is a secret.
- Existing items were not renumbered: the Observations table cites item numbers in Steps 15 to 17. So Step 15's digest read went in as a new item 6, and the cleanup item moved to 7, which no observation cites.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] Every plan of the runbook passes the digest, not only Steps 5 and 15 to 17**
- **Found during:** Task 2
- **Issue:** The plan's action names Steps 4, 5 and 15 to 17. But the must-have truth says "passes `-var image_digest=` in every plan", and `image_digest` is a required variable with no default. Without the change, every plan in Steps 8 to 12 (lock check, diagnostics, failed rollout, restore, floor change) and Election day would refuse with `No value for required variable`.
- **Fix:** Item 1 of each of Steps 8 to 12 now reads the running digest with the script and sets `$DIGEST`. All 16 `terraform -chdir="$T" plan` invocations pass `-var "image_digest=$DIGEST"`, and Election day points to Step 12's read.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 42ec6c350

**2. [Rule 2 - Missing critical functionality] Extra failure step `image-form`, and failure on `None`**
- **Found during:** Task 1
- **Issue:** The plan lists the steps describe-services, describe-task-definition, describe-images and digest-form. An image with neither `@` nor `<host>/<repository>:<tag>` fits none of them. A service that does not exist makes the CLI print `None` with exit 0, so it is not caught as a failure.
- **Fix:** Added `failed=image-form`. `None` or empty output from describe-services, describe-task-definition or describe-images now counts as that step's failure. A non-zero exit from describe-images (the real `ImageNotFoundException`) is also `failed=describe-images`.
- **Files modified:** infra/scripts/running-image-digest.sh, infra/scripts/running-image-digest.test.ts
- **Commit:** cf1e414ca

**3. [Rule 2 - Missing critical functionality] Step 16 guards against a deploy between Steps 15 and 16**
- **Found during:** Task 2
- **Issue:** Step 16 is given Step 15's digest. If a pipeline deploy ran between the two steps, the destroy and the re-apply would carry a stale image.
- **Fix:** While the service still runs, Step 16's item 1 re-reads the running digest and requires `s16_running_digest_unchanged_exit=0`.
- **Files modified:** infra/envs/staging/aws/README.md
- **Commit:** 42ec6c350

**4. [Rule 1 - Consistency] The introduction's "first run must be a plan that shows no change"**
- **Found during:** Task 2
- **Issue:** With the switch to digests, the pipeline's first plan replaces the task definition (research Pattern 4), so that sentence in this runbook's introduction was no longer true.
- **Fix:** Rewritten: the workflow's first plan shows at most the task definition replaced and the service updated. The same sentence in `infra/README.md` belongs to plan 187-11, which is outside this plan's files.
- **Commit:** 42ec6c350

## Left for later plans (outside this plan's files)

- `infra/README.md:61-62`: "its first run must be a plan that shows no change". Owned by plan 187-11 Task 2, whose verify asserts `grep -c 'shows no change' = 0`.
- `tests/README.md:149` and `tests/README.md:175`: read `image_tag` from `infra/envs/staging/aws/terraform.tfvars` as the source of `SMOKE_EXPECTED_SHA`, and the file no longer holds it. Owned by plan 187-11 (truth: "names the commit the last deploy built as the workstation's SMOKE_EXPECTED_SHA and no longer reads a variable file for it"). Plan 187-13 records the handoff to 186-08.
- `infra/envs/staging/aws/README.md` has six long lines it already had (stop-rule quotes in Steps 9, 10, 11 and 12, the Step 16 introduction, and the "Not yet observed" introduction). Prettier accepts them; I left them alone.

## Issues Encountered

- `shellcheck` is not installed on the host, so the script was not shellchecked. Its behaviour is covered by the 13 stub cases.

## TDD Gate Compliance

- RED: `b85de23a7` `test(187-06)`. The suite failed with 13 of 13 tests failing, because the script was missing.
- GREEN: `cf1e414ca` `feat(187-06)`. 13 of 13 pass.
- REFACTOR: none needed.

## Threat Flags

None. The script is read-only and adds no surface beyond the threat register (T-187-13: it reads the image field only through `--query`; T-187-14: it checks the digest's form before printing it). The plan installs no package (T-187-SC).

## Requirements

Coverage is recorded above. PIPE-05, PIPE-02 and PIPE-08 are not marked complete: they close only when observed on the hosted pipeline (plans 187-14..25).

## Self-Check: PASSED

- FOUND: infra/scripts/running-image-digest.sh (executable, 100755)
- FOUND: infra/scripts/running-image-digest.test.ts
- FOUND: infra/envs/staging/aws/README.md changes
- FOUND: b85de23a7, cf1e414ca, 42ec6c350 (ancestors of HEAD)
