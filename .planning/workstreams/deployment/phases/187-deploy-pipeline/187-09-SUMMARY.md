---
phase: 187-deploy-pipeline
plan: "09"
subsystem: infra
tags: [github-actions, oidc, terraform-apply, supabase-migrations, edge-functions, deployed-smoke, sns-alert]
status: complete

requires:
  - phase: 187-01
    provides: "the deploy role's policies (ECR push incl. DescribeImages, SNS publish) the gated job assumes"
  - phase: 187-03
    provides: "`push-migrations.sh --confirmed-ref`, accepted only with GITHUB_ACTIONS=true and OPENVAA_DEPLOY_ENVIRONMENT=staging"
  - phase: 187-04
    provides: "`build-push-image.sh` statuses 0 and 3 with their `image_digest=` lines"
  - phase: 187-08
    provides: "`infra/scripts/workflowGuards.ts` (`sharedViolations`, `loadWorkflow`, `jobSteps`, `workflowJobs`, `parseWorkflow`)"
provides:
  - "`.github/workflows/deploy.yml`: job `checks` (credential-free) and job `deploy` (environment `staging`, `ubuntu-24.04-arm`, 60 min)"
  - "Gated step ids in order: build, plan, link, migrations, functions, apply, stable, smoke, served-build, alert"
  - "`infra/scripts/deploy-workflow.test.ts`: 37 guards on triggers, gate, order, digest flow, secret placement, smoke env, cleanup and the alert, with red copies"
affects: [187-10, 187-13, 187-14, 187-17, 187-18, 187-21, 187-22, destroy.yml, lint:workflows]

actuals:
  tokens: 11482
  tasks: 2
  commits: 2
plan_head_before: a2ac7ce4020c25a1ec1bf6d8ebcaf1100d85f17c
plan_head_after: b161040ca6a14f246b986374a95fdb165b23edcf

tech-stack:
  added: []
  patterns:
    - "Every value reaches a run script through the step's env, step outputs included; Supabase and database secrets live in the env of the link, migrations and functions steps only"
    - "Each stage step has an id; the alert maps the first `failure` outcome to a stage name, else `setup` (job.status failure) or `cancelled`"
    - "Each status is read on the next line, never through a pipe; the Management API token reaches curl through a here-string as a one-line `-K -` configuration"

key-files:
  created:
    - .github/workflows/deploy.yml
    - infra/scripts/deploy-workflow.test.ts
  modified: []

key-decisions:
  - "The stable check reads cluster_name and service_name from the AWS root's outputs instead of hard-coding them, and the floor from task_floor of the variable file"
  - "The smoke step runs under `env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY -u AWS_SESSION_TOKEN`: the deploy role's session is not exported into the Playwright run, which needs none"
  - "A failed link step names the alert stage `migrations` (the link is the first half of the migration contract); the other setup steps (checkout, credentials, init, show, installs) name `setup`"
  - "The alert prints only the AWS error code of a failed publish (`alert_error=`), never the CLI's message, which names the role session"
  - "The always-run cleanup also removes the linked work directory and the push-migrations log directory, which holds the CLI's unredacted debug output naming the database's address"

patterns-established:
  - "Gated workflow: one job holds every hosted write, re-assumes the role right before the apply and again for the alert, and removes every $RUNNER_TEMP artifact in an `if: always()` step before the `failure() || cancelled()` alert"

requirements-completed: []

coverage:
  - id: D1
    description: "Triggers: push to deploy/staging and deploy-evidence/** except destroy-staging, workflow_dispatch; no main, no pull_request, no branches-ignore"
    requirement: PIPE-10
    verification:
      - kind: unit
        ref: "vitest deploy-workflow, describe 'the triggers and the concurrency of deploy.yml' (3 cases) and the red copy 'sees a pull-request trigger'"
        status: pass
    human_judgment: false
  - id: D2
    description: "Concurrency staging-aws, cancel-in-progress false; deploy job gated by environment staging, needs checks, arm runner, 60 min, contents read plus id-token write"
    requirement: PIPE-04
    verification:
      - kind: unit
        ref: "vitest deploy-workflow, describes 'the triggers and the concurrency' and 'the gate of the deploy job' (5 cases)"
        status: pass
      - kind: other
        ref: "hosted observation at 187-18/21"
        status: pending
    human_judgment: false
  - id: D3
    description: "Build before yarn install, statuses 0 and 3 accepted, digest passed to the plan; saved plan in $RUNNER_TEMP applied as is"
    requirement: PIPE-05
    verification:
      - kind: unit
        ref: "vitest deploy-workflow 'builds before setup-yarn…', 'plans with the built digest…'"
        status: pass
      - kind: other
        ref: "hosted observation at 187-21"
        status: pending
    human_judgment: false
  - id: D4
    description: "Fixed stage order build, plan, migrations, functions, apply, stable, smoke, served-build, alert; stable check on primary deployment"
    requirement: PIPE-06
    verification:
      - kind: unit
        ref: "vitest deploy-workflow 'runs the stage steps in their fixed order…' and the red copy with apply and plan swapped; actionlint 1.7.12 by digest with shellcheck: no finding"
        status: pass
      - kind: other
        ref: "hosted observation at 187-18/21"
        status: pending
    human_judgment: false
  - id: D5
    description: "Smoke step with SMOKE_EXPECTED_SHA and the contestant secrets, no Supabase/PG key; served-build re-read; no upload, cleanup always"
    requirement: PIPE-07
    verification:
      - kind: unit
        ref: "vitest deploy-workflow smoke, served-build, cleanup and secret-placement cases; vitest tests deployedSmokeGuards 16/16 (no remote-seed switch under .github/)"
        status: pass
      - kind: other
        ref: "hosted observation at 187-21/22"
        status: pending
    human_judgment: false
  - id: D6
    description: "Alert on failure() || cancelled(), role re-assumed, one SNS publish naming stage, commit, trigger and run URL"
    requirement: INFRA-16
    verification:
      - kind: unit
        ref: "vitest deploy-workflow describe 'the alert of the deploy job' (4 cases)"
        status: pass
      - kind: other
        ref: "red run with mail observed at 187-18"
        status: pending
    human_judgment: false
  - id: D7
    description: "Migrations through push-migrations.sh --confirmed-ref from a $RUNNER_TEMP linked work directory over the session pooler; functions deploy with a 3-ACTIVE verify_jwt read-back; Supabase secrets only in those steps' env"
    requirement: SUPA-08
    verification:
      - kind: unit
        ref: "vitest deploy-workflow describe 'the migrations and the functions of the deploy job' (7 cases); grep -c 6543 = 0"
        status: pass
      - kind: other
        ref: "hosted observation at 187-21"
        status: pending
    human_judgment: false

duration: 7min
completed: 2026-11-15
---

# Phase 187 Plan 09: The gated staging deploy Summary

**`deploy.yml`: one `staging`-gated arm job that builds the commit's image once, plans with its digest, pushes migrations through the confirmed form, deploys and reads back the functions, applies the saved plan, checks the primary deployment, runs the deployed smoke entry, re-reads the served build, and mails the operator through SNS when any stage fails or the run is cancelled.**

## Gated job step ids, in order

`build`, `plan`, `link`, `migrations`, `functions`, `apply`, `stable`, `smoke`, `served-build`, `alert`

The full step sequence of job `deploy`:

1. checkout (`persist-credentials: false`)
2. assume the deploy role (`vars.AWS_DEPLOY_ROLE_ARN`, `eu-north-1`, `allowed-account-ids: "471112560111"`, `deploy-${{ github.run_id }}`)
3. **build**: `registry_url` from the AWS variable file, `build-push-image.sh` into `$RUNNER_TEMP/build-push.txt`, status 0 or 3, `digest=` from the research sed pattern
4. setup-terraform 1.16.5 (unwrapped), `init -input=false -no-color -lockfile=readonly`
5. **plan**: `-var "image_digest=$DIGEST" -out="$RUNNER_TEMP/tfplan"`, `TF_VAR_alert_email` from `secrets.ALERT_EMAIL`
6. show `-no-color` to the log and a fenced block in `$GITHUB_STEP_SUMMARY`
7. setup-node 24.21.0, setup-yarn 4.18 (runs `yarn install`)
8. install `postgresql-client` (each apt status read), `psql_version=`
9. **link**: `project_ref` checked as 20 lower-case letters, `$RUNNER_TEMP/supabase-linked/<ref>/supabase` with three links, `supabase link`, `linked_ref=`, `shared_dir_linked=no`, `ref=`/`workdir=` outputs
10. **migrations**: `PGUSER=postgres.$REF`, `push-migrations.sh --ref --workdir --confirmed-ref --log-dir "$RUNNER_TEMP/push-migrations"`, its status passed on
11. **functions**: `supabase functions deploy --project-ref --workdir`, Management API list via `curl -sS -K -` with the token on standard input, one `function=… status=… verify_jwt=… expected_verify_jwt=…` line each, fails unless HTTP 200, three lines, all `ACTIVE` and equal
12. assume the deploy role again (comment: a session lasts one hour)
13. **apply** of `$RUNNER_TEMP/tfplan`
14. **stable**: `task_definition_arn`, `cluster_name`, `service_name` outputs, `describe-services`, `stable_task_definition_matches=`, `stable_rollout_state=`, `stable_running=`, `stable_desired=`; fails unless match, `COMPLETED`, running ≥ `task_floor`
15. `yarn playwright install --with-deps chromium`
16. **smoke**: `yarn test:e2e:deployed --output "$RUNNER_TEMP/smoke-output"`, `smoke_exit=`
17. **served-build**: `curl -fsS --max-time 20` of `/api/health`, `served_build_after_smoke=`, fails unless `$GITHUB_SHA`
18. cleanup, `if: always()`: plan, plan text, smoke output, linked work directory, link/push/functions logs and step files
19. assume the deploy role for the alert, `if: failure() || cancelled()`
20. **alert**, `if: failure() || cancelled()`: `alert_stage=`, one `aws sns publish` to `openvaa-staging-frontend-deployments`, `alert_message_id=`

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-15T02:44:02Z
- **Completed:** 2026-11-15T02:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- The `checks` job (`ubuntu-24.04`, `contents: read`, 20 min) runs `terraform fmt -check -recursive -diff infra`, `init -backend=false -lockfile=readonly` and `validate` of `infra/envs/staging/aws`, then setup-node, setup-yarn and `yarn test:unit:infra`.
- The `deploy` job runs the stages above with every value passed through `env`. Nothing goes to `$GITHUB_ENV`, the job and workflow have no `env`, and the file uploads no artifact.
- Verification: vitest `deploy-workflow` 37/37. actionlint 1.7.12 by digest, with its bundled shellcheck, reports no finding on `deploy.yml` or `infra-plan.yml`. `deployedSmokeGuards` passes 16/16, the whole `yarn test:unit:infra` passes 198/198 in 8 files, and Prettier and ESLint are clean on the test.
- Acceptance greps: `if: failure() || cancelled()` = 2, `!deploy-evidence/destroy-staging` = 1, `--confirmed-ref` = 2, `6543` = 0.

## Task Commits

1. **Task 1 (tracer): the AWS path from triggers to alert.** Commit `887f18bbf`. The tracer gate re-ran `<verify>` end to end and it passed: vitest exit 0, actionlint exit 0, deployedSmokeGuards exit 0, prettier exit 0.
2. **Task 2: migrations and functions between the plan and the apply.** Commit `b161040ca`.

## Files Created/Modified
- `.github/workflows/deploy.yml`: the gated staging deploy (jobs `checks`, `deploy`)
- `infra/scripts/deploy-workflow.test.ts`: guards on deploy.yml, plus red copies for the order, a smoke-step secret and a pull-request trigger

## Decisions Made
See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Critical] The AWS session is removed from the smoke run's environment**
- **Found during:** Task 1
- **Issue:** configure-aws-credentials exports the deploy role's session to every later step, the smoke step included. Playwright does not need it.
- **Fix:** The step runs `env -u AWS_ACCESS_KEY_ID -u AWS_SECRET_ACCESS_KEY -u AWS_SESSION_TOKEN yarn test:e2e:deployed …`. The step's `env` is still exactly the three keys the behavior list names.
- **Files modified:** .github/workflows/deploy.yml
- **Commit:** 887f18bbf

**2. [Rule 2 - Critical] The cleanup covers the Supabase artifacts**
- **Found during:** Task 2
- **Issue:** `push-migrations.sh` warns that its log directory holds unredacted debug output naming the database's address. The linked work directory holds `.temp`.
- **Fix:** The `if: always()` step also removes `$RUNNER_TEMP/supabase-linked`, `push-migrations`, the link and deploy logs and the function list files. A guard asserts the first two.
- **Files modified:** .github/workflows/deploy.yml, infra/scripts/deploy-workflow.test.ts
- **Commit:** b161040ca

**3. [Discretion] The alert names the link step's failure `migrations`.** The plan's stage list does not cover the link. Every other setup step still names `setup`.

**4. [Discretion] The cluster and service names come from Terraform outputs, not literals**, so the stable check reads the same root the apply wrote.

**5. [Discretion] The functions read-back uses a here-string, not `printf … | curl`.** The token still reaches curl only on standard input. Curl's status is read directly, as the execution rules require, rather than through a pipe.

**6. [TDD form] Each task's test and workflow were committed together, one commit per task.** The plan's type is `execute`. Red cases on mutated copies of the file's text stand in for a separate RED commit: the apply/plan swap, a `PGPASSWORD` added to the smoke step, and a `pull_request` trigger.

---

**Total deviations:** 6, none architectural.

## Issues Encountered
- Two first-draft assertions were too broad. `aws sns publish` also matched the `::error::` text, so the guard now counts only line starts. `--project` matched `--project-ref`, so the guard now uses `--project(?![-\w])`.

## Open items
- Nothing has run on GitHub. The environment `staging`, its secrets (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD`, `ALERT_EMAIL`) and its variables (`AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`, `DEPLOY_ENVIRONMENT`) are created at 187-14/17.
- Assumptions still to observe: Chromium on `ubuntu-24.04-arm` (A6), `psql` 16 against PG17 (A3), the session pooler fallback (A9), and that a job waiting for approval holds the concurrency group (A5). If the deploy role cannot be assumed at all, the alert step cannot publish either.
- `lint:workflows`, if added by a later plan, should name `deploy.yml` next to `infra-plan.yml`.
- REQUIREMENTS.md is unchanged, per the operator notes.

## Next Phase Readiness
- 187-10 (`destroy.yml`) shares the `staging-aws` concurrency group and can reuse the test helpers' form.

## Self-Check: PASSED
- FOUND: .github/workflows/deploy.yml, infra/scripts/deploy-workflow.test.ts
- FOUND: 887f18bbf, b161040ca (ancestors of HEAD)
