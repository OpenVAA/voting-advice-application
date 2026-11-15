# Phase 187: Deploy Pipeline - Research

**Researched:** 2026-11-15
**Domain:** GitHub Actions OIDC to AWS, gated Terraform plan/apply, ECS deploy by digest, Supabase CLI in CI, workflow guard testing
**Confidence:** HIGH for the repository facts and the verified mechanisms; MEDIUM for the deploy-role action list, which only the first runs can settle

## Summary

The phase is mostly plumbing that is well documented. The risk sits in a few facts about this repository and the platforms, and this session checked them against the tree, against official docs and with local probes. Seven findings change what the plans must contain, beyond what CONTEXT.md already says:

1. **The deploy role cannot run the build step as written.** `build-push-image.sh` calls `aws ecr describe-images` before it builds anything. The deploy role's ECR policy has no `ecr:DescribeImages`, so the first runner build would stop at `failed=describe-images` [VERIFIED: infra/modules/github-oidc/policies.tf:63-85; infra/scripts/build-push-image.sh:217-228]. In 185 the build ran under the operator's administrator profile, which hid this.
2. **`GITHUB_ENVIRONMENT` is not a variable GitHub sets.** GitHub's list of default variables has no variable that names the job's deployment environment [CITED: docs.github.com/en/actions/reference/workflows-and-actions/variables]. The C-04 condition "`GITHUB_ENVIRONMENT=staging`" would therefore never hold, unless the workflow sets the variable itself. Use an environment-scoped configuration variable instead (below).
3. **The arm64 runner image has no `psql`.** The partner image for `ubuntu-24.04-arm` lists PostgreSQL among the software it leaves out [CITED: github.com/actions/partner-runner-images arm-ubuntu-24-image.md]. The drift check needs `psql` [VERIFIED: infra/scripts/check-drift.sh:43]. Without an install step, `push-migrations.sh` would push and then exit 4.
4. **A type error does not break the frontend build.** "Vite only performs transpilation on .ts files and does NOT perform type checking" [CITED: vite.dev/guide/features]. The image builds with `svelte-kit sync && vite build`, with no `svelte-check` [VERIFIED: apps/frontend/package.json:8]. The red run (D-03) needs an unresolvable import or a syntax error, and the failure should be proven locally first.
5. **Branch-name collisions.** A push to `deploy-evidence/destroy-staging` also matches `deploy.yml`'s `deploy-evidence/**` glob, unless that branch is excluded with a `!` pattern. A pull-request base or head named `deploy-evidence/187-base` starts a gated deploy run when it is pushed.
6. **Environments must exist before the first push of `deploy.yml`.** "Running a workflow that references an environment that does not exist will create an environment with the referenced name", with no protection rules and no secrets [CITED: docs.github.com manage-environments]. The deploy role trusts `environment:staging` by name, so such a run could assume the deploy role, ungated. H2 must come before every H4 push.
7. **AWS documents the numeric-id claims as trust-policy condition keys.** `repository_id`, `repository_owner_id`, `job_workflow_ref`, `environment` and `ref` are all listed [CITED: docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html]. TR-183-02's "unverified" premise is answered by the documentation; the first credentialed run still observes it.

The repository's default workflow token permission is `write` [VERIFIED: `gh api repos/OpenVAA/voting-advice-application/actions/permissions/workflow` → `"default_workflow_permissions":"write"`], so every new workflow must set `permissions: {}` at the top level. All three example roots were mock-planned locally with `terraform test` in this session. Each needed one root-specific stub: `override_resource` for the Supabase root's `import` target, a `mock_data "aws_region"` for dns-mail, and `override_data` for the availability zones in the AWS root. This is verified, not assumed.

**Primary recommendation:** Do all the local code first, in autonomous plans:
- the `github-oidc` deploy policies, including `ecr:DescribeImages`;
- `image_digest`;
- CR-01;
- `--confirmed-ref`, keyed on an environment-scoped variable;
- three workflow files with a `psql` install step;
- the example mock plans;
- the guard tests and actionlint through its container;
- the docs;
- a locally proven red commit.

Then run the outward checkpoints in this order: environments (H2), bootstrap apply with the simulator and a CloudTrail cross-check (H1), secrets (H3), the red run first (H8, no hosted write), the PR plan and the fork PR (H5, H6), 186-08 (H9), the green run and then `deploy/staging` (H4, H7), the plan-only destroy evidence run, and the real destroy after 2026-11-23 (H10).

<user_constraints>
## User Constraints (from CONTEXT.md)

Every answer is the ★ RECOMMENDED option of `187-DISCUSSION-POINTS.md`, unreviewed by the operator, who may overrule any of them before execution.

### Locked Decisions

**Credentials and trust**
- The deploy role gains customer-managed deploy policies in `infra/modules/github-oidc`, one per concern under `/openvaa/`, each under the 6,144-character limit:
  - network: EC2, tag-conditioned on `Project=openvaa`/`Root=aws`;
  - load balancing;
  - ECS, by name `openvaa-staging-*`;
  - edge: CloudFront, and ACM in both regions, tag-conditioned;
  - DNS: record changes in the staging zone only;
  - observability: the log group, the SNS topic and the EventBridge rule, by name;
  - scaling;
  - `iam:PassRole` on `openvaa-staging-frontend-execution` with `iam:PassedToService = ecs-tasks.amazonaws.com`;
  - `sns:Publish` on `openvaa-staging-frontend-deployments`.

  No IAM create, put, attach or delete. Checked offline by `terraform test`, and on AWS by the policy simulator before the first pipeline apply. The pipeline plans and applies the whole `infra/envs/staging/aws` root.
- The numeric id conditions are set (`github_repository_id = "546467466"`, `github_repository_owner_id = "115159211"`). The plan trust is not pinned to a workflow, and that remainder is recorded as an accepted risk. If the first credentialed run shows AWS does not evaluate the id claims, the two lines are removed by one hand apply.
- Pull-request plans run with `-lock=false`, and the `plan_lock` policy and its attachment are removed (closes AR-183-02 / WR-04).
- Two GitHub Environments:
  - `staging`: required reviewer the operator, self-review allowed, custom deployment branch policy `deploy/staging` and `deploy-evidence/*` only.
  - `staging-destroy`: same reviewer and branch policy, no secrets. Its subject `repo:OpenVAA/voting-advice-application:environment:staging-destroy` is added to `deploy_subjects`.

  `infra/README.md` § Prerequisites ("default branch only") is corrected. The settings are read back with `gh api` GETs.
- Secrets and variables:
  - Environment secrets of `staging` only: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD`, `ALERT_EMAIL` (the same address the stack's subscription uses).
  - Environment variables: `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`.
  - Repository: variable `AWS_PLAN_ROLE_ARN`, and secret `ALERT_EMAIL` for the PR plan.
  - The service-role key is in no workflow and no secret.
- Fork pull requests: every credentialed job carries `if: github.event.pull_request.head.repo.full_name == github.repository`. Workflows never use `pull_request_target`.

**Triggers and workflow shape**
- Before the merge, every observed run is fed by a source-only commit built with a temporary index (the `ci-evidence` recipe: `read-tree HEAD`, `rm --cached .planning`, `write-tree`, `commit-tree -p origin/main`). It is pushed to `deploy-evidence/187-<name>` and, once green, to `deploy/staging`. Each push is an operator checkpoint. After the milestone merges, `deploy/staging` is fast-forwarded to a `main` commit.
- Three new workflow files, `main.yaml` untouched:
  - `infra-plan.yml`: pull requests to any base touching `infra/**` or the workflow, and `deploy-evidence/**` pushes. A no-credential job runs fmt, validate and the example mock plans; a credentialed same-repository job plans the staging AWS root.
  - `deploy.yml`: push to `deploy/staging`, push to `deploy-evidence/**`, `workflow_dispatch`.
  - `destroy.yml`.

  Actions are pinned by commit SHA with the tag in a comment. Every job sets `permissions` explicitly, and `id-token: write` appears only where a role is assumed.
- `deploy.yml` and `destroy.yml` share the concurrency group `staging-aws` with `cancel-in-progress: false`. The deploy job's `timeout-minutes` is set well above the longest observed apply.
- PR plans are observed through a draft pull request from a source-only branch into a source-only base branch (`deploy-evidence/187-base`), then closed. The plan is printed with `terraform show -no-color` to the log and the step summary. The plan file stays in `$RUNNER_TEMP` and is never uploaded.

**The deploy run**
- The task's image is `"${registry_url}@${image_digest}"`. A required `image_digest` variable (`^sha256:[0-9a-f]{64}$`, no default, not in tfvars) replaces `image_tag` in the module, the staging root and the example root. The ECR tag and `BUILD_SHA` stay the commit id. The deploy job passes the digest it pushed; PR plans and hand plans pass the digest the ECS service runs now. The staging AWS runbook's apply steps are rewritten for it.
- CR-01 is fixed before any runner builds: `build-push-image.sh` builds from a `git archive HEAD` context in a temporary directory, with a self-test that plants an ignored file and shows it absent. The build runs natively on `ubuntu-24.04-arm`, before `yarn install` in the job.
- One gated job in `staging`, in this order:
  1. build, push, digest;
  2. `terraform plan` with that digest, saved in `$RUNNER_TEMP`;
  3. migrations;
  4. functions;
  5. `terraform apply` of the saved plan;
  6. wait until stable;
  7. smoke run.

  A failed step stops the rest. A no-credential job before the gate runs fmt, validate and the infra unit tests.
- `push-migrations.sh` gains `--confirmed-ref <ref>`, accepted only when it equals `--ref`, `GITHUB_ACTIONS=true` and `GITHUB_ENVIRONMENT=staging`; anything else exits 2 as today. The job links a temporary work directory (never `apps/supabase`), connects through the session pooler (`SUPABASE_POOLER_HOST`, user `postgres.<ref>`, port 5432), and runs the drift check on the runner's Docker.
- Functions: `supabase functions deploy --project-ref <ref> --workdir <linked dir>` for all three. The Management API list must then show three `ACTIVE`, with `verify_jwt` as `config.toml` says. Function secrets are not touched.
- After the apply, a step fails unless the service's primary deployment names the task definition just applied, `rolloutState = COMPLETED`, and the running count is at least the floor.

**Smoke stage and alerts**
- The last step runs `yarn test:e2e:deployed` with `SMOKE_EXPECTED_SHA` = the built commit and the two contestant secrets, no service-role key in its environment, and its exit status read directly. The observed green run waits for plan 186-08's hosted contestant; there is no switch that skips the contestant spec.
- A final step of the gated job, `if: failure()`, publishes one message to the SNS topic `openvaa-staging-frontend-deployments`, naming the failed stage, the commit and the run URL. The rollout alert's 185-16 observation stands while its resources are unchanged; the pipeline alert is seen once by the red run.
- The red run is one source-only `deploy-evidence/187-red` push of a commit whose frontend build fails on purpose ("a type error in one route", never merged). It must stop at the build step, before any hosted write, exit red, and the alert mail must arrive. Then comes the green run of the unbroken commit. Run URLs, step conclusions and the mail's arrival time are recorded.

**The example environment**
- Each example root gets a `terraform test` with `mock_provider` blocks and `command = plan`, run by the no-credential job on every pull request, printing the planned addresses and asserting the production-shaped variables (floor 2, ceiling 4, two zones).
- "Never applied" rests on three guards: the stand-in account id, the deploy role's single state key, and a unit test that fails when a workflow runs `apply` or `destroy` anywhere but `infra/envs/staging/aws`.

**The destroy path**
- `destroy.yml` is triggered by `workflow_dispatch` (input `confirm` must equal `destroy staging aws`) and by a push to the one branch `deploy-evidence/destroy-staging`. It has one job, in `staging-destroy`, which:
  1. shows the Supabase root is out of reach: `terraform -chdir=infra/envs/staging/supabase init` with the deploy role must be refused on `hand/staging/supabase/terraform.tfstate`, and the step fails if it succeeds;
  2. runs `plan -destroy` of `infra/envs/staging/aws` only, refusing unless every address is under `module.frontend` and the count equals the resources in state;
  3. applies that saved plan.

  A unit test fails if the workflow names a Supabase secret or another root.
- The real destroy runs once, after the INFRA-13 cost read (on or after 2026-11-23), followed by a pipeline deploy from nothing. The operator confirms the new SNS subscription at that checkpoint. Until then the path is shown by its Supabase-root refusal and `plan -destroy`, in an evidence run that stops before the apply.

**Proofs, records and carried debts**
- Wrong-subject refusal: a job in `infra-plan.yml`, only on `deploy-evidence/**` pushes and with no environment, asks for the deploy role and passes only when the assume call is refused, printing the error code. A second step asks for the plan role from a push, which must also be refused.
- "A push to main deploys nothing": there is no `main` trigger, the environment branch policy refuses `main` (read back), and a unit test fails if a deploy or destroy `push` trigger can match `main`. No push to `main` in this phase.
- `secret-scan` is diagnosed from its job log on the first evidence run and fixed, or its findings recorded as accepted. `infra-validate` is observed on the final tree in the same run. `dependency-audit` is read once and, unless caused by this workstream's files, becomes a dated todo for phase 189.

### Claude's Discretion (decided autonomously in CONTEXT.md)
- Local workflow validation: actionlint at a pinned version through its published container image, a root script `lint:workflows`, and vitest guard tests in `infra/scripts/` (run by `yarn test:unit:infra`). The tests assert triggers, environments, permissions, SHA-pinned actions, no `pull_request_target`, no `upload-artifact`, no service-role name, and the C-03 step order.
- Documentation:
  - a new `infra/README.md` section "The deploy pipeline";
  - pointers from the hand runbooks;
  - dated rows in the Observations tables of the staging AWS and bootstrap runbooks;
  - raw evidence in `187-*/evidence/`.
- E2E gate: targeted checks in plans, then one full local run through `tests/scripts/e2e-run.sh` at phase end, with the unit, lint and format gates; a void run is made again.
- `build-push-image.sh` is the build step. Exit 3 (tag already pushed) is read as "take the digest it prints and continue".
- Versions: Terraform 1.16.5 through `hashicorp/setup-terraform` with `terraform_wrapper: false`; the Supabase CLI from `node_modules/.bin` after `yarn install`.
- The plan is printed with `terraform show -no-color` to the log and the step summary.
- Failure alert format: the subject names the environment and the failed stage; the body names the commit, the trigger and the run URL; no secret and no address.
- After a real destroy: the state holds no resource, the Supabase root plan is "No changes", and the conformance probe passes.

### Deferred Ideas (OUT OF SCOPE)
- FUT-10: rollback to the previous task definition when the smoke run fails.
- Pinning the plan trust to a workflow (`job_workflow_ref`).
- Narrowing the plan role's `ReadOnlyAccess` remainder (AR-183-01).
- The `dependency-audit` CI failure, unless caused by this workstream's files: a dated todo for phase 189.
- The first push to `main` after the merge: phase 189.
- 185 review warnings WR-01 to WR-06.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PIPE-01 | OIDC, read-only plan role, deploy role bound to the repo and one Environment; a wrong-subject token is seen refused | The numeric-id claims are documented condition keys (§ Credentials). Wrong-subject proof by a raw `sts assume-role-with-web-identity` (Code Examples). `docs.yml` already requests `id-token: write`, so the "id-token only where a role is assumed" guard must cover the three new files only |
| PIPE-02 | A PR runs fmt, validate and plan, and the plan is readable in the run | The PR plan job uses the plan role with `-lock=false` and the running digest resolved from ECS/ECR (Pattern 4). The plan role reads the pipeline state through `ReadOnlyAccess` |
| PIPE-03 | A fork PR gets no credentials, and its credentialed jobs skip visibly | A job-level `if:` on `head.repo.full_name`; `pull_request` only. Secondary sources say GitHub never issues an OIDC token to a fork run |
| PIPE-04 | Apply only behind an Environment gate; serialised; never cancelled mid-run | Environment secrets are withheld until approval (cited). Concurrency `single` queue semantics (cited). Credential lifetime versus `timeout-minutes` (Pitfall 8) |
| PIPE-05 | Built once, pushed, deployed by digest | ECS accepts `repository-url/image@digest` (cited). `ecr:DescribeImages` must be added. Exit 3 prints `tag_exists=yes image_digest=<d>` on one line |
| PIPE-06 | Fixed order: migrations, functions, rollout, wait until stable | One gated job. `--confirmed-ref` keyed on an environment variable. `psql` installed on arm64. The primary-deployment check after apply |
| PIPE-07 | The smoke run fails the pipeline | `yarn test:e2e:deployed` with `SMOKE_EXPECTED_SHA=${{ github.sha }}`. Playwright output stays on the runner |
| PIPE-08 | A guarded destroy removes the AWS stack and cannot reach the Supabase root | `terraform init` reads state (`RefreshState`, verified in the v1.16.5 source), so a denied `GetObject` fails `init`. Pass `image_digest` explicitly. The push trigger needs a stop-before-apply mechanism (Open Question 1) |
| PIPE-09 | One green and one red run recorded, the red from a broken build | The red commit must fail `vite build` (an unresolvable import), proven locally first. Running it first exercises the credentials, ECR, SNS publish and the refusal job with no hosted write |
| PIPE-10 | A push to the per-environment branch deploys; dispatch and `deploy-evidence/**` also apply; `main` does not | Branch filters with a `!` exclusion (cited). The environment branch policy is matched against `GITHUB_REF`, and `*` does not cross `/` (cited) |
| INFRA-16 | Alerts when a deployment or build fails or rolls back; each seen once | The `if: failure()` SNS publish, using the deploy role's identity policy. The rollout alert was already observed (185-16) |
| INFRA-19 | The example env is validated and planned in CI, never applied | Mock plans of all three example roots were run here (Code Examples) |
| SUPA-08 | Secrets only in the pipeline environment and in state; bucket hardened; no plan uploaded | Environment secrets. No `upload-artifact` in the new files. `secret-scan` diagnosed in this session (§ Carried CI debts) |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- E2E is the cardinal rule. A failing or "did not run" test is a failure, and a void run (exit 8, `VOID-host-suspend.txt`) is made again. Standing rule of 2026-11-09: targeted projects inside plans, then one full suite run at phase end. Run E2E through `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`.
- Never commit secrets or `.env` files. No secret in tfvars (infra/README.md § Rules of every apply).
- Read exit statuses on the next line, never through a pipe (infra/README § Rules; memory note "Never read a gate's status through a pipe").
- IAM is written only by roots no workflow applies, and only as customer-managed policies under `/openvaa/`. `yarn assert:no-inline-iam-policies` is a link of `lint:check`.
- Comment hygiene (no historical narrative, no `.planning` references, nothing addressed to the reviewer) is gated for `apps/`, `packages/` and `tests/` [VERIFIED: scripts/assert-comment-hygiene.mjs:195 `const SCAN_ROOTS = ['apps', 'packages', 'tests'];`]. `infra/` and `.github/` are outside the gate, but the same style is the convention.
- TypeScript strict, no `any`. Check the code review checklist (`.agents/code-review-checklist.md`).
- Gates: `yarn test:unit`, `yarn lint:check`, `yarn format:check`. `yarn test:unit` needs the shared local stack running, because the dev-seed integration test reads `SUPABASE_URL` (memory note).
- Executors: background long gates and poll (the 600 s watchdog); ignore the "CONTEXT WARNING" hook line.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Identity federation (OIDC → STS) | AWS IAM (bootstrap root, hand-applied) | GitHub token issuer | Trust and permissions live where no workflow can write them |
| Gate, branch guard, secret custody | GitHub Environment settings | — | Repository settings, not code; read back with `gh api` |
| Build once, push, digest | CI runner (arm64) + ECR | `build-push-image.sh` | The script owns the refusals and the `name=value` contract |
| Schema migrations, drift check | Supabase hosted DB via the CLI on the runner | runner Docker (shadow DB) | `push-migrations.sh` owns the refusals and exit codes |
| Edge Functions deploy | Supabase Management API via the CLI | — | Secrets stay with the hand-applied Supabase root |
| Frontend rollout | Terraform → ECS (pipeline root) | CloudFront/ALB unchanged | A task-definition replacement plus `wait_for_steady_state` |
| Post-deploy proof | Playwright smoke on the runner, against the CDN | `/api/health` build SHA | Read-mostly; no service-role key |
| Alerting | SNS topic (frontend-service module) | EventBridge rule (rollout) | One confirmed subscription serves both alerts |
| Example env "planned" | `terraform test` with mock providers (no credentials) | — | The stand-in account makes a real plan impossible |

## Standard Stack

### Core (workflow actions, pinned by SHA)

| Action | Version | SHA (resolved this session) | Purpose |
|---|---|---|---|
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` | The same SHA `infra-validate` pins [VERIFIED: .github/workflows/main.yaml:774 `uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7`; `gh api` tag → commit] |
| `hashicorp/setup-terraform` | v4.0.1 | `dfe3c3f87815947d99a8997f908cb6525fc44e9e` | [VERIFIED: main.yaml:779; `gh api`] |
| `aws-actions/configure-aws-credentials` | v6.3.0 (2026-09-15) | `e1253824e5c10ff9df46874f81ed3ec929e19cfd` | OIDC assume. `using: node24`. Inputs include `role-to-assume`, `aws-region`, `role-session-name`, `role-duration-seconds`, `allowed-account-ids`, `disable-retry`, `mask-aws-account-id` [VERIFIED: `gh api` action.yml at v6.3.0] |
| `actions/setup-node` | v7.1.0 | `949feb2413d6458794dcd2491c4babbbce0c15c1` | Node 24.21.0, as main.yaml uses [VERIFIED: `gh api`] |
| `threeal/setup-yarn-action` | v2.0.0 | `ec8c075e62bc497968de40011c2b766f5e8f1ac5` | Yarn 4.18. **It runs `yarn install` itself** (main.yaml:336-337 comment). Place it after the build step [VERIFIED: `gh api`; main.yaml:336-349] |

### Tools

| Tool | Version | Purpose |
|---|---|---|
| Terraform | 1.16.5 | Pinned [VERIFIED: infra/.terraform-version] |
| Supabase CLI | 2.118.0 | `node_modules/.bin/supabase` [VERIFIED: node_modules/supabase/package.json `"version": "2.118.0"`] |
| actionlint | 1.7.12 (2026-03-30), image `rhysd/actionlint:1.7.12`, repo digest `sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667` | Ran locally in this session. The image carries shellcheck 0.11.0 [VERIFIED: `docker pull`/`inspect`/`run`] |
| `js-yaml` | 5.4.2 (catalog) | YAML parse for the workflow guard tests. Already in the lockfile through `packages/llm`; add `"js-yaml": "catalog:"` to root `devDependencies` rather than relying on hoisting. It ships its own types [VERIFIED: .yarnrc.yml:44 `js-yaml: ^5.4.2`; node_modules/js-yaml/package.json `"types": "./dist/js-yaml.d.ts"`] |

**Runner labels:** `ubuntu-24.04-arm` for the deploy and destroy jobs, `ubuntu-24.04` for the others. Do not use `ubuntu-latest`: a run of this repository on 2026-11-13 carried the notice "The ubuntu-latest label will migrate to Ubuntu 26 beginning October 19, 2026" [VERIFIED: check-run annotations of run 43405262494].

**actionlint baseline:** `main.yaml` already fails actionlint (one SC2129 style finding at main.yaml:430) [VERIFIED: local run, exit 1]. `lint:workflows` must therefore name the three new files explicitly:

```bash
docker run --rm -v "$PWD:/repo:ro" -w /repo \
  rhysd/actionlint@sha256:b1934ee5f1c509618f2508e6eb47ee0d3520686341fec936f3b79331f9315667 \
  -no-color .github/workflows/infra-plan.yml .github/workflows/deploy.yml .github/workflows/destroy.yml
```

Use `-no-color`. `-color=never` is a parse error [VERIFIED: local run].

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| js-yaml | npm | 13+ yrs (5.5.0 published 2026-10-15) | ~390M/wk | github.com/nodeca/js-yaml | OK (no postinstall) | Approved. Pin through the existing catalog (`^5.4.2`); it adds nothing to the lockfile |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.
No other new package. The actions above come from official GitHub, HashiCorp and AWS organisations, and the established `threeal/setup-yarn-action`, which `main.yaml` already uses.

## Architecture Patterns

### System Architecture Diagram

```
push deploy/staging | push deploy-evidence/<name> (≠ destroy-staging) | workflow_dispatch (default branch only)
        │
        ▼
 deploy.yml ── concurrency staging-aws (cancel-in-progress: false, single pending)
        │
        ├─ job checks (ubuntu-24.04, no credentials): fmt → validate → yarn test:unit:infra
        │        │ needs
        ▼        ▼
 job deploy (ubuntu-24.04-arm, environment: staging) ── waits for reviewer ── secrets released on approval
   1 checkout (persist-credentials:false)
   2 configure-aws-credentials (deploy role, OIDC sub = repo:…:environment:staging)
   3 build-push-image.sh ──► ECR (describe-images → build from git archive → push → digest)
        │ exit 0 or 3 → digest
   4 setup-terraform · init · plan -var image_digest=<d> -out=$RUNNER_TEMP/tfplan · show -no-color → log + summary
   5 setup-node / setup-yarn (yarn install) · apt install postgresql-client
   6 link temp workdir · push-migrations.sh --confirmed-ref ──► Supabase DB (session pooler 5432) ──► drift check (runner Docker)
   7 functions deploy ──► Supabase Management API · read back 3 ACTIVE + verify_jwt
   8 (re-assume credentials) · terraform apply $RUNNER_TEMP/tfplan ──► ECS rollout (wait_for_steady_state, circuit breaker)
   9 describe-services: PRIMARY == applied task def, COMPLETED, running ≥ floor
  10 playwright install chromium · yarn test:e2e:deployed ──► https://staging.openvaa.org (/api/health build == github.sha)
  11 if failure(): sns publish ──► openvaa-staging-frontend-deployments ──► operator mailbox

 pull_request (any base; infra/** or the workflow) ─► infra-plan.yml
   job checks (no credentials): fmt, validate, example mock plans (terraform test -verbose)
   job plan (same-repo only; plan role, sub = repo:…:pull_request): running digest ← ECS/ECR → plan -lock=false → show
 push deploy-evidence/** ─► infra-plan.yml job wrong-subject (no environment): deploy role and plan role must both be refused

 push deploy-evidence/destroy-staging | dispatch(confirm) ─► destroy.yml (environment: staging-destroy, no secrets)
   init of the Supabase root must fail (AccessDenied on hand/…) → plan -destroy (aws root only) → guard addresses/count → apply
```

### Recommended file layout

```
.github/workflows/
├── infra-plan.yml        # PR plans + example mock plans + wrong-subject proof
├── deploy.yml            # the gated deploy
└── destroy.yml           # the guarded destroy
infra/modules/github-oidc/
├── deploy-policies.tf    # new: one aws_iam_policy per concern + per-role attachments
├── variables.tf          # + execution_role_arn, staging_zone_id, alert_topic_name, … (all strings)
└── tests/github_oidc.tftest.hcl   # new; picked up by infra-validate's module loop automatically
infra/envs/example/{aws,dns-mail,supabase}/tests/plan.tftest.hcl   # new; NOT reached by infra-validate's loop (modules only)
infra/scripts/
├── workflows.test.ts     # new guard tests (js-yaml)
├── push-migrations.test.ts  # new: --confirmed-ref refusals
└── build-push-image.sh/.test.ts  # CR-01 + new self-test case
```

### Pattern 1: Deploy-role policies as data documents with string inputs

**What:** Each concern is a `data "aws_iam_policy_document"` → `aws_iam_policy` (under `var.iam_path`) → `aws_iam_role_policy_attachment` to `aws_iam_role.deploy`. This is the same per-concern pattern as `policies.tf` [VERIFIED: infra/modules/github-oidc/policies.tf:1-15, 170-195].

**Inputs:** all resource names and ARNs come in as variables, because bootstrap "reads no other root's state" [VERIFIED: infra/bootstrap/main.tf:34-35]:
- the execution role ARN, from `module.frontend_task_role.execution_role_arn` in bootstrap;
- the staging hosted zone id, a new non-secret tfvars value copied from the dns-mail root's `zone_id` output;
- the ECS, ELB, log group, SNS and rule names.

**Why string inputs matter for tests:** policies built only from known strings are known at plan time, so `terraform test` with `command = plan` can assert on `aws_iam_policy.<x>.policy`. This was verified in this session with a real `aws` provider configured offline (`skip_credentials_validation`, `skip_requesting_account_id`, `skip_metadata_api_check`, fake keys). The ECR policy's actions were asserted at plan time and the run passed. The trust policies, by contrast, depend on the OIDC provider's ARN, a resource attribute, and stayed unknown at plan time even with `override_resource … override_during = plan` [VERIFIED: local probe]. Assert the numeric ids on the tfvars (vitest) or on the inputs, not on `assume_role_policy`.

**Names the policies must name** [VERIFIED: infra/modules/frontend-service/main.tf:54 `name               = "${var.name_prefix}-${var.environment}"`; service.tf:2 `name = local.name`; service.tf:6 `name              = "/openvaa/${var.environment}/frontend"`; service.tf:13 `family                   = "${local.name}-frontend"`; service.tf:85 `name                               = "${local.name}-frontend"`; alerts.tf:6 `name = "${local.name}-frontend-deployments"`; alerts.tf:11 `name        = "${local.name}-frontend-deployment-failed"`; origin.tf:53 `name                       = local.name`; origin.tf:67 `name                 = "${local.name}-frontend"`; scaling.tf:13 `name               = "${local.name}-frontend-cpu"`; infra/envs/staging/aws/terraform.tfvars:12 `name_prefix        = "openvaa"`, :10 `environment    = "staging"`, :15 `execution_role_arn = "arn:aws:iam::471112560111:role/openvaa/openvaa-staging-frontend-execution"`]. With `openvaa`/`staging` they evaluate to:

| Resource | Name |
|---|---|
| Cluster | `openvaa-staging` |
| Service | `openvaa-staging-frontend` |
| Task family | `openvaa-staging-frontend` |
| Log group | `/openvaa/staging/frontend` |
| Topic | `openvaa-staging-frontend-deployments` |
| Rule | `openvaa-staging-frontend-deployment-failed` |
| Load balancer | `openvaa-staging` |
| Target group | `openvaa-staging-frontend` |
| Scaling policy | `openvaa-staging-frontend-cpu` |

**Action catalogue per concern:** [ASSUMED, from training. Confirm with the CloudTrail cross-check and the simulator at H1.] Two entries are documented: the Application Auto Scaling caller needs `cloudwatch:PutMetricAlarm`, `DescribeAlarms` and `DeleteAlarms` plus `ecs:DescribeServices` and `ecs:UpdateService` [CITED: docs.aws.amazon.com/autoscaling/application/userguide/security_iam_id-based-policy-examples.html, "ECS services"].

- **Reads (refresh).** Service-wide read wildcards:
  - `ec2:Describe*` and `ec2:GetManagedPrefixListEntries`
  - `elasticloadbalancing:Describe*`
  - `ecs:Describe*` and `ecs:List*`
  - `cloudfront:Get*` and `cloudfront:List*`
  - `acm:DescribeCertificate` and `acm:ListTagsForCertificate`, in both regions
  - `route53:GetHostedZone`, `route53:ListHostedZones*`, `route53:ListResourceRecordSets`, `route53:GetChange` and `route53:ListTagsForResource`
  - `logs:DescribeLogGroups` and `logs:ListTagsForResource`
  - `sns:GetTopicAttributes`, `sns:GetSubscriptionAttributes`, `sns:ListSubscriptionsByTopic` and `sns:ListTagsForResource`
  - `events:DescribeRule`, `events:ListTargetsByRule` and `events:ListTagsForResource`
  - `application-autoscaling:Describe*`
  - `cloudwatch:DescribeAlarms`

  Never add `logs:Get*`, `s3:*`, `ssm:*` or `secretsmanager:*`: the deploy role must stay unable to read `hand/` state, and PIPE-08 rests on that.
- **ECR:** add `ecr:DescribeImages` on the repository ARN, in the existing `ecr_push` policy.
- **ECS:**
  - `RegisterTaskDefinition`, `DeregisterTaskDefinition` and `DescribeTaskDefinition` on resource `*` (no resource-level support);
  - `ecs:TagResource` on `task-definition/openvaa-staging-frontend:*`, the cluster and the service;
  - `Create/Update/DeleteService` on `service/openvaa-staging/openvaa-staging-frontend`;
  - `Create/DeleteCluster` on `cluster/openvaa-staging`;
  - `iam:PassRole` on the execution role ARN with `iam:PassedToService = ecs-tasks.amazonaws.com`.
- **Scaling:**
  - `application-autoscaling:RegisterScalableTarget`, `DeregisterScalableTarget`, `PutScalingPolicy`, `DeleteScalingPolicy`, `PutScheduledAction`, `DeleteScheduledAction`, `TagResource` and `ListTagsForResource`;
  - `cloudwatch:PutMetricAlarm` and `cloudwatch:DeleteAlarms`, which target tracking creates in the caller's name.
- **Edge, DNS, network, LB, observability:** create, modify, delete and tag actions for each resource the root declares. **DNS:** `route53:ChangeResourceRecordSets` on `hostedzone/<staging_zone_id>`, narrowed with `route53:ChangeResourceRecordSetsRecordTypes` (A, AAAA, CNAME) and `…NormalizedRecordNames`. The staging zone also holds the dns-mail root's DKIM, MX, SPF and DMARC records, which the deploy role must not be able to change [ASSUMED key names].
- **Alert:** `sns:Publish` on the topic ARN.

**Note:** the quota is "Managed policies per role" 20 by default, 25 at most, and a managed policy is limited to 6,144 characters with white space not counted [CITED: docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html]. Two existing policies plus nine new ones fit. Assert `length(replace(policy, "/\\s/", "")) <= 6144` in the module test.

### Pattern 2: An environment-scoped variable instead of `GITHUB_ENVIRONMENT`

GitHub does not set `GITHUB_ENVIRONMENT`, and a configuration variable "Must not start with the `GITHUB_` prefix" [CITED: docs.github.com/en/actions/reference/workflows-and-actions/variables]. Recommend:
- an environment variable `DEPLOY_ENVIRONMENT=staging`, created in the `staging` environment only (H3);
- the job exports `OPENVAA_DEPLOY_ENVIRONMENT: ${{ vars.DEPLOY_ENVIRONMENT }}`;
- `--confirmed-ref` accepts only when `GITHUB_ACTIONS=true` and `OPENVAA_DEPLOY_ENVIRONMENT=staging` and the value equals `--ref`.

An environment variable resolves only inside a job that references that environment, so the value is evidence of the gate, though not proof. **This changes the wording of a locked decision (C-04): flag it to the operator.**

Put the `--confirmed-ref` check in the refusals block, before the CLI runs. It then stays a pure exit-2 refusal, testable by vitest `spawnSync` without stubbing the CLI. The accepted path (push without a tty) still needs a stubbed CLI. Either add a `--self-test` mode in the `build-push-image.sh` style, where `CLI` and `DRIFT_CHECK` become shell functions (bash can background a function under `run_child`), or cover it on the runner only. `push-migrations.sh` currently has no self-test and no `.test.ts` [VERIFIED: ls infra/scripts]. Today the tty refusal sits at push-migrations.sh:313-315: `if ! (: <>/dev/tty) 2>/dev/null; then` / `fatal "there is no terminal to confirm the push on; nothing was pushed" 2`.

### Pattern 3: Build-step output parsing

Exit 0 prints two lines, `image_tag=<sha>` and `image_digest=<d>`. Exit 3 prints **one** line, `tag_exists=yes image_digest=<d>` [VERIFIED: build-push-image.sh:236 `echo "tag_exists=yes image_digest=$digest"`; :260-261]. Parse with `sed -n 's/.*image_digest=\(sha256:[0-9a-f]\{64\}\).*/\1/p'`, read the status on the next line, and accept 0 and 3. Use the `refused=`/`failed=` line for the alert stage text.

### Pattern 4: The running digest for PR and hand plans

The service's current task definition was registered with a **tag**: `service.tf:28` reads `image        = "${var.registry_url}:${var.image_tag}"` [VERIFIED]. Its `image` string therefore holds no digest until the first digest-based apply. Resolve the digest in this order:
1. If the task definition's image contains `@sha256:`, take it.
2. Otherwise take the tag and `aws ecr describe-images --image-ids imageTag=<tag>` → `imageDigest`. The plan role has this through `ReadOnlyAccess`.

**Consequence:** the first plan after the change shows the task definition **replaced**, because the image string changes from `:tag` to `@digest`, and the service updated. That is a no-op rollout of the same image. `infra/README.md` says the first workflow run "must be a plan that shows no change" [VERIFIED: infra/README.md:60-61]. Rewrite that sentence, or record the expected `1 to add, 1 to change, 1 to destroy` limited to those two addresses.

### Pattern 5: Fork skip and token permissions

```yaml
permissions: {}                        # repo default is write
jobs:
  plan:
    if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository
    permissions: { contents: read, id-token: write }
```

"If you specify the access for any of these permissions, all of those that are not specified are set to `none`" [CITED: docs.github.com workflow-syntax].

### Anti-Patterns to Avoid
- **Naming a PR base or head `deploy-evidence/…`.** Each push of it starts a gated `deploy.yml` run. Name them `pr-evidence/187-base` and `pr-evidence/187-head`, which no workflow's push trigger matches (`main.yaml` triggers on `main` and `ci-evidence/**` only) [VERIFIED: main.yaml:3-36]. The base can be `origin/main` itself. For `pull_request`, the workflow comes from the merge commit, so the base needs no workflow file. This overrules the branch name in B-04, so flag it.
- **Workflow-level `id-token: write`.** Grant it per job.
- **Interpolating `${{ secrets.* }}` or event text into `run:`.** Pass secrets through `env:` (script injection, secret echo).
- **`terraform show -json` to the log.** The JSON plan holds sensitive values in clear text. Use it only in `$RUNNER_TEMP` through `jq`.
- **A `paths` filter on `deploy.yml`.** "the workflow will only run when both filters are satisfied" [CITED: workflow-syntax], so a docs-only evidence commit would produce no run.
- **Writing `DEV_SEED_ALLOW_REMOTE`, `allow-remote` or `allowRemote` anywhere under `.github/`, comments included.** `deployedSmokeGuards.test.ts` scans every file there [VERIFIED: tests/tests/utils/deployedSmokeGuards.test.ts:20-23 `const REMOTE_SEED_SWITCH = /DEV_SEED_ALLOW_REMOTE|allow-remote|allowRemote/;`]. The same applies to a `SERVICE_ROLE` mention if the new guard scans text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OIDC assume for normal steps | curl the token endpoint and call STS | `aws-actions/configure-aws-credentials` | Masking, retries, cleanup, `allowed-account-ids`. The one exception is the wrong-subject proof, where the raw CLI error code is the evidence |
| Workflow linting | regex checks of YAML | actionlint (container) + js-yaml structural tests | Expression, runner-label and shellcheck coverage |
| Example "plan" without an account | an override file swapping the account | `terraform test` + `mock_provider`/`override_*` | Verified working; no credentials, no backend |
| Serialising applies | lock-polling loops | `concurrency` + Terraform's own lock | The documented FIFO, single-pending semantics |
| Waiting for ECS | a sleep loop | `wait_for_steady_state` + one `describe-services` assertion | Terraform already waits; one read proves the outcome |
| Ignored files out of the build context | a refusal list of ignored paths | `git archive <sha> \| tar -x` into `$WORK/context` | Proves "the image is the commit" by construction (185 CR-01 fix text) |

## Runtime State Inventory

The change is a refactor of `image_tag` to `image_digest` and of the deploy role's permissions.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Terraform state at `pipeline/staging/aws/terraform.tfstate` holds the task definition with image `…:712947a1…` (a tag). ECR holds the tag `712947a1…`, immutable | No migration. The first digest apply replaces the task definition (a rollout of the same image). ECR is unchanged |
| Live service config | GitHub: no `staging` or `staging-destroy` environment exists (30 environments, none of them these) [VERIFIED: `gh api …/environments`]. OIDC subject customisation `use_default: true`, `use_immutable_subject: false`, `sub_claim_prefix: repo:OpenVAA/voting-advice-application` [VERIFIED: `gh api …/actions/oidc/customization/sub`] | H2 and H3 create the settings. Opting into the immutable subject would break both trusts (main.tf:19-22 comment) |
| OS-registered state | None. Runners are ephemeral | None |
| Secrets/env vars | `TF_VAR_alert_email` is required by the staging AWS root and is sensitive [VERIFIED: infra/envs/staging/aws/variables.tf:105-109]. The hand runbooks read `image_tag` from tfvars (`envs/staging/aws/README.md`, 14 hits) and `tests/README.md` cites `image_tag` as the source of `SMOKE_EXPECTED_SHA` (2 hits) [VERIFIED: `git grep image_tag`] | Docs edits: the runbook's apply and destroy steps resolve the running digest (Pattern 4). `tests/README.md` names the commit id as the source |
| Build artifacts | None (no installed artifact carries `image_tag`) | None |

## Common Pitfalls

### Pitfall 1: The deploy role lacks `ecr:DescribeImages`
**What goes wrong:** the build step prints `failed=describe-images` on the first runner run.
**Why:** the existing ECR policy lists only `"ecr:CompleteLayerUpload", "ecr:UploadLayerPart", "ecr:InitiateLayerUpload", "ecr:BatchCheckLayerAvailability", "ecr:PutImage", "ecr:BatchGetImage"` and `ecr:GetAuthorizationToken` [VERIFIED: policies.tf:67-74, 82].
**Avoid:** add it to `ecr_push`, and assert it in the module test.

### Pitfall 2: `psql` missing on `ubuntu-24.04-arm`
**Avoid:** `sudo apt-get install -y --no-install-recommends postgresql-client` before `push-migrations.sh`. Ubuntu 24.04 ships client 16. The history query `psql -X -At -c` against the PG17 server is a plain select [ASSUMED compatible; observe on the first run]. The alternative is the PGDG apt repository for client 17.

### Pitfall 3: `GITHUB_ENVIRONMENT` never set
See Pattern 2. Without the change, the gated run would always exit 2 at migrations.

### Pitfall 4: A red run that is not red
A TypeScript type error passes `vite build`. Break it with `import '$lib/does-not-exist-187-red';` in one route, or with a Svelte syntax error, and prove it locally first. `git archive <red-sha> | tar -x` and a local `docker buildx build --target production` (native arm64 here) must fail at `RUN yarn workspace @openvaa/frontend build` [VERIFIED: apps/frontend/Dockerfile:56]. This is all local: build the commit object with `commit-tree` and push it only at H8.

### Pitfall 5: Branch globs versus the environment policy
In the workflow, `deploy-evidence/**` matches nested names. In the environment, "Wildcard characters will not match `/`" [CITED: docs.github.com deployments-and-environments]. A nested evidence branch would trigger the workflow, then be refused by the environment, and turn red without an alert. Keep evidence branch names flat, and add a negative pattern:

```yaml
on:
  push:
    branches: ["deploy/staging", "deploy-evidence/**", "!deploy-evidence/destroy-staging"]
```

"A matching negative pattern (prefixed with `!`) after a positive match will exclude the Git ref" [CITED: workflow-syntax].

### Pitfall 6: An auto-created, ungated environment
See Summary point 6. H2, with its read-back, must precede every push that carries `deploy.yml` or `destroy.yml`. Also deselect "Allow administrators to bypass configured protection rules": `can_admins_bypass` is `true` on every existing environment of the repository [VERIFIED: `gh api …/environments` keys include `can_admins_bypass`; all values `true`]. The REST page fetched does not document this field [CITED gap], so set it in the UI and read it back.

### Pitfall 7: `main.yaml` does not run on `deploy-evidence/**`
`secret-scan` and `infra-validate` are observed only on a `ci-evidence/**` push [VERIFIED: main.yaml:5-21]. G-03's "on the first evidence run" therefore needs one additional `ci-evidence/187-final` push (H4b), or a reading of the existing runs (§ Carried CI debts).

### Pitfall 8: Credential lifetime versus a long job
A role session defaults to one hour unless the role's maximum is raised [CITED: IAM quotas, "Role session duration"]. Estimated job time: build about 6 min (185: "exited 0 after about six minutes" on arm64), plus install, migrations with the shadow DB, functions, apply (185: create about 4 min, failed rollout about 7.5 min, destroy about 5 min), and smoke, so roughly 25-40 min. Set `timeout-minutes: 50` and re-run `configure-aws-credentials` right before `terraform apply`. A timeout or a manual cancel mid-apply can leave the S3 lock object held: document `terraform force-unlock` as a hand recovery.

### Pitfall 9: A saved plan goes stale
Apply of `$RUNNER_TEMP/tfplan` fails if the state serial changed between plan and apply. The concurrency group prevents this. Hand applies are the remaining risk: record "no hand apply of the AWS root while a run is pending".

### Pitfall 10: The destroy plan's variables
Terraform 1.16.5 refused a destroy plan with "No value for required variable" when the variable fed a resource outside state, and accepted one when it fed a resource in state [VERIFIED: local probe]. Do not rely on that subtlety. The destroy job passes:
- `-var image_digest=<running digest>`;
- `TF_VAR_alert_email=destroy-plan@example.invalid`, a placeholder that is never applied in destroy mode and passes the module's regex [VERIFIED: modules/frontend-service/variables.tf:249-252].

`staging-destroy` then needs no secret.

### Pitfall 11: The plan role can read the origin secret
`random_password.origin_verify` is in the pipeline state and in the CloudFront and ALB rule configuration [VERIFIED: origin.tf:46-50, edge.tf:85-88, origin.tf:111-116]. The plan role (`ReadOnlyAccess`) reaches both. CONTEXT's "the AWS root holds no secret value" is therefore inexact. Printing the plan stays safe because Terraform masks sensitive-derived values, but record this in AR-183-01's acceptance.

### Pitfall 12: An alert step that cannot run
With `if: failure()`, a timeout or a cancel produces no alert [ASSUMED]. Use `if: failure() || cancelled()`. After a real destroy and before the redeploy the topic does not exist, so a build failure in that window cannot alert. Record it.

## Code Examples

### Example roots planned with mocks (verified this session)

```hcl
# infra/envs/example/aws/tests/plan.tftest.hcl: the mock_provider "aws" and alias "us_east_1" blocks
# copy the defaults of infra/modules/frontend-service/tests/frontend_service.tftest.hcl:6-110
override_data {
  target = module.frontend.data.aws_availability_zones.available
  values = { names = ["eu-north-1a", "eu-north-1b"] }
}
variables {
  alert_email  = "alerts@example.org"
  image_digest = "sha256:0000000000000000000000000000000000000000000000000000000000000000"
}
run "example_root_plans_production_shaped" {
  command = plan
  assert {
    condition     = var.task_floor == 2 && var.task_ceiling == 4
    error_message = "The example root is not production-shaped: floor 2 and ceiling 4."
  }
  assert {
    condition     = length(module.frontend.public_subnet_ids) == 2
    error_message = "The example root does not span two zones."
  }
}
```

The probe passed with `terraform init -backend=false` then `terraform test`, and `terraform.tfvars` was loaded automatically. The probe ran against today's `image_tag` variable; the `image_digest` line applies after C-01. `terraform test -verbose` prints every planned address (17 for dns-mail).

```hcl
# infra/envs/example/supabase/tests/plan.tftest.hcl: the root's import block needs this
mock_provider "supabase" {}
override_resource {
  target = module.supabase.supabase_project.this
  values = { id = "abcdefghijklmnopqrst" }
}
variables {
  database_password = "stand-in-password-0000"
  smtp_user         = "stand-in-user"
  smtp_password     = "stand-in-password-0000"
}
run "plans" { command = plan }
```

Without the override, the run failed with "Cannot import resources from mock providers" [VERIFIED].

```hcl
# infra/envs/example/dns-mail/tests/plan.tftest.hcl: mail-ses compares var.aws_region with data.aws_region
mock_provider "aws" {
  mock_data "aws_region" {
    defaults = { region = "eu-north-1", name = "eu-north-1" }
  }
}
run "plans" { command = plan }
```

[VERIFIED: probe passed; without the mock_data the precondition failed with a random region string]

### The wrong-subject proof (no environment, push event)

```bash
set -uo pipefail
TOKEN=$(curl -sS -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
  "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=sts.amazonaws.com" | jq -r .value)
echo "::add-mask::$TOKEN"
printf '%s' "$TOKEN" > "$RUNNER_TEMP/oidc"
aws sts assume-role-with-web-identity --role-arn "$DEPLOY_ROLE_ARN" \
  --role-session-name wrong-subject --web-identity-token "file://$RUNNER_TEMP/oidc" \
  > /dev/null 2> "$RUNNER_TEMP/assume.err"
status=$?
rm -f "$RUNNER_TEMP/oidc"
code=$(sed -n 's/.*An error occurred (\([A-Za-z]*\)).*/\1/p' "$RUNNER_TEMP/assume.err")
echo "deploy_role_assume_status=$status deploy_role_error=${code:-none}"
test "$status" -ne 0 && test "$code" = AccessDenied
```

The job needs `permissions: { id-token: write }`. Its subject is `repo:OpenVAA/voting-advice-application:ref:refs/heads/deploy-evidence/<name>` ("only if the job doesn't reference an environment") [CITED: docs.github.com OIDC reference]. The expected `AccessDenied` code is [ASSUMED]; print whatever code comes back. The deploy role's ARN is a non-secret repository variable here, because the job has no environment. Add `AWS_DEPLOY_ROLE_ARN` at repository level too, or derive it (`arn:aws:iam::471112560111:role/openvaa/openvaa-staging-deploy`) [VERIFIED name parts: github-oidc/main.tf:116 `name               = "${var.name_prefix}-${var.environment}-deploy"`, path `/openvaa/`].

### The Supabase root is unreachable from the destroy job

`terraform init` refreshes state after initialising the backend, so an init with a denied `GetObject` fails with "Error refreshing state". This is verified in the Terraform v1.16.5 source: `internal/command/init_run.go:320-331`, `sMgr.RefreshState()` → `"Error refreshing state: %s"`. The refresh comes before provider installation, so a provider download error cannot masquerade as the refusal:

```bash
terraform -chdir=infra/envs/staging/supabase init -input=false -no-color \
  > "$RUNNER_TEMP/supabase-init.log" 2>&1
s=$?
echo "supabase_root_init_status=$s"
grep -q 'Error refreshing state' "$RUNNER_TEMP/supabase-init.log" \
  && grep -qE 'AccessDenied|403' "$RUNNER_TEMP/supabase-init.log"
r=$?
echo "supabase_root_refused=$([ "$s" -ne 0 ] && [ "$r" -eq 0 ] && echo yes || echo no)"
```

Pair it with `aws s3api head-object --bucket openvaa-tfstate-471112560111 --key hand/staging/supabase/terraform.tfstate`, which must fail with 403 [VERIFIED: infra/envs/staging/supabase/main.tf:21-22 `bucket       = "openvaa-tfstate-471112560111"` / `key          = "hand/staging/supabase/terraform.tfstate"`].

### The primary-deployment check after apply

```bash
TD=$(terraform -chdir=infra/envs/staging/aws output -raw task_definition_arn)   # output exists: outputs.tf:49-52
aws ecs describe-services --cluster openvaa-staging --services openvaa-staging-frontend \
  --query 'services[0].{d:deployments[?status==`PRIMARY`]|[0],desired:desiredCount}' > "$RUNNER_TEMP/svc.json"
echo "describe_status=$?"
jq -e --arg td "$TD" '.d.taskDefinition == $td and .d.rolloutState == "COMPLETED"
  and .d.runningCount >= .desired and .desired >= 1' "$RUNNER_TEMP/svc.json"
```

`task_floor = 1` on staging [VERIFIED: infra/envs/staging/aws/terraform.tfvars:20 `task_floor         = 1`]. 185-16 observed a circuit-breaker failure making the apply exit 1 (`FAULT_APPLY_EXIT=1 (expected)`) [VERIFIED: 185-16-SUMMARY.md], so this check is defence in depth.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| GitHub OIDC trust on `sub` only | Immutable ids (`repository_id`, `repository_owner_id`, `actor_id`) are documented condition keys; AWS warns "Use immutable identifiers, not names" | current IAM docs | A-02's numeric conditions are the documented practice |
| Concurrency: one pending run, older pending cancelled | Same default (`queue: single`), plus `queue: max` (up to 100 pending, FIFO) | current docs | Keep the default; `queue` is unnecessary. actionlint 1.7.12 (March 2026) may not know the key [ASSUMED] |
| ECS resolves `:tag` at deploy | `versionConsistency` (enabled by default) resolves tags to digests | current API ref | A digest in the task definition makes the plan show what runs |
| Managed policies per role: 10 | 20 (max 25) | current quotas page | No need to merge concern policies |

## Carried CI debts (diagnosed read-only this session)

- **`secret-scan`** (run 43405262494, `ci-evidence/180-deno`, 2026-11-13): trufflehog 3.97.9 reported 2 unverified URI findings, exit 183. The annotations name `tests/tests/utils/mailedLink.test.ts:98` and `apps/supabase/supabase/functions/account-access/signInLink.test.ts:37`, both localhost callback URL fixtures from the v2.16 stream (178-12). **Not this workstream's files.** The fix matches the policy of `.github/trufflehog-exclude-paths.txt`, "Every entry here is a MEASURED false positive from an observed run": two exact-path entries citing run 43405262494. Observe green on a `ci-evidence/**` push [VERIFIED: `gh run view --log`, `gh api …/check-runs/<id>/annotations`].
- **`dependency-audit`:** "Summary: 16 new advisory(ies) at high+, 0 accepted", for example undici GHSA-qrxm-fqhp-jwvm, vite GHSA-587h-7wmj-h5pm and zod GHSA-mrhx-c7xc-m3w5. These are third-party dependencies, so they become a dated todo for 189 [VERIFIED: job log].
- **`infra-validate`:** green on 2026-11-13 at `1ed7c6d2` (another stream's tree); it has not run on this phase's final tree. Observe it with the same `ci-evidence/187-final` push.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The per-service action catalogue (beyond the cited Auto Scaling list) is complete for refresh, update, create and destroy | Pattern 1 | Create and destroy paths fail at H10, or the first deploy fails at refresh. Mitigate with a CloudTrail `lookup-events` read of the 185-19 destroy (2026-11-14 09:49-09:54Z) and the 185-20 create (about 18:12Z), both within the 90-day event history, plus `simulate-principal-policy`, at H1 |
| A2 | Route 53, CloudFront and ACM tag or record-name condition keys behave as intended | Pattern 1 | A create is refused or a scope is wider than intended. The simulator checks, and H10 observes |
| A3 | psql 16 reads the PG17 history table | Pitfall 2 | The drift check exits 2, then push-migrations exits 4. Fallback: PGDG client 17 |
| A4 | GitHub issues no OIDC token to fork `pull_request` runs (secondary sources only) | PIPE-03 | Moot: the job-level `if:` skips the job first |
| A5 | A job waiting for environment approval holds its concurrency group | Pitfall 9 | A destroy could interleave with a pending deploy. Terraform's lock is the second guard |
| A6 | Playwright Chromium installs and runs on the `ubuntu-24.04-arm` image | Smoke step | The smoke step cannot start. Fallback: none inside one job; observe early on the red/green runs |
| A7 | `if: failure()` does not run after a job timeout or cancel | Pitfall 12 | An alert is missed. Mitigated by `failure() \|\| cancelled()` |
| A8 | An identity-policy `sns:Publish` suffices despite the topic policy naming only `events.amazonaws.com` (same-account union) | D-02 | The red run's alert is not published. Observed at H8 |
| A9 | The Supabase CLI falls back to the session pooler on an IPv4-only runner, as on the operator's IPv4 network in 184 ("persistent project uses the session pooler (direct host not resolved)", STATE.md 184-20) | Migrations | The dry run fails, exit 3. Reading `GET /v1/projects/<ref>/config/database/pooler` is the cross-check |
| A10 | The expected refusal code is `AccessDenied` | Wrong-subject proof | Only the printed text differs; the assertion should accept any non-zero status with a named code |

## Open Questions

1. **How does a push-triggered destroy "stop before the apply" for the evidence run?** `workflow_dispatch` is unavailable until the workflow is on `main`, and B-01 keeps every pre-merge observation a push.
   - Recommendation: split `destroy.yml` into two jobs, both in `staging-destroy`. Job A runs the refusal proof and the guarded `plan -destroy`. Job B `needs: A`, re-plans with the same guards and applies its own saved plan, so no artifact crosses jobs. Each job needs its own approval. For the evidence run, the operator approves A and rejects B; for H10, both.
   - This changes "one job" in F-01, so put it to the operator.
2. **The PR base name** `deploy-evidence/187-base` triggers a gated deploy run. Recommend `pr-evidence/187-base` with base = `origin/main`. This overrules B-04 as written.
3. **The `--confirmed-ref` environment condition.** `GITHUB_ENVIRONMENT` does not exist. Recommend `OPENVAA_DEPLOY_ENVIRONMENT` from an environment-scoped `vars.DEPLOY_ENVIRONMENT`. This overrules C-04 as written.
4. **The staging zone id** for the DNS policy is not in any tfvars. The operator copies it from the dns-mail root's `zone_id` output at H1. Alternatively, the policy uses `hostedzone/*` with the record-name and record-type conditions.
5. **Access-token scope.** `SUPABASE_ACCESS_TOKEN` is assumed to be a personal token with account-wide reach [ASSUMED]. Record it as an accepted risk of SUPA-08, or check whether a narrower token type exists.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Terraform | fmt/validate/test, probes | ✓ | 1.16.5 | — |
| Docker | actionlint container, local red-build proof, the CR-01 self-test needs none | ✓ | 29.7.2 | — |
| actionlint | `lint:workflows` | ✓ via container | 1.7.12 | — |
| shellcheck (local) | — | ✗ | — | inside the actionlint image (0.11.0) |
| gh | read-only `gh api` read-backs | ✓ | 2.103.3 | — |
| Node / Yarn | vitest guard tests | ✓ | 24.21.0 / 4.18.1 | — |
| AWS CLI | operator checkpoints only; the executor holds no credential | ✓ | 2.34.7 | — |
| psql (local) | — (runner needs it; local has 17.6) | ✓ | 17.6 | — |
| Runner `ubuntu-24.04-arm`: Docker, Buildx, AWS CLI, jq, curl, git, Node | the deploy job | ✓ per image page | — | — |
| Runner `ubuntu-24.04-arm`: PostgreSQL client | the drift check | ✗ | — | `apt-get install postgresql-client` in the job |

**Missing dependencies with no fallback:** none.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (root catalog), with `infra/vitest.config.ts` collecting `scripts/**/*.test.ts`; Terraform 1.16.5 `terraform test`; actionlint 1.7.12 |
| Config file | `infra/vitest.config.ts` (exists); `*.tftest.hcl` per module or root |
| Quick run command | `yarn test:unit:infra` (or `yarn test:unit:infra workflows`) |
| Full suite command | `yarn test:unit && yarn lint:check && yarn format:check && yarn lint:workflows`, plus the infra-validate loop locally, plus `terraform test` in each `infra/envs/example/*`, plus the one closing `tests/scripts/e2e-run.sh` run |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PIPE-01 | Deploy policies hold the needed actions, no `iam:Create*/Put*/Attach*/Delete*`, every policy ≤ 6,144 non-whitespace chars, `ecr:DescribeImages` present, `plan_lock` gone | tf unit | `terraform -chdir=infra/modules/github-oidc test` | ❌ Wave 0 |
| PIPE-01 | bootstrap tfvars set both numeric ids and the `staging-destroy` subject | unit | `yarn test:unit:infra workflows` (or a bootstrap tfvars test) | ❌ |
| PIPE-01 | The wrong subject is refused | manual-only (needs GitHub) | the `infra-plan.yml` wrong-subject job on the H8 push | ❌ |
| PIPE-02 | Every root formatted and validated; PR plan job shape | unit + CI | the infra-validate loop; `workflows.test.ts` | partial |
| PIPE-03 | Credentialed jobs carry the fork `if:`; no `pull_request_target` | unit | `yarn test:unit:infra workflows` | ❌ |
| PIPE-04 | `environment:` on the apply jobs; concurrency group `staging-aws`, `cancel-in-progress: false`; `timeout-minutes` set | unit | same | ❌ |
| PIPE-05 | Image by digest; `image_digest` regex refuses a tag, upper case or empty | tf unit | `terraform -chdir=infra/modules/frontend-service test` (rewrite the 3 `image_tag_refuses_*` runs) | ✅ (update) |
| PIPE-05 | Build context excludes an ignored file | script self-test | `yarn test:unit:infra build-push-image` (new case name asserted) | ✅ (extend) |
| PIPE-06 | Step order: build → plan → migrations → functions → apply → stable → smoke; failure alert last | unit | `yarn test:unit:infra workflows` | ❌ |
| PIPE-06 | `--confirmed-ref` refusals (mismatch, not Actions, wrong environment value) exit 2 before the CLI | unit | `yarn test:unit:infra push-migrations` | ❌ |
| PIPE-07 | The smoke step has `SMOKE_EXPECTED_SHA`, no `SUPABASE_SERVICE_ROLE_KEY`/`SECRET_KEY` anywhere, no `DEV_SEED_ALLOW_REMOTE` | unit | `yarn test:unit:infra workflows`; existing `deployedSmokeGuards.test.ts` | partial |
| PIPE-08 | The destroy workflow names only `infra/envs/staging/aws` for plan/apply; no Supabase secret; refusal step present | unit | `yarn test:unit:infra workflows` | ❌ |
| PIPE-09 | Red commit fails `vite build` locally | local proof | `git archive <red> \| tar -x` + `docker buildx build --target production` → non-zero | ❌ |
| PIPE-10 | No `push` trigger of deploy/destroy matches `main`; branch list exact; `!deploy-evidence/destroy-staging` | unit | `yarn test:unit:infra workflows` | ❌ |
| INFRA-16 | The `if: failure() \|\| cancelled()` publish step is the last step and names the topic | unit | same | ❌ |
| INFRA-19 | Three example roots mock-plan; floor 2, ceiling 4, two zones | tf unit | `terraform -chdir=infra/envs/example/<r> test -verbose` | ❌ Wave 0 |
| INFRA-19 | No workflow runs `apply`/`destroy` outside `infra/envs/staging/aws` | unit | `yarn test:unit:infra workflows` | ❌ |
| SUPA-08 | No `upload-artifact`; plan file only under `$RUNNER_TEMP`; actions SHA-pinned; `permissions: {}` at top; `persist-credentials: false` | unit + lint | `yarn test:unit:infra workflows`; `yarn lint:workflows` | ❌ |

### Sampling Rate
- **Per task commit:** `yarn test:unit:infra` plus the touched module's or root's `terraform test`, plus `yarn lint:workflows` when a workflow changed.
- **Per wave merge:** `terraform fmt -check -recursive infra`, the infra-validate loop, `yarn test:unit`.
- **Phase gate:** `yarn test:unit`, `yarn lint:check`, `yarn format:check`, `yarn lint:workflows`, and one full `tests/scripts/e2e-run.sh` run, all green before `/gsd-verify-work`. The outward observations (H-steps) are evidence files, not automated gates.

### Wave 0 Gaps
- [ ] `infra/modules/github-oidc/tests/github_oidc.tftest.hcl`: real provider offline (fake keys and skips) for plan-time JSON.
- [ ] `infra/envs/example/{aws,dns-mail,supabase}/tests/plan.tftest.hcl`, with the infra-plan.yml loop that runs them; infra-validate's loop does not reach roots.
- [ ] `infra/scripts/workflows.test.ts`, plus `js-yaml` in root devDependencies.
- [ ] `infra/scripts/push-migrations.test.ts`.
- [ ] Root script `lint:workflows`.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | OIDC federation; no stored AWS keys; exact `sub` plus numeric-id conditions |
| V3 Session Management | yes | STS session 1 h; re-assume before apply |
| V4 Access Control | yes | Environment reviewer and branch policy; least-privilege customer-managed policies; plan role read-only (`-lock=false`) |
| V5 Input Validation | yes | `image_digest` regex; `--confirmed-ref` equality; destroy `confirm` input equality; no event text in `run:` |
| V6 Cryptography | no new crypto | The S3 state bucket SSE stays as is (AES256) |
| V7 Logging | yes | Public logs: mask the token, print only `name=value` lines, `terraform show` masks sensitive values; never `show -json` |
| V14 Configuration | yes | SHA-pinned actions; `permissions: {}`; `persist-credentials: false` |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Same-repo PR edits the workflow to exfiltrate | Elevation | The plan role is read-only and denied `hand/` state and secret reads; the deploy role needs the environment, which the branch policy and reviewer guard |
| Fork PR runs credentialed code | Elevation | `pull_request` only, job `if:` skip |
| Script injection via branch or PR title | Tampering | No `${{ github.event.* }}`/`head_ref` in `run:`; values through `env:` |
| Ungated auto-created environment | Elevation | H2 before H4 (Pitfall 6) |
| Plan or state leak through artifacts or logs | Info disclosure | No `upload-artifact`; plan in `$RUNNER_TEMP`; the log is public on a public repository, so print masked text only |
| Origin secret readable by the plan role | Info disclosure | Accepted risk (Pitfall 11), recorded |
| Admin bypass of the gate | Elevation | `can_admins_bypass` false (Pitfall 6) |

## Recommended plan order (for the planner)

**Autonomous (`autonomous: true`), depending on no checkpoint:**
1. `github-oidc`:
   - the deploy policies, `ecr:DescribeImages`, removal of `plan_lock`;
   - the bootstrap tfvars: ids, the `staging-destroy` subject, zone id;
   - the module test;
   - the bootstrap README H1 procedure: plan, simulator, CloudTrail lookup, apply, Not-yet-observed rows.
2. `image_digest`: the module, both roots, the module test, the staging AWS runbook steps, `tests/README.md`, `registry` docs, the `build-push-image.sh` header.
3. CR-01: the `git archive` context and a self-test case for an ignored file.
4. `push-migrations.sh --confirmed-ref`, with its tests.
5. The example-root mock plans.
6. The three workflows: `psql` install, credential re-assume, failure-or-cancel alert, `!destroy-staging`, destroy split per Open Question 1 if accepted.
7. The guard tests, `js-yaml`, `lint:workflows`.
8. Docs (`infra/README.md` § The deploy pipeline, the Prerequisites fix, the "first run shows no change" sentence) and the `secret-scan` exclude entries.
9. The red commit object, built locally and proven failing locally; the source-only green commit object, built but not pushed.
10. The local gates and the one full E2E run.

**Checkpoints (`autonomous: false`), in dependency order:**
1. H2: environments and read-back, with admin bypass off.
2. H1: bootstrap plan, simulator and CloudTrail cross-check, then apply.
3. H3: secrets and variables, including `DEPLOY_ENVIRONMENT`.
4. H4b: the `ci-evidence/187-final` push, observing `secret-scan` and `infra-validate`.
5. H8: the red push, observing the gate, the OIDC assume with the ids, the ECR read, the build failure, the SNS mail, and the refusal job and light job on the same push.
6. H5 and H6: the PR plan and the fork PR.
7. H9: 186-08.
8. H4/H7: the green push, then `deploy/staging`. The second run exercises exit 3 and "No changes".
9. The plan-only destroy evidence run.
10. H10, on or after 2026-11-23: the destroy, the redeploy from nothing, and the subscription confirmation.

## Sources

### Primary (HIGH confidence)
- Repository files read this session: `infra/modules/github-oidc/*.tf`, `infra/bootstrap/{main,backend,outputs}.tf`, `terraform.tfvars`, `infra/modules/frontend-service/{main,service,alerts,scaling,edge,origin,variables}.tf` and tests, `infra/envs/{staging,example}/aws/*`, `infra/envs/example/{dns-mail,supabase}/main.tf`, `infra/scripts/{build-push-image.sh,build-push-image.test.ts,push-migrations.sh,check-drift.sh}`, `.github/workflows/*.y*ml`, `package.json`, `infra/vitest.config.ts`, `apps/frontend/{Dockerfile,package.json}`, `.dockerignore`, `tests/playwright.deployed.config.ts`, `tests/README.md`, 185/186 summaries.
- Local probes: `terraform test` of all three example roots with mocks; an offline-provider policy test; destroy-plan variable behaviour; actionlint container runs.
- Terraform v1.16.5 source, `internal/command/init_run.go:307-331` (fetched raw from GitHub).
- `gh api` GETs: repository ids, environments, OIDC subject customisation, workflow permissions, rulesets, action tag SHAs, run logs and annotations.
- AWS IAM condition keys: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html
- IAM quotas: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html
- Application Auto Scaling permissions: https://docs.aws.amazon.com/autoscaling/application/userguide/security_iam_id-based-policy-examples.html
- ECS ContainerDefinition `image`: https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_ContainerDefinition.html

### Secondary (MEDIUM confidence)
- GitHub: deployments and environments, manage environments, environments REST, concurrency, OIDC reference, variables, workflow syntax (docs.github.com, fetched this session).
- Supabase managing environments (non-interactive environment variables): https://supabase.com/docs/guides/deployment/managing-environments
- Partner runner image, arm64: https://github.com/actions/partner-runner-images/blob/main/images/arm-ubuntu-24-image.md
- Vite features (no type checking): https://vite.dev/guide/features

### Tertiary (LOW confidence)
- The fork-PR OIDC withholding (pypa gh-action-pypi-publish code comments, blogs), found through a web search.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. SHAs were resolved and the tools ran locally.
- Architecture and patterns: HIGH for the shape and the verified probes; MEDIUM for the IAM action list (A1, A2).
- Pitfalls: HIGH. Most were found in the tree or in official docs; A3, A6 and A7 are flagged.

**Research date:** 2026-11-15
**Valid until:** 2026-12-15 (re-resolve the action SHAs and actionlint if planning slips past that)
