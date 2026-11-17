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

## Task 2: the operator's approval (2026-11-17)

The orchestrator ran `bash "$A" new 187-19-2` (attempt id `20261117T143255Z.e2bcf829d`), showed the attempt id and Task 1's lines to the operator, and stored the reply with `bash "$A" put 187-19-2` under `OPERATOR_REPLY=received attempt=20261117T143255Z.e2bcf829d plan=187-19 task=2`; the reply passed the screen and holds `answer_push=approve`. `A=.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/tools/attempt.sh`.

```
PR_ATTEMPT=20261117T143255Z.e2bcf829d
PR_ANSWER_PUSH=approve
```

## Task 3: the pushes, the draft, the plan read, and the draft closed (2026-11-17)

### The binding, before the pushes and read again at Task 3

At top level, before either push, the orchestrator ran `bash "$A" bound 187-19-2 OPERATOR_REPLY plan=187-19 task=2` and `bash "$A" has 187-19-2 '^answer_push=approve$'`; both exited 0. The plan executor re-ran both read-only at 14:35Z as Task 3's first check: `bound_exit=0`, `has_exit=0`, and `bash "$A" id 187-19-2` printed `20261117T143255Z.e2bcf829d`, the attempt the pushes ran under.

```
PR_BINDING_BOUND=0
PR_BINDING_HAS_APPROVE=0
```

### The pushes

Made by the orchestrator at top level, each status read on its own line:

- `git push origin 340a200708c28fb7ed078d452138712f3400c789:refs/heads/pr-evidence/187-base` exit 0.
- `git push origin 0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499:refs/heads/pr-evidence/187-head` exit 0.

Read back by `git ls-remote origin refs/heads/pr-evidence/187-base refs/heads/pr-evidence/187-head` (exit 0, again at 14:35Z by the plan executor):

```
340a200708c28fb7ed078d452138712f3400c789	refs/heads/pr-evidence/187-base
0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499	refs/heads/pr-evidence/187-head
```

```
PR_BASE_PUSHED=340a200708c28fb7ed078d452138712f3400c789
PR_HEAD_PUSHED=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499
```

### The draft

Opened by the orchestrator with `gh pr create --draft --base pr-evidence/187-base --head pr-evidence/187-head`. `gh pr view 905 --json ...` (exit 0) read: number 905, title `Evidence draft: infrastructure plan (phase 187, do not merge)`, `isDraft=true`, `state=OPEN`, `baseRefName=pr-evidence/187-base` (not `main`), `headRefName=pr-evidence/187-head`, `headRefOid=0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`, created `2026-11-17T14:34:15Z`.

```
PR_NUMBER=905
PR_URL=https://github.com/OpenVAA/voting-advice-application/pull/905
PR_BASE_REF=pr-evidence/187-base
```

### The run

`gh run list --workflow infra-plan.yml --branch pr-evidence/187-head` listed one run, `44104573552`, event `pull_request`, head `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`, created `2026-11-17T14:34:21Z`, attempt 1. It was watched by a backgrounded `gh run watch 44104573552 --exit-status` (`watch_exit=0`). The log was read with `gh run view 44104573552 --log` (exit 0, 2490 lines). `gh run list --branch` lists no other run on either branch, so neither push and not the close started any other workflow.

```
PR_RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44104573552
PR_RUN_CONCLUSION=success
```

### The checks job

Job `134113318699`. Every step succeeded: `Check Terraform formatting` (`terraform fmt -check -recursive -diff infra`, no diff printed), `Validate every Terraform root` (`validated 8 roots: infra/bootstrap infra/envs/example/aws infra/envs/example/dns-mail infra/envs/example/supabase infra/envs/scratch/supabase infra/envs/staging/aws infra/envs/staging/dns-mail infra/envs/staging/supabase`, each `Success! The configuration is valid.`), `Test every Terraform module that has tests` (`infra/modules/frontend-service` `Success! 33 passed, 0 failed.`, `infra/modules/github-oidc` `Success! 11 passed, 0 failed.`, `tested 2 modules`), and `Plan the example roots with mock providers` (`planned 3 example roots`).

The planned addresses per example root, counted from the `# <address> will be|must be` lines of each root's group in the log, against each root's plan summary line:

| Root | Planned addresses | Plan summary line | Test |
|------|------------------|-------------------|------|
| `infra/envs/example/aws` | 40 (40 `will be created`) | `Plan: 40 to add, 0 to change, 0 to destroy.` | `run "example_root_plans_production_shaped"... pass` |
| `infra/envs/example/dns-mail` | 15 (15 `will be created`, plus the data source `module.mail_ses.data.aws_iam_policy_document.ses_send` `will be read during apply`) | `Plan: 15 to add, 0 to change, 0 to destroy.` | `run "example_dns_mail_plans"... pass` |
| `infra/envs/example/supabase` | 4 (`module.supabase.supabase_project.this` `will be imported`; `supabase_edge_function_secrets.this[0]`, `supabase_settings.smtp_secret[0]`, `supabase_settings.this` `will be created`) | `Plan: 1 to import, 3 to add, 0 to change, 0 to destroy.` | `run "example_supabase_plans"... pass` |

```
PR_CHECKS_JOB=success
PR_EXAMPLE_PLANS=aws:40,dns-mail:15,supabase:4
```

### The plan job

Job `134113319133`. Every step succeeded. `Assume the read-only plan role` printed `Assuming role with OIDC` and `Authenticated as assumedRoleId AROAW3MD7FXXXCULZGA4P:pr-plan-44104573552`, the session name the workflow gives the pull-request subject's plan role.

The digest step printed:

```
running_task_definition=arn:aws:ecs:eu-north-1:471112560111:task-definition/openvaa-staging-frontend:6
running_image_reference=tag
running_image_digest=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
```

The plan ran `terraform ... plan -lock=false -input=false -no-color -detailed-exitcode -var "image_digest=$DIGEST"`, printed no lock line, and ended with `plan_exit=2` (changes present). Its action lines, the same in the plan step and the `Show the plan` step:

```
  # module.frontend.aws_ecs_service.app will be updated in-place
  # module.frontend.aws_ecs_task_definition.app must be replaced
Plan: 1 to add, 1 to change, 1 to destroy.
```

The service's only shown change is `task_definition = ".../openvaa-staging-frontend:6" -> (known after apply)`. The task definition is replaced because `container_definitions` changes: `image = "471112560111.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend:712947a1bd44a735f66ee8f51610f4748d76cd30" -> "471112560111.dkr.ecr.eu-north-1.amazonaws.com/openvaa-frontend@sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea"`. The digest is the one the digest step resolved from that tag, so it is the same image. The same JSON diff also drops the AWS-filled defaults `mountPoints = []`, `portMappings[0].hostPort = 3000`, `systemControls = []` and `volumesFrom = []`, and the resource's `tags = {} -> null`. These are the provider's normalisation of the definition AWS returned, carried by the same replacement, and name no other address. The only output change is `task_definition_arn`.

`aws_sns_topic_subscription` appears on one line of the job's log, `module.frontend.aws_sns_topic_subscription.operator: Refreshing state... [id=arn:aws:sns:eu-north-1:471112560111:openvaa-staging-frontend-deployments:e3521c76-...]`. No action line and no line of the shown plan names it, so `ALERT_EMAIL` matches the stack's address.

```
PR_PLAN_JOB=success
PR_WRONG_SUBJECT_JOB=skipped
PR_DIGEST_REFERENCE=tag
PR_DIGEST=sha256:bab8fa75c6094a2cecab07282826bffa4d9746bf7ee56fc7231b8283ea937bea
PR_PLAN_EXIT=2
PR_PLAN_SUMMARY=Plan: 1 to add, 1 to change, 1 to destroy.
PR_PLAN_ADDRESSES=module.frontend.aws_ecs_task_definition.app (replace),module.frontend.aws_ecs_service.app (update in-place)
PR_PLAN_SUBSCRIPTION_UNCHANGED=yes
PR_PLAN_MATCHES_EXPECTED=yes
```

`PR_PLAN_MATCHES_EXPECTED=yes`: the summary line is `EXPECTED_PLAN=`, on exactly the two addresses of Task 1, a rollout of the same image. The plan does not stop the plan before the green run.

### The step summary

The `Show the plan` step concluded `success`. Its script writes `### Plan of infra/envs/staging/aws` and the `terraform show -no-color` text in a fenced block to `$GITHUB_STEP_SUMMARY`, after the `cat` that printed the same text to the log, and `show_exit` was 0. The summary itself could not be read from this workstation:

- The REST API exposes no job step summary. `gh api repos/OpenVAA/voting-advice-application/check-runs/134113319133` (exit 0) has `output.title=null`, `output.summary` and `output.text` empty, and `annotations_count=0`.
- `https://github.com/OpenVAA/voting-advice-application/actions/runs/44104573552/jobs/134113319133/summary_raw`, the same under `/job/` and with `?attempt=1` each answer HTTP 404 without a session. The public run page (HTTP 200) and job page (HTTP 200) say `Sign in to view logs` and hold no `Plan of infra` text, and the run's `summary_partial` holds only the run's status, duration and artifacts.

```
PR_PLAN_IN_SUMMARY=unread
```

So the line stays `unread` until someone signed in reads the plan job's summary on the run page.

### Artifacts

`gh api repos/OpenVAA/voting-advice-application/actions/runs/44104573552/artifacts` (exit 0): `total_count=0`, no names. The run page's summary also shows `Artifacts –`.

```
PR_ARTIFACTS=0
```

### The draft closed

`gh pr close 905 --comment "..."` exit 0 at 14:39Z. `gh pr view 905` (exit 0): `state=CLOSED`, `closedAt=2026-11-17T14:39:12Z`, base `pr-evidence/187-base`. `git ls-remote` (exit 0) afterwards still reads both branches at `340a200708c28fb7ed078d452138712f3400c789` and `0a73bb6dfd7a06c904f40f0bfa0454d9b7fbc499`. They stay for plan 187-20. Closing does not start an `infra-plan.yml` run, since its trigger types are `opened`, `synchronize`, `reopened` and `ready_for_review`, and no run followed.

```
PR_CLOSED=yes
```
