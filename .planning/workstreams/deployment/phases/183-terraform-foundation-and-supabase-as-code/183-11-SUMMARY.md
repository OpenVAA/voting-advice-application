---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 11
subsystem: ci
tags: [terraform, github-actions, ci, sha-pinning, vitest]
status: complete

requires:
  - phase: 183-06
    provides: "infra/scripts/check-settings-types.sh, the settings type check the job's last step runs"
  - phase: 183-07
    provides: "the staging and scratch Supabase roots and the staging/aws pipeline root with key pipeline/staging/aws/terraform.tfstate"
  - phase: 183-08
    provides: "the example dns-mail, supabase and aws roots the job must validate"
provides:
  - ".github/workflows/main.yaml: job `infra-validate` (last job): checkout, Terraform 1.16.5 setup without wrapper, `terraform fmt -check -recursive -diff infra`, init -backend=false -lockfile=readonly + validate over infra/bootstrap and infra/envs/*/*/ with a seven-named-root completeness check, `bash infra/scripts/check-settings-types.sh`"
  - "Action pins: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7 and hashicorp/setup-terraform@dfe3c3f87815947d99a8997f908cb6525fc44e9e # v4.0.1, resolved with git ls-remote on 2026-10-18T21:10Z (2026-10-19 local)"
  - "packages/dev-seed/tests/infraValidateJobGate.test.ts: 19 tests on the job's shape, credential absence, SHA pins, required roots and Terraform state keys"
affects: [183-15]

estimate:
  tokens: 50000
  tasks: 2
actuals:
  tokens: 3400     # chars/4 over the two task commits' diff (13577 chars)
  tasks: 2
  commits: 2

plan_head_before: b3dbeacd8449d987ae67d2baf56a2e7973c0ca49
plan_head_after: 8b948a94872e124ab663c1c57e2b065e576174f1

tech-stack:
  added: []
  patterns:
    - "A new workflow job pins each action by commit SHA with the tag in a trailing comment; existing jobs keep their tags"
    - "A glob-driven root loop backed by a check that names the roots it must have seen, so an empty or short glob fails"
    - "Workflow job spec: drop whole-line comments, slice the job from its key to the next two-space key, and assert the slice reaches the job's last step"

key-files:
  created:
    - packages/dev-seed/tests/infraValidateJobGate.test.ts
  modified:
    - .github/workflows/main.yaml

key-decisions:
  - "The new job's actions/checkout line is pinned by SHA too: a uses: line written in a new job counts as an action this milestone adds"
  - "Both tags resolved as lightweight tags (git ls-remote returned no peeled ^{} line), so the listed SHA is the commit itself"
  - "The completeness check compares each of the seven required roots with the roots the loop actually validated (trailing slash stripped) and emits ::error:: naming the first missing one; no count, because the scratch root is removed later"
  - "The validation and type-check steps carry if: ${{ !cancelled() }} so a formatting failure does not hide a validation failure"
  - "The spec's state-key checks read the backend blocks on disk: keys unique and non-empty, every key under hand/ or pipeline/, pipeline/ only for roots named aws, and pipeline_state_key of the bootstrap tfvars equal to the staging/aws backend key"

requirements-completed: []  # SUPA-11 is closed by the parity guard (183-10, paused); this plan builds the CI job toward criterion 5, which 183-15 observes in a run

duration: 5min
completed: 2026-10-19
---

# Phase 183 Plan 11: The credential-free infra-validate job Summary

**A `main.yaml` job that formats and validates every Terraform root under `infra/` with no credentials, pins its two actions by freshly resolved commit SHAs, fails when a named root goes unvalidated, and a 19-test spec that keeps it that way and keeps the Terraform state keys apart.**

## Performance

- **Duration:** about 5 min of execution (2026-10-18T21:09Z to 21:14Z)
- **Tasks:** 2
- **Files:** 1 created, 1 modified

## Accomplishments

- `infra-validate` appended as the last job of `.github/workflows/main.yaml` (72 added lines, no deletion, no other job or trigger touched). It has no `permissions` block, no secret, no credential action and no artifact upload.
- SHAs resolved on 2026-10-18T21:10Z (UTC; 2026-10-19 local) with `git ls-remote`:
  - `hashicorp/setup-terraform` `refs/tags/v4.0.1` → `dfe3c3f87815947d99a8997f908cb6525fc44e9e`
  - `actions/checkout` `refs/tags/v7` → `3d3c42e5aac5ba805825da76410c181273ba90b1`
  Both match the research's values; neither tag is annotated.
- The job's commands, run locally with Terraform 1.14.7 and no credentials (statuses read from files, not pipes): `terraform fmt -check -recursive -diff infra` exit 0 with empty diff; the validation step's own script (extracted from the parsed YAML) exit 0 with eight "Success! The configuration is valid." lines and `validated 8 roots` (seven required plus `infra/envs/scratch/supabase`); `bash infra/scripts/check-settings-types.sh` exit 0, "three cases hold". The plan's own verify loop exit 0, also eight successes.
- Negative control of the completeness check, with a stub `terraform` on `PATH` and the glob narrowed to `infra/envs/staging/*/`: exit 1 and `::error::infra/envs/example/dns-mail was not among the roots validated (...)`.
- The spec plus the two existing specs that read the workflow: 3 files, 36 tests passed. Mutation checks, each restored afterwards: a tag pin, an added `secrets.` reference, a dropped required root and a mismatched `pipeline_state_key` each failed exactly the one test named for it (1 failed / 18 passed).
- ESLint, Prettier, `tsc --noEmit -p packages/dev-seed` and the comment-hygiene guard (0 violations over 2092 files) pass on the new spec; Prettier and a YAML parse pass on the workflow.

## Task Commits

1. **Task 1: Append the `infra-validate` job** - `ac5a5c4bb` (feat)
2. **Task 2: The spec that keeps the job credential-free, pinned and complete** - `8b948a948` (test)

## Files Created/Modified

- `.github/workflows/main.yaml` - the `infra-validate` job, appended after `node-engine-range-negative-control`
- `packages/dev-seed/tests/infraValidateJobGate.test.ts` - 19 tests: job declared once and read to its last step; Terraform version, wrapper off, fmt, `-backend=false`, `-lockfile=readonly`, two `!cancelled()` guards, seven roots named; exactly two `uses:` lines each pinned by 40 hex characters; six separate absence tests (secrets, `id-token`, AWS credentials action, Supabase CLI action, artifact upload, `terraform plan|apply|import`); state keys unique and non-empty, under `hand/` or `pipeline/`, `pipeline/` only for `aws` roots; `pipeline_state_key` equals the staging/aws backend key

## Decisions Made

See `key-decisions` in the frontmatter. The main reading: the new job's `actions/checkout` is SHA-pinned while the twelve existing jobs keep `actions/checkout@v7`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Not Yet Observed

- **The job has not been seen in a run.** `main.yaml` runs only on `main`, on pull requests into `main` and on `ci-evidence/**` pushes, and this branch is none of those. Seeing it pass and fail is plan 183-15.
- CI uses Terraform 1.16.5; the local runs used 1.14.7. Whether 1.16.5 formats any file here differently, and whether `-lockfile=readonly` finds the Linux hashes the tracked lock files carry, is unobserved until that run.
- The workstation has bash 3.2; the runner has bash 5. The step script was exercised under 3.2 only.

## Next Phase Readiness

- 183-15 can push an evidence commit to `ci-evidence/**` and read the `infra-validate` job's own result.
- The spec does not name the parity guard of 183-10 and does not run it.

## Self-Check: PASSED

- FOUND: .github/workflows/main.yaml (contains `  infra-validate:` once, last job)
- FOUND: packages/dev-seed/tests/infraValidateJobGate.test.ts
- FOUND: ac5a5c4bb, 8b948a948 (both ancestors of HEAD)
