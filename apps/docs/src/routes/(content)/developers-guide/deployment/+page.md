# Deployment

A production OpenVAA has three parts:

- **The frontend on AWS.** The SvelteKit app is built into a Node container from [`apps/frontend/Dockerfile`](https://github.com/OpenVAA/voting-advice-application/blob/main/apps/frontend/Dockerfile) and runs as an ECS service behind a load balancer and a CloudFront distribution, in an AWS account of your own. Terraform under [`infra/`](https://github.com/OpenVAA/voting-advice-application/tree/main/infra) writes every resource of it.
- **The backend**, a hosted [Supabase](https://supabase.com/) project: the database, Auth, Storage and the three Edge Functions. You create the project by hand; the Supabase Terraform module imports it and writes its auth and API settings and its function secrets.
- **The deploy pipeline**, [`.github/workflows/deploy.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/.github/workflows/deploy.yml). Behind a GitHub environment's required reviewer it builds one commit, pushes the migrations and the functions, applies the AWS root and runs a smoke test against the deployed site.

The frontend reads its configuration at run time (see [Environment variables](/developers-guide/configuration/environmental-variables)), so the same image works in any environment once its variables are set.

## From an empty account to a tested instance

The stages below take an empty AWS account and a new Supabase project to a tested instance, in the order of [`infra/README.md` § Order](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#order):

1. [Fork and configure](#fork-and-configure)
2. [The account-level root](#the-account-level-root)
3. [The zone and mail root](#the-zone-and-mail-root)
4. [The Supabase project](#the-supabase-project)
5. [The two parameters](#the-two-parameters)
6. [The AWS root and its image](#the-aws-root-and-its-image)
7. [Checking the instance](#checking-the-instance)
8. [The deploy pipeline](#the-deploy-pipeline)

Each stage gives the step, its command against your copy of a root, and the result to expect, and links the runbook step where it was measured. The runbooks under `infra/` are the record of OpenVAA's own staging deployment, the worked instance of this guide: "observed on staging" with a date cites a row of that runbook's Observations table. They hold the full procedure of each step, with its stop rules and the lines to read back; the commands here are the steps' core. The placeholders are `<account-id>` (your AWS account id), `<your-environment>` (the name of your environment, such as `production`), `<your-domain>` (the domain the site serves), `<state-bucket>` (your state bucket) and `<project-ref>` (your Supabase project's ref).

The HCL is kept to what OpenTofu also accepts; the repository runs and tests it with Terraform 1.16, the version `infra/.terraform-version` pins. [§ Prerequisites](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#prerequisites) lists the tools and the AWS identity an apply needs; the later stages also use `psql` and Docker with buildx. [§ Rules of every apply](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#rules-of-every-apply) holds for every command below: an exit status is read on the line after its command and never through a pipe, a secret is typed into one shell session and written to no file, and `terraform.tfvars` is tracked and public, so it holds no secret.

### Fork and configure

Fork the repository and make the changes your instance needs. At least edit the [static settings](/developers-guide/configuration/static-settings) in `packages/app-shared/src/settings/staticSettings.ts`: the locales, colours, font and admin email.

Then copy the template roots. `infra/envs/example/` holds the zone-and-mail, Supabase and AWS roots with stand-in values, and `infra/bootstrap/example.tfvars` the account-level root's:

```bash
cp infra/bootstrap/example.tfvars infra/bootstrap/terraform.tfvars
mkdir -p infra/envs/<your-environment>
for r in dns-mail supabase aws; do
  cp -R "infra/envs/example/$r" "infra/envs/<your-environment>/$r"
done
```

In each copy replace every stand-in: the account id `000000000000` with `<account-id>`, the domain `vaa.example.org` with `<your-domain>`, the bucket `REPLACE-ME-tfstate` in the backend block with `<state-bucket>` and `example` in the state key with `<your-environment>`; in `infra/bootstrap` also the bucket of `backend.tf` and the OIDC subjects, in the form your repository's tokens carry. An unedited copy cannot be applied: each stand-in account id makes the provider refuse every real shell. [§ Example environment](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#example-environment) describes each replacement and the two subject forms.

### The account-level root

`infra/bootstrap` holds what every other root rests on: the state bucket, the image registry, the GitHub OIDC provider with the plan and deploy roles, the monthly budget and its alert, and the frontend's execution role. Its first apply runs on local state through an untracked backend override, because the bucket its backend names does not exist yet; the state then moves into that bucket.

The execution role's policy names the parameter store's AWS-managed key `alias/aws/ssm`, which AWS creates only when a SecureString parameter first uses it, and the plan of this root fails on reading that key until then ([Step 8](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/bootstrap/README.md#step-8-the-frontend-execution-role), its precondition). On a new account, run `put ANALYTICS_POSTHOG_KEY` of [The two parameters](#the-two-parameters) before this root's first plan; a stand-in value serves, and the anon key follows once the Supabase project exists.

```bash
cd infra/bootstrap
export TF_VAR_alert_email='<your-address>'
printf 'terraform {\n  backend "local" {}\n}\n' > backend_override.tf
terraform init -input=false
terraform plan -input=false -out=tfplan
terraform apply -input=false tfplan; echo "apply_exit=$?"
rm tfplan backend_override.tf
terraform init -migrate-state
terraform plan -input=false -detailed-exitcode; echo "plan_exit=$?"
```

The second plan exits 0, no change, with the state in `<state-bucket>`; remove the local `terraform.tfstate` files only after reading the remote copy back. Observed on staging, 2026-10-21: the first apply on local state created 23 resources, and after the migration the second plan showed no change ([Step 2](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/bootstrap/README.md#step-2-first-apply-with-local-state), [Step 3](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/bootstrap/README.md#step-3-migrate-the-state-and-plan-again), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/bootstrap/README.md#observations)). The runbook's Step 7 tests the budget alert at a low amount before raising it, and Step 9 proves the deploy role's policies before they are applied.

### The zone and mail root

`infra/envs/<your-environment>/dns-mail` holds the public hosted zone of `<your-domain>`, the SES mail identity with its DKIM, MAIL FROM and DMARC records, and the SMTP user whose credentials the Supabase project sends mail with.

```bash
cd infra/envs/<your-environment>/dns-mail
terraform init -input=false
terraform plan -input=false -out=tfplan
terraform apply -input=false tfplan; echo "apply_exit=$?"
rm tfplan
terraform output name_servers
```

Add the four name servers it prints as `NS` records at the DNS host of the parent zone, by hand: the parent zone is outside every root. Once the delegation resolves, the identity verifies. Observed on staging, 2026-10-22: the root added 14 resources; the parent zone's name servers then returned a referral naming exactly the zone's four name servers, and the identity read as verified for sending with DKIM and the MAIL FROM domain both `SUCCESS` ([Step 1](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#step-1-first-apply), [Step 5](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#step-5-the-delegation-at-the-parent-zones-dns-host), [Step 7](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#step-7-the-wait-for-the-identity-to-verify), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#observations)).

AWS documents that a new account sends from the SES sandbox, which delivers only to verified addresses, until its production-access request is granted ([Step 8](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/dns-mail/README.md#step-8-the-production-access-request)). Staging's account already had production access when it was read, on 2026-10-22, so no request was filed there; [SES: sandbox and production access](/developers-guide/deployment/operations#ses-sandbox-and-production-access) describes the request.

### The Supabase project

Create the project by hand in the Supabase dashboard, and choose its region first: a project's region cannot be changed later ([Step 8](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-8-choose-the-region-and-create-the-project)). Write its ref, organisation slug, name and region into `infra/envs/<your-environment>/supabase/terraform.tfvars`, with `public_origin` set to `https://<your-domain>`. The root's `import` block imports the project, so no plan of it ever creates one.

**The root's settings.** One plan and one apply import the project and write its auth and API settings, its two hooks, the function secrets of `infra/modules/supabase/function-secrets.tf` (the SMTP ones among them) and, only while the send-email hook is off, the auth service's SMTP settings. The SMTP credentials come from the zone-and-mail root's outputs:

```bash
cd "$(git rev-parse --show-toplevel)"
T=infra/envs/<your-environment>/supabase
D=infra/envs/<your-environment>/dns-mail
printf 'access token: '; read -rs SUPABASE_ACCESS_TOKEN; echo
printf 'database password: '; read -rs TF_VAR_database_password; echo
TF_VAR_smtp_user=$(terraform -chdir="$D" output -raw smtp_username)
TF_VAR_smtp_password=$(terraform -chdir="$D" output -raw smtp_password)
export SUPABASE_ACCESS_TOKEN TF_VAR_database_password \
  TF_VAR_smtp_user TF_VAR_smtp_password
terraform -chdir="$T" init -input=false
terraform -chdir="$T" plan -input=false -out=tfplan
terraform -chdir="$T" apply -input=false tfplan; echo "apply_exit=$?"
rm -f "$T/tfplan"
```

Read the plan before the apply. It imports the project with no change to it, and a plan that shows a destroy or a replacement is never applied, because the project holds the only copy of its data. The plan file holds the settings and the passwords in clear text, so it is removed after the apply and never shared. Observed on staging, 2026-11-09/10, on the throwaway project: the first apply imported the project and set the function secrets, then stopped on the API settings with a status 500 after they had been written; a new plan of the two resources not yet created applied with status 0. Observed on staging, 2026-11-11: the settings plan with `smtp` set applied whole, the next plan showed no change, and the project served every managed setting as declared ([Step 9](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-9-import-the-project-and-make-the-first-plan), [Step 18](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-18-the-settings-and-the-function-secrets), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#observations)). [Auth settings of a hosted project](#auth-settings-of-a-hosted-project) explains the auth settings, and [Hosted Supabase settings](/developers-guide/deployment/hosted-settings) lists each.

**Migrations and functions.** The Supabase CLI comes with `yarn install`. It runs from a work directory of its own, linked to the project, whose `supabase/` links to the repository's `config.toml`, `migrations` and `functions`, so that `apps/supabase` is never linked to a hosted project. `push-migrations.sh` shows the pending migrations, asks you to type the ref, pushes them and then checks the database for drift:

```bash
REF=<project-ref>
W=tmp/supabase-linked/$REF
mkdir -p "$W/supabase"
for p in config.toml migrations functions; do
  ln -sfn "$PWD/apps/supabase/supabase/$p" "$W/supabase/$p"
done
node_modules/.bin/supabase link --project-ref "$REF" --workdir "$W"
printf 'database password: '; read -rs SUPABASE_DB_PASSWORD; echo
export SUPABASE_DB_PASSWORD PGPASSWORD="$SUPABASE_DB_PASSWORD"
export PGHOST="db.$REF.supabase.co" PGPORT=5432 PGUSER=postgres PGDATABASE=postgres
infra/scripts/push-migrations.sh --ref "$REF" --workdir "$W"; echo "push_exit=$?"
node_modules/.bin/supabase functions deploy --project-ref "$REF" --workdir "$W"
echo "deploy_exit=$?"
```

When the direct host does not resolve from your workstation, use the session pooler on port 5432 with the user `postgres.<project-ref>`, never port 6543 ([Step 15](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-15-the-connection-psql-uses)). The migrations create both storage buckets, `public-assets` (public) and `private-assets` (private), with their policies, so no bucket is created by hand; observed on staging, 2026-11-11, after the push. The CLI deploys each function with the `verify_jwt` its block of `config.toml` sets: `identity-callback` and `account-access` run without JWT verification, `send-email` with it. Observed on staging, 2026-11-11: the Management API listed the three functions `ACTIVE`, `verify_jwt` false for the first two; and with `account-access` so deployed, a `check-code` call carrying the anon key in `apikey` alone, with no `Authorization` header and no user token, reached the function and was answered 200 ([Step 16](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-16-the-migrations), [Step 17](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-17-the-functions), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#observations)). [Edge Functions](/developers-guide/backend/edge-functions) describes each function.

**The bootstrap.** The script `infra/scripts/bootstrap.sql`, not the account-level root `infra/bootstrap`, writes the rows a deployment needs that no migration can write: the account, the project named by `PUBLIC_PROJECT_ID` and its settings row, the two `storage_config` rows the storage cleanup reads, `behind_cloudflare` and, when `BOOTSTRAP_ACCESS_CALLER_MAX` is set, the per-caller limit of `account-access`. It takes its values from the shell, and [Bootstrap](/developers-guide/configuration/environmental-variables#bootstrap) lists each `BOOTSTRAP_*` variable with its default. `BOOTSTRAP_CANDIDATE_REGISTRATION_MODES` names the modes by which a candidate may claim an invitation, any of `identity_provider`, `email` and `code`; without it no candidate invitation can be claimed, and the script writes it only into a settings row it creates, so set it on the first run. An invitation mailed to a candidate needs `email`. Read the server's seven logging settings first, because a server that logs the parameters of a statement would log the service-role key ([Step 19](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-19-the-servers-logging-settings)). In the same shell:

```bash
export PUBLIC_PROJECT_ID=<public_project_id of the root's terraform.tfvars>
export BOOTSTRAP_STORAGE_URL="https://$REF.supabase.co"
export BOOTSTRAP_BEHIND_CLOUDFLARE=true
export BOOTSTRAP_CANDIDATE_REGISTRATION_MODES=email
printf 'service-role key: '; read -rs SUPABASE_SERVICE_ROLE_KEY; echo
export SUPABASE_SERVICE_ROLE_KEY
psql -X -f infra/scripts/bootstrap.sql; echo "bootstrap_exit=$?"
```

It exits 0 with every row in place, and a second run leaves the same rows. A project the script creates is closed to voters unless `BOOTSTRAP_OPEN_FOR_VOTERS` is `true`, and a project that exists already keeps its value. Observed on staging, 2026-11-11: two runs, each with status 0, left one account, one project, one settings row, the two `storage_config` rows and one `deployment_settings` row ([Step 20](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-20-the-bootstrap)). `apps/supabase/supabase/seed.sql` is local development data: it creates two test users with a known password, so it is never run on a hosted database. `yarn check:seed`, the script `infra/scripts/check-seed.sql` that [§ Guards](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#guards) of the infrastructure README describes, reads the database in the same shell and exits 3 naming any seed user, local address or demo key it finds; it writes nothing.

**The first administrator.** Create the user in the dashboard with the address confirmed at creation, then give it the project-scope `admin` grant:

```bash
printf 'administrator address: '; read -r ADMIN_EMAIL; export ADMIN_EMAIL
psql -X -f infra/scripts/grant-project-admin.sql; echo "grant_exit=$?"
```

Observed on staging, 2026-11-11: the administrator signed in with a password, and its token's `grants` claim held exactly that one grant ([Step 21](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-21-the-first-administrator)).

### The two parameters

The task reads two values from the AWS parameter store, both SecureStrings under `/openvaa/<your-environment>/frontend/`: the project's anon key and the PostHog project key. They are created outside Terraform, each typed at a prompt so that it reaches no command line and no file:

```bash
P=/openvaa/<your-environment>/frontend
put() {
  printf '%s: ' "$1"; read -rs V; echo
  printf '%s' "$V" | aws ssm put-parameter --name "$P/$1" \
    --type SecureString --value file:///dev/stdin \
    --tags Key=Project,Value=openvaa Key=Environment,Value=<your-environment>
  echo "put_exit=$?"; unset V
}
put ANALYTICS_POSTHOG_KEY
put PUBLIC_SUPABASE_ANON_KEY
```

The status is the CLI's own, because the CLI is the last command of the pipe.

Without a PostHog project, type a stand-in such as `stand-in`: the task reads the key only once `ANALYTICS_PROVIDER` is `posthog`, and ECS starts no task whose parameter is missing. Observed on staging, 2026-11-12: both parameters read back as SecureStrings under `alias/aws/ssm` ([Step 2](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-2-the-two-parameters)). The account-level root's execution role reads them. Staging added that role by a later apply of the root, once both parameters existed; observed on staging, 2026-11-12: its plan read `Plan: 5 to add, 0 to change, 0 to destroy.` ([Step 8](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/bootstrap/README.md#step-8-the-frontend-execution-role)).

### The AWS root and its image

`infra/envs/<your-environment>/aws` holds the network, the load balancer, the ECS cluster and service, the CloudFront distribution, the two certificates, the alarms and the alert topic. Fill in `terraform.tfvars` from the account-level root's outputs (`registry_url`, `frontend_execution_role_arn`) and `environment_values` from your project: one line per entry of [`task-environment.json`](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/modules/frontend-service/task-environment.json) whose source is `value`.

The image is built from one commit that is on origin. `build-push-image.sh` refuses a dirty tree, a commit origin does not hold and a tree that holds `.planning/`; it builds from a `git archive` of the commit, tags the image with the commit id and prints `image_digest=`. The plan takes that digest, and the task runs the image by digest:

```bash
cd "$(git rev-parse --show-toplevel)"
T=infra/envs/<your-environment>/aws
U=$(terraform -chdir=infra/bootstrap output -raw registry_url)
OPENVAA_ACCOUNT_ID=<account-id> infra/scripts/build-push-image.sh --repository-url "$U"
echo "build_exit=$?"
DIGEST=<the image_digest it printed>
export TF_VAR_alert_email='<your-address>'
terraform -chdir="$T" init -input=false
terraform -chdir="$T" plan -input=false -var "image_digest=$DIGEST" -out=tfplan
terraform -chdir="$T" apply -input=false tfplan; echo "apply_exit=$?"
rm -f "$T/tfplan"
curl -s "https://<your-domain>/api/health"
```

`/api/health` answers 200 with `status` `ok` and the commit id as `build`. Confirm the alert topic's subscription from the mail the apply sends to the alert address ([Step 6](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-6-the-operators-confirmations); observed on staging, 2026-11-13, about ten minutes after the apply). Observed on staging, 2026-11-13: the first plan read `Plan: 40 to add, 0 to change, 0 to destroy.`, the plan after the apply and its follow-up showed no change, and `/api/health` answered 200 through CloudFront with the image's commit as `build` ([Step 4](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-4-the-image), [Step 5](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#step-5-the-first-plan-and-the-one-apply), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#observations)).

The task receives exactly the variables of `task-environment.json`, the identity-provider entries only when bank authentication is on. `SUPABASE_SERVICE_ROLE_KEY` is never one of them: it bypasses row-level security, and it belongs to the bootstrap run and the Supabase project alone; `taskEnvironment.test.ts` refuses any name that contains `SERVICE_ROLE`.

Bank authentication is off on the AWS path until a deployment turns it on; staging does not. With it off, the task receives none of the identity-provider entries of `task-environment.json` and the Supabase module sends no identity-provider secret, so `identity-callback` refuses every call. To turn it on, for Signicat or Idura ([Bank authentication](/developers-guide/contestant-app/bank-authentication) describes the flow and [Identity provider](/developers-guide/configuration/environmental-variables#identity-provider) the variables):

1. Register `https://<your-domain>/api/oidc/callback`, the deployment's `ORIGIN` followed by `/api/oidc/callback`, as the redirect URI of the client at the provider.
2. Generate the callback secret once, for example with `openssl rand -hex 32`. The frontend server sends it to `identity-callback`, which refuses every call without it, so both sides must hold the same value. No root reads the other's: store it as the parameter below and pass the same value to the Supabase root.
3. Create the secret parameters under the AWS root's `parameter_path`, as for the anon key: `IDENTITY_PROVIDER_DECRYPTION_JWKS` and `IDENTITY_CALLBACK_SERVER_SECRET`, and `IDENTITY_PROVIDER_CLIENT_SECRET` for Signicat or `IDURA_SIGNING_JWKS` for Idura. A standard parameter holds at most 4 KB; a larger key set needs the advanced tier.
4. In the AWS root's `terraform.tfvars`, set `identity_provider_type` to `signicat-ftn` or `idura-ftn` and add the provider's values to `environment_values`: `PUBLIC_IDENTITY_PROVIDER_CLIENT_ID`, `IDENTITY_PROVIDER_JWKS_URI` and `IDENTITY_PROVIDER_ISSUER`, and `PUBLIC_IDENTITY_PROVIDER_AUTHORIZATION_ENDPOINT` and `IDENTITY_PROVIDER_TOKEN_ENDPOINT` for Signicat or `IDURA_DOMAIN` and `IDURA_SIGNING_KEY_KID` for Idura. The module sets `PUBLIC_IDENTITY_PROVIDER_TYPE` from `identity_provider_type`, and refuses a plan that lacks one of these values or sets one the type does not select. The example root's `terraform.tfvars` carries them as comments.
5. In the Supabase root's `terraform.tfvars`, set `identity_provider` to the same type, client id, `jwks_uri` and issuer, and export `TF_VAR_identity_provider_decryption_jwks` and `TF_VAR_identity_callback_server_secret` with the same values as the two parameters. The module then sends the six secrets `identity-callback` reads, and refuses a plan with `identity_provider` set and either secret missing.
6. Apply the Supabase root, then the AWS root. A candidate can sign in this way only where the project's candidate registration modes include `identity_provider`, which `BOOTSTRAP_CANDIDATE_REGISTRATION_MODES` sets on the bootstrap's first run.

This path has not been run against a live provider on AWS: after the apply, sign in through it once before relying on it.

### Checking the instance

Two checks, both from a workstation. The conformance probe compares what the Supabase project serves with what the repository declares for it, through the Management API, the public API with the anon key and the catalog over `psql`; it writes nothing and never takes the service-role key. With `SUPABASE_ACCESS_TOKEN`, `SUPABASE_ANON_KEY` and the connection variables of the Supabase stage set:

```bash
node infra/scripts/probe-hosted.mjs --root infra/envs/<your-environment>/supabase
echo "probe_exit=$?"
```

Each line is `PASS <check>` or `FAIL <check>: <finding>`, and the status is 0 when every check passed. Observed on staging, 2026-11-11: twenty-two `PASS` lines and status 0 on the persistent project ([Step 23](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-23-the-conformance-probe)).

The deployed smoke run, `yarn test:e2e:deployed`, drives the deployed site with a voter and a contestant. It needs the smoke dataset and the smoke contestant on the project, seeded once ([Step 22](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-22-the-smoke-dataset)). It takes its test ids and messages from the checkout, so run it from a checkout whose `apps/` and `packages/` equal the deployed commit's. It refuses to start while any privileged key or database password is set, and it fails unless `/api/health` serves the commit `SMOKE_EXPECTED_SHA` names:

```bash
unset SUPABASE_SERVICE_ROLE_KEY SUPABASE_SECRET_KEY SUPABASE_ACCESS_TOKEN \
  SUPABASE_DB_PASSWORD TF_VAR_database_password PGPASSWORD
export SMOKE_EXPECTED_SHA=<the full commit id the image was built from>
export SMOKE_BASE_URL="https://<your-domain>"
printf 'smoke contestant address: '; read -r SMOKE_CONTESTANT_EMAIL
printf 'smoke contestant password: '; read -rs SMOKE_CONTESTANT_PASSWORD; echo
export SMOKE_CONTESTANT_EMAIL SMOKE_CONTESTANT_PASSWORD
# Only when the bootstrap set BOOTSTRAP_ACCESS_CALLER_MAX: the same value.
# export SMOKE_ACCESS_CALLER_MAX=<the per-caller limit>
yarn test:e2e:deployed; echo "smoke_exit=$?"
```

The run reads `project_ref`, `public_project_id` and `public_origin` from `infra/envs/staging/supabase/terraform.tfvars`, the path `tests/tests/utils/deployedTarget.ts` names, so a fork whose roots are under another name points that path at its own. [`tests/README.md` § Deployed smoke run](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/README.md#deployed-smoke-run) gives every input and refusal.

### The deploy pipeline

Once the stack stands, `deploy.yml` deploys every later commit. A push to `deploy/staging` starts it; a push to `main` deploys nothing. A job without credentials checks the Terraform and runs the infrastructure unit tests, and the gated job then waits for the reviewer of the `staging` GitHub environment. Once approved it builds the image by digest, plans the AWS root, pushes the migrations, checks the deployment settings, deploys the functions, applies the saved plan, waits for the service to be stable, runs the deployed smoke run and reads `/api/health` once more ([§ The gated job and its order](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#the-gated-job-and-its-order)). On a project whose bootstrap has not run, the run stops at stage `settings`, after its migrations are pushed, because the bootstrap of [The Supabase project](#the-supabase-project) is what writes `behind_cloudflare` ([§ Feedback rate limit and Cloudflare](#feedback-rate-limit-and-cloudflare)).

Before the first push that carries the workflow, create the two environments the deploy role trusts, `staging` and `staging-destroy`, each with a required reviewer and a deployment branch policy that admits `deploy/staging` and `deploy-evidence/*` only, and give `staging` its secrets and variables: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, `SMOKE_CONTESTANT_EMAIL`, `SMOKE_CONTESTANT_PASSWORD` and `ALERT_EMAIL`, and `AWS_DEPLOY_ROLE_ARN`, `SUPABASE_POOLER_HOST` and `DEPLOY_ENVIRONMENT` ([§ The environments and their settings](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#the-environments-and-their-settings)). GitHub creates an environment a job names that does not exist yet, with no protection at all, and the deploy role trusts every job that names it, so the branch policy is what keeps every other branch out. The workflow names the roots under `infra/envs/staging/` and the environment `staging`, and the subjects of `deploy_subjects` in `infra/bootstrap/terraform.tfvars` must name the same environments, so a fork whose roots or environments have other names changes them in `deploy.yml` and `destroy.yml` as well.

Before each push to `deploy/staging`:

- If the commit changes the Supabase root, that is `infra/modules/supabase/hosted-settings.json`, `infra/modules/supabase/function-secrets.tf` or `infra/envs/staging/supabase/terraform.tfvars`, apply it by hand first from [the runbook's Step 18](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-18-the-settings-and-the-function-secrets). The pipeline applies the AWS root only, and it deploys the functions without reading the hosted settings or the function secrets, so functions pushed first run against settings or secrets the project does not serve yet.

Then:

```bash
git push origin <commit>:refs/heads/deploy/staging
```

Approve the run's review in GitHub. Observed on staging, 2026-11-18: the first green deploy ran every stage in order in about ten minutes, and the same day a deploy from `deploy/staging` brought the stack up again from nothing after a destroy ([Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/aws/README.md#observations)). [§ Reading a red run](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#reading-a-red-run) says what a failed stage leaves behind.

[Hosted Supabase settings](/developers-guide/deployment/hosted-settings) lists every setting the Supabase root writes, and [Operations](/developers-guide/deployment/operations) covers election-day scaling, rollback, teardown and restore, and the SES production-access request.

## Auth settings of a hosted project

The Supabase root's settings resource, `supabase_settings.this` of `infra/modules/supabase/`, writes each auth setting to the hosted project, and it is their only writer: no workflow or script pushes the local configuration to a hosted project. The values the hosted project shares with the local stack are in `infra/modules/supabase/hosted-settings.json`, and `yarn assert:hosted-settings-parity`, part of `yarn lint:check`, holds them equal to the local `apps/supabase/supabase/config.toml`. A value is changed in `hosted-settings.json` and applied, not in the dashboard. Seven of the settings carry the invitation model:

- `disable_signup`: `true`, public sign-up off;
- `mailer_autoconfirm`: `false`, email confirmation on;
- `password_min_length`: `8`;
- `mailer_otp_length`: `10` digits, the auth service's maximum;
- `mailer_otp_exp`: `3600` seconds, the lifetime of a mailed sign-in or recovery link;
- `hook_send_email_enabled` and `hook_send_email_uri`: the Send Email hook on, pointed at the function `public.send_email_hook`;
- `mailer_secure_email_change_enabled`: `true`.

[Hosted Supabase settings](/developers-guide/deployment/hosted-settings) gives every row the module sends, with where the repository sets it, its parity class and how to verify it.

- **The password length** is the length the Contestant App's password rule asks for. On the local stack it binds the setting of a password: a user's own `updateUser` and an administrator's `createUser` with fewer than eight characters are refused `422 weak_password`, and an account whose shorter password was set before the setting still signs in with it. A smaller value on a hosted project would let a direct call to the auth service set a password the screens refuse, so the parity guard lets the hosted `password_min_length` be stricter than the local one, never weaker.
- **The lifetime of a mailed link** is the second bound on a link, beside its single use: whoever holds a link is signed in by it, so how long it can be used is bounded. The repository's gate pins 3600 seconds for the local file, and the parity guard lets the hosted `mailer_otp_exp` be shorter, never longer.
- **The one-time code's length.** Every link the `account-access` function has the auth service mint also stores a one-time code for the address, and the auth service accepts that code in the link's place for as long as the link lives. The application never uses it, but anyone can have a link sent to an invited address, so with six digits the code could be guessed within the link's hour. Ten digits, the auth service's maximum, put it out of reach. `yarn assert:auth-signup-closed` pins the local file and `yarn assert:hosted-settings-parity` holds the Terraform module's `mailer_otp_length` equal to it.
- **Secure email change** is required by the address confirmation of an identity-provider account. The `confirm-address` operation confirms the placeholder's side of the change itself and mails only the typed address's link, which relies on the auth service asking for both confirmations. With the setting off, confirming the placeholder's side completes the change at once, without the typed address being proved; the operation then puts the placeholder back, mails nothing and answers `refused`, so no identity-provider account can prove an address on that project. `yarn assert:hosted-settings-parity` holds the Terraform module's `mailer_secure_email_change_enabled` equal to the local value.
- **The Send Email hook** is where it is adopted: with it the auth service sends no mail of its own, and the application's mails go out through the `account-access` function alone. Without it the auth service's own one-time-code and recovery endpoints mail its default English text to any address a caller names. The function is created by the schema, executable by `supabase_auth_admin` alone; the module's `hook_send_email_uri` points the hook at it while the root's `enable_send_email_hook` is `true`, as it is in each root. See [Email](/developers-guide/backend/email#supabase-auth-sends-no-mail).

To read what a project serves, request its auth settings with the project's anon key:

```bash
curl -s -H "apikey: <anon key>" "<project url>/auth/v1/settings"
```

The answer must hold `"disable_signup": true` and `"mailer_autoconfirm": false`. It holds neither the other settings nor the hook. The full check is the conformance probe of [Checking the instance](#checking-the-instance), which reads every setting the module sends through the Management API: its `auth.signup-closed`, `auth.email-confirm`, `auth.other-settings` and `auth.send-email-hook` lines cover the seven above. Observed on staging, 2026-11-20: the probe passed all twenty-two checks on the persistent project ([Step 23](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-23-the-conformance-probe), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#observations)).

In the dashboard the two sign-up switches are "Allow new users to sign up" and "Confirm email", in the User Signups panel of Authentication, Sign In / Providers. Observed on staging, 2026-11-08/09: on a new project both are on, and Authentication, Hooks lists no hook ([Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#observations)). The module's apply is what turns sign-up off and adopts the hook.

**The database has no guard of its own.** A function that grants authority to a confirmed address reads `auth.users.email_confirmed_at`, and cannot tell how the address came to be confirmed. On a project that allows public sign-up, anyone can obtain a confirmed address they do not control:

- with email confirmation off, by signing up with the address: it is confirmed at once, and no mail is sent;
- with email confirmation on, by signing up with the address and a password of their own first. When the owner of the address later opens any link mailed to it, the address is confirmed and the password still signs in.

Turning sign-up off closes both. Confirmation stays on as well, so that a sign-up switched back on by mistake does not confirm addresses without a mail.

### The sign-in link of an invitation

The `account-access` Edge Function mails the sign-in link of an invitation. Four settings decide whether it does, and where the link leads, and the Supabase root writes each of them:

| What decides it                                                    | Where the repository sets it                                                                                                                                                            | Required value                                                                                                                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| the two switches above                                             | `disable_signup` and `mailer_autoconfirm`, written by the settings resource                                                                                                             | public sign-up off, email confirmation on                                                                                                 |
| the redirect allowlist of the auth service                         | `uri_allow_list`, written by the settings resource from `redirect_callback_paths` of `hosted-settings.json`                                                                             | the root's `public_origin` followed by `/auth/confirm`, and by `/*/auth/confirm`, which admits the confirm page behind one locale segment |
| `SITE_URL`                                                         | a function secret, written by `infra/modules/supabase/function-secrets.tf` from the root's `public_origin`                                                                              | the frontend's public origin, with no path. It is the origin of every mailed link; no request can change it                               |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USER` and `SMTP_PASS` | function secrets, written by `function-secrets.tf` while the root sets `smtp`: the first three from `smtp`, the last two from the shell's `TF_VAR_smtp_user` and `TF_VAR_smtp_password` | the mail server the link is sent through                                                                                                  |

Before it issues a link the function checks the first two rows with the auth service, and on a misconfigured deployment it mails nothing and logs why; read the function's log after the first link request of a new deployment, as [The two deployment checks](/developers-guide/backend/edge-functions#the-two-deployment-checks) describes.

**The function's refusal does not protect the claim:** only `disable_signup` does, as [The database has no guard of its own](#auth-settings-of-a-hosted-project) above explains.

Both refusals are held by unit tests of the function's modules, with injected answers. [What this does not protect against](/developers-guide/backend/authentication#what-this-does-not-protect-against) lists what else an operator accepts with the invitation model: one sign-in mail per minute to any eligible address, and a per-caller limit that holds only behind Cloudflare and lets callers who share an address share one bucket. The per-caller limit is described in [The per-caller limit of account-access](#the-per-caller-limit-of-account-access).

## Feedback rate limit and Cloudflare

Voter feedback is limited to five submissions per five minutes per client. A Postgres trigger on the `feedback` table picks the client's rate-limit bucket from the request headers. Which header it trusts is a database setting, `private.deployment_settings.behind_cloudflare`, and not an environment variable: the feedback insert goes straight from the browser to the database API, so no process that reads `.env` is on that path.

- When the setting is `true`, the bucket is keyed on `cf-connecting-ip`, which Cloudflare sets to the connecting client.
- When it is `false`, a client-sent `cf-connecting-ip` is ignored and the bucket is keyed on the last `x-forwarded-for` hop, which the gateway appends from the connection's peer.

The migration ships the setting as `false`, and the bootstrap writes it. `infra/scripts/bootstrap.sql` requires `BOOTSTRAP_BEHIND_CLOUDFLARE`, refuses to run without it and writes its value on every run, so the bootstrap of [The Supabase project](#the-supabase-project) passes `BOOTSTRAP_BEHIND_CLOUDFLARE=true`. A later run with another value changes the setting.

The deploy pipeline reads the setting after every migration push, with `infra/scripts/check-deployment-settings.sql`, and stops the run before the functions and the rollout unless it is `true` ([§ Reading a red run](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/README.md#reading-a-red-run), stage `settings`).

**Precondition:** every request reaches the API through Cloudflare. Hosted Supabase does. A self-hosted gateway qualifies only when its origin accepts connections from Cloudflare alone; otherwise a client can send its own `cf-connecting-ip` and choose its own bucket.

**Hosted Supabase must set it.** On hosted Supabase the last `x-forwarded-for` hop can be a platform-internal address shared by many voters, so with the setting left `false` those voters share one bucket and the sixth submission among them in five minutes is refused.

Observed on staging, 2026-11-10, on the throwaway project: a request that carried its own `cf-connecting-ip` was refused by Cloudflare with status 403, before the project, both for a function and for a database request, and on every served request the header was the connecting client. Observed on staging, 2026-11-11: both bootstrap runs of the persistent project, with `BOOTSTRAP_BEHIND_CLOUDFLARE=true`, left `behind_cloudflare` true, read back from the database after each run ([Step 20](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#step-20-the-bootstrap), [Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#observations)).

The local development stack turns the setting on in `apps/supabase/supabase/seed.sql`, so that the E2E suite can give each feedback submission its own bucket.

## The per-caller limit of account-access

Three operations of the `account-access` function, `check-code`, `request-link` and `request-recovery`, count every request against one bucket per caller per project: 30 requests in 10 minutes by default, across the three together. The function takes the caller's slot before it does any work of the operation. A caller over the limit is answered HTTP 429 with `{ "error": "too-many-requests" }` and a `Retry-After` header that gives the seconds until the window ends, the same for each of the three operations; every answer exposes the header through CORS (`Access-Control-Expose-Headers: Retry-After`), so a browser caller can read it. A failure to read the limit is answered 500 `{ "error": "internal" }`, so the limit is never skipped silently. The address confirmation, `confirm-address`, is answered only to a signed-in account and has slots of its own, so it is not counted. The code sign-in, `code-sign-in`, is not counted either: the frontend server calls it, so its caller would be the server's address and every user's code sign-in would share one bucket; see [Known residuals](/developers-guide/backend/authentication#sign-in-and-mailed-links).

The caller is the `cf-connecting-ip` header. The function reads no other header for it. The database trusts the header under the same `behind_cloudflare` setting as the feedback limit above: only when the setting is `true` and the header is present and is an address. Otherwise, with the setting `false` or the header missing, there is no per-caller limit, and the three operations are answered as if it did not exist. An IPv4 address is one bucket, an IPv4-mapped IPv6 address (`::ffff:a.b.c.d`) is the bucket of its IPv4 address, and any other IPv6 address counts by its /64, so a caller cannot widen its key by sending a mask. The precondition of the feedback limit holds here too: every request has to reach the functions through Cloudflare, as on hosted Supabase. The feedback limit buckets a trusted `cf-connecting-ip` by the same rule, so an IPv6 client is one bucket of each limit.

The number of requests is a database setting, `private.deployment_settings.access_caller_max`, which the database function `access_caller_take` reads on every take. The bootstrap writes it from `BOOTSTRAP_ACCESS_CALLER_MAX` when that is set, and otherwise leaves it as it is. Raise it for a deployment where many contestants register from one network at once, such as an office or an event: each contestant takes at least two slots, a code check and a link request, and an administrator asking for a recovery link from the same address shares their bucket. A changed value applies to the next take, also within a window already running.

The function's former name, `invitation_caller_take`, stays in the database as a wrapper that answers as `access_caller_take` does, from the same slots, and the service role alone may execute it. The pipeline pushes the migrations before it deploys the functions, so between the two steps the deployed `account-access` still calls the former name, as do the functions of an earlier commit redeployed as a rollback. A later migration drops the wrapper once every deployment runs the functions that call `access_caller_take`.

Observed on staging, 2026-11-19, on the hosted `account-access` after the migration that adds the limit was pushed: one caller was answered 200 by `check-code` thirty times and refused 429 with a `Retry-After` header at its 31st call; a second caller, inside the first one's window, was answered 200 until its own 31st call, was refused the same way, and was answered 200 again once its own window had ended ([Observations](https://github.com/OpenVAA/voting-advice-application/blob/main/infra/envs/staging/supabase/README.md#observations)).

Every deploy's smoke run checks the limit with `tests/tests/deployed/caller-limit.smoke.ts`. It calls `check-code` with fresh codes no invitation holds until it is refused, at most twice the limit plus one times (61 for the default of 30), which allows for one reset of the 10-minute window during the run, and fails unless the refusal is 429 with the fixed body and a `Retry-After` of 1 to 600 seconds. The smoke run cannot read `access_caller_max`, so it takes the limit from `SMOKE_ACCESS_CALLER_MAX`, default 30: a deployment that sets `BOOTSTRAP_ACCESS_CALLER_MAX` sets `SMOKE_ACCESS_CALLER_MAX` to the same value, in the shell of a workstation run and as the `staging` environment's variable of that name for the deploy workflow. It sends no client-address header, so Cloudflare sets `cf-connecting-ip` to the caller's own address, and that address is then refused by the three operations for up to 10 minutes ([`tests/README.md` § Deployed smoke run](https://github.com/OpenVAA/voting-advice-application/blob/main/tests/README.md#deployed-smoke-run)).

**What is stored.** The caller's address is stored in clear, as part of a key of `private.access_throttle` (`caller:<project id>:<address>`), with a count and the start of its window. It is kept only while its 10-minute window runs: after taking its own slot, each take deletes the other keys whose window has ended, skipping any key another request is writing at that moment, which a later take deletes. Each smoke run leaves one such row, of the runner's address, for its window. No log line of the function holds the address, and no answer returns it.

## Testing a production build locally

[`docker-compose.dev.yml`](https://github.com/OpenVAA/voting-advice-application/blob/main/docker-compose.dev.yml) at the repository root builds the frontend's production image and runs it against the local Supabase stack. Start the stack first:

```bash
yarn db:start
docker compose -f docker-compose.dev.yml up --build
```

The app is then on port 3000. The compose file reaches the local API at `http://host.docker.internal:54321` unless `PUBLIC_SUPABASE_URL` says otherwise, and takes `PUBLIC_SUPABASE_ANON_KEY` from your environment.

To build and run the production frontend without Docker, run `yarn build` at the repository root, which builds the shared packages and the frontend, and then start the server with the variables set:

```bash
yarn build
node apps/frontend/build/index.js
```

It also listens on port 3000 by default.
