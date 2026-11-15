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
