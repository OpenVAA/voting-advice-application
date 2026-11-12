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
| `envs/staging/aws`      | The staging application's network, load balancer, Fargate service and CloudFront distribution, the two certificates and their records in the delegated zone, the service's scaling and the deployment alert | `pipeline/staging/aws/terraform.tfstate`                     | By hand, from its runbook, until the deploy workflow exists; then by that workflow, through the deploy role | Not yet                                                                |
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

Once the deploy workflow exists, it takes over `envs/staging/aws` on the same state, and its first run
must be a plan that shows no change.

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
- Before a workflow first assumes the deploy role, the GitHub Environment that role is bound to
  (`deploy_environment` of `bootstrap`) allows deployments from the default branch only, through a
  deployment branch policy. The deploy role trusts every job that names that environment, so the
  branch policy, which is a repository setting and not code, is what keeps other branches out.

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

| Guard                        | What it checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | How to run it                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No inline IAM policies       | No `.tf` file under `infra/` declares an inline IAM policy in any form, and no `.tf.json` file exists there. A link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                      | `yarn assert:no-inline-iam-policies`                                                                                                                                                                                                                                                                                                                                                 |
| Hosted settings parity       | The hosted settings in `modules/supabase/hosted-settings.json` match the local Supabase configuration key by key. A link of `yarn lint:check`.                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `yarn assert:hosted-settings-parity`                                                                                                                                                                                                                                                                                                                                                 |
| The validation job           | `infra-validate` in `.github/workflows/main.yaml`: formatting, `init -backend=false` and `validate` of every root, `terraform test` of every module that has a `tests` directory, and the settings types of the Supabase module. No credentials.                                                                                                                                                                                                                                                                                                                                               | `terraform fmt -check -recursive infra`, then for each root `terraform -chdir=<root> init -backend=false -input=false -lockfile=readonly` and `terraform -chdir=<root> validate`, then for each module with a `tests` directory `terraform -chdir=<module> init -backend=false -input=false` and `terraform -chdir=<module> test`, then `bash infra/scripts/check-settings-types.sh` |
| No inline user policy in AWS | The account side of the same rule: no IAM user in the account carries an inline policy. Run by the operator with credentials; read-only.                                                                                                                                                                                                                                                                                                                                                                                                                                                       | `infra/scripts/account-inventory.sh --assert-no-inline-user-policies`                                                                                                                                                                                                                                                                                                                |
| Hosted conformance probe     | A hosted project serves what the repository declares for it: the auth and API settings, the three functions and their `verify_jwt`, the buckets, the hook functions, the `anon` timeout, the Postgres major version, one read of more than 1000 rows, and no trace of the local seed. It compares the project's Management API, its public API read with the anon key (with no key for the `identity-callback` calls), and its catalog with the tracked files the parity guard reads, and writes nothing to the project. Run by an operator with credentials; not a link of `yarn lint:check`. | `node infra/scripts/probe-hosted.mjs --root infra/envs/<environment>/supabase`, as Step 23 of [`envs/staging/supabase/README.md`](envs/staging/supabase/README.md) gives it                                                                                                                                                                                                          |

## Example environment

`envs/example/` is what a fork copies to start a deployment of its own. Nothing applies it; the
validation job validates it, so it stays in step with the staging roots.

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
