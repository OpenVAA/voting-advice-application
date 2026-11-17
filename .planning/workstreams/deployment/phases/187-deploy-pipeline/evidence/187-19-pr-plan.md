# 187-19 evidence: the pull request's plan

## Task 1: readiness, read-only (2026-11-17)

Recorded 2026-11-17 (UTC) by the plan executor of plan 187-19, from HEAD `c5dbe5e86`. Nothing was pushed and no pull request was opened. The only remote reads were `gh api .../commits/<head>`, `git ls-remote origin` and `git fetch origin main`, each made at 14:31Z, after the rebuild of the execution rules had finished.

### The head

```
PR_HEAD=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
PR_HEAD_REBUILT=yes
PR_HEAD_TREE_OK=yes
PR_HEAD_PUBLIC=no
PR_HEAD_DIFF_VS_PUBLIC_RED=apps/frontend/src/routes/+layout.ts,infra/bootstrap/README.md,infra/envs/staging/aws/README.md
```

- **`PR_HEAD_REBUILT=yes`.** Before the rebuild, `git diff --stat refs/evidence/187/green HEAD -- . ':!.planning'` listed `infra/bootstrap/README.md` and `infra/envs/staging/aws/README.md` (`2 files changed, 14 insertions(+), 12 deletions(-)`, the runbook rows of `e7ed9022c`). Both evidence commits were rebuilt and the red build re-proven locally, with no remote read. The rebuild is recorded as `## Re-run 2026-11-17 (plan 187-19)` in `evidence/187-12-evidence-commits.md`: green `0a73bb6df` built (exit 0), red `aee0ba372` failed at `@openvaa/frontend#build` on the missing module (exit 1), and the builder cache was pruned.
- **`PR_HEAD_TREE_OK=yes`.** `git rev-parse refs/evidence/187/green` prints `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`, and `git diff --quiet 0a73bb6df HEAD -- . ':!.planning'` exits 0.
- **`PR_HEAD_PUBLIC=no`.** `gh api repos/OpenVAA/voting-advice-application/commits/0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499 --jq .sha` exit 1, HTTP 422, `No commit found for SHA: 0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`. Pushing the head publishes this commit.
- **`PR_HEAD_DIFF_VS_PUBLIC_RED=`.** `git diff --name-only 26ecadd36d5cf2dbc17fd1f3739708d42c9be09a 0a73bb6df` (the `RED_PUSHED_COMMIT=` of `evidence/187-29-red-rerun.md`, the public tip of `deploy-evidence/187-red-2`) lists three paths: `apps/frontend/src/routes/+layout.ts`, the broken import line the public red commit carries and the head does not, and the two runbooks with the rows of `e7ed9022c`. Everything else in the head is already public.

### The base, the branches, the triggers, the paths

```
PR_BASE=340a200708c28fb7ed078d452138712f3400c789
PR_BRANCHES_ABSENT=yes
PR_BRANCHES_TRIGGER_NO_PUSH=yes
PR_PATHS_MATCH=yes
EXPECTED_PLAN=1 to add, 1 to change, 1 to destroy
```

- **`PR_BASE=`.** `git fetch origin main` exit 0; `FETCH_HEAD` and `refs/remotes/origin/main` both `340a200708c28fb7ed078d452138712f3400c789`, unchanged since the evidence commits were first written, and the parent of both rebuilt commits. `git merge-base --is-ancestor 340a20070 0a73bb6df` exit 0.
- **`PR_BRANCHES_ABSENT=yes`.** `git ls-remote origin refs/heads/pr-evidence/187-base refs/heads/pr-evidence/187-head` exit 0, 0 bytes.
- **`PR_BRANCHES_TRIGGER_NO_PUSH=yes`.** Every workflow file at the green commit was read with `git show 0a73bb6df:<path>` and its `on.push.branches` parsed with the repository's `yaml` package; each pattern was matched against both branch names with GitHub's filter globbing (`*` within a segment, `**` across segments, `!` negating). Three files have no push trigger (`claude-code-review.yml`, `claude-solve-issue.yml`, `claude.yml`). The push patterns are `deploy.yml` `deploy/staging`, `deploy-evidence/**`, `!deploy-evidence/destroy-staging`; `destroy.yml` `deploy-evidence/destroy-staging`; `docs.yml` `main`; `infra-plan.yml` `deploy-evidence/**`; `main.yaml` `main`, `ci-evidence/**`; `release.yml` `main`. None matches `pr-evidence/187-base` or `pr-evidence/187-head` (0 matches). The same matcher, given `deploy-evidence/187-red-2` and `ci-evidence/x` as a control, reports 3 matches (`deploy.yml`, `infra-plan.yml`, `main.yaml`). Of the pull-request triggers, `infra-plan.yml`'s has no branch filter and so runs for a pull request into `pr-evidence/187-base`; `main.yaml`'s is filtered to `main` and does not.
- **`PR_PATHS_MATCH=yes`.** `git diff --name-only 340a20070 0a73bb6df` lists 4489 paths, 124 of them under `infra/` and one `.github/workflows/infra-plan.yml`, so the pull request matches `infra-plan.yml`'s `paths` filter.
- **`EXPECTED_PLAN=`.** From `infra/envs/staging/aws/README.md` § Step 5: on a state that already holds the stack with its image named by a tag, the first plan after the switch to a digest is `Plan: 1 to add, 1 to change, 1 to destroy.` on `module.frontend.aws_ecs_task_definition.app` (replaced) and `module.frontend.aws_ecs_service.app` (updated) only, a rollout of the same image.
