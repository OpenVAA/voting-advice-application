# Infrastructure as code

This directory holds the Terraform code of OpenVAA's deployments: the account-level resources every
other part rests on, each deployment's zone, mail and Supabase project, its pipeline root, and a
template environment that a fork or a downstream repository copies. Upstream, the one deployment is
`staging`; a downstream repository adds its own beside it, in the same account, as
[§ Adding a deployment](#adding-a-deployment) describes. Every root is applied by hand, from its
runbook, except a deployment's AWS root, which the deploy workflow applies once its first apply by
hand is done. No pull-request workflow applies
anything, and nothing here holds a secret: secrets arrive as environment variables of one shell
session.

Two things here are called bootstrap. `bootstrap/` is the root of the AWS account, applied once per
account; `scripts/bootstrap.sql` writes the database rows of one deployment, its account, project and
storage settings.

Each root is a thin directory that calls modules from `modules/`. A root has its own state key in
the state bucket and its own tracked `terraform.tfvars`, the public record of its non-secret inputs.

## Roots

| Root                    | What it holds                                                                                                                                                                                                                      | State key                                                    | Applied by                                                                                                  | Ever applied                                                           |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `bootstrap`             | The state bucket, the monthly cost budget and the GitHub OIDC provider; for each deployment of the map, its image registry, plan role, deploy role and their policies, and the frontend's execution role with its parameter policy | `hand/bootstrap/terraform.tfstate`                           | The operator, by hand, with administrator rights                                                            | Yes, first with local state, then migrated; the execution role not yet |
| `envs/staging/dns-mail` | The delegated zone of the staging domain, the mail identity with its DKIM, MAIL FROM and DMARC records, and the SMTP user                                                                                                          | `hand/staging/dns-mail/terraform.tfstate`                    | The operator, by hand                                                                                       | Yes                                                                    |
| `envs/staging/supabase` | The staging Supabase project, imported and never created or deleted by Terraform, and its hosted settings                                                                                                                          | `hand/staging/supabase/terraform.tfstate`                    | The operator, by hand                                                                                       | Yes                                                                    |
| `envs/staging/aws`      | The staging application's network, load balancer, Fargate service and CloudFront distribution, the two certificates and their records in the delegated zone, the service's scaling and the deployment alert                        | `pipeline/staging/aws/terraform.tfstate`                     | By hand, from its runbook, until the deploy workflow exists; then by that workflow, through the deploy role | Yes, first on 2026-11-13                                               |
| `envs/example/dns-mail` | A template of the zone and mail root, with stand-in values                                                                                                                                                                         | `hand/example/dns-mail/terraform.tfstate` in your own bucket | Nobody; the validation job validates it                                                                     | Never                                                                  |
| `envs/example/supabase` | A template of the Supabase root, with stand-in values                                                                                                                                                                              | `hand/example/supabase/terraform.tfstate` in your own bucket | Nobody; the validation job validates it                                                                     | Never                                                                  |
| `envs/example/aws`      | A template of the staging AWS root, with stand-in values                                                                                                                                                                           | `pipeline/example/aws/terraform.tfstate` in your own bucket  | Nobody; the validation job validates it                                                                     | Never                                                                  |
| `envs/scratch/supabase` | A throwaway Supabase project, on which every step of the staging Supabase root is rehearsed first                                                                                                                                  | Local state, ignored by Git                                  | The operator, by hand                                                                                       | Yes; its state is removed with each throwaway project                  |

Every root that only an operator ever applies keeps its state under `hand/`. A deployment's AWS root,
which the deploy workflow takes over, keeps its state under `pipeline/<key>/` from its first apply by
hand, so that the workflow inherits that same state. Each deployment's plan role is denied every S3
object but its own deployment's pipeline state, `hand/`, `env:/` (where the S3 backend keeps the
state of a non-default workspace) and the other deployments' pipeline state included, and every log
event; its deploy role is allowed only that same key. So no workflow role can read the state of a
root under `hand/`, which holds secrets in clear text, or the state of another deployment.

One AWS account holds every deployment, and the account has one `bootstrap` root. It holds the
account-wide resources once: the state bucket, the monthly budget and the GitHub OIDC provider. It
holds one set of per-deployment resources for each entry of the deployment map
[`bootstrap/deployments.auto.tfvars.json`](bootstrap/deployments.auto.tfvars.json), keyed by the
deployment's name (`staging` here): the plan role and the deploy role with their policies, the
frontend's execution role with its parameter policy, and the image repository. The entry's key
names the deployment's roots `envs/<key>/`, its pipeline state key, its parameter path and the
`Environment` tag its AWS root sets, and the workflows act only on the entries whose repository id
is the running repository's own.

Runbooks: [`bootstrap/README.md`](bootstrap/README.md) for the account-level root, the `README.md`
of `envs/staging/dns-mail` and of `envs/staging/supabase` for those roots, and
[`envs/staging/aws/README.md`](envs/staging/aws/README.md) for the staging AWS root.

## Order

← guide: [Deployment § From an empty account to a tested instance](https://openvaa.org/developers-guide/deployment#from-an-empty-account-to-a-tested-instance)

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

← guide: [Deployment § From an empty account to a tested instance](https://openvaa.org/developers-guide/deployment#from-an-empty-account-to-a-tested-instance)

- Terraform 1.16.5, the version pinned in `infra/.terraform-version`. Check with `terraform version`.
- The AWS CLI version 2, `jq`, `dig`, `curl`, `shasum` and `git`.
- An identity that applies by hand and carries no inline policy: an IAM Identity Center permission set
  that uses the AWS-managed `AdministratorAccess` policy, or an IAM user with MFA and managed policies
  only. A "force MFA" policy written inline has to become a customer-managed policy first.
- For the Supabase roots, a Supabase access token, given per session as their runbooks describe.
- For the GitHub Environments, the GitHub CLI `gh`, signed in as an administrator of the repository.
- Docker, needed only by `local/check-proxy-topology.sh`, `local/check-proxy-sigterm.sh`,
  `scripts/build-push-image.sh`, `scripts/load-check.sh`, `yarn lint:workflows` and
  `scripts/check-drift.sh`, whose schema part starts a shadow database in it.
- Before any push that carries a workflow naming them, the GitHub Environments a deployment's deploy
  role trusts (the `deploy_subjects` of its entry in the map) exist, each with a required reviewer and
  a custom deployment branch policy. For staging these are `staging` and `staging-destroy`, admitting
  `deploy/staging` and `deploy-evidence/*` only, as Step 10 of
  [`bootstrap/README.md`](bootstrap/README.md) creates and reads them back. The deploy role trusts
  every job that names one of them, so that branch policy, a repository setting and not code, is what
  keeps `main` and every other branch out. A deployment without GitHub Environments has no such
  policy; its subjects name its branches instead, as [§ Adding a deployment](#adding-a-deployment)
  says.

## Rules of every apply

← guide: [Deployment § From an empty account to a tested instance](https://openvaa.org/developers-guide/deployment#from-an-empty-account-to-a-tested-instance)

- An exit status is read on the line after the command, as `echo "…_exit=$?"`, and never through a
  pipe, because a pipe reports the status of its last command and not of the one that matters.
- A secret arrives as an environment variable of one shell session, `export TF_VAR_<name>=…`, and is
  written to no file, because a file is easily copied, attached or committed.
- `terraform.tfvars` is tracked and public, so nothing secret and no personal address goes into it.
- A root uses the default workspace only, and no backend block sets `workspace_key_prefix`, because
  each workflow role reaches its deployment's one pipeline state key and nothing else: a workspace's
  state is kept under another key, out of the roles' reach and outside what the policies were
  written for.
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

| Guard                        | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | How to run it                                                                                                                                                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No inline IAM policies       | No `.tf` file under `infra/` declares an inline IAM policy in any form, and no `.tf.json` file exists there. A link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | `yarn assert:no-inline-iam-policies`                                                                                                                                                                                                |
| Hosted settings parity       | The hosted settings in `modules/supabase/hosted-settings.json` match the local Supabase configuration key by key. A link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `yarn assert:hosted-settings-parity`                                                                                                                                                                                                |
| The validation job           | `infra-validate` in `.github/workflows/main.yaml`: formatting, `init -backend=false` and `validate` of every root, `terraform test` of every module that has a `tests` directory, the settings types of the Supabase module among them (`modules/supabase/tests/settings.tftest.hcl`). `modules/supabase` tracks its `.terraform.lock.hcl`, which its init reads with `-lockfile=readonly`. No credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | `terraform fmt -check -recursive infra`, then `infra/scripts/terraform-checks.sh validate` and `infra/scripts/terraform-checks.sh test-modules`; the script's header lists the commands each check runs and the roots it must reach |
| No inline user policy in AWS | The account side of the same rule: no IAM user in the account carries an inline policy. Run by the operator with credentials; read-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `infra/scripts/check-inline-policies.sh --assert-no-inline-user-policies`                                                                                                                                                           |
| Hosted conformance probe     | A hosted project serves what the repository declares for it: the auth and API settings, the three functions and their `verify_jwt`, the buckets, the hook functions, the `anon` timeout, the Postgres major version, one read of more than 1000 rows, and no trace of the local seed. It compares the project's Management API, its public API read with the anon key (with no key for the `identity-callback` calls), and its catalog with the tracked files the parity guard reads, and writes nothing to the project. Run by an operator with credentials; not a link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `node infra/scripts/probe-hosted.mjs --root infra/envs/<environment>/supabase`, as Step 23 of [`envs/staging/supabase/README.md`](envs/staging/supabase/README.md) gives it                                                         |
| Deploy-role policies         | `terraform test` of `modules/github-oidc`: each customer-managed deploy policy stays under 6,144 characters and under `/openvaa/`, `iam:PassRole` on the frontend execution role for ECS tasks is the only IAM action, record changes reach the one zone and the frontend's names only, no policy reads state, parameters, secrets, keys or log events, and every tagged create requires the tags `Project=openvaa` and `Root=aws`. No credentials.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `terraform -chdir=infra/modules/github-oidc init -backend=false -input=false`, then `terraform -chdir=infra/modules/github-oidc test`                                                                                               |
| Example mock plans           | `terraform test` of each root under `envs/example/` plans it against mock providers, with no credential and no backend, and asserts its production shape: a floor of 2 tasks, a ceiling of 4 and two zones for the AWS root. Run by the `checks` job of the pull-request workflow.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `infra/scripts/terraform-checks.sh plan-examples`                                                                                                                                                                                   |
| Workflow guards              | The vitest tests of `infra/scripts/`: each pipeline workflow's own rules (`infra-plan-workflow.test.ts`, `deploy-workflow.test.ts`, `destroy-workflow.test.ts`) and the rules across files in `workflows.test.ts`: no workflow applies or destroys anything but the AWS root the resolve job names, no push trigger of the deploy or destroy workflow can match `main`, both share the concurrency group `aws-pipeline` without cancelling, no workflow names a role ARN literally and every role a pipeline job assumes is the one the resolve job derives from the map, each environment is the resolved one and named by its one workflow, and every job of the deploy and destroy workflows but `resolve` needs `resolve`. `arm-lock`: every root a job on an ARM runner initialises has a lock whose every provider carries one `h1:` hash for each of linux_amd64, linux_arm64, darwin_arm64 and darwin_amd64. `lock-platforms`: every root lock under `infra/` carries those four, and locks that select the same provider version carry the same hashes. Every root lock is written, after `terraform -chdir=<root> init -backend=false`, with `terraform -chdir=<root> providers lock -platform=linux_amd64 -platform=linux_arm64 -platform=darwin_arm64 -platform=darwin_amd64`, and never edited by hand. `rollout-poll` of `deploy-workflow.test.ts`: the stable step reads the service in a loop with a sleep between reads, its limit, the number of reads times the interval, between 600 s and half the deploy job's `timeout-minutes`. The shared rule `status-read-after-or` keeps every `$?` read in an `\|\|` list on its command's line and errexit on, and `workflow-errexit.test.ts` runs every status-reading step under `bash -e` against stub commands. Every rule is shown red on a mutated copy. A link of `yarn test:unit`. | `yarn test:unit:infra`                                                                                                                                                                                                              |
| Workflow lint                | actionlint 1.7.12, from its container pinned by digest and with its shellcheck, over `infra-plan.yml`, `deploy.yml` and `destroy.yml`. `main.yaml` is not passed: its one known finding is not the pipeline's. Needs Docker.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | `yarn lint:workflows`                                                                                                                                                                                                               |
| Migration drift              | The database's migration history against the manifest, and its schema against the migrations. Needs `psql`, the Supabase CLI of `yarn install`, Docker and a target, local or linked, with the connection in the libpq `PG*` variables. `deploy.yml` runs it against the linked project after each migration push, through `scripts/push-migrations.sh`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `yarn check:migration-drift --target local`, or `yarn check:migration-drift --target linked --workdir <linked work directory>`                                                                                                      |
| No local seed                | A deployed database holds no user of the local seed, no local address and not the demo key in `public.storage_config`. Run with the libpq `PG*` variables set; exits 3 on a finding. The `supabase-tests` job of `main.yaml` runs it on the seeded local stack and expects that 3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `yarn check:seed`                                                                                                                                                                                                                   |
| Proxy topology               | The frontend's production image behind a reverse proxy: the build id, the public origin, the form-post origin check and a spoofed forwarded address, each with a control. Needs Docker.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | `yarn check:proxy-topology --out <dir>`                                                                                                                                                                                             |

## Scripts

The operator's scripts under `scripts/` and `local/`, each documented in its own header. Docker is
needed by the two `local/` checks, `build-push-image.sh`, `load-check.sh` and the schema part of
`check-drift.sh`, as it is by `yarn lint:workflows`.

| Script                                  | What it checks or writes                                                                                                                                                                                                                                              | When the operator runs it                                                                                                 | Credentials                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `scripts/bootstrap.sql`                 | Writes the rows a deployment needs that no migration can: its account, project and settings row, `public.storage_config` and `private.deployment_settings`.                                                                                                           | Once after the migrations are pushed to a new database, and again after a key or address changes                          | A direct connection as `postgres` in the libpq `PG*` variables, and the service-role key                  |
| `scripts/grant-project-admin.sql`       | Gives one existing user the project-scope `admin` grant on the project of `PUBLIC_PROJECT_ID`.                                                                                                                                                                        | Once per administrator, after `bootstrap.sql`                                                                             | A connection as `postgres` in the libpq `PG*` variables                                                   |
| `scripts/grant-smoke-contestant.sql`    | Gives one existing user the `editor` grant on the project's first nominated `smoke_` candidate and records its acceptance of the terms of use, so that the deployed smoke run can sign in.                                                                            | Once, after `bootstrap.sql` and after the smoke dataset is in the project                                                 | A connection as `postgres` in the libpq `PG*` variables                                                   |
| `scripts/check-seed.sql`                | Reads a database for anything of the local seed: its users, a local Storage address or the demo key. Writes nothing.                                                                                                                                                  | After `bootstrap.sql`, and whenever a deployed database may have been seeded                                              | A role that reads `auth.users` and `public.storage_config`, in the libpq `PG*` variables                  |
| `scripts/check-deployment-settings.sql` | Reads whether `private.deployment_settings.behind_cloudflare` is `true`, on which the per-caller limits depend. Writes nothing.                                                                                                                                       | Run by the deploy job after each migration push; by hand after a change of the setting                                    | A connection as `postgres` in the libpq `PG*` variables                                                   |
| `scripts/push-migrations.sh`            | Pushes the pending migrations to one hosted project after a dry run and a typed project ref, then runs `check-drift.sh` against it.                                                                                                                                   | Run by the deploy job with `--confirmed-ref`; by hand from the staging Supabase runbook                                   | A linked work directory, `SUPABASE_DB_PASSWORD` and the project's connection in the libpq `PG*` variables |
| `scripts/check-drift.sh`                | Reads whether a database's migration history equals the manifest and its schema equals the migrations. Writes nothing to the database.                                                                                                                                | After pushing migrations, and before a schema change to a deployed database; `push-migrations.sh` runs it after each push | The target's connection in the libpq `PG*` variables; for `--target linked`, a linked project             |
| `scripts/probe-hosted.mjs`              | Reads a hosted project's settings, functions, buckets and catalog and compares them with the tracked files. Writes nothing.                                                                                                                                           | After a change of the hosted settings, the functions or the migrations                                                    | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ANON_KEY` and a connection in the libpq `PG*` variables                |
| `scripts/build-push-image.sh`           | Builds the frontend image of a clean, pushed commit, tags it with the commit id, pushes it and prints `image_digest=`.                                                                                                                                                | Run by the deploy job; by hand from the staging AWS runbook                                                               | A shell signed in to the AWS account that may push to the registry; `--self-test` needs none              |
| `scripts/running-image-digest.sh`       | Reads the digest of the image an ECS service runs now and prints `running_image_digest=`. Changes nothing.                                                                                                                                                            | Before a hand plan of the staging AWS root; run by the pull-request plan and the destroy workflow                         | A shell signed in to the AWS account                                                                      |
| `scripts/check-destroy-plan.sh`         | Checks that a saved destroy plan deletes exactly the `module.frontend` resources of the state, at least one, and nothing else.                                                                                                                                        | Run by both jobs of the destroy workflow                                                                                  | None: it reads the plan's JSON and the state list it is given                                             |
| `scripts/resolve-deployment.sh`         | Names the deployment a workflow run acts on from the map, this repository's id and the ref, and prints the roots, roles, topic, cluster, service and branches derived from its key; in plan mode, the list of every deployment this repository owns. Credential-free. | Run by the first job of every pipeline workflow; by hand to read what a ref would deploy                                  | `jq`; reads only the map and `bootstrap/terraform.tfvars`                                                 |
| `scripts/check-bootstrap-plan.sh`       | Checks a saved plan of `bootstrap`, as JSON: no delete or replace, no move that is not a no-op or an in-place update, and no create outside the keys it is told to expect.                                                                                            | Before every apply of `bootstrap`, from its runbook                                                                       | `jq`; it reads the plan's JSON only                                                                       |
| `scripts/request-loop.sh`               | Requests one URL repeatedly and counts the answers that were not 2xx.                                                                                                                                                                                                 | Beside a rollout, to count what a viewer saw                                                                              | None                                                                                                      |
| `scripts/relay-refusals.sh`             | Sends the analytics relay's nine refusal cases to one deployment and compares each status with the one expected.                                                                                                                                                      | While an analytics provider is active, after a change of the relay                                                        | None                                                                                                      |
| `scripts/posthog-read.sh`               | Asks the PostHog EU project one of four fixed questions and prints the answer as named counts, no event or property value.                                                                                                                                            | With `relay-refusals.sh`, to read what PostHog stored                                                                     | `POSTHOG_PERSONAL_API_KEY`, a read-only personal key; `--self-test` needs none                            |
| `scripts/load-check.sh`                 | Runs the voter-journey load check with k6 from its pinned image and prints the capacity figure; the method is in `scripts/load-check/README.md`.                                                                                                                      | Before a change of the service's size or scaling                                                                          | `SUPABASE_ANON_KEY` when the journey holds a data request; `--self-test` needs none                       |
| `scripts/check-inline-policies.sh`      | Reads whether any IAM user, or any role or user under a path, carries an inline policy. Read-only.                                                                                                                                                                    | After every apply of `bootstrap`, and whenever an identity is added to the account                                        | A shell signed in to the AWS account; `--self-test` needs none                                            |
| `local/check-proxy-topology.sh`         | Runs the production image behind nginx and checks the build id, the public origin, the form-post origin check, a spoofed forwarded address and the diagnostics switch, each with a control.                                                                           | Before a deployment changes its proxy, `ORIGIN`, `ADDRESS_HEADER` or `XFF_DEPTH`                                          | None; `--with-login` needs a Supabase URL, its anon key and a test account                                |
| `local/check-proxy-sigterm.sh`          | Runs the same stack and checks that the server drains a request in flight and exits by itself on SIGTERM, with a control.                                                                                                                                             | Before a deployment changes the image's entry point or its stop timeout                                                   | None                                                                                                      |

The settings types of the Supabase module have no script of their own: `terraform test` in
`modules/supabase` checks them, as the validation job runs it.

## The deploy pipeline

Three workflows under `.github/workflows/` make up the pipeline, and `main.yaml` is not one of them:
`deploy.yml` deploys one commit to one deployment, `destroy.yml` destroys one deployment's AWS
stack, and `infra-plan.yml` checks and plans the Terraform of a pull request for every deployment
the repository owns. The same three files run unedited upstream and in a downstream repository. The
workflow guards and `yarn lint:workflows` in [§ Guards](#guards) check all three without a
credential.

Each starts with `resolve`, a job with no credential and no environment that runs
`infra/scripts/resolve-deployment.sh` over the deployment map. A repository owns the entries whose
`github_repository_id` is its own; every other entry is inert in it. In `deploy.yml` the job picks
the one owned entry one of whose `deploy_branches` matches the pushed or dispatched ref, in
`destroy.yml` the owned entry whose destroy branch `deploy-evidence/destroy-<key>` is the pushed ref
(on a dispatch, the entry the ref deploys), and in `infra-plan.yml` the list of every owned entry
whose AWS root exists. It prints the key and every name derived from it: the environments, the
roots `infra/envs/<key>/aws` and `infra/envs/<key>/supabase`, the state keys, the roles, the alert
topic, the cluster and the service. A ref no owned entry matches, two entries matching one ref, a
malformed key or a missing root end the run at `resolve`, before any job names an environment or
asks for a token, so no run names an environment the map does not hold. Every later job takes its
environment, role, account, region and roots from the job's outputs. Upstream the map holds one
entry, `staging`, deployed from `deploy/staging`, and the examples below use it.

### What starts a deploy

The triggers are static and cover every deployment; the resolve job narrows them to one:

- A push to a `deploy/*` branch, `deploy/<key>` of the deployment the ref deploys.
- A push to a `deploy-evidence/**` branch other than `deploy-evidence/destroy-*`, for a deployment
  whose `deploy_branches` list `deploy-evidence/*`, as staging's do. The name holds no further `/`:
  the resolver and an environment's branch policy match one path segment only, so a nested name
  starts the workflow and is then refused at `resolve`, red and with no alert.
- A dispatch, from the deployment's `deploy/<key>` ref, once the workflow is on the default branch.
  GitHub offers a dispatch only for a workflow on the default branch, and the environment admits no
  other ref for it.

A push to `main` deploys nothing: no trigger of `deploy.yml` or `destroy.yml` names it, and neither
environment's branch policy admits it.

A push to a `deploy-evidence/**` branch other than `deploy-evidence/destroy-*` also starts
`infra-plan.yml`, its `checks` and `wrong-subject` jobs. A push to `deploy-evidence/destroy-<key>`
starts `destroy.yml` only: `infra-plan.yml` leaves those branches out, so its wrong-subject proof
never runs on a ref that a deployment without GitHub Environments trusts by name.

### The gated job and its order

← guide: [Deployment § The deploy pipeline](https://openvaa.org/developers-guide/deployment#the-deploy-pipeline)

← guide: [Operations § Rollback](https://openvaa.org/developers-guide/deployment/operations#rollback)

After `resolve`, a no-credential job, `checks`, runs: Terraform formatting, the validation of the
deployment's AWS root and `yarn test:unit:infra`. The `deploy` job needs both. It runs in the
deployment's GitHub Environment, `staging` for staging, and waits for its reviewer; for an entry
that names no environment it runs with none and starts at once. Its first step, before any call
to AWS, checks that the job's settings name the resolved deployment: the variable
`DEPLOY_ENVIRONMENT` must be the resolved key, a set `AWS_DEPLOY_ROLE_ARN` must equal the resolved
deploy role (the role assumed is always the resolved one), and `public_origin` of the Supabase
root's tfvars must be `https://<domain>` of the entry, so that the smoke run's target and the
address read again after it are one origin. Then, in this order:

1. **Build**, by digest. The deploy role is assumed and `infra/scripts/build-push-image.sh` builds
   the commit natively on `ubuntu-24.04-arm` from a `git archive` of it, pushes the image under the
   commit id and prints `image_digest=`. Status 3 means the registry already holds the commit's
   image, which is deployed as it is. The role's credentials are then dropped from the job's
   environment, and they are dropped again after the plan and after the stable check: the role is
   assumed only for the steps that call AWS, so no tool, package or browser install and no Supabase
   CLI call runs with them.
2. **Plan**, of the deployment's AWS root with `-var "image_digest=<digest>"`, saved under
   `$RUNNER_TEMP` and printed with `terraform show -no-color` to the log and the step summary.
3. **Migrations.** A temporary work directory is linked to the Supabase project, and
   `infra/scripts/push-migrations.sh --deployment <key> --confirmed-ref` pushes the pending
   migrations through the session pooler over TLS with `PGSSLMODE=verify-full` against the
   Supabase root committed under `infra/certs`, which refuses a server that root did not sign or
   whose certificate does not name the pooler host, and checks for drift afterwards. The session
   pooler offers no SCRAM channel binding, so none is required. The script accepts the flag only
   in an Actions job with `DEPLOY_ENVIRONMENT=<key>` on a `deploy/<key>` or `deploy-evidence/*`
   ref, and only for the `project_ref` of that deployment's Supabase tfvars, which guards against
   a mistake and proves no environment: a repository variable of the same name, or any shell that
   sets those variables, passes it. The boundary is `SUPABASE_DB_PASSWORD`, an environment secret
   of `staging` alone for staging; for a deployment without GitHub Environments it is a
   repository secret, and the trigger branch is the only gate.
4. **Settings check.** `infra/scripts/check-deployment-settings.sql` is run with psql as
   `postgres.<ref>` through the session pooler over the same verified connection
   (`PGSSLMODE=verify-full` against the committed root), with the database password in
   `PGPASSWORD` alone, and fails the run before the functions and the apply unless
   `private.deployment_settings.behind_cloudflare` is `true`: the per-caller limit of
   `account-access` and the feedback limit trust `cf-connecting-ip` only then. The setting is
   written by the operator's bootstrap
   ([`infra/envs/staging/supabase/README.md` § Step 20](envs/staging/supabase/README.md#step-20-the-bootstrap))
   and never by the pipeline, which only reads it.
5. **Functions.** All three are deployed from the linked directory, and the Management API's list
   must then show three `ACTIVE` functions, each with `verify_jwt` as `config.toml` says, whose
   slugs are the function directories of the commit.
6. **Apply** of the saved plan, with the role assumed again so that its credentials outlive it.
7. **Stable check.** The step reads the service up to 60 times, 15 s apart, until the primary
   deployment on the task definition just applied has `rolloutState` `COMPLETED` with at least
   `task_floor` tasks running. Another task definition, `FAILED` or another state, or fewer tasks
   fail it at once, and a rollout still `IN_PROGRESS` at the last read fails it.
8. **Smoke run.** `yarn test:e2e:deployed` against `https://<domain>`, with `SMOKE_DEPLOYMENT`
   set to the key, `SMOKE_EXPECTED_SHA` to the built commit, the two contestant secrets, and no AWS
   credential.
9. **`/api/health` re-read.** It must still serve the built commit, so that a deploy landing while
   the specs ran cannot leave a `PASS sha` line speaking for a build the specs never drove.
10. **Failure alert.** The plan, the smoke output and the step files are removed whatever the
    outcome. When a step failed or the run was cancelled, the role is assumed once more and one
    message goes to the deployment's SNS topic, `openvaa-<key>-frontend-deployments`, naming the
    deployment, the stage, the commit, the trigger and the run.

The pipeline applies the deployment's AWS root only. The Supabase root's hosted settings and function
secrets are applied by hand, and no stage reads them before the functions are deployed. A commit
that changes `modules/supabase/hosted-settings.json`, `modules/supabase/function-secrets.tf` or
`envs/staging/supabase/terraform.tfvars` is therefore applied by hand first, from
[`envs/staging/supabase/README.md` § Step 18](envs/staging/supabase/README.md#step-18-the-settings-and-the-function-secrets),
and pushed to `deploy/staging` only once that apply is done. Otherwise its functions are deployed
against settings or secrets the project does not serve yet.

A failed step stops every later one but the cleanup and the alert. `deploy.yml` and `destroy.yml`
share one constant concurrency group, `aws-pipeline`, with `cancel-in-progress: false`: a run
waiting for the group is replaced by a newer one, and a running one is never cancelled. The group is
workflow-wide and the same for every deployment of a repository, so a run whose gated job waits for
approval is already running and holds it, and two deployments of one repository never deploy at
once. GitHub scopes a group to its repository, so upstream and a downstream repository do not
share it. A group name only orders the runs that carry it: before a change of the group's name
reaches `main`, no run may be waiting on the old group, or it runs beside one on the new.

### The environments and their settings

← guide: [Deployment § The deploy pipeline](https://openvaa.org/developers-guide/deployment#the-deploy-pipeline)

← guide: [Operations § The GitHub secrets](https://openvaa.org/developers-guide/deployment/operations#the-github-secrets)

A deployment's entry names its GitHub Environments, `environment` for the deploy job and
`destroy_environment` for the destroy jobs, or none. Staging names both, with these settings:

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
Supabase token exists in a destroy job. The repository itself holds the secret `ALERT_EMAIL`, for
the pull-request plan. No workflow reads a role ARN from a repository variable: the pull-request
plan assumes each deployment's plan role as the resolve job derives it from the map, so the
repository needs no `AWS_PLAN_ROLE_ARN`, and a variable of that name is read by nothing.
The service-role key is in none of them and in no workflow. `ALERT_EMAIL` is the address the
stack's alert subscription uses.

Both environments must exist, with these settings read back, before any push that carries a workflow
naming them. GitHub creates an environment a job names and that does not exist yet, with no
protection rule at all, and the deploy role trusts every job that names it.

A deployment whose entry names no environment, such as one in a private repository on GitHub Free,
where environments are not available, keeps the same settings as repository secrets and variables:
`SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`,
`SMOKE_CONTESTANT_PASSWORD` and `ALERT_EMAIL` as secrets, and `SUPABASE_POOLER_HOST` and
`DEPLOY_ENVIRONMENT=<key>` as variables. `AWS_DEPLOY_ROLE_ARN` may be left unset. Its deploy and
destroy jobs run with no environment, its deploy role trusts the subjects of its branches, and
[§ Accepted risks](#accepted-risks) lists what that gives up.

### The pull-request workflow

`infra-plan.yml` runs on a pull request to any base that touches `infra/**` or the workflow itself,
and on a push to a `deploy-evidence/**` branch other than `deploy-evidence/destroy-*`. Its `resolve`
job lists the deployments this repository owns, and the `plan` and `wrong-subject` jobs run once
for each, as a matrix that does not stop at the first red entry.

- `checks`, with no credential: formatting, `init -backend=false` and `validate` of every root,
  `terraform test` of every module that has tests, and the plan of each example root against mock
  providers.
- `plan`, for a pull request from this repository only, once per owned deployment: assumes that
  deployment's read-only plan role, reads the digest its service runs, and plans its AWS root with
  `-lock=false`, printing the plan. Taking no lock, it can show a diff against a state an apply is
  writing at the same time; the next push to the pull request plans again. A fork's pull request
  gets no token and no secret, and the job's `if` skips it, so it shows as skipped.
- `wrong-subject`, on a push only, once per owned deployment: names no environment, so its token's
  subject is the pushed branch's ref, which neither of that deployment's roles trusts. It passes
  only when STS refuses that subject for both the deploy role and the plan role with `AccessDenied`, printing each error code; another code,
  such as `InvalidIdentityToken` for a missing OIDC provider, fails it. STS answers `AccessDenied`
  for a role that does not exist as well, so the pull-request plan and the deploy runs, which
  assume the same two ARNs, are what show the ARNs right.

### The destroy workflow

← guide: [Operations § Teardown](https://openvaa.org/developers-guide/deployment/operations#teardown)

`destroy.yml` starts on a push to a `deploy-evidence/destroy-<key>` branch, which the deploy and
pull-request workflows exclude, or on a dispatch from a `deploy/<key>` ref whose `confirm` input is
`destroy <key> aws`; for staging, `deploy-evidence/destroy-staging`, `deploy/staging` and
`destroy staging aws`. Its resolve job picks the deployment the branch or the ref names. A
deployment without GitHub Environments whose destroy is to be started by a push lists
`ref:refs/heads/deploy-evidence/destroy-<key>` among its `deploy_subjects`. The workflow has two
jobs, each in the deployment's destroy environment, `staging-destroy` for staging, and each waiting
for its own approval there:

1. `plan-destroy` shows the Supabase root out of reach first: an init of
   `infra/envs/<key>/supabase` and a read of its state key under `hand/` must both be refused to
   the deploy role. It then lists the AWS root's state, plans `-destroy` of that root into a saved
   plan with a placeholder digest, and checks it with `infra/scripts/check-destroy-plan.sh`
   (every change a delete under `module.frontend`, of exactly the managed addresses the state holds,
   and at least one) before it prints it.
2. `apply-destroy` plans again into its own saved plan, so that no plan crosses jobs, checks and
   prints it the same way, applies it, and fails unless the state is then empty.

An evidence run is approved at `plan-destroy` and rejected at `apply-destroy`, so it destroys
nothing. A real destroy is approved at both. A deployment without GitHub Environments has no
approval to give: its two jobs run one after the other, and the push or the typed `confirm` input
is the only gate.

### How a hand plan names the image

No variable file holds `image_digest`. A plan by hand, like the pull-request plan, passes the digest
the service runs now, so that its diff shows the infrastructure change alone:
`infra/scripts/running-image-digest.sh --cluster openvaa-<key> --service openvaa-<key>-frontend`,
for staging `--cluster openvaa-staging --service openvaa-staging-frontend`, prints
`running_image_digest=`, and the plan takes it as `-var "image_digest=$DIGEST"`.
[`envs/staging/aws/README.md`](envs/staging/aws/README.md) gives the commands.

### Reading a red run

← guide: [Deployment § The deploy pipeline](https://openvaa.org/developers-guide/deployment#the-deploy-pipeline)

The alert mail's subject names the stage that failed. Every step of the gated job belongs to the
stage it follows: `setup` is the checkout, the check of the resolved settings and the first role assumption, before anything is built;
`plan` is every step after the image push up to the printed plan, the Node, Yarn, psql and
Terraform setup among them; `migrations` begins where the plan's credentials are dropped;
`settings` is the settings check alone, after the migrations;
`rollout` includes the role assumption before the apply, after the functions are deployed; `smoke`
includes the Playwright install; `cleanup` is the removal of the step files, after everything else. `cancelled` means a cancelled
run, and `unknown` a failed job in which no step reads as failed. A stage at or after `migrations`
means the persistent Supabase project may already hold that run's migrations. A red `checks` job
sends no alert, because it holds no credential and the gated job never starts. The stage's step
log then says why:

| Stage        | What to read in the step's log                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `build`      | The `refused=` or `failed=` line of `build-push-image.sh`, and `build_exit=`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `plan`       | `plan_exit=` and Terraform's own error. `does not match any of the checksums recorded in the dependency lock file`, after an init that printed `Provider lock file not updated`, means the root's lock has no hash for the runner's platform                                                                                                                                                                                                                                                                                                                                                                                              |
| `migrations` | `link_exit=` and `linked_ref=` of the link step; then the `push_*` lines of `push-migrations.sh` (`push_connection=`, `push_pending=`, `push_confirmation=`, `push_status=`) and `drift_status=`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `settings`   | `settings_exit=` and psql's error. Status 3 with an error beginning `check-deployment-settings:` is a finding: the project does not trust `cf-connecting-ip`, fixed by the bootstrap of [Step 20](envs/staging/supabase/README.md#step-20-the-bootstrap) with `BOOTSTRAP_BEHIND_CLOUDFLARE=true`. Status 3 with any other error means the check could not run, status 2 a refused or lost connection, and status 1 a failure of psql itself, such as a script file it could not read. A step cut off at its two-minute limit prints no `settings_exit=` line, and the runner reports the timeout. The run's migrations are already pushed |
| `functions`  | `functions_deploy_exit=`, `functions_list_http=`, the `function=` lines, one per function with its `status=`, `verify_jwt=` and `expected_verify_jwt=`, then `functions_expected=` and `functions_served=`                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `rollout`    | The second role assumption's error, or `apply_exit=`; a rollout the circuit breaker stops also sends the stack's own rollout alert through the same topic                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `stable`     | One `stable_poll=<n>` line opens each read's lines: `stable_describe_exit=`, `stable_task_definition_matches=`, `stable_rollout_state=`, `stable_running=`, `stable_desired=`. The last read's lines say why it failed. The error line `still IN_PROGRESS after 60 reads` means the rollout neither completed nor failed within the bound; the ECS service's deployments and events say where it stands                                                                                                                                                                                                                                   |
| `smoke`      | The smoke gate's `PASS` and `FAIL` lines and `smoke_exit=`, or `served_build_after_smoke=` of the re-read                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `cleanup`    | The `rm` error of the removal step; every stage before it passed                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

The lines this table lists are printed because every step reads a command's status as
`cmd || name=$?`, which the runner's `bash -e` lets run, while any other failing command ends the
step with its own error output.

No report, plan or output directory is uploaded from any job, on a green run or a red one: the log
is all there is. An alert that could not be sent prints `alert_error=` in the alert step.

### Recovery

← guide: [Operations § Rollback](https://openvaa.org/developers-guide/deployment/operations#rollback)

← guide: [Operations § Teardown](https://openvaa.org/developers-guide/deployment/operations#teardown)

- An apply cut short by a timeout, a cancel or a lost runner can leave the state lock held. Once no
  run is applying, release it from the operator's shell with
  `terraform -chdir=infra/envs/<key>/aws force-unlock <lock id>`, the id taken from the lock
  error of the next plan.
- No hand apply of a deployment's AWS root while a run waits or runs: a saved plan is refused once the
  state has changed under it, and the run turns red at its apply.
- A run waiting for approval holds the group until it is approved, rejected or cancelled, and
  blocks every later deploy and destroy of every deployment of the repository until then: reject or cancel a stale one before pushing
  again. A run waiting for the group is replaced by a newer one; to deploy the commit it carried,
  push it again or re-run it once the newer run is done.
- A destroy that stopped part-way, on a lost runner, a timeout or a failed delete, is finished by
  running the destroy workflow again: its plan reads no running service, and its guard plans the
  destroy of whatever the state still holds.
- Between a real destroy and the next deploy there is no service to read a digest from, so the
  pull-request plan is red at "Read the digest the service runs". The deploy from nothing ends it.
- A red run keeps what it already did: pushed migrations stay pushed and can only be followed by a
  new migration, and deployed functions stay deployed. The fix goes forward, as a new commit on
  `deploy/<key>`.

### Evidence branches

Until the milestone merges, every observed run is fed by a source-only commit: built with a
temporary index from the branch tip with `.planning/` removed, parented on `origin/main`, pushed to
a flat `deploy-evidence/<name>` branch and, once green, to `deploy/staging`. No `.planning/` file is
on any of those branches, and each push is an operator's step. After the merge, `deploy/staging` is
fast-forwarded to a `main` commit.

### Accepted risks

The account hosts more than one deployment, each with its own roles, and IAM cannot scope every
action between them. The bullets below hold for each deployment, with "the other deployment" meaning
any other entry of the map.

- The plan role's trust is not pinned to a workflow: any workflow of a pull request from this
  repository can assume it.
- The plan role's read-only remainder can read the origin secret, in the pipeline state and in the
  configuration of the CloudFront distribution and of the load balancer's rules.
- `SUPABASE_ACCESS_TOKEN` reaches every project of its Supabase account, not the deployment's
  project alone.
- A deploy has one approval, given when the deploy job starts in its environment, before the Terraform plan and
  the list of pending migrations exist. Approving it releases the migration push, which cannot be
  undone. The reviewer approves the commit, and its diff of `apps/supabase/supabase/migrations/`
  since the last deploy is the pending list.
- Between a real destroy and the redeploy the alert topic does not exist, so a failure in that
  window sends no alert, and the new subscription has to be confirmed again.
- An assumption of the deploy role that fails cannot publish its own alert: the alert step needs
  that role too, so such a run is red with no mail.
- The deploy role's EC2, CloudFront and certificate scopes test the tags `Project=openvaa`,
  `Root=aws` and `Environment=<key>`, which name the project, the root and the deployment. A
  distribution, certificate or network resource in the account that carries another deployment's
  three tags, such as one tagged by hand, is within that deployment's reach. A resource without
  them is not: no tag call of the role is allowed on the request's tags alone.
- ECS scopes neither `RegisterTaskDefinition` nor `DeregisterTaskDefinition` to a family, so each
  deploy role can register and deregister task definitions of any family in the account, the other
  deployment's included. It can also subscribe any endpoint to its deployment topic and rewrite the
  topic's policy, which the root manages.
- Application Auto Scaling writes are scoped by service namespace and scalable dimension only, so
  each deploy role can register, change and delete the scaling target and policies of the other
  deployment's service, its desired-count bounds included.
- Each plan role reads the other deployment's configuration through the AWS-managed
  `ReadOnlyAccess`: the CloudFront distribution and its configuration (`GetDistribution`,
  `GetDistributionConfig`), the load balancer, its listeners, rules, target groups, attributes and
  tags (`DescribeLoadBalancers`, `DescribeListeners`, `DescribeRules`, `DescribeTargetGroups`,
  `DescribeLoadBalancerAttributes`, `DescribeTags`), its SSM String parameters (`GetParameter`,
  `GetParameters`, `GetParametersByPath`), and its ECS service and task definitions
  (`DescribeServices`, `DescribeTaskDefinition`). The origin secret header is among them. Whether
  any of these actions takes a resource-tag condition is unconfirmed, so no tag-conditioned deny
  narrows them; a confirmed one can be added to the plan role's deny policy in place. The plan
  role's deny still keeps every S3 object but its own pipeline state, every secret value and every
  data-plane read out of its reach.
- The account has one monthly budget, so its alert cannot say which deployment spent.
- A deployment with no GitHub Environments, such as one in a private repository on GitHub Free, has
  no reviewer gate: any writer of its repository can push its deploy branch, or its destroy branch,
  and the run deploys, pushes migrations or destroys at once. Its secrets are repository secrets,
  which every workflow of that repository can read, and its deploy role trusts its branches by
  name, not an environment. The trigger branch is the only gate.

## Adding a deployment

← guide: [Deployment § Adding a deployment from a downstream repository](https://openvaa.org/developers-guide/deployment#adding-a-deployment-from-a-downstream-repository)

A deployment beside staging, in the same account, is one entry of the map and three env roots. The
entry is upstream's, because the map is; the roots, the branches and the settings are the
deploying repository's, so a downstream repository adds them under its own `infra/envs/<key>/`
without changing an upstream file. The three workflows run there unedited.

1. **The entry, by a pull request to the upstream repository.** It adds one key to
   [`bootstrap/deployments.auto.tfvars.json`](bootstrap/deployments.auto.tfvars.json), shaped like
   [`bootstrap/example-deployments.json`](bootstrap/example-deployments.json). The key is the
   deployment's name: it starts with a lower-case letter, holds only lower-case letters, digits and
   hyphens, and is at most 15 characters long, because the load balancer's name carries it. The
   fields, which the `deployments` variable's description in
   [`bootstrap/variables.tf`](bootstrap/variables.tf) states in full:
   - `github_repository_id` and `github_repository_owner_id`, the numeric ids of the repository
     that deploys it and of its owner. A repository acts only on the entries that carry its own id.
   - `plan_subjects` and `deploy_subjects`, the exact OIDC subjects the plan role and the deploy
     role trust. An entry with GitHub Environments trusts its environments,
     `...:environment:<name>`; one without trusts its branches, `...:ref:refs/heads/<branch>`, one
     subject per branch, since a subject holds no wildcard. When its destroy is to be started by a
     push, its `deploy_subjects` list `ref:refs/heads/deploy-evidence/destroy-<key>` as well. A
     repository created after 2026-07-15 receives the id-bearing form
     `repo:OWNER@OWNER-ID/REPO@REPO-ID:...`; one created before keeps `repo:OWNER/REPO:...`. Read
     the exact `sub` from a token probe in the deploying repository, as
     [`bootstrap/README.md` § Step 13](bootstrap/README.md#step-13-adding-a-deployment) shows, and
     copy it: a subject that differs by one character is refused.
   - `deploy_branches`, the branches that deploy it, `deploy/<key>` and, for evidence runs,
     `deploy-evidence/*`.
   - `hosted_zone_id` and `domain`, the delegated zone its dns-mail root creates and the domain the
     site serves.
   - `environment` and `destroy_environment`, the GitHub Environments its deploy and destroy jobs
     name; left out, the jobs name none.
   - `registry_name` and `iam_name_prefix`, which override the derived names
     `openvaa-<key>-frontend` and `openvaa-<key>`. Only staging sets them, to keep the names it has.
2. **The operator applies `bootstrap`** from its runbook,
   [`bootstrap/README.md` § Step 13](bootstrap/README.md#step-13-adding-a-deployment). The plan
   guard admits creates under the new key only, so the apply creates that entry's roles, policies,
   execution role and image repository and changes no other deployment's resource.
3. **The deploying repository copies the roots.** `infra/envs/example/dns-mail`,
   `infra/envs/example/supabase` and `infra/envs/example/aws` go to `infra/envs/<key>/`, under the
   same three names. In each copy the backend key names the deployment: `hand/<key>/dns-mail`,
   `hand/<key>/supabase` and `pipeline/<key>/aws`, each followed by `/terraform.tfstate`, and the
   bucket is the account's state bucket. Each copy keeps its `.terraform.lock.hcl` as it is, with
   its hashes for the four platforms linux_amd64, linux_arm64, darwin_arm64 and darwin_amd64,
   because the validation of every root and every init of the pipeline read the lock as it is
   (`-lockfile=readonly`), the deploy job's on an ARM runner. `infra/scripts/rootCopies.test.ts`
   compares every root under `infra/envs/` with staging's root of the same name, so a module input
   left out of a copy fails `yarn test:unit:infra`.
4. **The deploying repository creates its branches and settings.** The branches are `deploy/<key>`,
   whose push deploys, and `deploy-evidence/destroy-<key>`, whose push destroys. The repository
   variable `DEPLOY_ENVIRONMENT` is `<key>`, and the secrets of
   [§ The environments and their settings](#the-environments-and-their-settings) are environment
   secrets of its environments or, without environments, repository secrets. The workflows resolve
   the deployment from the repository's id and the ref, so none of them is edited.

## Example environment

← guide: [Deployment § Fork and configure](https://openvaa.org/developers-guide/deployment#fork-and-configure)

`envs/example/` is what a fork copies to start a deployment of its own. Nothing applies it; the
validation job validates it, so it stays in step with the staging roots, and the pull-request
workflow plans each of its roots with mock providers. No workflow applies it: the workflow guards
fail on any `apply` or `destroy` outside the AWS root the resolve job names, and no entry of the map
is called `example`. A downstream repository that deploys into upstream's account follows
[§ Adding a deployment](#adding-a-deployment) instead; a fork that deploys into a separate account follows
these steps.

1. Copy `bootstrap/example.tfvars` over `bootstrap/terraform.tfvars` and replace every stand-in: the
   account id `000000000000` and the bucket name. Replace the bucket in `bootstrap/backend.tf` with
   the same name. Terraform documents that it loads `terraform.tfvars` and `*.auto.tfvars` by
   itself, so `example.tfvars` is never read. Then replace the map
   `bootstrap/deployments.auto.tfvars.json` with your own entries, shaped like
   `bootstrap/example-deployments.json`: your repository's ids, the OIDC subjects, the deploy
   branches, the zone and the domain, and the GitHub Environments when your jobs name them, as
   [§ Adding a deployment](#adding-a-deployment) describes each field.
2. Copy each root of `envs/example/` to `envs/<key>/`, with the key of your map entry. In each,
   replace the bucket `REPLACE-ME-tfstate` in the backend block with your state bucket and `example`
   in the state key with the key, and replace the stand-in values in `terraform.tfvars`. Each stand-in account id makes
   the provider refuse every real shell, so an unedited copy cannot be applied.
3. Write the OIDC subjects in the form your repository's tokens carry. GitHub documents two forms:
   - `repo:OWNER/REPO:environment:ENVIRONMENT`, the name-based form, kept by a repository created
     before 2026-07-15 until it is renamed, transferred or opted in to the other form;
   - `repo:OWNER@OWNER-ID/REPO@REPO-ID:environment:ENVIRONMENT`, with the numeric ids of the owner
     and of the repository, used by every repository created after that date, a fork included.

   The pull-request subject ends in `:pull_request` instead of `:environment:ENVIRONMENT`. A subject
   that differs by one character is refused, so copy it exactly.

4. Apply the roots in the order above, each from its runbook.
