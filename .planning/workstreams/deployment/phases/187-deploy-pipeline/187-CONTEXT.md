# Phase 187: Deploy Pipeline - Context

**Gathered:** 2026-11-15
**Status:** Ready for planning (recommendations, unreviewed by the operator)

<domain>
## Phase Boundary

GitHub Actions deploys the staging stack without stored keys. A push to `deploy/staging`, a manual dispatch or a `deploy-evidence/**` push runs one gated job in the `staging` GitHub Environment that builds the image once, plans the AWS root with the image digest, pushes migrations, deploys the three Edge Functions, applies the AWS root (the frontend rollout), waits until the service is stable and runs the deployed smoke entry last; any failed stage fails the run and mails the operator. Pull requests get a read-only plan of the staging AWS root and mock-provider plans of the `example` roots; fork pull requests get no credentials and their credentialed jobs show as skipped. A guarded destroy workflow removes the AWS stack and is seen unable to reach the Supabase root. One green and one red run (from a build broken on purpose) are observed and recorded, before the workflows are on `main`, through source-only `deploy-evidence/**` pushes (PIPE-01 to PIPE-10, INFRA-16, INFRA-19, SUPA-08).

Out of scope: rollback to the previous task definition on a failed smoke run (FUT-10); any change to hosted auth settings or function secrets (hand-applied Supabase root, C4/C7); a second applied environment (A1); a push to `main`.

</domain>

<decisions>
## Implementation Decisions

Every answer below is the ★ RECOMMENDED option of `187-DISCUSSION-POINTS.md`. The operator was away and has not reviewed them, and may overrule any of them there before execution; CONTEXT.md is then rewritten from the fill.

### Credentials and trust
- The deploy role gains customer-managed deploy policies in `infra/modules/github-oidc`, one per concern under `/openvaa/`, each under the 6,144-character limit: network (EC2, tag-conditioned on `Project=openvaa`/`Root=aws`), load balancing, ECS (by name `openvaa-staging-*`), edge (CloudFront, ACM in both regions, tag-conditioned), DNS (record changes in the staging zone only), observability (the log group, the SNS topic, the EventBridge rule by name), scaling, `iam:PassRole` on `openvaa-staging-frontend-execution` with `iam:PassedToService = ecs-tasks.amazonaws.com`, and `sns:Publish` on `openvaa-staging-frontend-deployments`. No IAM create, put, attach or delete. Checked offline by `terraform test` and on AWS by the policy simulator before the first pipeline apply. The pipeline plans and applies the whole `infra/envs/staging/aws` root. — **Reversibility:** costly — the bootstrap root is applied by hand, and every workflow's ability to apply depends on the exact action list; narrowing it later means a hand apply and a re-observation of every run.
- The numeric id conditions are set (`github_repository_id = "546467466"`, `github_repository_owner_id = "115159211"`); the plan trust is not pinned to a workflow, and that remainder is recorded as an accepted risk. If the first credentialed run shows AWS does not evaluate the id claims, the two lines are removed by one hand apply. — **Reversibility:** costly — a wrong condition makes both roles unassumable until a hand apply of bootstrap.
- Pull-request plans run with `-lock=false`, and the `plan_lock` policy and its attachment are removed (closes AR-183-02 / WR-04).
- Two GitHub Environments. `staging`: required reviewer the operator, self-review allowed, custom deployment branch policy `deploy/staging` and `deploy-evidence/*` only. `staging-destroy`: same reviewer and branch policy, no secrets; its subject `repo:OpenVAA/voting-advice-application:environment:staging-destroy` is added to `deploy_subjects`. `infra/README.md` § Prerequisites ("default branch only") is corrected. Settings are read back with `gh api` GETs. — **Reversibility:** costly — the deploy role's only branch guard is this repository setting, and the destroy path's "cannot reach Supabase" argument rests on the second environment holding no secret.
- Secrets are environment secrets of `staging` only: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD`, `ALERT_EMAIL` (the same address the stack's subscription uses). Environment variables: `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`. Repository: variable `AWS_PLAN_ROLE_ARN`, secret `ALERT_EMAIL` for the PR plan. The service-role key is in no workflow and no secret.
- Fork pull requests: every credentialed job carries `if: github.event.pull_request.head.repo.full_name == github.repository`; workflows never use `pull_request_target`.

### Triggers and workflow shape
- Before the merge, every observed run is fed by a source-only commit built with a temporary index (the `ci-evidence` recipe: `read-tree HEAD`, `rm --cached .planning`, `write-tree`, `commit-tree -p origin/main`), pushed to `deploy-evidence/187-<name>` and, once green, to `deploy/staging`. Each push is an operator checkpoint. After the milestone merges, `deploy/staging` is fast-forwarded to a `main` commit. — **Reversibility:** one-way — a commit pushed to the public repository cannot be withdrawn.
- Three new workflow files, `main.yaml` untouched: `infra-plan.yml` (pull requests to any base touching `infra/**` or the workflow, and `deploy-evidence/**` pushes; a no-credential job for fmt, validate and the example mock plans; a credentialed same-repository job that plans the staging AWS root), `deploy.yml` (push `deploy/staging`, push `deploy-evidence/**`, `workflow_dispatch`), `destroy.yml`. Actions pinned by commit SHA with the tag in a comment; explicit `permissions` per job; `id-token: write` only where a role is assumed.
- `deploy.yml` and `destroy.yml` share the concurrency group `staging-aws` with `cancel-in-progress: false`; the deploy job's `timeout-minutes` is set well above the longest observed apply.
- PR plans are observed through a draft pull request from a source-only branch into a source-only base branch (`deploy-evidence/187-base`), then closed. The plan is printed with `terraform show -no-color` to the log and the step summary; the plan file stays in `$RUNNER_TEMP` and is never uploaded.

### The deploy run
- The task's image is `"${registry_url}@${image_digest}"`; a required `image_digest` variable (`^sha256:[0-9a-f]{64}$`, no default, not in tfvars) replaces `image_tag` in the module, the staging root and the example root. The ECR tag and `BUILD_SHA` stay the commit id. The deploy job passes the digest it pushed; PR plans and hand plans pass the digest the ECS service runs now. The staging AWS runbook's apply steps are rewritten for it. — **Reversibility:** costly — the module interface, both roots, the 185 runbook and every later hand apply change with it.
- CR-01 is fixed before any runner builds: `build-push-image.sh` builds from a `git archive HEAD` context in a temporary directory, with a self-test that plants an ignored file and shows it absent. The build runs natively on `ubuntu-24.04-arm`, before `yarn install` in the job.
- One gated job in `staging`, in this order: build, push, digest; `terraform plan` with that digest, saved in `$RUNNER_TEMP`; migrations; functions; `terraform apply` of the saved plan; wait until stable; smoke run. A failed step stops the rest. A no-credential job before the gate runs fmt, validate and the infra unit tests.
- `push-migrations.sh` gains `--confirmed-ref <ref>`, accepted only when it equals `--ref`, `GITHUB_ACTIONS=true` and `GITHUB_ENVIRONMENT=staging`; anything else exits 2 as today. The job links a temporary work directory (never `apps/supabase`), connects through the session pooler (`SUPABASE_POOLER_HOST`, user `postgres.<ref>`, port 5432), and runs the drift check on the runner's Docker. — **Reversibility:** one-way — once a run is approved, any pending migration is pushed to the persistent project `cofbsatfrdysyphajsky` and cannot be revised, only followed by a new migration.
- Functions: `supabase functions deploy --project-ref <ref> --workdir <linked dir>` for all three, then the Management API list must show three `ACTIVE` with `verify_jwt` as `config.toml` says. Function secrets are not touched.
- After the apply, a step fails unless the service's primary deployment names the task definition just applied, `rolloutState = COMPLETED`, and the running count is at least the floor.

### Smoke stage and alerts
- The last step runs `yarn test:e2e:deployed` with `SMOKE_EXPECTED_SHA` = the built commit and the two contestant secrets, no service-role key in its environment, exit status read directly. The observed green run waits for plan 186-08's hosted contestant; there is no switch that skips the contestant spec. — **Reversibility:** costly — PIPE-09's recorded green run is defined by what this step proves; a skip switch, once used for the record, would have to be re-observed.
- A final step of the gated job, `if: failure()`, publishes one message to the SNS topic `openvaa-staging-frontend-deployments` naming the failed stage, the commit and the run URL. The rollout alert's 185-16 observation stands while its resources are unchanged; the pipeline alert is seen once by the red run. — **Reversibility:** costly — the alert channel is one confirmed e-mail subscription that every re-creation re-asks for, and INFRA-16 is observed through it.
- The red run is one source-only `deploy-evidence/187-red` push of a commit whose frontend build fails on purpose (a type error in one route, never merged): it must stop at the build step, before any hosted write, exit red, and the alert mail must arrive. Then the green run of the unbroken commit. Run URLs, step conclusions and the mail's arrival time are recorded.

### The example environment
- Each example root gets a `terraform test` with `mock_provider` blocks and `command = plan`, run by the no-credential job on every pull request, printing the planned addresses and asserting the production-shaped variables (floor 2, ceiling 4, two zones).
- "Never applied" rests on three guards: the stand-in account id, the deploy role's single state key, and a unit test that fails when a workflow runs `apply` or `destroy` anywhere but `infra/envs/staging/aws`.

### The destroy path
- `destroy.yml`: `workflow_dispatch` (input `confirm` must equal `destroy staging aws`) and a push to the one branch `deploy-evidence/destroy-staging`; one job in `staging-destroy`. It first shows the Supabase root is out of reach (`terraform -chdir=infra/envs/staging/supabase init` with the deploy role must be refused on `hand/staging/supabase/terraform.tfstate`, and the step fails if it succeeds), then `plan -destroy` of `infra/envs/staging/aws` only, refusing unless every address is under `module.frontend` and the count equals the resources in state, then applies that saved plan. A unit test fails if the workflow names a Supabase secret or another root.
- The real destroy runs once, after the INFRA-13 cost read (on or after 2026-11-23), followed by a pipeline deploy from nothing; the operator confirms the new SNS subscription at that checkpoint. Until then the path is shown by its Supabase-root refusal and `plan -destroy` in an evidence run that stops before the apply. — **Reversibility:** one-way — the destroy removes the live stack, recreates certificates and the alert subscription, and restarts the cost window.

### Proofs, records and carried debts
- Wrong-subject refusal: a job in `infra-plan.yml`, only on `deploy-evidence/**` pushes, with no environment, asks for the deploy role and passes only when the assume call is refused (printing the error code); a second step asks for the plan role from a push and must also be refused.
- "A push to main deploys nothing": no `main` trigger, the environment branch policy refuses `main` (read back), and a unit test fails if a deploy or destroy `push` trigger can match `main`. No push to `main` in this phase.
- `secret-scan` is diagnosed from its job log on the first evidence run and fixed or its findings recorded as accepted; `infra-validate` is observed on the final tree in the same run; `dependency-audit` is read once and, unless caused by this workstream's files, becomes a dated todo for phase 189.

### Decided autonomously
- [Proofs] Q: 'How are the workflows validated locally?' → Selected: 'actionlint at a pinned version through its published container image, a root script lint:workflows, and vitest guard tests in infra/scripts/ (run by yarn test:unit:infra) asserting triggers, environments, permissions, SHA-pinned actions, no pull_request_target, no upload-artifact, no service-role name, and the C-03 step order' — test files and one script key, removable without touching the workflows.
- [Records] Q: 'Where does the pipeline's documentation go?' → Selected: 'a new infra/README.md section The deploy pipeline, pointers from the hand runbooks, dated rows in the Observations tables of the staging AWS and bootstrap runbooks, raw evidence in 187-*/evidence/' — documentation placement.
- [Records] Q: 'Which E2E gate?' → Selected: 'targeted checks in plans; one full local run through tests/scripts/e2e-run.sh at phase end with the unit, lint and format gates; a void run is made again' — verification procedure under the standing rule of 2026-11-09.
- [Deploy run] Q: 'Is the image script still called with its refusals on the runner?' → Selected: 'yes; build-push-image.sh is the build step, and exit 3 (tag already pushed) is read as: take the digest it prints and continue, so a re-run of the same commit deploys the same image' — script call site in one workflow.
- [Deploy run] Q: 'Which Terraform and CLI versions?' → Selected: 'Terraform 1.16.5 through hashicorp/setup-terraform with terraform_wrapper false, as infra-validate does; the Supabase CLI from node_modules/.bin after yarn install' — version pins in workflow files.
- [Deploy run] Q: 'Does the run print the plan?' → Selected: 'yes, terraform show -no-color of the saved plan in the log and the step summary; the AWS root holds no secret value, and sensitive values are masked' — output only.
- [Alerts] Q: 'Message format of the failure alert?' → Selected: 'subject names the environment and the failed stage; body names the commit, the trigger and the run URL; no secret, no address' — message text in one step.
- [Destroy] Q: 'What is checked after a real destroy?' → Selected: 'the state holds no resource, the Supabase root plan is No changes and the conformance probe passes, as in 185-19 and 185-20' — evidence procedure.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `infra/modules/github-oidc/{main,policies,variables,outputs}.tf`: the provider, both roles, exact-match trust, the per-concern customer-managed policy pattern with per-role attachments, `aws_iam_role_policies_exclusive`.
- `infra/scripts/build-push-image.sh` and `build-push-image.test.ts`: refusals, `image_digest=` output, the stub-based `--self-test`.
- `infra/scripts/push-migrations.sh`, `check-drift.sh`: the push and drift contract with exit codes 0-4 and 130; Step 14 of `infra/envs/staging/supabase/README.md` for the linked work directory; Step 17 for the functions deploy and read-back.
- `.github/workflows/main.yaml` `infra-validate` (lines 767-841): SHA-pinned checkout and setup-terraform, `terraform_wrapper: false`, `persist-credentials: false`, the named-roots loop.
- `tests/playwright.deployed.config.ts`, `tests/deployed-global-setup.ts`, `tests/tests/utils/deployedSmokeGuards.test.ts` (already scans `.github/` for `DEV_SEED_ALLOW_REMOTE`).
- `infra/modules/frontend-service/alerts.tf`: the SNS topic and the confirmed e-mail subscription the pipeline alert reuses.
- The `ci-evidence` source-only commit recipe (memory note on the CI evidence channel).

### Established Patterns
- Exit statuses are read on the next line, never through a pipe; result lines are `name=value`.
- Backends are literal per root; the deploy role reaches only `pipeline/staging/aws/terraform.tfstate`; hand roots live under `hand/`, denied to the plan role.
- No secret in tfvars; secrets arrive as `TF_VAR_*` or environment variables of one session; no plan, state or raw log is ever uploaded.
- Every hosted write is an operator-approved checkpoint; the executor holds no credential.
- Module behaviour is checked offline by `terraform test` (33 runs in `frontend-service/tests`).

### Integration Points
- `infra/bootstrap/terraform.tfvars:16-21` (subjects, environment, state key) and `infra/bootstrap/main.tf:57-70` (module call) for A-01 to A-04.
- `infra/modules/frontend-service/service.tf:28` and `variables.tf:41-49` for `image_digest`; `infra/envs/staging/aws/terraform.tfvars:45-46` and `infra/envs/example/aws/terraform.tfvars` lose `image_tag`.
- `infra/README.md:85-88` (branch-policy prerequisite) is rewritten.
- `package.json:51, 55` (`test:unit:infra`, `test:e2e:deployed`); `infra/vitest.config.ts` collects `scripts/**/*.test.ts`.
- `infra/envs/staging/aws/README.md` Steps 4-5 (image and apply) and Steps 15-17 (destroy, re-apply) change with the digest.

</code_context>

<specifics>
## Specific Ideas

- Staging serves build `712947a1bd44a735f66ee8f51610f4748d76cd30` (2026-11-14 23:56Z). `deploy-evidence/185-image` already exists on origin at that commit.
- No `staging` GitHub Environment exists yet; the repository has 29 unrelated environments and older `deploy-*` branches, none matched by `deploy/staging` or `deploy-evidence/*`.
- Runners are IPv4-only, and the direct database host has only an AAAA record; the session pooler host is copied from the dashboard (it cannot be derived from the region) and stored as an environment variable.
- `workflow_dispatch` is only offered for workflows on the default branch, so every observation in this phase is a push.
- Outward actions, each an operator checkpoint (187-DISCUSSION-POINTS.md § H): H1 bootstrap hand apply; H2 the two Environments; H3 secrets and variables; H4 source-only pushes; H5 the draft PR; H6 a fork PR; H7 approving gated runs (first hosted migration push); H8 the red run and its mail; H9 plan 186-08's sitting; H10 the real destroy and redeploy after 2026-11-23, with the new subscription confirmed.
- Local work with no outward dependency: the IAM policies and their tests (written, not applied), `image_digest`, CR-01, `--confirmed-ref`, the three workflows, the example mock plans, the guard tests and actionlint, the README section, and the local gates.

</specifics>

<deferred>
## Deferred Ideas

- FUT-10: rollback to the previous task definition when the smoke run fails.
- Pinning the plan trust to a workflow (`job_workflow_ref`), if AWS supports the claim and the pull-request threat model changes.
- Narrowing the plan role's `ReadOnlyAccess` remainder (AR-183-01): stays an accepted risk with the explicit denies; revisit if the plan role ever plans a root holding data reads that matter.
- `dependency-audit` CI failure, unless caused by this workstream's files: a dated todo for phase 189.
- The first push to `main` after the merge, read to show it deploys nothing: phase 189.
- 185 review warnings WR-01 (HSTS), WR-02 (execution role managed policy) and WR-03 to WR-06: not in this phase's requirements; they stay `open` in `185-REVIEW-DISPOSITION.md` for triage.

</deferred>
