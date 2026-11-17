# 187-18 — The red run and the wrong-subject refusal

Repository: `OpenVAA/voting-advice-application`. Names, counts, forms and commit ids only: no login, no address, no secret value.

## Task 1 — Readiness, read-only (2026-11-17T07:50Z to 07:52Z)

Recorded by the plan executor from this checkout at HEAD `5e25a1b8ba3ae81146c4e5fa6933f74f10551a87`. Every read below is a GET or a local git read; nothing was pushed, no setting was changed, no run was started or approved. Each status was read on its own line.

```
READ_AT=2026-11-17T07:50Z
ENV_READ_BACK_OK=yes
STEP9_APPLIED=yes
RED_TREE_PROVEN=yes
RED_BRANCH_ABSENT=yes
SERVED_BUILD_BEFORE=712947a1bd44a735f66ee8f51610f4748d76cd30
NO_RUN_ACTIVE=yes
RED_COMMIT=3250ba0e8e964f8c87c03459f812bd935637272b
RED_TREE=20756a2dec61b17bab3dafecbc020c4d0f1510c0
RED_PARENT=340a200708c28fb7ed078d452138712f3400c789
RED_DIFF_PATHS=apps/frontend/src/routes/+layout.ts
GREEN_COMMIT=68a54299aa81b2a2f95fd2151031ab4e624ef01c
GREEN_TREE=a9d648e87d3e075e1dafc650f2c5030afdda29fb
HEAD_TREE_WITHOUT_PLANNING=a9d648e87d3e075e1dafc650f2c5030afdda29fb
RED_REBUILT=no
NO_RUN_ACTIVE_METHOD=repo-wide status filters and the workflows list; the plan's --workflow form returns 404
```

### `ENV_READ_BACK_OK=yes` (2026-11-17T07:50Z)

`gh api repos/OpenVAA/voting-advice-application/environments/<E>` and `.../environments/<E>/deployment-branch-policies` for `staging` and `staging-destroy`, each exit 0, read as reviewer types only:

- Both: `can_admins_bypass: false`; one `required_reviewers` rule with one reviewer of type `User`, `prevent_self_review: false`, no wait timer; a `branch_policy` rule; `deployment_branch_policy` `custom_branch_policies: true`, `protected_branches: false`.
- Both: branch policies exactly `deploy-evidence/*:branch,deploy/staging:branch`.

That is what plan 187-14 read back on 2026-11-15T19:59Z (`187-14-environments.md` § Task 3).

### `STEP9_APPLIED=yes`

`187-16-bootstrap-apply.md` § Task 3 records `STEP9_RESULT=applied` (`s9d_apply_exit=0`, `Apply complete! Resources: 18 added, 3 changed, 2 destroyed.`, second plan exit 0), with both trusts naming `repository_id 546467466` and `repository_owner_id 115159211` and the deploy trust naming the `environment:staging` and `environment:staging-destroy` subjects. The code applied is unchanged at this HEAD: `git diff --quiet 1e10dff7f HEAD -- infra/bootstrap infra/modules/github-oidc ':!infra/bootstrap/README.md'` exit 0 (the only change in those two paths since is the runbook).

### `RED_TREE_PROVEN=yes`

- `git rev-parse refs/evidence/187/red` prints `3250ba0e8e964f8c87c03459f812bd935637272b` and its tree `20756a2dec61b17bab3dafecbc020c4d0f1510c0`: the `RED_COMMIT` and `RED_TREE` of `187-12-evidence-commits.md` § Re-run 2026-11-16 (plan 187-28), whose local build exited 1 at `shared 2/2 RUN yarn build` on `Failed: @openvaa/frontend#build` (`RED_LOCAL_BUILD_EXIT=1`).
- The green ref's tree still equals HEAD's tree without `.planning/`: in a temporary index under the session scratch directory (removed afterwards), `git read-tree HEAD` exit 0, `git rm -r --cached --quiet .planning` exit 0, `git write-tree` exit 0 printed `a9d648e87d3e075e1dafc650f2c5030afdda29fb`, which is `refs/evidence/187/green^{tree}`; `git diff --quiet refs/evidence/187/green HEAD -- . ':!.planning'` exit 0; the real index untouched (`git diff --cached --quiet` exit 0). So, per the plan's execution rules, the red commit is `refs/evidence/187/red` as it stands and nothing was rebuilt.
- `git diff-tree -r --name-only refs/evidence/187/green refs/evidence/187/red` prints the one path `apps/frontend/src/routes/+layout.ts`; `git diff --stat`: `1 file changed, 1 insertion(+)`, the line `import '$lib/does-not-exist-187-red';` (blob `8ccc60be8f1696621812d5e7f8084f403b708aa7`). The red commit's parent is `340a200708c28fb7ed078d452138712f3400c789`, which `git ls-remote origin refs/heads/main` still prints.
- `git for-each-ref --contains refs/evidence/187/red` prints exactly `refs/evidence/187/red`.

### `RED_BRANCH_ABSENT=yes` (2026-11-17T07:50Z)

`git ls-remote origin refs/heads/deploy-evidence/187-red` exit 0 printed nothing (0 bytes). For context, `git ls-remote origin 'refs/heads/deploy-evidence/*' 'refs/heads/deploy/*'` prints one branch, `deploy-evidence/185-image` at `712947a1bd44a735f66ee8f51610f4748d76cd30`, and no `deploy/*` branch.

### `SERVED_BUILD_BEFORE` (2026-11-17T07:50:40Z)

`curl -sS -m 30 https://staging.openvaa.org/api/health` exit 0, HTTP 200, body `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}`: the tip of `deploy-evidence/185-image`.

### `NO_RUN_ACTIVE=yes` (2026-11-17T07:51Z)

- `gh run list --workflow deploy.yml`, `--workflow destroy.yml` and `--workflow infra-plan.yml` each exit 1 with `HTTP 404: workflow <name> not found on the default branch`. The plan's command form cannot answer here: none of the three files is on `main`, and none has ever run, so GitHub has not registered it.
- `gh api repos/OpenVAA/voting-advice-application/actions/workflows` (exit 0) lists nine workflows, none of the three.
- `gh api .../actions/runs?per_page=100` (exit 0): 0 runs whose `path` names `deploy.yml`, `destroy.yml` or `infra-plan.yml`.
- `gh run list --status <s>` repository-wide for `queued`, `waiting`, `in_progress`, `requested` and `pending`, each exit 0, each empty: no run of any workflow is active.

So no run of either workflow is queued, waiting or in progress, and the first `deploy.yml` and `infra-plan.yml` runs will be the red push's.

### What the red tree will trigger

From `git show refs/evidence/187/red:.github/workflows/<w>.yml`: `deploy.yml` runs on a push to `deploy/staging` and `deploy-evidence/**` (but not `deploy-evidence/destroy-staging`); `infra-plan.yml` runs on a push to `deploy-evidence/**`; `destroy.yml` runs on a push to `deploy-evidence/destroy-staging` only. A push to `deploy-evidence/187-red` therefore starts one `deploy.yml` run and one `infra-plan.yml` run, and no `destroy.yml` run.
