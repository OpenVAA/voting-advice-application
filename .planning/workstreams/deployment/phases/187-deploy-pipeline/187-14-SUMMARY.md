---
phase: 187-deploy-pipeline
plan: "14"
subsystem: infra
tags: [github-environments, deploy-gate, branch-policy, secrets, oidc]
status: complete

requires:
  - phase: 187-13
    provides: "the committed final tree and closing E2E run that the first push (plan 187-15) carries"
provides:
  - "`evidence/187-14-environments.md`: the starting state (Task 1) and the read-back of both GitHub Environments, their secrets and variables, and the repository's own variable and secret (Task 3)"
  - "GitHub settings, created by the operator: environments `staging` and `staging-destroy`; `staging` secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `ALERT_EMAIL` and variables `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`, `DEPLOY_ENVIRONMENT`; repository variable `AWS_PLAN_ROLE_ARN` and secret `ALERT_EMAIL`"
affects: [187-15, 187-16, 187-17, 187-18]

actuals:
  tokens: 2800
  tasks: 3
  commits: 4
plan_head_before: 9791c06bf6233fcdbbe38bc3abca06f77c54aadd
plan_head_after: c68824af7deca0599aaa0a7c7fac910af6cd4645

tech-stack:
  added: []
  patterns:
    - "Settings read back with `gh api` GETs filtered by `--jq` to types, names and counts, so no login and no secret value reaches the transcript; a secret-adjacent value (the pooler host) is matched against its form inside the shell and only the verdict is printed"

key-files:
  created:
    - .planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-14-environments.md
  modified: []

key-decisions:
  - "The gate and the branch guard exist before any push: both environments have one User reviewer, self-review allowed, administrator bypass off, and exactly the branch rules deploy/staging and deploy-evidence/*, neither of which admits main"

requirements-completed: []
requirements-advanced: [PIPE-04, PIPE-10, PIPE-08, SUPA-08]

metrics:
  duration: "3h45min wall clock (16:15Z-20:00Z), almost all of it the operator checkpoint"
  completed: 2026-11-15
---

# Phase 187 Plan 14: GitHub Environments, secrets and variables Summary

**The operator created the GitHub Environments `staging` and `staging-destroy`. I read every setting back with `gh api` GETs. Each environment has one required reviewer, allows self-review, has administrator bypass off, and admits only `deploy/staging` and `deploy-evidence/*`. `staging` holds the three secrets and three variables the deploy workflow names. `staging-destroy` holds nothing, and no rule admits `main`.**

## Branch policies and bypass flags

| Environment | Branch rules (type) | Custom policies | Admin bypass | Reviewers | Self-review | Wait timer |
|---|---|---|---|---|---|---|
| `staging` | `deploy/staging` (branch), `deploy-evidence/*` (branch) | true (protected-branches false) | **false** | 1, type User | allowed (`prevent_self_review: false`) | none |
| `staging-destroy` | `deploy/staging` (branch), `deploy-evidence/*` (branch) | true (protected-branches false) | **false** | 1, type User | allowed (`prevent_self_review: false`) | none |

`MAIN_ADMITTED=no`: I tested `main` against each rule with the shell's own glob (`[[ main == <rule> ]]`). Neither rule equals it or matches it as a glob.

## Secrets and variables (names only)

```
ENV_STAGING_SECRET_NAMES=ALERT_EMAIL,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
ENV_STAGING_VARIABLE_NAMES=AWS_DEPLOY_ROLE_ARN,DEPLOY_ENVIRONMENT,SUPABASE_POOLER_HOST
ENV_STAGING_AWS_DEPLOY_ROLE_ARN=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
ENV_STAGING_DEPLOY_ENVIRONMENT=staging
POOLER_HOST_FORM=ok
ENV_STAGING_DESTROY_SECRETS=0
ENV_STAGING_DESTROY_VARIABLES=0
REPO_AWS_PLAN_ROLE_ARN=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
REPO_VARIABLE_NAMES=AWS_PLAN_ROLE_ARN
REPO_SECRET_NAMES=ALERT_EMAIL
```

No setting at either level holds the service-role key. The two smoke contestant secrets are not set yet; they are set at plan 187-17, once the contestant exists.

## Performance

- **Started:** 2026-11-15T16:15Z (Task 1)
- **Completed:** 2026-11-15T20:00Z
- **Tasks:** 3 (1 tracer, 1 operator checkpoint, 1 auto)
- **Files created:** 1

## Task Commits

1. **Task 1: The repository's settings now, read-only** - `aed6cb3b4` (docs)
2. **Task 2: The operator creates the environments and sets the secrets and variables** - no commit (operator action). The reply was stored with `attempt.sh put 187-14-2` under attempt `20261115T161551Z.aed6cb3b4`, passed the screen (exit 0), and holds `answer_environments=created`, `answer_secrets_state=set`, `answer_alert_email=same-as-stack` and `answer_pooler_host=copied`
3. **Task 3: Every setting read back** - `c68824af7` (docs). `bound` and `has` both exited 0 before any read, and the Task 3 `<verify>` block exited 0

Two orchestrator commits sit between Task 1 and Task 3 in the measured range: `d55a94b7a` (R-01 resolved as one approval, listed as an accepted risk) and `4256c5a3b` (the plan amendment that renamed the secrets answer key to `answer_secrets_state`). They are counted in `commits: 4` because the count is measured, not narrated.

## Deviations from Plan

### Process

**1. The answer key was renamed between the checkpoint and the resume**
- **Found during:** Task 2, at the previous executor's first `put`
- **Issue:** the screen refused the reply. Rule 2 (secret-name) treats any name whose last word ends in a secret word as a secret, so the original key for the secrets answer was refused. The refused put appended nothing.
- **Fix:** the orchestrator amended the plan (`4256c5a3b`) so the key is `answer_secrets_state=set`. The operator reworded their reply to match, and this run stored it unchanged apart from stripping the indentation pasted with it.
- **Files modified:** `187-14-PLAN.md` (by the orchestrator, not by this plan's tasks)

Otherwise the plan ran as written. Every call was a `gh api` GET, nothing was pushed, and the agent changed no setting.

## Issues Encountered

None.

## Next Phase Readiness

- Plan 187-15 may push workflows that name `environment: staging` and `staging-destroy`. Both environments now exist with their gate, so GitHub will not create an unprotected one on the first run (T-187-37 mitigated). `can_admins_bypass` reads back false for both (T-187-38 mitigated). No secret value entered the transcript or the evidence (T-187-39 mitigated).
- R-01 is resolved, so plan 187-18 needs no revision for it.
- PIPE-04, PIPE-10, PIPE-08 and SUPA-08 are advanced, not completed. Plans 187-15 to 187-25 carry them too, and each one is met only once a pipeline run shows it. That is why `requirements.mark-complete` was not run.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/187-deploy-pipeline/evidence/187-14-environments.md`
- FOUND: `aed6cb3b4` (ancestor of HEAD)
- FOUND: `c68824af7` (ancestor of HEAD)
- Task 3 `<verify>` exit 0; the evidence holds no address and no login
