---
phase: 187-deploy-pipeline
plan: "02"
subsystem: infra
tags: [terraform, ecs, ecr, image-digest, frontend-service]

requires:
  - phase: 185
    provides: the frontend-service module, the staging and example AWS roots and the module's offline test
provides:
  - "Required `image_digest` input (`^sha256:[0-9a-f]{64}$`, no default) in the frontend-service module and both AWS roots"
  - "Container image rendered as `<registry_url>@<image_digest>`"
  - "Module test runs `image_digest_refuses_a_commit_id`, `image_digest_refuses_empty`, `image_digest_refuses_upper_case`"
  - "No image value in any tfvars under infra/envs"
affects: [187-06 runbook and running-digest helper, 187-07 example mock plans, deploy and infra-plan workflows]

actuals:
  tokens: 2400
  tasks: 2
  commits: 2
plan_head_before: a29398abe7ce39db3e23b56abaccee39848bab2c
plan_head_after: cb172ac72cc82bee30a61f2dd05bb40893f22df4

tech-stack:
  added: []
  patterns:
    - "The image reaches Terraform per plan as -var image_digest=, never from a tracked variable file"

key-files:
  created: []
  modified:
    - infra/modules/frontend-service/variables.tf
    - infra/modules/frontend-service/service.tf
    - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
    - infra/envs/staging/aws/main.tf
    - infra/envs/staging/aws/variables.tf
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/example/aws/main.tf
    - infra/envs/example/aws/variables.tf
    - infra/envs/example/aws/terraform.tfvars

key-decisions:
  - "The frontend task's image is <registry_url>@<image_digest>; image_digest is required, validated as sha256: plus 64 lower-case hex, and is never written to a tfvars file (C-01). The ECR tag and BUILD_SHA stay the commit id."

patterns-established:
  - "Per-plan image input: the pipeline passes the digest it pushed, a hand plan the digest the service runs now"

requirements-completed: []

coverage:
  - id: D1
    description: "The module renders the container image by digest and refuses a commit id, an empty value and upper-case hex as image_digest"
    requirement: PIPE-05
    verification:
      - kind: unit
        ref: "terraform -chdir=infra/modules/frontend-service test -no-color (33 passed, 0 failed; runs environment_split, image_digest_refuses_a_commit_id, image_digest_refuses_empty, image_digest_refuses_upper_case)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both AWS roots declare image_digest, pass it to module \"frontend\" and validate offline; no tfvars under infra/envs assigns an image value"
    requirement: PIPE-05
    verification:
      - kind: other
        ref: "terraform validate of infra/envs/staging/aws (scratch TF_DATA_DIR) and infra/envs/example/aws after init -backend=false -lockfile=readonly; terraform fmt -check -recursive infra; git grep -e '^image_tag *=' -e '^image_digest *=' -- infra/envs exits 1"
        status: pass
    human_judgment: false
  - id: D3
    description: "ECS pulls and runs the image when given as repository-url@sha256:<digest> (PIPE-05 observed half)"
    requirement: PIPE-05
    verification: []
    human_judgment: true
    rationale: "Only an apply against the hosted staging account shows ECS accepting the digest form; that belongs to plans 187-14..25"

duration: 3min
completed: 2026-11-15
status: complete
---

# Phase 187 Plan 02: Image by digest Summary

**The frontend ECS task now runs `<registry_url>@<image_digest>`, with `image_digest` a required sha256 input in the module and both AWS roots, and no image value in any tracked tfvars**

Module test passed count: **33 before, 33 after** (the three tag refusal runs were rewritten in place as three digest refusal runs; no run was added or removed).

## Performance

- **Duration:** about 3 min
- **Started:** 2026-11-15T01:50:46Z
- **Completed:** 2026-11-15T01:53:30Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- `infra/modules/frontend-service`: `image_digest` (no default, validated `^sha256:[0-9a-f]{64}$`) replaces the commit-id tag input. `registry_url`'s description now names the digest form, and `service.tf` renders `image = "${var.registry_url}@${var.image_digest}"`.
- Module test: stand-in digest `sha256:` plus 64 zeros. The `environment_split` image assertion compares against the URL, `@` and that digest. The runs `image_digest_refuses_a_commit_id` (40 hex), `image_digest_refuses_empty` and `image_digest_refuses_upper_case` (`sha256:ABCDEF0…`) each expect a failure of `var.image_digest`.
- Staging and example AWS roots: both declare `image_digest` with the per-plan description and pass `image_digest = var.image_digest` to `module "frontend"`. Neither tfvars holds an image line any more, and each header says the digest is given per plan as `-var image_digest=`.
- `infra/scripts/build-push-image.sh` and `infra/modules/registry` were not touched, so the ECR tag and `BUILD_SHA` are still the commit id and the tags are still immutable.

## Task Commits

1. **Task 1 (tracer): Image by digest through the module, its test and the staging root.** `b42319e3f` (feat). The tracer gate re-ran the verify on the committed tree and it passed (33/0, validate 0, fmt 0).
2. **Task 2: No image value in either variable file, and the example root by digest.** `cb172ac72` (feat)

## Files Created/Modified

- `infra/modules/frontend-service/variables.tf`: the `image_digest` input and its validation. `registry_url`'s description is reworded.
- `infra/modules/frontend-service/service.tf`: the container image is set by digest.
- `infra/modules/frontend-service/tests/frontend_service.tftest.hcl`: the stand-in digest, the image assertion and the three refusal runs.
- `infra/envs/staging/aws/{main,variables}.tf`: `image_digest` is declared and passed to the module.
- `infra/envs/staging/aws/terraform.tfvars`: the committed tag is removed and a header sentence is added.
- `infra/envs/example/aws/{main,variables}.tf`: `image_digest` is declared and passed to the module.
- `infra/envs/example/aws/terraform.tfvars`: the stand-in tag is removed and a header sentence is added.

## Decisions Made

- Followed C-01 as specified. For the upper-case refusal value I used `sha256:ABCDEF` followed by 58 zeros, which is 64 hex characters. It fails only because of its upper-case letters.

## Deviations from Plan

None. The plan was executed as written.

Notes on how it was executed (not deviations):
- `infra/envs/staging/aws/.terraform/` is wired to the real S3 backend, so the staging root was initialised and validated with a scratch `TF_DATA_DIR` and the original directory was left alone. The example root's `.terraform/` has no backend state, so it was initialised in place with `-backend=false -lockfile=readonly`.
- The plan's acceptance check `grep -c '@${var.image_digest}' …service.tf` printed 0 through the shell's `grep` wrapper (ugrep), which reads the `$` in the middle of the pattern as an anchor. `/usr/bin/grep` and `git grep` both print 1, and the line is `image = "${var.registry_url}@${var.image_digest}"`. PASS.
- Between Task 1 and Task 2, staging `validate` warned about an undeclared `image_tag` value in tfvars (exit 0). Task 2 removed that line, and the warning is gone.

## Issues Encountered

None.

## Known Stubs

None.

## User Setup Required

None. No external service configuration is required.

## Next Phase Readiness

- Plan 187-06 must rewrite the staging AWS runbook (`infra/envs/staging/aws/README.md`) and `tests/README.md`. Several steps there still append `image_tag = "<sha>"` to the root's tfvars or read it back with `sed`. Those steps no longer match the root, which declares no `image_tag` and gets the digest only per plan as `-var image_digest=`.
- Plan 187-07's example `terraform test` must supply its own stand-in `image_digest`, because the example root has no default and its tfvars has no value.
- The workflows of later plans must pass `-var image_digest=<digest>` to every plan of the staging AWS root.
- PIPE-05 stays pending, as the operator notes require. Only the code half is done here, and the observed half comes in plans 187-14..25.

## Self-Check: PASSED

- All 9 modified files exist and hold the change. `git grep` shows no `image_tag` input left outside the registry's `image_tag_mutability`, the build script's output contract and the runbooks owned by 187-06.
- Commits `b42319e3f` and `cb172ac72` are ancestors of HEAD, and `git rev-list --count a29398abe..HEAD` is 2.
- Acceptance criteria: there are 3 `image_digest_refuses_` runs. `@${var.image_digest}` appears once in service.tf. The test count is 33 both before and after. `git grep` for image assignments under `infra/envs` exits 1 with no output. The example main.tf has exactly one `image_digest = var.image_digest` line.
- Plan verification: the module test passes, both AWS roots validate, `fmt -check` is clean and no tfvars under `infra/envs` assigns an image value.

---
*Phase: 187-deploy-pipeline*
*Completed: 2026-11-15*
