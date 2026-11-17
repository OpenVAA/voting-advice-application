# 187-20 evidence: a fork's pull request gets no credentials

## Task 1: readiness, read-only (2026-11-17)

Recorded 2026-11-17 at 14:53Z (UTC) by the plan executor of plan 187-20, from HEAD `619505b36`. Nothing was pushed and no pull request was opened or closed. The only remote reads were `git ls-remote origin`, `gh api repos/OpenVAA/voting-advice-application/commits/<head>`, `gh api repos/OpenVAA/voting-advice-application` and `gh pr list --base pr-evidence/187-base`.

### The base

```
FORK_BASE_PRESENT=yes
```

`git ls-remote origin refs/heads/pr-evidence/187-base refs/heads/pr-evidence/187-head` exit 0:

```
340a200708c28fb7ed078d452138712f3400c789	refs/heads/pr-evidence/187-base
0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499	refs/heads/pr-evidence/187-head
```

The base names `340a200708c28fb7ed078d452138712f3400c789`, the `PR_BASE=` and `PR_BASE_PUSHED=` of `evidence/187-19-pr-plan.md`, unchanged since plan 187-19 pushed it. `gh pr list --base pr-evidence/187-base --state all` (exit 0) lists one pull request, #905, `CLOSED`, head `pr-evidence/187-head`, `isCrossRepository=false`, so no pull request from a fork is open against the base yet. The repository is public and `allow_forking=true`.

### The head

```
FORK_HEAD_COMMIT=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
```

The `PR_HEAD=` of `evidence/187-19-pr-plan.md`, still `refs/evidence/187/green` (`git rev-parse` prints the same id) and still the tip of `pr-evidence/187-head`. `gh api repos/OpenVAA/voting-advice-application/commits/0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499 --jq .sha` exit 0 now prints the id, so the commit is public and a fork can carry it. `git diff --name-only 340a20070 0a73bb6df -- infra .github/workflows/infra-plan.yml` (exit 0) lists 125 paths, so a pull request from this head into the base matches `infra-plan.yml`'s `paths` filter, as #905 did.

### The plan job's condition

```
PLAN_JOB_IF_GUARDS_FORK=yes
```

`git show 0a73bb6df:.github/workflows/infra-plan.yml` (exit 0), the workflow at the head commit, gives the three jobs these conditions:

- `checks`: no `if`, `permissions: contents: read`, no credentials step. It runs for every event of the workflow.
- `plan`: `if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository`. For a pull request whose head repository is a fork the second operand is false, so the job is skipped before a runner is assigned. It is the only job with a `aws-actions/configure-aws-credentials` step (one occurrence in the file, line 158).
- `wrong-subject`: `if: github.event_name == 'push'`, so a `pull_request` event skips it as well.

The workflow triggers on `pull_request` and `push` only; `grep pull_request_target` finds nothing (exit 1), so a fork's run gets the read-only token and no secret. `git diff --quiet 0a73bb6df HEAD -- .github/workflows/infra-plan.yml` exits 0: the file at the head is the file on this branch.
