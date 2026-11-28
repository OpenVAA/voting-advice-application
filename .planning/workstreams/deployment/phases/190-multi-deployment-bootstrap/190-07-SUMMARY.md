---
phase: 190-multi-deployment-bootstrap
plan: 07
subsystem: pipeline workflows
tags: [github-actions, deploy, destroy, resolver, multi-deployment]
requires:
  - "190-02: infra/scripts/resolve-deployment.sh (deploy and destroy modes, 18 outputs, --github-output)"
  - "190-04: the deployment map infra/bootstrap/deployments.auto.tfvars.json"
provides:
  - "deploy.yml and destroy.yml with a credential-free first job `resolve`; every later job needs it"
  - "environment, role, account, region and the AWS and Supabase roots of both workflows from needs.resolve.outputs.*"
  - "deploy job settings check: DEPLOY_ENVIRONMENT must equal the resolved key, a configured AWS_DEPLOY_ROLE_ARN must equal the resolved role"
  - "cross-workflow rules over resolved values, plus the new needs-resolve rule"
affects:
  - "190-08 (stage values: migration --deployment, smoke key, URL, alert topic and text, confirm text, Supabase state key, step names, headers)"
  - "190-09 (infra-plan.yml; its literal ARN is still pinned by deploy-role-arn)"
tech-stack:
  added: []
  patterns:
    - "resolve job outputs mapped 1:1 from steps.resolve.outputs.<name>"
    - "Terraform root as -chdir=\"$AWS_ROOT\" with AWS_ROOT bound in the step env to needs.resolve.outputs.aws_root"
    - "errexit stand-ins for needs.resolve.outputs.* taken from a run of the resolver for deploy/staging"
key-files:
  created: []
  modified:
    - .github/workflows/deploy.yml
    - .github/workflows/destroy.yml
    - infra/scripts/workflows.test.ts
    - infra/scripts/deploy-workflow.test.ts
    - infra/scripts/destroy-workflow.test.ts
    - infra/scripts/workflow-errexit.test.ts
decisions:
  - "The resolve step reads the resolver's status as `|| resolve_exit=$?` and ends with its own ::error:: line, so it joins the errexit sweep"
  - "The settings check is step `resolved-settings` (stage `setup` in the alert), placed between checkout and the first assume"
  - "arm-lock expands a resolved \"$AWS_ROOT\" to every infra/envs/<key>/aws of the map that exists; any other binding stays unreadable"
  - "The errexit harness maps an env value ${{ needs.resolve.outputs.X }} to the resolver's own output for deploy/staging, and expands $VAR paths when it copies repository files into a sweep case"
metrics:
  duration: "~12 min"
  completed: 2026-11-24
---

# Phase 190 Plan 07: deploy.yml and destroy.yml routed through the resolve job Summary

Both writing workflows now start with a credential-free `resolve` job that runs `resolve-deployment.sh` with the repository id and ref (and the event for destroy). Their triggers are the static superset (`deploy/*`, `deploy-evidence/**` without `destroy-*`, and `deploy-evidence/destroy-*`) and they share the one constant group `aws-pipeline`. Every environment, `role-to-assume`, account, region and Terraform root comes from `needs.resolve.outputs.*`. For staging the resolved values equal the old literals.

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | The cross-workflow rules over resolved values (RED) | 867dd0b2f | infra/scripts/workflows.test.ts |
| 2 | deploy.yml routed through the resolve job | 7cc3afaec | .github/workflows/deploy.yml, infra/scripts/deploy-workflow.test.ts, infra/scripts/workflow-errexit.test.ts |
| 3 | destroy.yml routed through the resolve job (GREEN for Task 1) | 20f1ab5ea | .github/workflows/destroy.yml, infra/scripts/destroy-workflow.test.ts |

## What changed

- **workflows.test.ts:** the rules are now apply-root (`-chdir="$AWS_ROOT"` with `AWS_ROOT` bound to `needs.resolve.outputs.aws_root`), no-main-push (new patterns), shared-concurrency (`aws-pipeline`), deploy-role-arn (no literal ARN in deploy/destroy and every role is `needs.resolve.outputs.deploy_role_arn`; infra-plan.yml's literal ARN is still derived from tfvars plus map), environments (resolved expressions; the deploy job uses the object form with a `url`), the new **needs-resolve** rule and arm-lock (with the `mapAwsRoots()` expansion). Every rule has `it.each` red copies. The remaining `staging-aws` and `staging` strings are mutation replacements and the derived-ARN pin. `infra/envs/staging/aws` no longer appears in the file.
- **deploy.yml:**
  - The `resolve` job is first.
  - `checks` has `needs: resolve`, and its validate step uses `"$AWS_ROOT"`.
  - `deploy` has `needs: [resolve, checks]` and the environment `{ name: resolved environment, url: https://resolved domain }`.
  - A new step "Check the settings name the resolved deployment" comes before the first assume.
  - All four assume steps take the role, region and account from the resolve outputs.
  - The build, init, plan, show, apply and stable steps read `$AWS_ROOT`, and link reads `$SUPABASE_ROOT`.
  - The plan summary heading is `### Plan of $AWS_ROOT`.
- **destroy.yml:**
  - The `resolve` job is first, in destroy mode with `EVENT_NAME`.
  - `plan-destroy` has `needs: resolve`, `apply-destroy` has `needs: [resolve, plan-destroy]`, and both job `if:` conditions use `format('refs/heads/{0}', needs.resolve.outputs.destroy_branch)` and `needs.resolve.outputs.destroy_confirm`.
  - The environments are `needs.resolve.outputs.destroy_environment`, and the role, account and region are resolved.
  - Every `-chdir` is `"$AWS_ROOT"` or `"$SUPABASE_ROOT"`, each bound in its step env.
  - The destroy plan headings are `### Destroy plan of $AWS_ROOT`.
- **Tests:**
  - deploy-workflow tests: new describes for the resolve job and the settings check, each with red copies; the trigger, concurrency, checks, gate, role, root and tfvars pins are updated.
  - destroy-workflow tests: a new resolve-job describe. rootViolations now checks the env bindings. New red copies cover a literal root, a wrong `AWS_ROOT`/`SUPABASE_ROOT` binding, a literal destroy branch in `if:`, missing `resolve` in `needs` and `id-token` on resolve.

## Verification

- `yarn test:unit:infra`: **676 passed / 6 failed**. The six failures are the 190-01 host-only `workflow-errexit.test.ts` failures with their titles unchanged (wrong-subject ×2, sweep "deploy.yml deploy Alert the operator", sweep "destroy.yml plan-destroy Show the Supabase root's state is out of reach", Supabase-root ×2). This adds 43 tests to the 633/6 baseline and no failures.
- `yarn lint:check` exit 0, `yarn format:check` exit 0, `yarn lint:workflows` exit 0 ("actionlint found nothing in 3 workflows").
- Acceptance greps:
  - deploy.yml outside comments has 0 `infra/envs/staging`.
  - `vars.AWS_DEPLOY_ROLE_ARN` appears once in deploy.yml (the settings check).
  - `group: aws-pipeline` appears once in each file.
  - destroy.yml outside comments has 0 `arn:aws:iam::`.
  - `needs.resolve.outputs.destroy_environment` appears twice in destroy.yml.

**Renamed errexit cases:** none of the six baseline titles changed. New errexit cases: the sweep now also covers "deploy.yml resolve Resolve the deployment" and "destroy.yml resolve Resolve the deployment" (both green). One case was added: "the build step of deploy.yml under bash -e > stops before the build when the root AWS_ROOT names holds no tfvars".

**E2E:** no local E2E project's spec, fixture, route or helper was touched, so no targeted run is due. Project deltas are 0 against `tests/e2e-runs/191-06-full` (742 passed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The alert reads the new settings-check step's outcome**
- **Found during:** Task 2
- **Issue:** The deploy test "names a stage for every step before it" requires the alert to read every earlier step's outcome. The new step would have made it fail.
- **Fix:** Added `RESOLVED_SETTINGS_OUTCOME` and the pair `"setup:$RESOLVED_SETTINGS_OUTCOME"` to the alert. The alert's text, subject and topic are unchanged and stay with 190-08.
- **Commit:** 7cc3afaec

**2. [Rule 3 - Blocking] Plan summary headings name `$AWS_ROOT`**
- **Found during:** Tasks 2 and 3
- **Issue:** The `echo "### Plan of infra/envs/staging/aws"` lines are not comments. They would have broken the acceptance grep (0 `infra/envs/staging` outside comments) and the destroy rule that no root is named outside a comment.
- **Fix:** The headings now print `$AWS_ROOT`, which is staging's value for staging. 190-08 lists this rename, so it has nothing left to do here.
- **Commits:** 7cc3afaec, 20f1ab5ea

**3. [Rule 3 - Blocking] errexit harness stand-ins for resolve outputs**
- **Found during:** Task 2
- **Issue:** The build, link and stable steps read `"$AWS_ROOT/terraform.tfvars"` or `"$SUPABASE_ROOT/terraform.tfvars"`. With the stand-in value `standin`, `sed` failed inside `x=$(...)` under `bash -e`, so the steps ended before they printed their `::error::` lines and three sweep cases went red.
- **Fix:**
  - `standInEnv` maps `${{ needs.resolve.outputs.X }}` to the resolver's own output for `deploy/staging`, computed once by running the script.
  - `sweepFiles` expands `$VAR` paths when it copies repository files.
  - The build, plan-print and stable cases set `AWS_ROOT` explicitly to a harness directory and write the tfvars there, as the plan asked.
- **Commit:** 7cc3afaec

**4. [Rule 1 - Bug] destroy.yml resolve-job comment named the map's file**
- **Found during:** Task 3
- **Issue:** The file name `deployments.auto.tfvars.json` contains `vars.`, which tripped the test "names no secret and no setting at all".
- **Fix:** The comment now says "the deployment map under infra/bootstrap". The test was not relaxed.
- **Commit:** 20f1ab5ea

## Known follow-ups (planned, not stubs)

- deploy.yml still calls `push-migrations.sh --confirmed-ref` without `--deployment` (logged by 190-03 in deferred-items.md). 190-08 adds `--deployment "$DEPLOYMENT_KEY"`. Until it lands, a staging deploy stops at the migrations step.
- The smoke and re-read URLs, the alert topic and text, the dispatch `confirm` description, the head-object bucket and key, the step display names and the header comments still name staging. All of them belong to 190-08.

## Threat Flags

None. The new surface is the resolve job, which has `contents: read`, no `id-token`, no environment and a checkout without persisted credentials, as the threat model sets out (T-190-28 to T-190-33). Tests cover it.

## Self-Check: PASSED

- FOUND: .github/workflows/deploy.yml, .github/workflows/destroy.yml, infra/scripts/workflows.test.ts, infra/scripts/deploy-workflow.test.ts, infra/scripts/destroy-workflow.test.ts, infra/scripts/workflow-errexit.test.ts
- FOUND commits: 867dd0b2f, 7cc3afaec, 20f1ab5ea
