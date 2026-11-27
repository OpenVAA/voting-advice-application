---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "08"
subsystem: infra
status: complete
tags: [runbook, terraform, aws, ecs, cloudfront, ssm, task-environment, guard]
requires:
  - phase: 185-01
    provides: execution role in bootstrap (Step 8), the push and alert-address rulings
  - phase: 185-05
    provides: infra/scripts/build-push-image.sh and its exit codes
  - phase: 185-07
    provides: example AWS root tfvars, module-test CI step
provides:
  - infra/envs/staging/aws/README.md with its frame and Steps 1 to 6
  - infra/README.md Regions section, corrected Roots table, Order and IAM rule
  - task-environment guard over the runbook's table and both AWS roots' tfvars
affects: [185-09, 185-11, 185-12, 185-13]
tech-stack:
  added: []
  patterns:
    - "Every step of the AWS runbook begins with the same block: the static key variables unset, the profile exported, $L made, the account read and compared, each status on its own line"
    - "A secret reaches the AWS CLI as a jq-built --cli-input-json on standard input, from an exported variable read with read -rs"
key-files:
  created:
    - infra/envs/staging/aws/README.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-08-tdd-red.json
  modified:
    - infra/README.md
    - apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
key-decisions:
  - "The runbook's opening block unsets AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS_SESSION_TOKEN before exporting AWS_PROFILE, because a key pair in the environment wins over the profile"
  - "Step 4 ends by pinning image_tag in the staging tfvars and committing it, so Step 5's single plan runs the pushed image"
  - "The guard also flags a tfvars environment_values name that the list does not hold, and a runbook or tfvars without its section or block"
patterns-established:
  - "Named lines s<step>_<field>=; statuses s<step>_<field>_exit= on the next line"
requirements-completed: [INFRA-12, INFRA-10, OBS-08]
duration: 15min
completed: 2026-11-12
actuals:
  tokens: 26940
  tasks: 3
  commits: 4
plan_head_before: 02f42b0355ff104949e4bac57beb8d7e6dd1af88
plan_head_after: 1b17fed3801aa756614f1c532f55ae027b199ec6
---

# Phase 185 Plan 08: The AWS Root's Runbook, Steps 1 to 6 Summary

The staging AWS root now has its own runbook. It covers everything from the account check to the first apply and the operator's confirmations. `infra/README.md` now describes the AWS root as this phase builds it. The task-environment guard now also holds the runbook's table and both AWS roots' `environment_values` to the module's list.

## Performance

- **Duration:** about 15 min
- **Started:** 2026-11-12T17:40:10Z
- **Completed:** 2026-11-12T17:54:30Z
- **Tasks:** 3 of 3
- **Files:** 4 (2 created, 2 modified)

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (tracer) | The runbook's frame and Steps 1 to 6 | 5a49cf863 | infra/envs/staging/aws/README.md |
| 2 | infra/README.md brought up to date | feff7c303 | infra/README.md |
| 3 (RED) | The guard expects the runbook and both tfvars | f987b2a2b | taskEnvironment.test.ts, evidence/185-08-tdd-red.json |
| 3 (GREEN) | The guard checks them | 1b17fed38 | taskEnvironment.test.ts |

## What was built

**The runbook (`infra/envs/staging/aws/README.md`, 953 lines).** It opens with what the root holds and how it is applied: by hand in the operator's administrator session, then by the deploy workflow on the same key, whose first run must show no change. It then lists what lives outside the root (registry and role in bootstrap, zone and mail in dns-mail, the operator's parameters) and why each one survives a destroy. The sections that follow:
- **Rules of this root**, eight, each with its reason.
- **What you paste back.**
- **What the operator gives.**
- **Before you start.**
- **The lines that begin each command.**
- **The task's environment:** 16 rows, generated from `task-environment.json` with columns Name, Source, Starts without it and Description.
- **Flow overview:** Steps 1 to 18. Steps 7 to 18 are marked not yet written.
- **Steps 1 to 6.**
- **Not yet observed:** 17 rows, each naming its step.
- **Observations:** header only.

What each step does:
- **Step 1:** the tools, `uname -m`, and the alert address checked as set without being printed.
- **Step 2:** the operator creates the two parameters. Each is a SecureString with the default key and the tags Project and Environment only. The value is read with `read -rs` and passed through `jq` to `--cli-input-json file:///dev/stdin`. The read-back prints name, type, key and tag keys only, and the step includes a `ParameterAlreadyExists` and overwrite note.
- **Step 3:** bootstrap's Step 8, then the read-back of the role:
  - its path, trust and ARN, compared with the tfvars
  - its attached policies and an inline policy count of 0
  - the policy simulator, `allowed` on the role's own path and `implicitDeny` on `/openvaa/staging/other/X`
  - both inventory asserts
- **Step 4:** the clean tree, then the source-only commit:
  - built through a temporary index with `.planning` removed and `origin/main` as its parent
  - its tree checked for planning paths
  - pushed to `deploy-evidence/185-image`, with a lease form for a rebuild
  - listed by `ls-remote`

  Then the build from a detached worktree, the registry and local read-back (digest, media type, arm64), the local `docker run` with the four stand-in variables and the `/api/health` build match, the refused second push (a derived `FROM` + `LABEL` image, the refusal line with `<registry>` in place of the host), the unchanged digest, and the script exiting 3. It ends by pinning `image_tag` and cleaning up.
- **Step 5:** `init -lockfile=readonly`, then one plan to `$L/tfplan` with no `-target`. It prints the counts of planned actions by kind from `show -json` and `s5_outside_module`, and quotes the stop rule. The apply runs in the background with a status file. After it come a `-detailed-exitcode` second plan, the state object read (SSE, versioned), and `/api/health` through the CDN (status, build match, `x-cache`).
- **Step 6:** the operator confirms the subscription and activates the tags. The read-back prints each subscription's protocol and state, never its endpoint, and calls `aws ce list-cost-allocation-tags --region us-east-1`.

Every command line is at most 80 characters, with `\` continuations. Every jq, awk and sed program in the runbook was run against sample input before the commit.

**`infra/README.md`:**
- The opening paragraph now says the AWS root is applied by hand until the deploy workflow exists. It no longer says that nothing is applied by an agent.
- Roots table: bootstrap's row adds the execution role and its parameter policy, with "the execution role not yet" under Ever applied. The AWS root's row lists what it holds, keeps its key, gives the new "Applied by" text and reads "Not yet". The example AWS row now says it is a template of the staging AWS root.
- The `hand/` and `pipeline/` paragraph now explains why a root applied by hand keeps a `pipeline/` key.
- The runbooks line links the new runbook.
- Order step 5 now names its preconditions, followed by the line about a no-change first run of the workflow.
- New `## Regions` section: `us-east-1` for the CloudFront certificate and the future WAF rule (CLOUDFRONT scope, off, not built yet). The distribution, IAM, the zones and the budget are global, and the Supabase project is in `eu-north-1`.
- The IAM rule reworded (see Deviations).
- The validation job's guard row adds `terraform test` of every module that has a `tests` directory.

**The guard:**
- `taskEnvironmentProblems` now also takes `runbook` and `tfvars: Array<{path, text}>`.
- `runbookEnvironmentNames` reads backticked text from the line that begins `## The task` up to the next `## ` heading.
- `tfvarsEnvironmentNames` reads the `NAME =` lines between `environment_values = {` and the next line that begins with `}`.
- The new problems: a list name the runbook section does not list; a `value` name a tfvars does not set; a `parameter` name a tfvars sets; a tfvars name not in the list; a runbook without the section; a tfvars without the closed block.
- Eight new fixture cases. The real-files case reads the runbook and both AWS tfvars.

## TDD Gate Compliance

- **RED:** `f987b2a2b`. Eight new fixture cases failed on their assertions (`expected [] to deeply equal [StringContaining …]`), and the 16 earlier cases and the real-files case passed.
  - The target is "taskEnvironmentProblems against the runbook and the AWS roots > names a variable the runbook's environment section does not list".
  - The classifier refused the tap-flat report as `invalid_record` ("Malformed TAP"), because vitest writes its multi-line diff below the YAML indent. The same run was repeated with `--reporter=junit`, and `gsd_run check tdd-red-evidence` returned `RED_EVIDENCE_OK` (`target_test_failed`). The record, with `semanticAssessment`, is `evidence/185-08-tdd-red.json`.
- **GREEN:** `1b17fed38`. 25 of 25 pass.
- **REFACTOR:** none needed.

## Verification

| Gate | Result |
| ---- | ------ |
| Task 1 verify 1 (twelve headings, `prettier --check`) | exit 0 |
| Task 1 verify 2 (no planning reference, profile present, `-target` on 1 line, no long command line) | exit 0 |
| Task 1 acceptance `grep -c 'Key=Root'` | 0 |
| Tracer gate (auto mode): Task 1 verify re-run after its commit | exit 0, then went on to Task 2 |
| Task 2 verify (Regions, us-east-1, CLOUDFRONT, runbook link, old line gone, no planning reference, Prettier) | exit 0 |
| Task 2 acceptance `grep -c 'pipeline/staging/aws/terraform.tfstate'` | 1 |
| Task 3 verify `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts` | exit 0, 25 passed |
| Task 3 acceptance `grep -c 'infra/envs/example/aws/terraform.tfvars'` | 1 |
| Planted faults in the real files (XFF_DEPTH row removed from the runbook; ORIGIN removed from, ANALYTICS_POSTHOG_KEY added to, the example tfvars) | real-files case exit 1, each fault named; files restored with `git checkout -- <file>` |
| ESLint, Prettier on the guard; `scripts/assert-comment-hygiene.mjs` | 0, 0, 0 violations |
| `yarn workspace @openvaa/frontend typecheck` | exit 0, 0 errors, 0 warnings |
| `yarn test:unit:infra` | exit 0, 102 passed |

Nothing ran against AWS. No Terraform plan or apply was made.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Correctness] The opening block unsets the static key variables**
- **Found during:** Task 1
- **Issue:** if `AWS_ACCESS_KEY_ID` and its pair are in the environment, both the CLI and the provider use them in preference to `AWS_PROFILE`, so exporting the profile alone does not keep the default account's credentials out.
- **Fix:** `unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN` is the second line of every step, and the section gives the reason. `$L` is made before the account read, so the CLI's error text goes to `$L/account.err` and not to the terminal.
- **Commit:** 5a49cf863

**2. [Rule 2 - Correctness] Steps 4 and 5 carry the checks the hosted plans need**
- **Found during:** Task 1, when reading plans 185-12 and 185-13
- **Fix:**
  - Step 4 checks that the commit's tree holds no planning path, reads back the arm64 single-manifest image and the unchanged digest, and ends by pinning `image_tag` in the staging tfvars and committing it. Plan 185-12 sets the tag, and Step 5 reads it.
  - Step 5 adds `-lockfile=readonly` to `init` (threat T-185-SC), a count of planned addresses outside `module.frontend`, the state object's read-back, and a note on a cached negative DNS answer.
- **Commit:** 5a49cf863

**3. [Rule 1 - Truth] Two more `infra/README.md` statements made true**
- **Found during:** Task 2
- **Issue:** two statements became misleading now that a root applied by hand keeps a `pipeline/` key. The `hand/` and `pipeline/` paragraph said "the one root the pipeline applies keeps it under `pipeline/`". The IAM rule said "IAM is written only by roots applied by hand".
- **Fix:** the paragraph now explains the key choice. The rule now reads "roots that no workflow will ever apply" and adds that the AWS root writes none. Bootstrap's "Ever applied" notes that the execution role is not applied yet.
- **Commit:** feff7c303

**4. [Rule 2 - Correctness] The guard checks in both directions, and reports a missing section**
- **Found during:** Task 3
- **Fix:** a tfvars name outside the list, a runbook without the section and a tfvars without a closed block are each a named problem. Otherwise a misspelled key, or a renamed heading, would pass silently.
- **Commit:** 1b17fed38

**5. [Process] A RED evidence record outside `files_modified`**
- `evidence/185-08-tdd-red.json` comes from the RED step. It was made with the JUnit reporter after the TAP adapter refused vitest's output (see TDD Gate Compliance).

### Additions

- A short "What you paste back" section, in the shape the other two runbooks use.

## Known Stubs

| File | Line | Reason |
| ---- | ---- | ------ |
| infra/envs/staging/aws/README.md | "Steps 7 to 18 are not written yet." under Flow overview | Intentional. This plan writes Steps 1 to 6, and plan 185-09 writes Steps 7 to 18 and the election-day section. Also recorded in `.planning/WINDOWS.md`. |

## Threat Flags

None. The runbook adds no endpoint or permission. T-185-19 is mitigated: secrets are read with `read -rs` and passed as `jq`-built standard input. T-185-20 is mitigated: only the account id is read, and the caller's ARN is never printed. T-185-SC is mitigated: no package was installed, and `init` reads the lock file only.

## Self-Check: PASSED

- FOUND: infra/envs/staging/aws/README.md
- FOUND: infra/README.md (Regions section)
- FOUND: apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
- FOUND: evidence/185-08-tdd-red.json
- FOUND commits: 5a49cf863, feff7c303, f987b2a2b, 1b17fed38 (each an ancestor of HEAD)
