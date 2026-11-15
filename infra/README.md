# Infrastructure as code

This directory holds the Terraform code of an OpenVAA deployment: the account-level resources every
other part rests on, the staging environment's zone, mail and Supabase project, the pipeline's own
root, and a template environment that a fork copies. Every root is applied by hand, from its
runbook. The staging AWS root is applied that way too, in the operator's administrator session, until
the deploy workflow exists, and by that workflow from then on. No pull-request workflow applies
anything, and nothing here holds a secret: secrets arrive as environment variables of one shell
session.

Each root is a thin directory that calls modules from `modules/`. A root has its own state key in
the state bucket and its own tracked `terraform.tfvars`, the public record of its non-secret inputs.

## Roots

| Root                    | What it holds                                                                                                                                                                                               | State key                                                    | Applied by                                                                                                  | Ever applied                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `bootstrap`             | The state bucket, the image registry, the monthly cost budget, the GitHub OIDC provider, the plan role, the deploy role and their policies, and the frontend's execution role with its parameter policy     | `hand/bootstrap/terraform.tfstate`                           | The operator, by hand, with administrator rights                                                            | Yes, first with local state, then migrated; the execution role not yet |
| `envs/staging/dns-mail` | The delegated zone of the staging domain, the mail identity with its DKIM, MAIL FROM and DMARC records, and the SMTP user                                                                                   | `hand/staging/dns-mail/terraform.tfstate`                    | The operator, by hand                                                                                       | Yes                                                                    |
| `envs/staging/supabase` | The staging Supabase project, imported and never created or deleted by Terraform, and its hosted settings                                                                                                   | `hand/staging/supabase/terraform.tfstate`                    | The operator, by hand                                                                                       | Yes                                                                    |
| `envs/staging/aws`      | The staging application's network, load balancer, Fargate service and CloudFront distribution, the two certificates and their records in the delegated zone, the service's scaling and the deployment alert | `pipeline/staging/aws/terraform.tfstate`                     | By hand, from its runbook, until the deploy workflow exists; then by that workflow, through the deploy role | Yes, first on 2026-11-13                                               |
| `envs/example/dns-mail` | A template of the zone and mail root, with stand-in values                                                                                                                                                  | `hand/example/dns-mail/terraform.tfstate` in your own bucket | Nobody; the validation job validates it                                                                     | Never                                                                  |
| `envs/example/supabase` | A template of the Supabase root, with stand-in values                                                                                                                                                       | `hand/example/supabase/terraform.tfstate` in your own bucket | Nobody; the validation job validates it                                                                     | Never                                                                  |
| `envs/example/aws`      | A template of the staging AWS root, with stand-in values                                                                                                                                                    | `pipeline/example/aws/terraform.tfstate` in your own bucket  | Nobody; the validation job validates it                                                                     | Never                                                                  |
| `envs/scratch/supabase` | A throwaway Supabase project, on which every step of the staging Supabase root is rehearsed first                                                                                                           | Local state, ignored by Git                                  | The operator, by hand                                                                                       | Yes; its state is removed with each throwaway project                  |

Every root that only an operator ever applies keeps its state under `hand/`. The staging AWS root,
which the deploy workflow takes over, keeps its state under `pipeline/` from its first apply by hand,
so that the workflow inherits that same state. The plan role's policy denies it every object under
`hand/` and every object under `env:/`, where the S3 backend keeps the state of a non-default
workspace, and the deploy role's policy allows it only its own key under `pipeline/`, so that neither
workflow role can read the state of a root under `hand/`, which holds secrets in clear text.

Runbooks: [`bootstrap/README.md`](bootstrap/README.md) for the account-level root, the `README.md`
of `envs/staging/dns-mail` and of `envs/staging/supabase` for those roots, and
[`envs/staging/aws/README.md`](envs/staging/aws/README.md) for the staging AWS root.

## Order

The first apply of each root, in this order:

```
1. bootstrap                    local state first; the state is then migrated into the bucket it created
      |
      +-- 2. envs/staging/dns-mail     zone, mail identity, SMTP user
      |        |
      |        +-- the zone's name servers are added at the parent zone by hand
      |
      +-- 3. envs/scratch/supabase     the throwaway project: import, settings, second plan, destroy refusal
      |        |
      |        +-- 4. envs/staging/supabase   the same steps on the staging project; it takes the SMTP
      |                                       password from step 2 in one shell session
      |
      +-- 5. envs/staging/aws          after bootstrap's execution role (its Step 8), the two parameters
                                       and the image; applied by hand from its runbook
```

The wait for the budget alert of `bootstrap` and the wait for the mail identity's verification can
each take hours. Neither blocks the next apply.

The deploy workflow takes over `envs/staging/aws` on the same state. Its first plan after the switch
to image digests replaces the task definition and updates the service, a rollout of the same image,
and shows no other change.

## Regions

Every regional resource of every root is in `eu-north-1`, with two exceptions, both in `us-east-1`:

- the certificate of the CloudFront distribution, because CloudFront takes its viewer certificate
  from `us-east-1` only;
- a future WAF rate rule for the analytics endpoint, which attaches to the distribution in the
  `CLOUDFRONT` scope, which lives in `us-east-1`. It will be off by default, and it is not built yet.

The CloudFront distribution itself is global and has no region, as are IAM, the hosted zones and the
budget. The staging Supabase project is in
`eu-north-1`, as `region` in `envs/staging/supabase/terraform.tfvars` records.

## Prerequisites

- Terraform 1.16.5, the version pinned in `infra/.terraform-version`. Check with `terraform version`.
- The AWS CLI version 2, `jq`, `dig`, `curl`, `shasum` and `git`.
- An identity that applies by hand and carries no inline policy: an IAM Identity Center permission set
  that uses the AWS-managed `AdministratorAccess` policy, or an IAM user with MFA and managed policies
  only. A "force MFA" policy written inline has to become a customer-managed policy first.
- For the Supabase roots, a Supabase access token, given per session as their runbooks describe.
- Before any push that carries a workflow naming them, the two GitHub Environments the deploy role
  trusts (`deploy_subjects` of `bootstrap`), `staging` and `staging-destroy`, exist, each with a
  required reviewer and a custom deployment branch policy that admits `deploy/staging` and
  `deploy-evidence/*` only. The deploy role trusts every job that names one of them, so that branch
  policy, a repository setting and not code, is what keeps `main` and every other branch out.

## Rules of every apply

- An exit status is read on the line after the command, as `echo "…_exit=$?"`, and never through a
  pipe, because a pipe reports the status of its last command and not of the one that matters.
- A secret arrives as an environment variable of one shell session, `export TF_VAR_<name>=…`, and is
  written to no file, because a file is easily copied, attached or committed.
- `terraform.tfvars` is tracked and public, so nothing secret and no personal address goes into it.
- A root uses the default workspace only, and no backend block sets `workspace_key_prefix`, because
  the plan role's deny on other roots' state covers the `hand/` keys and the backend's default
  workspace prefix `env:/` and no other key.
- A plan of a Supabase root that shows a destroy or a replacement is never applied, because the
  project holds the only copy of its data and Terraform must never delete it.
- A plan file is never uploaded, attached or pasted anywhere, because it holds the planned attribute
  values in clear text, secrets included; the same holds for a state file and for a raw plan or apply
  log.
- Hosted auth settings have one writer, the Terraform settings resource of the Supabase module, and
  the CLI's configuration push is used nowhere, because a second writer would overwrite the first and
  a plan could no longer show the drift.
- IAM is written only by roots that no workflow will ever apply, and only as customer-managed
  policies under the path `/openvaa/`, because no workflow role may create or change a permission and
  no permission may depend on an inline policy. The staging AWS root, which the deploy workflow takes
  over, writes none: the execution role its task runs under is in `bootstrap`.

## Guards

| Guard                        | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | How to run it                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No inline IAM policies       | No `.tf` file under `infra/` declares an inline IAM policy in any form, and no `.tf.json` file exists there. A link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `yarn assert:no-inline-iam-policies`                                                                                                                                                                                                                                                                                                                                                 |
| Hosted settings parity       | The hosted settings in `modules/supabase/hosted-settings.json` match the local Supabase configuration key by key. A link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `yarn assert:hosted-settings-parity`                                                                                                                                                                                                                                                                                                                                                 |
| The validation job           | `infra-validate` in `.github/workflows/main.yaml`: formatting, `init -backend=false` and `validate` of every root, `terraform test` of every module that has a `tests` directory, and the settings types of the Supabase module. No credentials.                                                                                                                                                                                                                                                                                                                                                                               | `terraform fmt -check -recursive infra`, then for each root `terraform -chdir=<root> init -backend=false -input=false -lockfile=readonly` and `terraform -chdir=<root> validate`, then for each module with a `tests` directory `terraform -chdir=<module> init -backend=false -input=false` and `terraform -chdir=<module> test`, then `bash infra/scripts/check-settings-types.sh` |
| No inline user policy in AWS | The account side of the same rule: no IAM user in the account carries an inline policy. Run by the operator with credentials; read-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `infra/scripts/account-inventory.sh --assert-no-inline-user-policies`                                                                                                                                                                                                                                                                                                                |
| Hosted conformance probe     | A hosted project serves what the repository declares for it: the auth and API settings, the three functions and their `verify_jwt`, the buckets, the hook functions, the `anon` timeout, the Postgres major version, one read of more than 1000 rows, and no trace of the local seed. It compares the project's Management API, its public API read with the anon key (with no key for the `identity-callback` calls), and its catalog with the tracked files the parity guard reads, and writes nothing to the project. Run by an operator with credentials; not a link of `yarn lint:check`.                                 | `node infra/scripts/probe-hosted.mjs --root infra/envs/<environment>/supabase`, as Step 23 of [`envs/staging/supabase/README.md`](envs/staging/supabase/README.md) gives it                                                                                                                                                                                                          |
| Deploy-role policies         | `terraform test` of `modules/github-oidc`: each customer-managed deploy policy stays under 6,144 characters and under `/openvaa/`, `iam:PassRole` on the frontend execution role for ECS tasks is the only IAM action, record changes reach the one zone and the frontend's names only, no policy reads state, parameters, secrets, keys or log events, and every tagged create requires the tags `Project=openvaa` and `Root=aws`. No credentials.                                                                                                                                                                            | `terraform -chdir=infra/modules/github-oidc init -backend=false -input=false`, then `terraform -chdir=infra/modules/github-oidc test`                                                                                                                                                                                                                                                |
| Example mock plans           | `terraform test` of each root under `envs/example/` plans it against mock providers, with no credential and no backend, and asserts its production shape: a floor of 2 tasks, a ceiling of 4 and two zones for the AWS root. Run by the `checks` job of the pull-request workflow.                                                                                                                                                                                                                                                                                                                                             | for each example root `terraform -chdir=<root> init -backend=false -input=false -lockfile=readonly`, then `terraform -chdir=<root> test -verbose`                                                                                                                                                                                                                                    |
| Workflow guards              | The vitest tests of `infra/scripts/`: each pipeline workflow's own rules (`infra-plan-workflow.test.ts`, `deploy-workflow.test.ts`, `destroy-workflow.test.ts`) and the rules across files in `workflows.test.ts`: no workflow applies or destroys anything but `infra/envs/staging/aws`, no push trigger of the deploy or destroy workflow can match `main`, both share the concurrency group `staging-aws` without cancelling, the literal deploy role ARN is the one the bootstrap tfvars create, and each environment is named by its one workflow. Every rule is shown red on a mutated copy. A link of `yarn test:unit`. | `yarn test:unit:infra`                                                                                                                                                                                                                                                                                                                                                               |
| Workflow lint                | actionlint 1.7.12, from its container pinned by digest and with its shellcheck, over `infra-plan.yml`, `deploy.yml` and `destroy.yml`. `main.yaml` is not passed: its one known finding is not the pipeline's. Needs Docker.                                                                                                                                                                                                                                                                                                                                                                                                   | `yarn lint:workflows`                                                                                                                                                                                                                                                                                                                                                                |

## The deploy pipeline

Three workflows under `.github/workflows/` make up the pipeline, and `main.yaml` is not one of them:
`deploy.yml` deploys one commit to staging, `destroy.yml` destroys the staging AWS stack, and
`infra-plan.yml` checks and plans the Terraform of a pull request. The workflow guards and
`yarn lint:workflows` in [§ Guards](#guards) check all three without a credential.

### What starts a deploy

- A push to `deploy/staging`.
- A push to a flat `deploy-evidence/<name>` branch other than `deploy-evidence/destroy-staging`. The
  name holds no further `/`: the environment's branch policy matches one path segment only, so a
  nested name starts the workflow and is then refused at the gate, red and with no alert.
- A dispatch, from the `deploy/staging` ref, once the workflow is on the default branch. GitHub
  offers a dispatch only for a workflow on the default branch, and the environment admits no other
  ref for it.

A push to `main` deploys nothing: no trigger of `deploy.yml` or `destroy.yml` names it, and neither
environment's branch policy admits it.

A push to a `deploy-evidence/*` branch also starts `infra-plan.yml`, its `checks` and
`wrong-subject` jobs. That holds for `deploy-evidence/destroy-staging` too, whose push starts both
`destroy.yml` and `infra-plan.yml`. The second is harmless: it names no environment, writes
nothing, and its one credentialed job only shows that both roles refuse it.

### The gated job and its order

A no-credential job, `checks`, runs first: Terraform formatting, the validation of the staging AWS
root and `yarn test:unit:infra`. The `deploy` job needs it, runs in the `staging` environment and
waits for its reviewer. Once approved, in this order:

1. **Build**, by digest. The deploy role is assumed and `infra/scripts/build-push-image.sh` builds
   the commit natively on `ubuntu-24.04-arm` from a `git archive` of it, pushes the image under the
   commit id and prints `image_digest=`. Status 3 means the registry already holds the commit's
   image, which is deployed as it is. The role's credentials are then dropped from the job's
   environment, and they are dropped again after the plan and after the stable check: the role is
   assumed only for the steps that call AWS, so no tool, package or browser install and no Supabase
   CLI call runs with them.
2. **Plan**, of the staging AWS root with `-var "image_digest=<digest>"`, saved under
   `$RUNNER_TEMP` and printed with `terraform show -no-color` to the log and the step summary.
3. **Migrations.** A temporary work directory is linked to the Supabase project, and
   `infra/scripts/push-migrations.sh --confirmed-ref` pushes the pending migrations through the
   session pooler and checks for drift afterwards. The script accepts the flag only in an Actions
   job with `DEPLOY_ENVIRONMENT=staging` on a `deploy/staging` or `deploy-evidence/*` ref, which
   guards against a mistake and proves no environment: a repository variable of the same name, or
   any shell that sets those variables, passes it. The boundary is `SUPABASE_DB_PASSWORD`, an
   environment secret of `staging` alone.
4. **Functions.** All three are deployed from the linked directory, and the Management API's list
   must then show three `ACTIVE` functions, each with `verify_jwt` as `config.toml` says.
5. **Apply** of the saved plan, with the role assumed again so that its credentials outlive it.
6. **Stable check.** The service's primary deployment must run the task definition just applied,
   with `rolloutState` `COMPLETED` and at least `task_floor` tasks running.
7. **Smoke run.** `yarn test:e2e:deployed` against `https://staging.openvaa.org`, with
   `SMOKE_EXPECTED_SHA` set to the built commit, the two contestant secrets, and no AWS credential.
8. **`/api/health` re-read.** It must still serve the built commit, so that a deploy landing while
   the specs ran cannot leave a `PASS sha` line speaking for a build the specs never drove.
9. **Failure alert.** The plan, the smoke output and the step files are removed whatever the
   outcome. When a step failed or the run was cancelled, the role is assumed once more and one
   message goes to the SNS topic `openvaa-staging-frontend-deployments`, naming the stage, the
   commit, the trigger and the run.

A failed step stops every later one but the cleanup and the alert. `deploy.yml` and `destroy.yml`
share the concurrency group `staging-aws` with `cancel-in-progress: false`: a run waiting for the
group is replaced by a newer one, and a running one is never cancelled. The group is workflow-wide,
so a run whose gated job waits for approval is already running and holds it.

### The environments and their settings

| Setting                              | `staging`                                                                                                             | `staging-destroy`          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| Required reviewer                    | The operator                                                                                                          | The operator               |
| Self-review                          | Allowed                                                                                                               | Allowed                    |
| Administrators bypass the protection | Off                                                                                                                   | Off                        |
| Deployment branch policy             | Custom: `deploy/staging` and `deploy-evidence/*` only                                                                 | The same                   |
| Environment secrets                  | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD`, `ALERT_EMAIL` | None                       |
| Environment variables                | `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST`, `DEPLOY_ENVIRONMENT` (the value `staging`)                             | None                       |
| Named by                             | The `deploy` job of `deploy.yml`                                                                                      | Both jobs of `destroy.yml` |

`staging-destroy` holds none of the eight settings of `staging`: no secret and no variable, so no
Supabase token exists in a destroy job. The repository itself holds the variable `AWS_PLAN_ROLE_ARN`
and the secret `ALERT_EMAIL`, both for the pull-request plan. The service-role key is in none of
them and in no workflow. `ALERT_EMAIL` is the address the stack's alert subscription uses.

Both environments must exist, with these settings read back, before any push that carries a workflow
naming them. GitHub creates an environment a job names and that does not exist yet, with no
protection rule at all, and the deploy role trusts every job that names it.

### The pull-request workflow

`infra-plan.yml` runs on a pull request to any base that touches `infra/**` or the workflow itself,
and on a push to a `deploy-evidence/**` branch.

- `checks`, with no credential: formatting, `init -backend=false` and `validate` of every root,
  `terraform test` of every module that has tests, and the plan of each example root against mock
  providers.
- `plan`, for a pull request from this repository only: assumes the read-only plan role named by
  `AWS_PLAN_ROLE_ARN`, reads the digest the service runs, and plans the staging AWS root with
  `-lock=false`, printing the plan. Taking no lock, it can show a diff against a state an apply is
  writing at the same time; the next push to the pull request plans again. A fork's pull request
  gets no token and no secret, and the job's `if` skips it, so it shows as skipped.
- `wrong-subject`, on a push only: names no environment, so its token's subject is the pushed
  branch's ref, which neither role trusts. It passes only when STS refuses that subject for both
  the deploy role and the plan role, printing each error code.

### The destroy workflow

`destroy.yml` starts on a push to the one branch `deploy-evidence/destroy-staging`, which the deploy
workflow excludes, or on a dispatch from the `deploy/staging` ref whose `confirm` input is
`destroy staging aws`. It has two jobs, each in `staging-destroy` and each waiting for its own
approval:

1. `plan-destroy` shows the Supabase root out of reach first: an init of
   `infra/envs/staging/supabase` and a read of its state key under `hand/` must both be refused to
   the deploy role. It then lists the AWS root's state, plans `-destroy` of that root into a saved
   plan with a placeholder digest, and checks it with `infra/scripts/check-destroy-plan.sh`
   (every change a delete under `module.frontend`, of exactly the managed addresses the state holds,
   and at least one) before it prints it.
2. `apply-destroy` plans again into its own saved plan, so that no plan crosses jobs, checks and
   prints it the same way, applies it, and fails unless the state is then empty.

An evidence run is approved at `plan-destroy` and rejected at `apply-destroy`, so it destroys
nothing. A real destroy is approved at both.

### How a hand plan names the image

No variable file holds `image_digest`. A plan by hand, like the pull-request plan, passes the digest
the service runs now, so that its diff shows the infrastructure change alone:
`infra/scripts/running-image-digest.sh --cluster openvaa-staging --service openvaa-staging-frontend`
prints `running_image_digest=`, and the plan takes it as `-var "image_digest=$DIGEST"`.
[`envs/staging/aws/README.md`](envs/staging/aws/README.md) gives the commands.

### Reading a red run

The alert mail's subject names the stage that failed. Every step of the gated job belongs to the
stage it follows: `setup` is the checkout and the first role assumption, before anything is built;
`plan` is every step after the image push up to the printed plan, the Node, Yarn, psql and
Terraform setup among them; `migrations` begins where the plan's credentials are dropped;
`rollout` includes the role assumption before the apply, after the functions are deployed; `smoke`
includes the Playwright install; `cleanup` is the removal of the step files, after everything else. `cancelled` means a cancelled
run, and `unknown` a failed job in which no step reads as failed. A stage at or after `migrations`
means the persistent Supabase project may already hold that run's migrations. A red `checks` job
sends no alert, because it holds no credential and the gated job never starts. The stage's step
log then says why:

| Stage        | What to read in the step's log                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `build`      | The `refused=` or `failed=` line of `build-push-image.sh`, and `build_exit=`                                                                                                                     |
| `plan`       | `plan_exit=` and Terraform's own error                                                                                                                                                           |
| `migrations` | `link_exit=` and `linked_ref=` of the link step; then the `push_*` lines of `push-migrations.sh` (`push_connection=`, `push_pending=`, `push_confirmation=`, `push_status=`) and `drift_status=` |
| `functions`  | `functions_deploy_exit=`, `functions_list_http=`, and the `function=` lines, one per function with its `status=`, `verify_jwt=` and `expected_verify_jwt=`                                       |
| `rollout`    | The second role assumption's error, or `apply_exit=`; a rollout the circuit breaker stops also sends the stack's own rollout alert through the same topic                                        |
| `stable`     | The `stable_*` lines: `stable_task_definition_matches=`, `stable_rollout_state=`, `stable_running=`, `stable_desired=`                                                                           |
| `smoke`      | The smoke gate's `PASS` and `FAIL` lines and `smoke_exit=`, or `served_build_after_smoke=` of the re-read                                                                                        |
| `cleanup`    | The `rm` error of the removal step; every stage before it passed                                                                                                                                 |

No report, plan or output directory is uploaded from any job, on a green run or a red one: the log
is all there is. An alert that could not be sent prints `alert_error=` in the alert step.

### Recovery

- An apply cut short by a timeout, a cancel or a lost runner can leave the state lock held. Once no
  run is applying, release it from the operator's shell with
  `terraform -chdir=infra/envs/staging/aws force-unlock <lock id>`, the id taken from the lock
  error of the next plan.
- No hand apply of the staging AWS root while a run waits or runs: a saved plan is refused once the
  state has changed under it, and the run turns red at its apply.
- A run waiting for approval holds the group until it is approved, rejected or cancelled, and
  blocks every later deploy and destroy until then: reject or cancel a stale one before pushing
  again. A run waiting for the group is replaced by a newer one; to deploy the commit it carried,
  push it again or re-run it once the newer run is done.
- A destroy that stopped part-way, on a lost runner, a timeout or a failed delete, is finished by
  running the destroy workflow again: its plan reads no running service, and its guard plans the
  destroy of whatever the state still holds.
- Between a real destroy and the next deploy there is no service to read a digest from, so the
  pull-request plan is red at "Read the digest the service runs". The deploy from nothing ends it.
- A red run keeps what it already did: pushed migrations stay pushed and can only be followed by a
  new migration, and deployed functions stay deployed. The fix goes forward, as a new commit on
  `deploy/staging`.

### Evidence branches

Until the milestone merges, every observed run is fed by a source-only commit: built with a
temporary index from the branch tip with `.planning/` removed, parented on `origin/main`, pushed to
a flat `deploy-evidence/<name>` branch and, once green, to `deploy/staging`. No `.planning/` file is
on any of those branches, and each push is an operator's step. After the merge, `deploy/staging` is
fast-forwarded to a `main` commit.

### Accepted risks

- The plan role's trust is not pinned to a workflow: any workflow of a pull request from this
  repository can assume it.
- The plan role's read-only remainder can read the origin secret, in the pipeline state and in the
  configuration of the CloudFront distribution and of the load balancer's rules.
- `SUPABASE_ACCESS_TOKEN` reaches every project of its Supabase account, not the staging project
  alone.
- Between a real destroy and the redeploy the alert topic does not exist, so a failure in that
  window sends no alert, and the new subscription has to be confirmed again.
- An assumption of the deploy role that fails cannot publish its own alert: the alert step needs
  that role too, so such a run is red with no mail.
- The deploy role's EC2 and edge scopes test the tags `Project=openvaa` and `Root=aws`, which name
  the project and the root but not the environment. A distribution, certificate or network resource
  in this account that already carries both tags, such as one of a second environment's AWS root, is
  within the role's reach. A resource without them is not: no tag call of the role is allowed on the
  request's tags alone.

## Example environment

`envs/example/` is what a fork copies to start a deployment of its own. Nothing applies it; the
validation job validates it, so it stays in step with the staging roots, and the pull-request
workflow plans each of its roots with mock providers. No workflow applies it: the workflow guards
fail on any `apply` or `destroy` outside `infra/envs/staging/aws`.

1. Copy `bootstrap/example.tfvars` over `bootstrap/terraform.tfvars` and replace every stand-in: the
   account id `000000000000`, the bucket name, the GitHub environment and the OIDC subjects. Replace
   the bucket in `bootstrap/backend.tf` with the same name. Terraform documents that it loads
   `terraform.tfvars` and `*.auto.tfvars` by itself, so `example.tfvars` is never read.
2. Copy each root of `envs/example/` to `envs/<your-environment>/`. In each, replace the bucket
   `REPLACE-ME-tfstate` in the backend block with your state bucket and the environment name in the
   state key, and replace the stand-in values in `terraform.tfvars`. Each stand-in account id makes
   the provider refuse every real shell, so an unedited copy cannot be applied.
3. Write the OIDC subjects in the form your repository's tokens carry. GitHub documents two forms:
   - `repo:OWNER/REPO:environment:ENVIRONMENT`, the name-based form, kept by a repository created
     before 2026-07-15 until it is renamed, transferred or opted in to the other form;
   - `repo:OWNER@OWNER-ID/REPO@REPO-ID:environment:ENVIRONMENT`, with the numeric ids of the owner
     and of the repository, used by every repository created after that date, a fork included.

   The pull-request subject ends in `:pull_request` instead of `:environment:ENVIRONMENT`. A subject
   that differs by one character is refused, so copy it exactly.

4. Apply the roots in the order above, each from its runbook.
