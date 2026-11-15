# Phase 187 — Discussion points

**Phase:** Deploy Pipeline (workstream `deployment`)
**Written:** 2026-11-15, from a scout of the tree at `1bf1c6400`, read-only `gh api` GETs on the repository and a read of `https://staging.openvaa.org/api/health`
**Closes:** PIPE-01 to PIPE-10, INFRA-16, INFRA-19, SUPA-08
**Carries in:** TR-183-01, TR-183-02, AR-183-01, AR-183-02 (re-transferred to this phase by 184 D-21), 185 review CR-01, the 183 CI debts listed in `STATE.md`

## How to fill this

- Each decision lists its options as checkboxes. Exactly one is marked **★ RECOMMENDED**.
- **If you leave every box in a decision unticked, the ★ option is chosen.** Tick a box only to overrule it.
- Tick one other box to overrule. A `**NOTE:**` or `**EDIT:**` line beats any box.
- **⚠ DECIDE** marks the seven decisions that change the shape of the phase: **A-01, A-04, B-01, C-01, D-01, D-02, F-02**. Read those first.
- You were away when this was written. `187-CONTEXT.md` has already been written from the ★ options, so planning can start. Overrule here before execution, and CONTEXT.md is rewritten from your fill.
- Section H lists every step that acts outside this workstation. Each one is an operator checkpoint. Everything else is local and can run without you.

Not asked here, because a ruling already settles them:

- The named branch is a per-environment branch, `deploy/staging`, deployed by GitHub Actions and not by AWS CodePipeline (reading 3 of the 2026-10-11 rulings; E3 with the F1 note).
- Plans run on pull requests; applies run on a push to `deploy/staging`, a manual dispatch and a `deploy-evidence/**` push; a push to `main` deploys nothing (E3, PIPE-10).
- One applied environment, staging. `example` is validated and planned, never applied (A1).
- The smoke run is read-mostly and seeds nothing; `DEV_SEED_ALLOW_REMOTE` appears in no workflow (E1). The entry is `yarn test:e2e:deployed`, built by phase 186.
- Edge Function secrets live in Terraform state behind the hardened bucket (C7). They are set by the hand-applied Supabase root, not by the pipeline.
- Rollback to the previous task definition when the smoke run fails (FUT-10) is not built.
- IAM is written only by roots no workflow applies (`infra/README.md` § Rules of every apply), so the pipeline never widens its own access.

---

## Factual baseline (re-verified 2026-11-15, about 00:00Z)

| Claim the phase inherits | On the tree, or as served | Evidence |
|---|---|---|
| OIDC provider and two roles exist | `aws_iam_openid_connect_provider.github`, roles `openvaa-plan` and `openvaa-staging-deploy`, every condition `StringEquals` on `aud` and `sub` | `infra/modules/github-oidc/main.tf:14-17, 23-63, 65-105, 109-119` |
| Trust subjects | Plan: `repo:OpenVAA/voting-advice-application:pull_request`. Deploy: `repo:OpenVAA/voting-advice-application:environment:staging`. Wildcards refused by validation | `infra/bootstrap/terraform.tfvars:17-18`, `infra/modules/github-oidc/variables.tf:17-39` |
| Numeric id conditions | Written and validated, **unset** (`github_repository_id`, `github_repository_owner_id` are null). The repository id is `546467466`, the owner id `115159211` | `github-oidc/main.tf:45-61, 87-103`; `gh api repos/OpenVAA/voting-advice-application` |
| What the deploy role may do | **Only** read and write the one state key `pipeline/staging/aws/terraform.tfstate` and its lock, and push to the one ECR repository. **It cannot apply the AWS root**: no EC2, ELB, ECS, CloudFront, ACM, Route 53, Logs, SNS, EventBridge or Auto Scaling permission, and no `iam:PassRole` | `infra/modules/github-oidc/policies.tf:27-61, 63-92, 187-195` |
| What the plan role may do | `ReadOnlyAccess`, minus an explicit deny on `hand/*` and `env:/*` state, secret and KMS reads and data-plane reads; **plus write and delete of the pipeline lock** (AR-183-02, WR-04) | `policies.tf:98-151, 153-185` |
| State bucket (SUPA-08) | Versioned, `AES256`, all four public-access blocks, ownership controls, a bucket policy, `prevent_destroy` | `infra/modules/state-bucket/main.tf:14-50, 84` |
| Root state keys | AWS staging root `pipeline/staging/aws/…` (the only key the deploy role reaches); Supabase staging `hand/staging/supabase/…`; dns-mail `hand/staging/dns-mail/…`; bootstrap `hand/bootstrap/…` | `infra/envs/staging/aws/main.tf:17-23`, `envs/staging/supabase/main.tf:20-22`, `envs/staging/dns-mail/main.tf:14-16`, `infra/bootstrap/backend.tf` |
| GitHub Environment `staging` | **Does not exist.** The repository holds 29 other environments (older `deploy-*` ones, `copilot`, `github-pages`), none named `staging` | `gh api repos/OpenVAA/voting-advice-application/environments` |
| Documented branch policy | `infra/README.md` says the environment "allows deployments from the **default branch only**". That contradicts PIPE-10, which deploys from `deploy/staging` | `infra/README.md:85-88` |
| Workflows on the tree | `main.yaml` (with `infra-validate`: fmt, validate of every root, module tests, settings-type check; no credentials), `docs.yml`, `release.yml`, three `claude*` workflows. **No plan or deploy workflow exists**, and no workflow requests `id-token: write` | `.github/workflows/main.yaml:3-36, 767-841` |
| Evidence channels | `main.yaml` runs on `ci-evidence/**` pushes. A `deploy-evidence/185-image` branch already exists on origin at `712947a1`, the source-only commit 185 built from. GitHub only offers `workflow_dispatch` for a workflow on the default branch | `main.yaml:7-21`; `git ls-remote origin 'refs/heads/deploy*'` |
| Image build | `infra/scripts/build-push-image.sh` builds `apps/frontend/Dockerfile` target `production`, `linux/arm64` by default, `BUILD_SHA` = HEAD, tag = HEAD, reads the digest back and prints `image_digest=`. It refuses a dirty tree, a tree holding `.planning/`, and an unpushed HEAD; exit 3 when the tag exists | `build-push-image.sh:8-32, 77-79, 176-191` |
| CR-01 (185 review, open) | The build context includes gitignored files: the dirty-tree check does not list ignored files and the build runs in the live tree. Must be fixed before a runner builds | `185-VERIFICATION.md` gaps 2; `185-REVIEW-DISPOSITION.md:5` |
| How the task names its image | `"${var.registry_url}:${var.image_tag}"`, a **tag**, not a digest. `image_tag` must be 40-hex and is committed in tfvars as `712947a1…` | `infra/modules/frontend-service/service.tf:28`, `variables.tf:41-49`, `envs/staging/aws/terraform.tfvars:45-46` |
| Rollout and wait | `wait_for_steady_state = true`, circuit breaker with rollback, min 100 / max 200 percent | `frontend-service/service.tf:84-100` |
| Deployment alert today | EventBridge `SERVICE_DEPLOYMENT_FAILED` of this service → SNS topic `openvaa-staging-frontend-deployments` → e-mail subscription (`alert_email`). **Seen firing** in 185-16 (the mail arrived). There is **no build-failure or pipeline-failure alert** | `frontend-service/alerts.tf:1-59`; `185-VERIFICATION.md` truth 3 |
| Migrations by hand | `infra/scripts/push-migrations.sh`: refusals, dry run, **typed confirmation of the ref on `/dev/tty`** (no terminal → exit 2), push, then `check-drift.sh --target linked` (needs Docker for a shadow database). The work directory is linked beforehand (runbook Step 14), never `apps/supabase` | `push-migrations.sh:7-12, 66, 313-322`; `check-drift.sh:44-45`; `envs/staging/supabase/README.md:693-830` |
| Database path | The direct host `db.<ref>.supabase.co` has an AAAA record and no A record; from an IPv4-only network the session pooler (port 5432, user `postgres.<ref>`) is needed. GitHub-hosted runners are IPv4-only | `envs/staging/supabase/README.md:743-790, 1807, 1866` |
| Functions by hand | `supabase functions deploy --project-ref … --workdir <linked dir>` with `SUPABASE_ACCESS_TOKEN`; `verify_jwt` read from `config.toml`; their secrets come from the Supabase root (Step 18) | `envs/staging/supabase/README.md:831-872` |
| What 185 did by hand, in order | Step 4 image (build, push, digest) → Step 5 plan and one apply of the AWS root (`wait_for_steady_state`) → Step 7 read of what the stack serves. Migrations and functions were pushed in 184 (Steps 16-17), before the AWS root existed | `envs/staging/aws/README.md:502, 745, 960`; `envs/staging/supabase/README.md:796, 831` |
| The smoke entry | `yarn test:e2e:deployed`; inputs `SMOKE_EXPECTED_SHA` (required, 40-hex), `SMOKE_BASE_URL`, `SMOKE_CONTESTANT_EMAIL`/`_PASSWORD`; refuses a set `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY`; `retries: 0`; a guard test scans `.github/` for `DEV_SEED_ALLOW_REMOTE` | `package.json:55`; `tests/README.md:139-160, 309`; `tests/tests/utils/deployedSmokeGuards.test.ts:14-23, 201` |
| The smoke contestant | **Does not exist yet.** Plan 186-08 awaits the operator's sitting (attempt `186-08-2`). Without it the contestant spec fails by name | `STATE.md` Blockers, first item; `tests/README.md:151` |
| Staging now | `/api/health` → `{"status":"ok","build":"712947a1bd44a735f66ee8f51610f4748d76cd30"}` | `curl -s`, 2026-11-14 23:56Z |
| Example roots | `infra/envs/example/{aws,dns-mail,supabase}`, stand-in account `000000000000` (the provider refuses any real credential), backend bucket `REPLACE-ME-tfstate`. Validated by `infra-validate`; **never planned** | `envs/example/aws/main.tf:1-28`, `terraform.tfvars:10-12` |
| The 183 deferrals | TR-183-01 (plan trust pinned to a workflow; staging branch policy), TR-183-02 (numeric id claims), AR-183-01 (`ReadOnlyAccess` remainder), AR-183-02 (plan role holds the lock). 184 did not act on them: D-21 re-transferred all four to 187 | `183-SECURITY.md:149-162`; `184-CONTEXT.md:153-156` |
| CI debts | `infra-validate` has not run on the final tree (last observed at `18fdcd6ca`). `secret-scan` and `dependency-audit` concluded failure on the pushed tree, undiagnosed. Nothing in 184-186 touched them | `STATE.md` Blockers (Phase 183 items) |
| Local tools | Terraform 1.16.5 present. **`actionlint` is not installed** | `which actionlint terraform` |
| Cost window | INFRA-13's measured estimate needs seven full days of tagged cost data from 2026-11-15; readable from 2026-11-23. **A destroy or re-apply restarts the window** | `185-VERIFICATION.md` gaps 1 |

---

## A — Credentials and trust (PIPE-01, PIPE-03, SUPA-08)

### A-01 — What the deploy role may do, so that the pipeline can apply the AWS root ⚠ DECIDE

The deploy role can push an image and write one state key, and nothing else (baseline). A pipeline `terraform apply` of `infra/envs/staging/aws` (40 resources across EC2, ELB, ECS, CloudFront, ACM in two regions, Route 53, Logs, SNS, EventBridge, Application Auto Scaling) fails on its first refresh. The root creates no IAM itself, so the only IAM action it needs is `iam:PassRole` on the execution role.

- [ ] ★ RECOMMENDED — **Customer-managed deploy policies, added to the `github-oidc` module and applied by hand from `bootstrap`.** One policy per concern under `/openvaa/`, each kept under the 6,144-character size limit: network (EC2 VPC resources, conditioned on the `Project=openvaa` / `Root=aws` tags at create and at change), load balancing, ECS (cluster and service by name `openvaa-staging-*`), edge (CloudFront and ACM, tag-conditioned; ACM in `eu-north-1` and `us-east-1`), DNS (record changes in the staging zone only), observability (the log group, the SNS topic and the EventBridge rule by name), scaling, and `iam:PassRole` on `openvaa-staging-frontend-execution` with `iam:PassedToService = ecs-tasks.amazonaws.com`. No `iam:Create*`, `Put*`, `Attach*` or `Delete*` on roles or policies. Each statement is checked offline by a `terraform test` of the module and on AWS by the IAM policy simulator before the first pipeline apply. The pipeline then plans and applies the whole root, the same root 185 applied by hand.
- [ ] One broad AWS-managed policy (`PowerUserAccess`) on the deploy role. A few lines, and the first apply cannot fail on a missing action; but every job in the `staging` environment can then change anything in the account except IAM, against INFRA-17's "customer-managed where AWS-managed does not fit" and the least-privilege intent of 183.
- [ ] The pipeline deploys the image only (`aws ecs register-task-definition` + `update-service`) and every infrastructure change stays a hand apply. Narrow permissions, but Terraform state no longer describes the running task, every hand plan shows the pipeline's revision as drift, and the destroy path (PIPE-08) still needs every delete permission.

### A-02 — The carried 183 trust items (TR-183-01, TR-183-02, AR-183-01)

- [ ] ★ RECOMMENDED — **Set the numeric id conditions; do not pin the plan trust to a workflow; keep AR-183-01 accepted** (the plan role keeps `ReadOnlyAccess` with its explicit denies: forks get no token, so only a writer can reach it, and the AWS root it plans holds no secret). `github_repository_id = "546467466"` and `github_repository_owner_id = "115159211"` go into `bootstrap/terraform.tfvars`, so both trusts survive a rename and refuse a recreated repository of the same name. Whether AWS evaluates those claims is unobserved (bootstrap runbook "Not yet observed"); the first green run shows it, and if the role becomes unassumable the two lines are removed by one hand apply. The workflow pin is not added: for a `pull_request` run the workflow file comes from the pull request itself, so a pin to a path protects nothing against a writer who edits that file. That remainder is recorded as an accepted risk, beside the branch policy of A-04, which is what keeps other branches out of the deploy role.
- [ ] Keep the name-based subjects only (A-09 of 183). No apply, no risk of locking the roles out; TR-183-02 stays open a third time and a repository rename silently breaks both roles.
- [ ] Also pin the plan trust to `job_workflow_ref`. Only if AWS honours that claim (unverified), and it buys nothing against a writer (above).

### A-03 — The plan role's lock write (AR-183-02, WR-04)

- [ ] ★ RECOMMENDED — **Pull-request plans run with `-lock=false`, and the `plan_lock` policy is removed**, so the plan role is read-only in fact and no pull request can hold or delete the lock an apply needs. The cost is that a plan made during an apply can show a diff against state that is being written; it is a read, and the next push re-plans.
- [ ] Keep the lock write (183 A-08). Plans are consistent with applies, but a pull-request job can hold the lock and block or break a deploy, and can delete the lock while an apply runs.

### A-04 — The `staging` GitHub Environment ⚠ DECIDE

The deploy role trusts every job that names `environment: staging`, from any branch, so the environment's settings are the gate (PIPE-04) and the branch guard. `infra/README.md:85-88` says "default branch only", which PIPE-10 contradicts.

- [ ] ★ RECOMMENDED — **Required reviewer: the operator; self-review allowed (one person both pushes and approves); deployment branch policy: custom, `deploy/staging` and `deploy-evidence/*` patterns only, so `main` and every other branch are refused by GitHub before a job starts.** `infra/README.md` § Prerequisites is corrected to say so. A second environment, `staging-destroy`, with the same reviewer and branch policy and **no secret at all**, holds the destroy job (F-01); its subject is added to `deploy_subjects`. The settings are read back with `gh api` GETs and recorded.
- [ ] One environment for deploy and destroy. One subject fewer, but the destroy job then runs in an environment that holds the Supabase access token and the database password, and "cannot reach the Supabase root" rests on the workflow not naming them.
- [ ] A wait timer instead of a reviewer. Unattended deploys, but PIPE-04's gate becomes a delay anyone with push access can sit out.

### A-05 — Where the secrets live (SUPA-08)

- [ ] ★ RECOMMENDED — **Environment secrets of `staging` only:** `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD`, `ALERT_EMAIL` (must equal the address the stack's subscription uses, or the subscription is recreated and needs a new confirmation). Non-secret values are environment variables (`AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`). The repository gets one variable, `AWS_PLAN_ROLE_ARN`, and one repository secret, `ALERT_EMAIL`, for the pull-request plan, which is not in an environment. **The service-role key is in no workflow and no secret**: the pipeline needs none of its steps, and the smoke gate refuses it. A unit test fails on `SERVICE_ROLE`, `SECRET_KEY`, `upload-artifact` and a plan file path outside `$RUNNER_TEMP` in the new workflows.
- [ ] Repository secrets. Simpler to set, but every workflow and every same-repository pull request can read them, outside the gate.

### A-06 — Fork pull requests (PIPE-03)

- [ ] ★ RECOMMENDED — Every credentialed job carries `if: github.event.pull_request.head.repo.full_name == github.repository` (and `github.event_name != 'pull_request'` for the deploy workflow, which has no PR trigger), so a fork's run shows the job as **skipped**; GitHub also withholds secrets and the identity token from fork runs. Workflows use `pull_request`, never `pull_request_target`, and a unit test fails on `pull_request_target`. Observed once with a pull request opened from a fork (H).
- [ ] Rely on GitHub's withholding alone. The job then runs and fails at `configure-aws-credentials`, a red run where PIPE-03 asks for a visible skip.

---

## B — Triggers and the shape of the workflows (PIPE-02, PIPE-04, PIPE-10)

### B-01 — What feeds `deploy/staging` and `deploy-evidence/**` before this branch is on `main` ⚠ DECIDE

This branch's commits hold `.planning/`, and the repository is public. `build-push-image.sh` refuses a tree holding `.planning/`. 185 deployed from `712947a1`, a source-only commit.

- [ ] ★ RECOMMENDED — **Source-only commits, built by the orchestrator with a temporary index** (the `ci-evidence` recipe: `read-tree HEAD`, `rm --cached .planning`, `write-tree`, `commit-tree -p origin/main`), pushed to `deploy-evidence/187-<name>` for each observed run, and to `deploy/staging` once the pipeline is green. Each push is an operator checkpoint, because a pushed commit on a public repository is permanent. After the milestone merges, `deploy/staging` is fast-forwarded to a `main` commit and the recipe is no longer needed.
- [ ] Push this branch as it is. One command, but it publishes about three thousand planning documents, and the image script refuses it anyway.
- [ ] Wait for the merge to `main` and observe everything there. No source-only commits, but nothing in this phase can be observed before the milestone ends, and PIPE-09 and the roadmap's evidence note cannot be met here.

### B-02 — Which workflow files

- [ ] ★ RECOMMENDED — **Three new files, and `main.yaml` untouched:** `infra-plan.yml` (on `pull_request` to any base when `infra/**` or the workflow changes, and on `deploy-evidence/**` pushes; a no-credential job runs fmt, validate and the `example` plans of E-01; a credentialed job plans the staging AWS root), `deploy.yml` (push `deploy/staging` and `deploy-evidence/**`, `workflow_dispatch`), `destroy.yml` (F-01). Each action is pinned by commit SHA with the tag in a comment, as `infra-validate` does; every job sets `permissions` explicitly and `id-token: write` only where a role is assumed.
- [ ] One workflow with event-switched jobs. One file, but the plan, deploy and destroy permissions sit side by side, and a mistaken `if:` crosses them.

### B-03 — Serialising applies (PIPE-04)

- [ ] ★ RECOMMENDED — `deploy.yml` and `destroy.yml` share one concurrency group, `staging-aws`, with `cancel-in-progress: false`. A running apply is never cancelled; GitHub keeps one waiting run and replaces an older waiting run with a newer one, which is recorded as the intended behaviour. The deploy job's `timeout-minutes` is set well above the longest observed apply (185: CloudFront and certificate creation), so a timeout cannot cut an apply short in normal operation. Terraform's own lock remains the second guard.
- [ ] Terraform's lock alone. A second run fails at `init`/`plan` with a lock error instead of waiting, and a run cancelled by a newer push can leave the lock held.

### B-04 — Where pull-request plans can be observed

- [ ] ★ RECOMMENDED — `infra-plan.yml` triggers on pull requests to **any** base, so the observed plan can be a draft pull request from a source-only branch into a source-only base branch (`deploy-evidence/187-base`), closed afterwards, with no pull request against `main`. The plan is printed with `terraform show -no-color` to the job log and to the step summary; the plan file stays in `$RUNNER_TEMP` and is never uploaded.
- [ ] Only pull requests to `main`. Matches `main.yaml`, but the observation then needs a public pull request against `main` carrying the milestone's infra code.

---

## C — The deploy run (PIPE-05, PIPE-06)

### C-01 — How the image reaches the task: by digest ⚠ DECIDE

The task names a tag (`service.tf:28`), and the committed tfvars pins `image_tag = 712947a1…`. A pipeline that builds a new commit must pass its image to the apply without a commit back to the branch.

- [ ] ★ RECOMMENDED — **Replace `image_tag` with a required `image_digest` variable (`^sha256:[0-9a-f]{64}$`), no default and not in `terraform.tfvars`;** the task's image becomes `"${registry_url}@${image_digest}"`. The tag in ECR stays the commit id (immutable) and `BUILD_SHA` stays the commit id, so the smoke gate still proves the build SHA. The deploy job passes the digest the build step printed. The pull-request plan and every hand plan pass **the digest the service runs now**, read from the ECS service's task definition, so their diff shows only infrastructure changes. The 185 runbook's apply steps and the `example` root change with it.
- [ ] Keep the tag and pass `-var image_tag=<sha>`. Smaller change, but PIPE-05 says "deployed by digest", and a tag only names an image because the repository is immutable.
- [ ] Keep `image_tag` in tfvars and have the pipeline commit the new value to `deploy/staging`. The file then records what runs, but the pipeline writes to the branch that triggers it, and a commit per deploy needs a token with write access.

### C-02 — Building on a runner: CR-01 and the platform

- [ ] ★ RECOMMENDED — **Fix CR-01 first:** the script builds from a `git archive HEAD` context in a temporary directory, so no ignored or untracked file can enter the image, with a self-test case that plants an ignored file and shows it absent from the context. **Build natively on a GitHub-hosted `ubuntu-24.04-arm` runner** (free for public repositories), the platform the service runs on. The build step runs before `yarn install` in the job, and the script's existing refusals stay.
- [ ] Emulate arm64 with QEMU on an x86 runner. No runner change, but the build is several times slower.
- [ ] Move the service to `X86_64`. Native x86 builds, but it changes the running stack, its price and the task definition 185 observed.

### C-03 — The order of the run, and how many gated jobs

- [ ] ★ RECOMMENDED — **One gated job in `staging`, steps in this order:** (1) build, push, digest; (2) `terraform plan` of the AWS root with that digest, saved in `$RUNNER_TEMP`, printed with `show`; (3) migrations (C-04); (4) functions (C-05); (5) `terraform apply` of the saved plan (the frontend rollout); (6) wait until stable (C-06); (7) the smoke run (D-01). A failed step stops the steps after it. Build and plan come before the first hosted write, so a broken build or a bad plan never touches the database. One approval per run. A light job before the gate, with no credentials, runs fmt, validate and the infra unit tests.
- [ ] One job per stage, each in `staging`. A clearer run graph, but each job waiting on a protected environment asks for its own approval, and the digest and saved plan have to cross jobs (the plan would have to be an artifact, which SUPA-08 forbids).
- [ ] Migrations after the rollout. The old frontend would never meet a newer schema, but a new frontend could meet an old one, and PIPE-06 fixes migrations first.

### C-04 — Migrations without a terminal

`push-migrations.sh` asks for the ref on `/dev/tty` and exits 2 without one.

- [ ] ★ RECOMMENDED — **A `--confirmed-ref <ref>` flag that replaces the typed answer**, accepted only when it equals `--ref` and only when `GITHUB_ACTIONS=true` and `GITHUB_ENVIRONMENT=staging`; anything else exits 2 as today. The environment approval is the human confirmation. The dry run's `push_pending=` lines are printed before the push. The job links a temporary work directory (runbook Step 14 shape, never `apps/supabase`), uses the **session pooler** from `SUPABASE_POOLER_HOST` (runners are IPv4-only), and runs the drift check on the runner's Docker. Self-test cases cover the flag's refusals.
- [ ] Call `supabase db push` directly in the workflow. Fewer lines, but the refusals, the drift check and the exit-status contract of 184 are bypassed.

### C-05 — Functions

- [ ] ★ RECOMMENDED — `supabase functions deploy --project-ref <ref> --workdir <linked dir>` for all three, then the Management API list read back: three `ACTIVE`, `verify_jwt` as `config.toml` says (runbook Step 17 item 2), failing the step otherwise. Function secrets are not touched.
- [ ] Deploy only the functions that changed. Faster, but a change detector is one more thing that can be wrong, and three functions deploy in about a minute.

### C-06 — "Wait until stable"

- [ ] ★ RECOMMENDED — The apply already waits (`wait_for_steady_state`). After it, a step reads the service and fails unless the primary deployment names the task definition just applied with `rolloutState = COMPLETED` and the running count is at least the floor, because a circuit-breaker rollback can also end in a steady service. `/api/health`'s `build` equal to the commit is then proven by the smoke gate.
- [ ] Trust the apply's exit status. One step fewer, but a rollback that ends steady may not fail the apply.

---

## D — Smoke stage and alerts (PIPE-07, PIPE-09, INFRA-16)

### D-01 — The smoke run as the last stage, and the missing contestant ⚠ DECIDE

- [ ] ★ RECOMMENDED — **The last step runs `yarn test:e2e:deployed` with `SMOKE_EXPECTED_SHA` = the built commit, the two contestant secrets, no service-role key in the step's environment, and its exit status read directly; a failure fails the run.** The browser is installed in the job. **The observed green run waits for plan 186-08** (the hosted contestant). Until then the voter half can be run in an evidence run, but it is not counted as PIPE-09's green run, and there is no switch that skips the contestant spec.
- [ ] Add an input that skips the contestant spec, and count a voter-only green run. The phase can close before 186-08, but PIPE-07's "signs one contestant in" is not shown by the pipeline, and a skip switch is a way to ship a run that proves less.

### D-02 — How the operator is told that a build or a deploy failed ⚠ DECIDE

The rollout alert exists and was seen (baseline). There is no alert for a failed build or a failed pipeline step.

- [ ] ★ RECOMMENDED — **A final step of the gated job, `if: failure()`, publishes one message to the existing SNS topic `openvaa-staging-frontend-deployments`**, naming the failed stage (build, plan, migrations, functions, rollout, stable, smoke), the commit and the run URL, so both alerts reach the operator's mailbox through one confirmed subscription. The deploy role gains `sns:Publish` on that topic only (part of A-01). The rollout alert's observation in 185-16 stands, since its resources are unchanged; it is observed again only if the topic or subscription is recreated (F-02). The pipeline alert is seen firing once by the red run (D-03).
- [ ] GitHub's own failed-workflow mail to the person who triggered the run. No code and no IAM, but it depends on that person's notification settings and on who pushed, and it is not the operator's alert channel.
- [ ] A chat webhook. A second channel and a second secret to keep.

### D-03 — The red run

- [ ] ★ RECOMMENDED — **One evidence push of a commit whose frontend build fails on purpose** (a type error in one route, on a source-only `deploy-evidence/187-red` branch, never merged): the run must stop at the build step, before any hosted write, exit red, and the alert mail must arrive. Then a green run of the unbroken commit. Both runs' URLs, step conclusions and the mail's arrival time are recorded.
- [ ] A broken rollout (an image that fails its health check). It exercises the circuit breaker again (already seen in 185-16), costs a rollback on the live stack, and PIPE-09 asks for a broken build.
- [ ] A failing smoke run (a wrong `SMOKE_EXPECTED_SHA`). Cheap, but it is not a broken build, and the build-failure alert is not shown.

---

## E — The `example` environment (INFRA-19, PIPE-02)

### E-01 — How the example roots are "planned"

The stand-in account `000000000000` makes the provider refuse every real credential, and the roots read data sources (the zone by name, the CloudFront policies), so a real plan cannot run.

- [ ] ★ RECOMMENDED — **A `terraform test` per example root with `mock_provider` blocks and `command = plan`**, run by the no-credential job in `infra-plan.yml` on every pull request, with the planned resource addresses printed in the log. It asserts what makes the root production-shaped (floor 2, ceiling 4, two zones) from the variables. No credentials, no backend.
- [ ] Plan with the real plan role and an override file that swaps the account. Real data sources, but a CI override that changes the account guard is a way to apply the template against the real account.
- [ ] Validate only. Already done by `infra-validate`; INFRA-19 asks for a plan.

### E-02 — "Never applied"

- [ ] ★ RECOMMENDED — Three guards: the stand-in account id (provider refusal); the deploy role reaches only `pipeline/staging/aws`, and the example backend names another bucket; and a unit test that fails when any workflow runs `apply` or `destroy` in a directory other than `infra/envs/staging/aws`.
- [ ] The stand-in account alone. It holds until a forker copies the root and replaces the id in this repository.

---

## F — The destroy path (PIPE-08)

### F-01 — Its shape

- [ ] ★ RECOMMENDED — **`destroy.yml`, triggered by `workflow_dispatch` (input `confirm` must equal `destroy staging aws`) and by a push to one exact branch, `deploy-evidence/destroy-staging`; its one job is in the `staging-destroy` environment (A-04), which holds no secret.** It runs `terraform plan -destroy` of `infra/envs/staging/aws` only, prints it, refuses unless every planned address is under `module.frontend` and the count equals the resources in state, then applies that saved plan. Before the plan it proves the Supabase root is out of reach: `terraform -chdir=infra/envs/staging/supabase init` with the deploy role is refused (403 on `hand/staging/supabase/terraform.tfstate`), and the step fails if that read succeeds. A unit test fails if the workflow names a Supabase secret or any other root.
- [ ] A destroy input on `deploy.yml`. One file fewer, but the destroy runs in the environment that holds the Supabase token and database password.

### F-02 — Is the destroy run for real in this phase, and when ⚠ DECIDE

A real destroy removes the live stack. It recreates the certificates and the SNS subscription (a new confirmation mail) and **restarts INFRA-13's seven-day cost window**, readable from 2026-11-23.

- [ ] ★ RECOMMENDED — **Run it for real once, after the INFRA-13 cost read (on or after 2026-11-23), followed by a pipeline deploy from nothing**, which also shows the pipeline can build the stack, not only update it. The operator confirms the new SNS subscription at that checkpoint. Until then the path is shown by its `plan -destroy` and the Supabase-root refusal in an evidence run that stops before the apply.
- [ ] Run it for real as soon as the pipeline is green. The phase can close sooner, but the cost window restarts and INFRA-13's measured figure moves to a week later.
- [ ] Show only `plan -destroy` and the refusal. No downtime and no restart, but "removes the AWS stack" is never seen through the pipeline (it was seen by hand in 185-19).

---

## G — Proofs, records and carried debts

### G-01 — "A token with the wrong subject is seen refused" (PIPE-01)

- [ ] ★ RECOMMENDED — A job in `infra-plan.yml` that runs only on `deploy-evidence/**` pushes, **with no environment**, asks for the deploy role and must be refused (its token's subject is `ref:refs/heads/deploy-evidence/…`); the job passes only when `sts:AssumeRoleWithWebIdentity` fails, and prints the error code. A second step asks for the plan role from a push (not a pull request) and must also be refused.
- [ ] Show it with the IAM policy simulator. No workflow, but the simulator does not evaluate OIDC trust conditions from a real token.

### G-02 — "A push to main deploys nothing"

- [ ] ★ RECOMMENDED — `deploy.yml` has no `main` in its triggers, the environment's branch policy refuses `main` (read back with `gh api`), and a unit test fails if a deploy or destroy workflow's `push` triggers can match `main`. No push to `main` is made in this phase; the first one after the merge is read in phase 189.
- [ ] Push to `main` to observe it. Not possible before the milestone merges, and not this phase's to do.

### G-03 — The carried CI debts

- [ ] ★ RECOMMENDED — **Diagnose `secret-scan`** from its job log on the first evidence run and fix it or record the accepted findings, because SUPA-08's "only in the pipeline's environment and in state" leans on a green scan. **Observe `infra-validate` on the final tree** in the same evidence run. **`dependency-audit`** is read once and, unless the cause is in this workstream's files, recorded as a dated todo for phase 189.
- [ ] Leave all three to phase 189. Fewer tasks, but the phase claims SUPA-08 while the one job that scans for secrets is red.

### G-04 — Local validation of the workflows

- [ ] ★ RECOMMENDED — `actionlint` at a pinned version, run through its published container image (it is not installed here), plus vitest guard tests in `infra/scripts/` (picked up by `yarn test:unit:infra`) that parse the three workflows: triggers, environments, permissions, pinned actions, no `pull_request_target`, no artifact upload, no service-role name, the step order of C-03. A root script `lint:workflows` runs `actionlint`.
- [ ] Rely on the first run on GitHub. Each mistake then costs an outward push.

### G-05 — Records and the E2E rule

- [ ] ★ RECOMMENDED — How the pipeline works, its inputs, its secrets and how to read a red run go in a new `infra/README.md` § "The deploy pipeline", with the hand runbooks pointing to it; dated rows go in the "Observations" tables of the staging AWS and bootstrap runbooks; raw evidence in `187-*/evidence/`. This phase changes no file under `apps/` or `tests/` except, possibly, workflow guard tests; plans run targeted checks, and one full local run through `tests/scripts/e2e-run.sh` closes the phase (standing rule of 2026-11-09), together with the unit, lint and format gates.
- [ ] Phase evidence only. Phase 189 then digs the pipeline's documentation out of plan summaries.

---

## H — Outward actions and what can run without you

Every item below leaves this workstation and is an **operator-approved checkpoint**. Nothing in it can be undone by a later commit alone. The plans should put all local work in autonomous plans that depend on none of them.

| # | Outward action | System | Needed for | One-way? |
|---|---|---|---|---|
| H1 | Hand apply of `bootstrap`: the deploy policies and `sns:Publish` (A-01), the numeric ids (A-02), removal of `plan_lock` (A-03), the `staging-destroy` subject (A-04) | AWS IAM | every credentialed run | costly (reversible by another hand apply) |
| H2 | Create the `staging` and `staging-destroy` GitHub Environments: reviewer, self-review, branch policy | GitHub settings | PIPE-04, PIPE-10, A-04 | reversible |
| H3 | Set the environment secrets and variables, the repository variable and secret (A-05) | GitHub settings | the first credentialed run | reversible; the values never pass through the agent |
| H4 | Push each source-only branch (`deploy-evidence/187-*`, the PR base and head, `deploy/staging`) | GitHub, public | every observation | **one-way** (a public commit) |
| H5 | Open the draft pull request for the plan observation, and close it | GitHub | PIPE-02 | reversible (stays in history) |
| H6 | A pull request from a fork | GitHub, operator's fork | PIPE-03 | reversible |
| H7 | Approve each gated run, the first real deploy included: it pushes any pending migration to `cofbsatfrdysyphajsky` and applies the AWS root | Supabase, AWS | PIPE-04 to PIPE-07 | **one-way** for a pushed migration |
| H8 | The red run (D-03) and reading the alert mail | GitHub, AWS SNS, mailbox | PIPE-09, INFRA-16 | reversible |
| H9 | Plan 186-08's hosted contestant sitting (already pending) | Supabase | the green run (D-01) | one-way (hosted write) |
| H10 | The real destroy and the redeploy from nothing, after 2026-11-23, and confirming the new SNS subscription mail | AWS, mailbox | PIPE-08 (F-02) | **one-way** (stack and subscription recreated, cost window restarts) |

**Local work that can run now, without any of the above:** the `github-oidc` deploy policies, their `terraform test` and the tfvars changes (A-01 to A-04, written but not applied); `image_digest` in the module, both roots and the runbook (C-01); the CR-01 fix and its self-test (C-02); the `--confirmed-ref` flag and its self-tests (C-04); the three workflow files (B-02, C-03, C-05, C-06, D-01, D-02, F-01, G-01); the example-root mock-plan tests (E-01); the guard tests and `actionlint` (G-04); the README section (G-05); the local gates (fmt, validate, module tests, unit, lint, format) and the closing local E2E run.

---

## Fill status

| Section | Decisions | ⚠ |
|---|---|---|
| A Credentials and trust | 6 | 2 |
| B Triggers and workflow shape | 4 | 1 |
| C The deploy run | 6 | 1 |
| D Smoke stage and alerts | 3 | 2 |
| E The example environment | 2 | 0 |
| F The destroy path | 2 | 1 |
| G Proofs, records, carried debts | 5 | 0 |
| **Total** | **28** | **7** |
