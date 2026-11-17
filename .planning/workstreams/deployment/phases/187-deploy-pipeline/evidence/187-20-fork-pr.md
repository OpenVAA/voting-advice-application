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

## Task 3: the fork run read, and the pull request closed (2026-11-17)

Recorded 2026-11-17 at 16:24Z (UTC) by the plan executor of plan 187-20, from HEAD `6854e9d6f`. The operator's reply was read first: `attempt.sh bound 187-20-2 OPERATOR_REPLY plan=187-20 task=2` exit 0, attempt `20261117T145418Z.1c5ed8deb`, `answer_fork_pr=906`. The only remote writes were `gh pr close 906`; nothing was pushed and neither `pr-evidence/*` branch was touched. The fork owner's login is not written here.

```
FORK_PR=906
FORK_HEAD_IS_FORK=yes
FORK_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44124810789
FORK_RUN_EVENT=pull_request
FORK_RUN_CONCLUSION=success
FORK_CHECKS_JOB=success
FORK_PLAN_JOB=skipped
FORK_WRONG_SUBJECT_JOB=skipped
FORK_ASSUME_STEPS=0
FORK_ARTIFACTS=0
FORK_PR_CLOSED=yes
```

### The pull request

`gh api repos/OpenVAA/voting-advice-application/pulls/906` (exit 0), before the close: `state=open`, `draft=true`, base `pr-evidence/187-base`, head ref `pr-evidence/187-fork`, head SHA `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499` (the `FORK_HEAD_COMMIT=` above), `head.repo.fork=true`, and the head repository is not `OpenVAA/voting-advice-application`. That last fact is the second operand of the `plan` job's `if`, false here.

### The run

`gh api .../actions/runs/44124810789` (exit 0): workflow `.github/workflows/infra-plan.yml`, event `pull_request`, attempt 1, created 16:21:23Z, completed 16:22:53Z, conclusion `success`, head branch `pr-evidence/187-fork`, `head_repository.fork=true`. It is the only run for the fork pull request: `actions/runs?head_sha=0a73bb6df…` (exit 0) lists two runs, this one and 187-19's 44104573552, both `pull_request`.

`gh api .../actions/runs/44124810789/jobs` (exit 0), `total_count=3`:

- `checks` (job 134185560511): `success`. Its steps are checkout, the Terraform setup, the format check, the validation, the module tests, the example plans, and the checkout's post step, all `success`. There is no credentials step. Its log (`gh run view --job 134185560511 --log`, exit 0, 2013 lines) prints `validated 8 roots`, module tests `33 passed` and `11 passed` (`tested 2 modules`), and three example plans each `1 passed` (`planned 3 example roots`). Its token permissions are `Contents: read` and `Metadata: read`. `configure-aws-credentials`, `AWS_ACCESS_KEY_ID`, `assume-role` and `id-token` each occur 0 times in the log.
- `plan` (job 134185564336): `skipped`, with no steps. The job holding the run's one `aws-actions/configure-aws-credentials` step was never given a runner.
- `wrong-subject` (job 134185642793): `skipped`, with no steps, as on every `pull_request` event.

No step of any job of the run is the credentials action, so `FORK_ASSUME_STEPS=0`. `gh api .../actions/runs/44124810789/artifacts --jq .total_count` (exit 0) printed `0`.

### The close

`gh pr close 906` ran at 16:23:59Z, exit 0. Then `gh api .../pulls/906` (exit 0) read `state=closed`, `merged=false`, `closed_at=2026-11-17T16:24:00Z`. The close started no run: the head SHA's run count is still 2. `git ls-remote origin` (exit 0) still reads `pr-evidence/187-base` at `340a20070…` and `pr-evidence/187-head` at `0a73bb6df…`.
