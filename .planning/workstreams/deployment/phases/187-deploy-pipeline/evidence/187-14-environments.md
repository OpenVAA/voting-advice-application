# 187-14 — GitHub Environments, secrets and variables

Repository: `OpenVAA/voting-advice-application`. Read with `gh api` GETs only; every call exited 0. Names, counts and forms only: no login, no address, no secret value.

## Task 1 — The starting state (read 2026-11-15T16:15Z, tree at `9791c06bf`)

Calls: `environments` (names only, paginated), `actions/permissions/workflow`, `actions/oidc/customization/sub`, `actions/variables` (names only), `actions/secrets` (names only).

```
READ_AT=2026-11-15T16:15Z
ENV_STAGING_EXISTS=no
ENV_STAGING_DESTROY_EXISTS=no
ENV_TOTAL_COUNT=30
DEFAULT_WORKFLOW_PERMISSIONS=write
CAN_APPROVE_PULL_REQUEST_REVIEWS=false
OIDC_SUB_USE_DEFAULT=true
OIDC_SUB_USE_IMMUTABLE_SUBJECT=false
OIDC_SUB_CLAIM_PREFIX=repo:OpenVAA/voting-advice-application
REPO_VARIABLE_NAMES=(none)
REPO_SECRET_NAMES=(none)
OPERATOR_OVERRULES=none
```

Readings:

- Neither `staging` nor `staging-destroy` is among the repository's 30 environments, so there are no existing settings to correct; both are created at Task 2. Until then, a pushed workflow naming either would make GitHub create it with no protection (research Pitfall 6), so no workflow naming them is pushed before Task 3's read-back.
- The OIDC subject is the default form (`use_default: true`, not the immutable subject), which is the form the `github-oidc` trusts name.
- The default workflow token permission is `write`. The pipeline's workflows declare their own `permissions:` blocks, so this repository default does not reach them; it is recorded, not changed.
- The repository holds no Actions variable and no Actions secret: `AWS_PLAN_ROLE_ARN` and the repository `ALERT_EMAIL` are set at Task 2.
- `187-DISCUSSION-POINTS.md` carries no ticked box and no `EDIT:` or `NOTE:` line from the operator (§ A-04, § A-05, § Amendments). The open R-01 decision bears on plan 187-18, not on this plan.

## Task 2 — The operator's reply

Attempt `20261115T161551Z.aed6cb3b4` of key `187-14-2`. The reply was stored with `attempt.sh put 187-14-2` under `OPERATOR_REPLY=received attempt=20261115T161551Z.aed6cb3b4 plan=187-14 task=2`; the put passed the screen (exit 0). It holds `answer_environments=created`, `answer_secrets_state=set`, `answer_alert_email=same-as-stack` and `answer_pooler_host=copied`. The operator created both environments and set every secret and variable themselves; no value passed through the agent.

## Task 3 — Every setting read back (read 2026-11-15T19:59Z, tree at `4256c5a3b`)

Checks first: `attempt.sh bound 187-14-2 OPERATOR_REPLY plan=187-14 task=2` exit 0; `attempt.sh has 187-14-2 '^answer_environments=created$'` exit 0.

Calls (GETs only, every one exited 0): `environments/<E>` (protection rules read as reviewer types only, no login), `environments/<E>/deployment-branch-policies`, `environments/<E>/secrets` (names only), `environments/<E>/variables` (names; values only of the two non-secret variables named below), `environments/staging/variables/SUPABASE_POOLER_HOST` (matched against `^[a-z0-9-]+\.pooler\.supabase\.com$` in the shell, its value not printed or written), `actions/variables`, `actions/secrets` (names only).

```
READ_AT=2026-11-15T19:59Z
ENV_STAGING_REVIEWERS=1
ENV_STAGING_REVIEWER_TYPE=User
ENV_STAGING_PREVENT_SELF_REVIEW=false
ENV_STAGING_WAIT_TIMER=none
ENV_STAGING_ADMIN_BYPASS=false
ENV_STAGING_CUSTOM_BRANCH_POLICIES=true
ENV_STAGING_PROTECTED_BRANCHES=false
ENV_STAGING_BRANCH_POLICIES=deploy-evidence/*:branch,deploy/staging:branch
ENV_STAGING_SECRETS=3
ENV_STAGING_SECRET_NAMES=ALERT_EMAIL,SUPABASE_ACCESS_TOKEN,SUPABASE_DB_PASSWORD
ENV_STAGING_VARIABLES=3
ENV_STAGING_VARIABLE_NAMES=AWS_DEPLOY_ROLE_ARN,DEPLOY_ENVIRONMENT,SUPABASE_POOLER_HOST
ENV_STAGING_AWS_DEPLOY_ROLE_ARN=arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy
ENV_STAGING_DEPLOY_ENVIRONMENT=staging
POOLER_HOST_FORM=ok
ENV_STAGING_DESTROY_REVIEWERS=1
ENV_STAGING_DESTROY_REVIEWER_TYPE=User
ENV_STAGING_DESTROY_PREVENT_SELF_REVIEW=false
ENV_STAGING_DESTROY_WAIT_TIMER=none
ENV_STAGING_DESTROY_ADMIN_BYPASS=false
ENV_STAGING_DESTROY_CUSTOM_BRANCH_POLICIES=true
ENV_STAGING_DESTROY_PROTECTED_BRANCHES=false
ENV_STAGING_DESTROY_BRANCH_POLICIES=deploy-evidence/*:branch,deploy/staging:branch
ENV_STAGING_DESTROY_SECRETS=0
ENV_STAGING_DESTROY_SECRET_NAMES=(none)
ENV_STAGING_DESTROY_VARIABLES=0
ENV_STAGING_DESTROY_VARIABLE_NAMES=(none)
REPO_AWS_PLAN_ROLE_ARN=arn:aws:iam::471112560111:role/openvaa/openvaa-plan
REPO_VARIABLE_NAMES=AWS_PLAN_ROLE_ARN
REPO_SECRET_NAMES=ALERT_EMAIL
MAIN_ADMITTED=no
```

Readings:

- Both environments carry one required-reviewer rule with one reviewer of type `User`, self-review allowed, no wait timer, administrator bypass off (`can_admins_bypass: false`, which the API does return although the REST page does not document it), and a custom deployment branch policy of exactly two `branch` rules, `deploy/staging` and `deploy-evidence/*`.
- `MAIN_ADMITTED=no` was computed by matching `main` against each rule with the shell's glob (`[[ main == <rule> ]]`): neither rule equals or globs to it.
- `staging-destroy` holds no secret and no variable. `staging` holds the three secrets and the three variables the deploy workflow names; the repository holds `AWS_PLAN_ROLE_ARN` and `ALERT_EMAIL` and nothing else. No setting at either level holds the service-role key.
- The two smoke contestant secrets are not set yet; they are set at plan 187-17.
- Nothing was pushed and no setting was changed by the agent.
