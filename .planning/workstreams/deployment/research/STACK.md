# Stack Research

**Domain:** Deployment infrastructure (AWS by Terraform + hosted Supabase), CI deploy pipeline, and a storage-less analytics relay for an existing SvelteKit / Supabase monorepo
**Milestone:** v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay
**Researched:** 2026-10-10
**Confidence:** MEDIUM overall (see the legend; nothing here has been applied to a real account yet)

**Scope.** Only what the new capabilities need. The application stack (SvelteKit 2 / Svelte 5, adapter-node, Supabase schema and auth model, Playwright suite) is validated and is not re-researched.

**Confidence legend used below**

| Tag | Meaning |
| --- | --- |
| REGISTRY | Version read directly from the GitHub Releases API or the npm registry on 2026-10-10. A fact, not a search result. |
| MEDIUM | An official document was read and a second source agrees (the ceiling the `classify-confidence` seam gives a cross-checked web finding). |
| LOW | One source only, or training knowledge. Unverified: check before a plan depends on it. |

---

## The four open questions, answered

1. **What runs the frontend container: ECS on Fargate behind an Application Load Balancer, written as explicit Terraform resources.** App Runner is closed to new customers since 2026-04-30, so it is not available to a project that has deployed nothing. ECS Express Mode is AWS's named successor and has a Terraform resource, but it creates the load balancer, listeners, target groups, security groups and scaling policies itself, outside Terraform state, and a custom domain is added by editing that load balancer by hand. That is the opposite of "the deployment lives in the repo". Lambda with the Web Adapter is rejected because the server keeps the Admin App's jobs in process memory.
2. **How the hosted Supabase project is provisioned: split by kind of thing, one owner each.** The `supabase/supabase` Terraform provider owns the project and every *setting* (API limits, auth settings, redirect allowlist, SMTP, the access-token hook, Edge Function secrets, reading the API keys). The Supabase CLI, already pinned in the repo, owns *code*: `db push` for migrations and `functions deploy` for the three functions. `supabase config push` is not used. Three things neither tool sets are closed with SQL: the two storage buckets (a migration) and the per-deployment rows (an idempotent bootstrap script).
3. **Remote state and CI auth: an S3 backend with S3-native locking (`use_lockfile = true`, no DynamoDB table), and GitHub Actions OIDC into two IAM roles** (a read-only plan role and an environment-gated deploy role). No AWS access keys are stored in GitHub. A small `bootstrap` root module, applied once by hand, creates the state bucket, the OIDC provider, the roles and the ECR repository.
4. **PostHog: EU Cloud (`https://eu.i.posthog.com`), not self-hosted, reached from the relay through its documented HTTP capture API with plain `fetch`.** PostHog calls self-hosting "officially unsupported", has ended Kubernetes support, and sizes its hobby deployment at 4 vCPU / 16 GB, which would cost more than the application it measures. The relay sends anonymous events (`$process_person_profile: false`); no PostHog SDK is added to the browser or the server.

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
| --- | --- | --- | --- | --- |
| Terraform CLI | 1.16.5 (constraint `~> 1.16`) | All AWS and Supabase-settings provisioning | Operator decision. 1.16 has S3-native state locking as a stable feature and the native `terraform test` framework with mock providers, so no wrapper tool is needed. | REGISTRY |
| `hashicorp/aws` provider | 6.68.0 (constraint `~> 6.60`, exact version in `.terraform.lock.hcl`) | VPC, ALB, ECS, ECR, ACM, Route 53, IAM, SSM, CloudWatch, SES | The current major. Everything used here is long-stable, so the lock file is the real pin. | REGISTRY |
| `supabase/supabase` provider | 1.11.0 (constraint `~> 1.11`) | The hosted project, its settings, its Edge Function secrets, reading its API keys | The only tool that gives `plan`-time drift detection on hosted auth settings, which is exactly the class of fact the standing todos call "never observed". `supabase_settings.auth` is a JSON pass-through to the Management API's auth-config endpoint, so it reaches every field the app needs. | REGISTRY (version), MEDIUM (capabilities) |
| `hashicorp/random` provider | 3.9.1 (constraint `~> 3.9`) | The database password of the Supabase project | Keeps the password out of anyone's head; it lives only in encrypted state. | REGISTRY |
| Amazon ECS on AWS Fargate | platform version `LATEST` | Runs the existing `apps/frontend/Dockerfile` `production` image | No servers to patch, the image is used unchanged, and the service scales out for an election-day peak. A long-lived Node process is what adapter-node and the in-memory admin job store both assume. | MEDIUM |
| Application Load Balancer + ACM | n/a | TLS termination, HTTP to HTTPS redirect, health checks, the custom domain | Fully described by Terraform resources, so the custom domain, the certificate and the health-check path are in state and in review. | MEDIUM |
| Amazon ECR | n/a | Private registry for the frontend image | The image bakes in each fork's `staticSettings.ts`, so it is per-deployer and not publishable as a shared image. | MEDIUM |
| Supabase CLI | 2.118.0 (the version already pinned in the catalog and in `main.yaml`) | `supabase db push`, `supabase functions deploy` against the hosted project | Already a devDependency and already the pinned CI version; the deploy job must use the same pin so local, CI and deploy bundle functions identically. Latest is 2.120.0; a bump is not needed for this milestone. | REGISTRY |
| GitHub Actions OIDC + `aws-actions/configure-aws-credentials` | v6.3.0, pinned by commit SHA | Short-lived AWS credentials in the pipeline | The standard, AWS-owned mechanism. No long-lived keys. Runs on the Node 24 action runtime. | REGISTRY (version), MEDIUM (mechanism) |
| `hashicorp/setup-terraform` | v4.0.1, pinned by commit SHA, `terraform_version: 1.16.5`, `terraform_wrapper: false` | Installs the pinned Terraform in CI | Official. The wrapper is turned off because it mangles `terraform output -raw`, which the pipeline reads. | REGISTRY |
| PostHog Cloud EU | SaaS, host `https://eu.i.posthog.com` | The one real analytics provider behind the relay | EU residency (Frankfurt), 1M events a month free, a public documented capture endpoint that needs only a write-only project token. | MEDIUM |

### AWS resources the Terraform creates

Shape, not exhaustive. All of it is plain `aws_*` resources in a local module; see "What NOT to use" for why no community module.

| Resource group | What | Decision and reason |
| --- | --- | --- |
| Network | One VPC, two public subnets in two availability zones, an internet gateway. **No NAT gateway, no private subnets.** | Tasks get a public IP and a security group that admits only the load balancer. A NAT gateway costs about as much per month as the whole compute bill at one task and buys nothing here: the tasks hold no database and only make outbound calls to Supabase, PostHog and ECR. |
| Load balancer | `aws_lb`, `aws_lb_target_group` (`target_type = "ip"`), listeners on 443 (ACM certificate) and 80 (301 redirect) | `deregistration_delay` lowered to about 30 s, or every deploy waits the default 300 s. Health check on a new cheap endpoint (see Integration points), never on `/`. |
| Compute | `aws_ecs_cluster`, `aws_ecs_task_definition`, `aws_ecs_service` | `deployment_circuit_breaker { enable = true, rollback = true }` and `wait_for_steady_state = true`, so a bad image fails `terraform apply` instead of leaving a half-deployed service. Start at 0.5 vCPU / 1 GB (sizing is unmeasured). Node is single-threaded: scale by task count, not task size. |
| Scaling | `aws_appautoscaling_target` + a target-tracking policy on CPU | `min_capacity` and `max_capacity` are variables; an operator raises the floor before election day. |
| Images | `aws_ecr_repository` (immutable tags, scan on push) + a lifecycle policy | Lives in the bootstrap module, because the image must exist before the service that runs it. Tag is the git SHA. |
| DNS and TLS | `aws_acm_certificate` with DNS validation, `aws_route53_record` alias | The hosted zone is an input (existing zone id), not created, because an operator's domain usually already lives somewhere. A variant that only outputs the validation records covers DNS held outside Route 53. |
| Configuration | Plain `environment` entries for the `PUBLIC_*` values; SSM Parameter Store `SecureString` for the few real secrets (identity-provider keys, `LLM_OPENAI_API_KEY`), injected through the task definition's `secrets` | Parameter Store standard parameters are free; Secrets Manager charges per secret and its rotation features are unused here. |
| Logs | `aws_cloudwatch_log_group` with a retention period, `awslogs` driver | This is the durable server-log sink the 157.1 logging work left open: the shared logger already writes structured records to stdout. It closes the "self-hosted PostHog as a log sink" evaluation with "no: CloudWatch Logs for server logs, PostHog for product events". |
| Mail (optional module) | `aws_sesv2_email_identity` for the domain with DKIM records, an IAM user restricted to `ses:SendRawEmail`, its SMTP password (`ses_smtp_password_v4`) | Feeds both Supabase Auth's SMTP settings and the functions' `SMTP_*` secrets from one place. The functions' `nodemailer` transport uses `secure: false`, which matches SES on port 587 with STARTTLS. An operator with another SMTP server sets five variables instead. |
| CI identity | `aws_iam_openid_connect_provider` for `token.actions.githubusercontent.com`, a plan role, a deploy role | In the bootstrap module. See the pipeline section for the trust conditions. |

### Hosted Supabase: who owns what

One owner per setting. A setting with two writers drifts silently, and this project's standing todos are a list of hosted settings nobody has ever read back.

| Hosted fact | Owner | Mechanism | Confidence |
| --- | --- | --- | --- |
| The project itself: organization, name, region, compute size, database password | Terraform | `supabase_project` (or `terraform import` of an existing project) | MEDIUM |
| Data API: `max_rows = 50000`, exposed schemas, extra search path | Terraform | `supabase_settings.api` | MEDIUM |
| Auth: `site_url`, `uri_allow_list` (the two callback entries), `disable_signup = true`, `mailer_autoconfirm = false`, `jwt_exp`, refresh-token rotation and reuse interval, `password_min_length`, the auth rate limits | Terraform | `supabase_settings.auth` | MEDIUM (all twenty fields checked against the Management API reference) |
| The custom access token hook (`hook_custom_access_token_enabled`, `hook_custom_access_token_uri = "pg-functions://postgres/public/custom_access_token_hook"`) | Terraform | `supabase_settings.auth` | MEDIUM |
| Auth SMTP (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_admin_email`, `smtp_sender_name`) | Terraform | `supabase_settings.auth`, values from the SES module or from variables | MEDIUM |
| Edge Function secrets: `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_*`, `IDENTITY_PROVIDER_*` | Terraform | One `supabase_edge_function_secrets` resource. `SITE_URL` is derived from the same domain variable as the load balancer and the allowlist, so the three cannot disagree. | MEDIUM |
| The API keys the frontend needs | Terraform (read) | `data.supabase_apikeys` feeds `PUBLIC_SUPABASE_ANON_KEY` in the task definition | MEDIUM |
| Schema, RLS, role settings (`anon` `statement_timeout = 8s` ships in the migration) | Supabase CLI | `supabase db push` in the deploy job | MEDIUM |
| Edge Function code and `verify_jwt` | Supabase CLI | `supabase functions deploy`, with `identity-callback`'s `verify_jwt = false` declared in `config.toml` under `[functions.identity-callback]` instead of a command-line flag | MEDIUM |
| The two storage buckets (`public-assets`, `private-assets`) | A new migration | An idempotent `INSERT INTO storage.buckets ... ON CONFLICT DO NOTHING`. Hosted Supabase does not read `[storage.buckets.*]` from `config.toml`. Closes item 4 of the 2026-10-02 todo. | LOW (the migration is the obvious fix; that it works on hosted is unobserved) |
| Per-deployment rows: the `accounts` / `projects` bootstrap row, `public.storage_config` (project URL + service-role key), `private.deployment_settings.behind_cloudflare = true` | An idempotent SQL bootstrap script run by the deploy job | `psql` against the pooler connection string, values from `terraform output`. `psql` is on the runner image and `sql-lint` already depends on it. | LOW |
| Postgres major version | Nobody: the provider has no attribute for it | The deploy job asserts `SHOW server_version` reports 17 before pushing migrations | LOW |

**Why not the Terraform provider for functions too.** `supabase_edge_function` exists in 1.11.0, but its documented schema has no `verify_jwt` attribute, and `identity-callback` must run without JWT verification. The CLI is also what the local stack and the existing CI already use to bundle.

**Why not `supabase config push`.** It would make `config.toml` the writer of hosted auth settings, and `config.toml` holds local values (`site_url = http://127.0.0.1:5173`, the `localhost` allowlist). Per-environment overrides need `[remotes.<name>]` blocks keyed by a hosted project ref committed in the file, which does not fit a framework that every deployer forks. One unofficial source also reports that it sends local-development defaults for every auth field the file does not declare. Terraform gives a reviewed plan and drift detection; `config push` gives neither.

**The cost of that choice, and its mitigation.** Security-relevant auth values now exist twice: in `config.toml` for the local stack and in HCL for the hosted one. Terraform has no built-in TOML decoder, so HCL cannot read `config.toml`. Add one guard in the repo's existing `assert:*` style that compares the keys that must agree (`enable_signup`, `enable_confirmations`, `max_rows`, the hook, `jwt_expiry`, rotation, password length) between the two files, and wire it into `lint:check` beside `assert:auth-signup-closed`.

### The CI deploy pipeline

| Piece | Choice | Notes |
| --- | --- | --- |
| Workflow | A new `.github/workflows/deploy.yml`, separate from `main.yaml` | `main.yaml` holds no cloud credentials and should stay that way. |
| Static checks (no credentials, run on every PR including forks) | `terraform fmt -check`, `terraform validate`, `terraform test` with `mock_provider` blocks, `tflint` 0.64.0 via `terraform-linters/setup-tflint` v6.3.2 | These are the only checks a fork PR can run, because a fork gets neither OIDC nor secrets. |
| Plan (same-repo PRs that touch `infra/**`) | `terraform plan` under the read-only plan role, output written to the job summary | No PR-comment action. The summary is enough and adds no dependency. |
| Apply | On push to `main` and on `workflow_dispatch`, in a job bound to a GitHub environment | Environment protection rules are the approval gate for production. |
| Image | `docker build --target production` then `docker push`, logged in with `aws ecr get-login-password` | Same plain `docker build` the existing `docker-image-build` job uses, so no build action enters a job that holds cloud credentials. |
| Rollout | `terraform apply -var image_tag=$GITHUB_SHA` | Terraform owns the task definition. No `amazon-ecs-deploy-task-definition` action, which would force `ignore_changes` on the task definition and split ownership. |
| Backend | `supabase db push`, `supabase functions deploy`, then the SQL bootstrap | `SUPABASE_ACCESS_TOKEN` and the database password come from environment secrets and `terraform output`. |
| Smoke / E2E subset | Playwright `^1.63.0`, already in the catalog, with a second config whose `baseURL` is the deployed URL and which starts no dev server | Seed the staging project with `@openvaa/dev-seed --allow-remote`. The suite's served-app preflight reads the project id off the HTML root, so it can assert the deployed app serves the intended project. |
| Order | Terraform (settings + infra) → migrations → functions → bootstrap SQL → image rollout → smoke | Settings before code, because `account-access` refuses to mail a link until the auth settings and allowlist are right. |

**OIDC trust conditions.** Audience `sts.amazonaws.com`. The plan role trusts `repo:OpenVAA/voting-advice-application:pull_request`; the deploy role trusts only `repo:OpenVAA/voting-advice-application:environment:<name>`. When a job names an environment, the token's subject is the environment and not the branch, so the environment's branch policy is what restricts who may deploy. Two things a fork must know: the repository slug is a variable, and GitHub documents that repositories created after 2026-07-15 use an id-bearing subject format (`repo:org@id/repo@id:...`), so a fresh fork's trust policy differs from this repository's. (MEDIUM: GitHub's own OIDC page.)

**Observing the pipeline before it is on `main`.** `workflow_dispatch` is offered only for workflows on the default branch. Reuse the repo's evidence-channel pattern: add a namespaced push trigger (for example `deploy-evidence/**`) to `deploy.yml` and allow that branch pattern in the staging environment.

**Pin by commit SHA in `deploy.yml`.** In March 2026 nearly every tag of `aquasecurity/trivy-action` was force-pushed to a credential stealer. A workflow that holds a cloud role must not resolve a mutable tag. This is stricter than `main.yaml`'s tag pins, on purpose.

### The analytics relay

| Piece | Choice | Version | Why |
| --- | --- | --- | --- |
| Relay endpoint | A SvelteKit `+server.ts` `POST` route in the existing app | none new | Same container, same origin, same deploy. The browser never contacts a third party, so no third-party origin is needed in any allowlist and the provider can change without a client release. |
| Browser transport | `fetch(url, { method: 'POST', keepalive: true })`, with `navigator.sendBeacon` for the flush on page hide | platform | No library. Same-origin, so SvelteKit's origin check passes. |
| Payload validation | `zod` | `^4.3.6`, already in the catalog | The event-name union in `trackingEvent.type.ts` becomes a closed enum the relay enforces, so the endpoint cannot be used to write arbitrary events into the provider. |
| Provider interface | A small server-only TypeScript interface under `$lib/server/` with three implementations: `posthog`, `console` (structured log line, for development and for E2E assertions), `none` | none new | "Modular with one real implementation". The `console` provider is what lets the consent-and-events E2E todo be closed without a network dependency. |
| PostHog implementation | Plain `fetch` to `POST {host}/batch/` with the project token in the body | Node 24 built-in `fetch` | The relay is a stateless forwarder: one inbound request, one outbound request. See below for why not `posthog-node`. |
| Configuration | Server-only variables: the provider name, the PostHog host, the PostHog project token | n/a | Read through `$env/dynamic/private`. None carries a `PUBLIC_` prefix, so none needs a cross-runtime pair entry, and the browser bundle no longer names the provider. |
| Visit identifier without storage | A UUIDv7 held in a JavaScript module variable for the life of the page load, generated by a small local helper | none new | See "Sessions without storage". PostHog requires a custom `$session_id` to be a UUIDv7 whose timestamp is not after the first event. |

**Why plain `fetch` and not `posthog-node`.**

- The SDK's value is an in-process queue with batching, feature flags, and person and group calls. The relay uses none of them. Its queue is state that must be flushed on `SIGTERM` at every Fargate scale-in or deploy, which is a new way to lose events.
- A second provider (Umami's `/api/send`) is also one HTTP `POST`. Keeping the first provider at that level keeps the interface honest.
- `posthog-node` publishes several times a week (5.55.1 on 2026-10-08) and the repo's `npmMinimalAgeGate: 7d` refuses any version younger than seven days, so the dependency would be a recurring friction point for nothing the relay needs.
- The capture endpoint is a documented public API, not an internal one.

**What the relay sends to PostHog.** `event`, `distinct_id`, `timestamp`, and `properties` carrying `$process_person_profile: false` (anonymous event, no person profile), `$geoip_disable: true`, `$current_url`, and `$session_id` when a visit identifier exists. The relay **does not forward the visitor's IP address**. Without `$geoip_disable`, PostHog would geolocate the Fargate task's own address, which is wrong and misleading.

**Sessions without storage.** Three modes, selectable by a setting:

| Mode | How | Storage on the device | What you get |
| --- | --- | --- | --- |
| `memory` (recommended default) | The browser holds a random UUIDv7 in memory. It survives client-side navigation and is gone on reload or tab close. | None | Per-visit funnels. A reload starts a new visit. |
| `none` | No identifier; each event stands alone (a fresh random `distinct_id` per event) | None | Counts and distributions only. The fallback the operator named. |
| `daily-hash` (do not build in v1) | The relay derives an id from a keyed hash of date, IP and user agent | None | Cross-reload continuity within a day, at the price of processing IP addresses and a contested legal position. |

Today the tracking service keeps its session id in `sessionStorage` (`sessionStorageState('appContext-sessionId', ...)`). Moving it to a module variable is the whole client-side change that removes storage.

PostHog's own cookieless mode (`cookieless_mode: 'always'`) is **not** used: it is a `posthog-js` feature that computes a hash from the IP and user agent of the request PostHog receives, and behind a relay that request comes from the server. Whether it can be driven through a relay is undocumented. The relay's own modes are provider-neutral, which the modularity requirement needs anyway.

---

## Installation

No npm package is added for either capability. Everything new is a CLI, a Terraform provider, or a GitHub Action.

```bash
# Local tooling an operator needs once (the bootstrap apply and local plans)
brew install hashicorp/tap/terraform   # 1.16.5; or tfenv / mise pinned by infra/.terraform-version
brew install tflint                    # 0.64.0
# AWS CLI v2 for `aws sso login` / profile credentials; the Supabase CLI already comes with `yarn install`
```

```hcl
# infra/<root>/versions.tf
terraform {
  required_version = "~> 1.16"

  required_providers {
    aws      = { source = "hashicorp/aws",     version = "~> 6.60" }
    supabase = { source = "supabase/supabase", version = "~> 1.11" }
    random   = { source = "hashicorp/random",  version = "~> 3.9" }
  }

  backend "s3" {
    # bucket, key and region come from `-backend-config`, so a fork commits no account-specific value
    encrypt      = true
    use_lockfile = true   # S3-native locking; no DynamoDB table
  }
}
```

```yaml
# .github/workflows/deploy.yml (the parts that are new to this repo; SHAs to be resolved at authoring time)
permissions:
  id-token: write   # required to request the OIDC token
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@<sha of v6.3.0>
    with:
      role-to-assume: ${{ vars.AWS_DEPLOY_ROLE_ARN }}
      aws-region: ${{ vars.AWS_REGION }}
  - uses: hashicorp/setup-terraform@<sha of v4.0.1>
    with:
      terraform_version: 1.16.5
      terraform_wrapper: false
  - uses: supabase/setup-cli@v3
    with:
      version: 2.118.0   # same pin as main.yaml
```

**Secrets and variables the pipeline needs, per GitHub environment:** `SUPABASE_ACCESS_TOKEN` (a fine-grained token; the auth-config endpoint needs `auth_config_write` and `project_admin_write`), the Supabase organization slug, the AWS role ARNs and region, the domain, the PostHog project token, and the identity-provider values where bank authentication is used. No AWS key and no Supabase service-role key is stored in GitHub: the service-role key is read from Terraform at run time and masked.

**Proposed layout** (an `infra/` directory at the repo root, not a Yarn workspace, so Turborepo and the frontend Docker build context ignore it):

```
infra/
  bootstrap/        # applied once by hand: state bucket, OIDC provider, CI roles, ECR repository
  modules/
    frontend/       # VPC, ALB, ECS service, scaling, logs, DNS, certificate
    supabase/       # project, settings, function secrets, apikeys data source
    mail-ses/       # optional
  environments/
    staging/        # the stack the pipeline applies and smoke-tests
    production/     # same modules, different variables
  tests/            # *.tftest.hcl with mock providers
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use the Alternative |
| --- | --- | --- |
| ECS Fargate + ALB as explicit resources | **ECS Express Mode** (`aws_ecs_express_gateway_service`, provider 6.23+) | A throwaway demo on the AWS-generated URL with no custom domain. It is one resource and AWS's recommended App Runner successor. Not for the reference deployment: the load balancer it creates is not in Terraform state, a custom domain means hand-editing that load balancer's listener, the default network is the default VPC, and the resource already carries a deprecated attribute a year after launch. |
| ECS Fargate + ALB | **AWS App Runner** | Never for a new account: closed to new customers since 2026-04-30, no new features planned. Only an account that already used it can still create services. |
| ECS Fargate + ALB | **Lambda + AWS Lambda Web Adapter** (v1.1.0) behind a Function URL or CloudFront | A deployment with long idle periods where scale-to-zero matters more than anything else, and only after the Admin App's in-memory job store is moved to the database. Costs: cold starts on a large SSR bundle, response-size and streaming constraints. |
| ECS Fargate + ALB | **EC2 / Lightsail instance with Docker** | The cheapest possible single box for a tiny election. No autoscaling, and patching becomes the operator's job. |
| Terraform CLI | **OpenTofu** 1.13.1 | If the BUSL licence of Terraform is a problem for a deployer. The HCL recommended here uses nothing Terraform-only (OpenTofu also supports `use_lockfile`), so keep it that way and the choice stays open. |
| S3 backend with `use_lockfile` | **HCP Terraform** (remote state + runs as a service) | A team that wants a managed UI, policy checks and run history. Adds an account and a token, and moves the apply out of GitHub Actions. |
| S3 backend with `use_lockfile` | S3 + DynamoDB lock table | Never for new work: deprecated, to be removed in a future minor version. |
| Supabase Terraform provider for settings | **`supabase config push`** with `[remotes.*]` blocks | A single-deployment project (not a forked framework) that wants `config.toml` as the one source for local and hosted. |
| Supabase Terraform provider for settings | **Management API** called from scripts (`PATCH /v1/projects/{ref}/config/auth` and siblings) | For a setting the provider does not expose. The provider's JSON pass-through covers everything needed today, so this is a fallback, not a layer. |
| One persistent staging project | **Supabase Branching** (`supabase_branch`) for per-PR backends | A team on a paid plan that wants a database per pull request. Too slow and too costly to be the default test target here. |
| PostHog Cloud EU | **Self-hosted PostHog** (hobby Docker Compose) | A deployer that is forbidden to use any SaaS and expects under roughly 300k events. Unsupported, single VM, 4 vCPU / 16 GB, no paid features, and security fixes mean tracking the latest image yourself. |
| PostHog as the first provider | **Umami** (v3.4.0) Cloud or self-hosted | The natural second provider: cookieless by design, a single `POST /api/send`, light enough to self-host on a small container. Use it to check the provider interface is not PostHog-shaped. It is not the first provider because the operator prefers PostHog and its funnels and breakdowns are stronger. |
| Plain `fetch` to the capture API | **`posthog-node`** 5.55.1 | If feature flags, server-side error tracking or cross-request batching are wanted later. Then flush on the `sveltekit:shutdown` event. |
| In-app schema allowlist + size cap + per-address limiter on the relay | **AWS WAF** rate-based rule on the load balancer | When abuse is observed or a hard per-address cap is required. WAF bills per request inspected, and every request through the load balancer is inspected, so its cost scales with election-day traffic. Make it an opt-in variable. |
| SSM Parameter Store `SecureString` | **AWS Secrets Manager** | When automatic rotation or cross-account sharing is needed. |
| Amazon SES for SMTP | Any SMTP provider supplied through variables | An operator who already has a mail provider, or who cannot wait for SES production access. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
| --- | --- | --- |
| AWS App Runner | Closed to new customers since 2026-04-30; maintenance only | ECS Fargate + ALB |
| A DynamoDB lock table for Terraform state | Deprecated in the S3 backend; one more resource to bootstrap | `use_lockfile = true` |
| AWS access keys in GitHub secrets | Long-lived, exfiltratable, and unnecessary | OIDC role assumption |
| A NAT gateway and private subnets for the tasks | A fixed monthly cost comparable to the compute itself, for tasks that only make outbound calls | Public subnets, tasks with a public IP, a security group that admits only the load balancer |
| `terraform-aws-modules/*` (ecs 7.6.1, vpc 6.7.3, alb 10.5.1) | Well made, but each is a large abstraction with frequent major versions. A reference deployment that forks must read and adapt is clearer as about fifteen plain resources. | A small local module of `aws_*` resources |
| `aws-actions/amazon-ecs-deploy-task-definition` / `amazon-ecs-render-task-definition` | A second writer of the task definition; Terraform would need `ignore_changes` and would stop describing what runs | `terraform apply -var image_tag=...` |
| `docker/build-push-action`, `aws-actions/amazon-ecr-login` in the deploy job | Not wrong, but each is another third-party action inside a job that holds a cloud role, and the repo already builds this image with plain `docker build` | `docker build` / `docker push` + `aws ecr get-login-password` |
| `aquasecurity/trivy-action` by tag | Its tags were hijacked in March 2026 to steal CI secrets | If IaC scanning is wanted, run a pinned Trivy binary or pin the action by SHA; `tflint` + `terraform validate` are the baseline |
| Terragrunt, Atlantis, Terraform workspaces for environments | Extra tools and indirection for two environments | Two small root modules sharing local modules |
| `supabase config push` alongside Terraform | Two writers of the same hosted settings | Terraform only, plus the parity guard |
| `supabase_edge_function` (Terraform) for deploying functions | No `verify_jwt` in its documented schema; a second bundling path beside the CLI | `supabase functions deploy` |
| `apps/supabase/supabase/seed.sql` on a hosted project | Creates two test users with a known password | The SQL bootstrap script |
| `posthog-js` in the browser | It is the direct browser-to-third-party path the milestone removes, and it writes cookies and local storage by default | The relay |
| The existing `UmamiAnalytics.svelte` script-tag loader | Loads a third-party script and sends from the browser | The relay; Umami can return later as a server-side provider |
| A user-agent parsing library in the relay (`ua-parser-js` 2.x is AGPL, LOW confidence) | Licence risk and a dependency for a minor dimension | If device class is wanted, have the client send a viewport-width bucket |
| The PostHog Terraform provider | The PostHog project is one manual step and one token; managing it in state adds a provider for no drift worth detecting | A variable holding the project token |
| Self-hosted Supabase | Out of scope by operator decision | Hosted Supabase |
| Per-PR ephemeral full stacks | A Supabase project per PR is slow and billable; the load balancer alone takes minutes | One persistent staging stack, applied and smoke-tested by the pipeline |

---

## Stack Patterns by Variant

**If the deployer's DNS is in Route 53:**
- Pass the hosted zone id; Terraform validates the certificate and creates the alias record itself.
- Because `apply` is then one step with no human in the middle.

**If the DNS is held elsewhere:**
- Terraform outputs the ACM validation records and the load balancer's DNS name; the operator creates two records, then re-applies.
- Because certificate validation blocks the HTTPS listener until the record exists. This is a two-phase apply and the docs must say so.

**If mail goes through SES:**
- Enable the `mail-ses` module, and request SES production access early (it is a manual AWS review; a new account is in the sandbox and can only mail verified addresses).
- For the tested staging stack, verified recipient addresses or the SES mailbox simulator are enough.

**If bank authentication is not used:**
- Omit the `IDENTITY_PROVIDER_*` function secrets and frontend variables entirely.
- Because `identity-callback` throws on a partial set by design.

**If the election is large (a municipal election, tens of thousands of nominations):**
- Raise `min_capacity` to 2 or more across both zones before the peak, and consider a Supabase compute size above the smallest.
- Consider CloudFront in front of the load balancer for `/_app/immutable/*`. It is deliberately not in the first version: it adds a distribution, a second certificate in `us-east-1`, and changes `XFF_DEPTH` to 2.

**If the strictest reading of "no consent needed" is required:**
- Run the relay in `none` mode.
- Because under the broadest reading of the ePrivacy rules even a script-generated in-memory identifier may be argued to be information obtained from the device. This is a legal question, not a technical one (LOW confidence; see Open questions).

---

## Version Compatibility

| Item | Compatible With | Notes |
| --- | --- | --- |
| `@sveltejs/adapter-node` 5.5.7 (locked) | An ALB in front | Reads `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, `PROTOCOL_HEADER`, `HOST_HEADER`, `KEEP_ALIVE_TIMEOUT`, `HEADERS_TIMEOUT`, `SHUTDOWN_TIMEOUT` (checked in the published 5.5.7 files). Set `ORIGIN=https://<domain>`, `ADDRESS_HEADER=X-Forwarded-For`, `XFF_DEPTH=1`. No upgrade to 6.0.0 is needed. |
| Node `keepAliveTimeout` (5 s default) | ALB idle timeout (60 s default) | A backend that closes idle connections before the load balancer does produces intermittent 502s. Set `KEEP_ALIVE_TIMEOUT` above the ALB idle timeout (for example 65) and `HEADERS_TIMEOUT` above that. |
| `SHUTDOWN_TIMEOUT` (30 s default) | ECS `stopTimeout` (30 s default) | ECS kills the container at `stopTimeout`. Keep `SHUTDOWN_TIMEOUT` below it, and the target group's deregistration delay at or below both. |
| `aws_ecs_service.wait_for_steady_state` | Terraform apply in CI | Makes the apply as long as the rollout. Budget the job timeout for it. |
| Terraform `use_lockfile` | Terraform 1.10+ | Needs `s3:DeleteObject` on the `.tflock` key in the CI roles' policy, in addition to get and put. |
| `supabase/supabase` provider 1.11 | Secret auth fields | The API returns `smtp_pass` and hook secrets hashed, and the provider keeps the prior state value, so a change made to those in the dashboard does **not** appear in `plan`. Drift detection covers the non-secret fields only. |
| `supabase_edge_function_secrets` | Secret names | A name starting with `SUPABASE_` is rejected by the API. `SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected by the platform and must not be declared. Values are stored in Terraform state, hence the encrypted backend. |
| Supabase CLI 2.118.0 | GitHub-hosted runners (IPv4 only) | A hosted project's direct database host is IPv6-only without a paid add-on. `supabase link` + `db push` are reported to go through the IPv4 pooler; a fallback is `--db-url` with the pooler connection string from `data.supabase_pooler`. Verify in the first pipeline run (LOW). |
| Supabase legacy `anon` / `service_role` keys | End of 2026 | Supabase is deprecating them in favour of publishable and secret keys by the end of 2026. `data.supabase_apikeys` exposes both kinds. The frontend variable is named `PUBLIC_SUPABASE_ANON_KEY` but takes either. Which keys a brand-new project has, and what the Edge runtime injects as `SUPABASE_ANON_KEY`, is unverified. |
| PostHog `$session_id` | UUIDv7 only | `crypto.randomUUID()` is v4; the existing `getUUID()` helper cannot be reused for the visit id. A v7 generator is about fifteen lines. Sessions whose id is not a valid v7 are silently excluded from session aggregations. |
| `posthog-node` (if ever added) | Node 24, `npmMinimalAgeGate: 7d` | Engines `^20.20.0 \|\| >=22.22.0`. The age gate blocks the newest release for a week. |
| `fetch` with `keepalive` | 64 KB body cap | The tracking service already caps a compound pageview at 45 sub-events; keep the cap and add a byte check. |
| ECS Fargate architecture | The current Dockerfile | `node:24-alpine` is multi-arch. `X86_64` is the safe default because `ubuntu-latest` builds it natively. `ARM64` is roughly a fifth cheaper and is a one-variable change once the image is built on an arm64 runner (LOW on the price ratio). |

---

## Integration points with the existing repository

These are the places the new stack touches code that exists today. Each is a requirement candidate.

1. **A health endpoint.** The load balancer needs a path that answers 200 without rendering a page or querying Supabase. None exists; `/` does both. Add a trivial `+server.ts` and exclude it from the session gate and Paraglide redirects.
2. **Proxy variables for adapter-node.** `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`, `KEEP_ALIVE_TIMEOUT` are set nowhere today. `getClientAddress()` returns the load balancer's address without them, and the relay's limiter keys on that call.
3. **The in-memory admin job store** (`apps/frontend/src/lib/server/admin/jobs/jobStore.ts`: two module-level `Map`s, with a comment that it "will be replaced with a database later"). With more than one task, a progress poll lands on a task that never saw the job. It is why Lambda is out, and it is a known limit of scaling the service past one task until it is moved.
4. **`PUBLIC_PROJECT_ID` is missing from both deployment templates** (2026-10-02 todo, item 1). The Terraform task definition is where it finally gets set, from the same value as the function secret.
5. **`PUBLIC_BROWSER_FRONTEND_URL` / `PUBLIC_SERVER_FRONTEND_URL` have no consumer** (same todo, item 2). Decide before writing the task definition, so the new template does not carry dead variables.
6. **Storage buckets exist only in `config.toml`** (same todo, item 4). The new migration closes it. Note the repo's schema-to-migration parity guard: the change goes in `schema/` and is regenerated.
7. **`render.example.yaml`** stays or goes: the Terraform stack replaces it as the tested reference. The `docker-image-build` job's header comment names it as a consumer of the image.
8. **The tracking service's storage use.** `sessionStorageState('appContext-sessionId', ...)` and the consent gate `userPreferences.dataCollection.consent === 'granted'` are the two things "no permission needed" changes. The session id is also substituted into the survey link, so a per-page-load id changes what that link carries.
9. **`analytics.platform` is a static setting typed `name: 'umami'`**, and the privacy text is keyed on the platform name. The relay makes the provider a server concern; the 2026-06-01 todo already asks to move analytics to a dynamic setting.
10. **The Playwright config hard-codes `baseURL` to `localhost`** and its preflight asserts the listener is this checkout's dev server. The deployed smoke run needs its own config; the project-id half of the preflight is reusable as is.
11. **`@openvaa/dev-seed` refuses a non-local `SUPABASE_URL`** unless `--allow-remote` or `DEV_SEED_ALLOW_REMOTE=1` is set. The staging seed step must opt in, and nothing must ever point it at production.
12. **`.env.example` conventions.** New server-only variables (relay provider, PostHog host and token) take no `PUBLIC_` prefix, so the env-pair registry guard derives nothing from them. `assert:edge-function-env` already derives the function variables from source; the Terraform secret list can be checked against the same derivation.
13. **`[functions.identity-callback] verify_jwt = false`** is not in `config.toml` today (the local serve passes `--no-verify-jwt`). Declaring it there makes local and hosted deploys agree without a flag.
14. **`main.yaml`'s test-asserted properties.** Several jobs have their shape asserted by tests under `packages/dev-seed/tests/` (for example that `docker-image-build` never pushes). The deploy job goes in a new workflow file so those assertions stay true.

---

## Open questions and unverified items

Carry these into phase research; none blocks the roadmap.

| Item | Why it is open | Suggested resolution |
| --- | --- | --- |
| The legal position of an in-memory visit identifier, and of any analytics without consent | A legal question. The EDPB's guidelines on the technical scope of ePrivacy Article 5(3) (version 2.0, October 2024) read "gaining access" broadly; their treatment of script-generated identifiers was not read in this research. GDPR still applies to the processing either way. | Operator or legal review. Ship `none` as an available mode so the decision is a setting, not a rebuild. |
| What a hosted gateway does that the local one does not | The standing 174 todos: whether `account-access` is reachable with the anon key alone, which forwarded headers arrive, the redirect behaviour of `/auth/v1/verify` | This milestone's staging stack is the first place they can be measured. Plan a measurement task, not an assumption. |
| `supabase db push` from an IPv4-only runner | Community reports say the CLI uses the pooler; no official page confirms it for `db push` | First pipeline run; fall back to `--db-url` with the pooler string. |
| Which API keys a new Supabase project issues, and what the Edge runtime injects | The legacy-key deprecation is scheduled for the end of 2026 | Read `data.supabase_apikeys` on the staging project; decide whether the frontend takes the publishable key. |
| Postgres 17 on a new hosted project | The provider cannot set or read the major version | Assert in the pipeline. |
| `uri_allow_list` format and the single-segment `*` pattern on hosted | Believed to be a comma-separated string; the mid-path wildcard was measured only against the local auth service | Apply to staging and repeat the local measurements listed in `config.toml`. |
| Supabase plan for staging | Free projects pause after about a week without activity (third-party sources), which would break a pipeline that runs rarely; Pro is about 25 USD a month per organization | Operator decision. A scheduled smoke run also keeps a free project awake. |
| SES production access | A manual AWS review of unknown duration | Request at the start of the milestone; the staging tests do not depend on it. |
| Driving PostHog's cookieless hash mode through a relay | Undocumented | Not needed; the relay's own modes replace it. |
| PostHog cost at election peak | 1M events a month are free; the paid rate for anonymous events was not confirmed | The tracking service already folds a page's events into one compound `pageview`, which keeps volume near one event per page. If the relay unfolds them for easier analysis, volume multiplies. Set a billing limit on the PostHog project. |
| Fargate sizing and monthly cost | Not measured | A rough estimate is 45 to 60 USD a month for one small task, the load balancer and their public addresses (LOW, from list prices recalled, not read). Measure on staging. |
| Region pairing | Not checked which Supabase regions exist near the chosen AWS region | Put the frontend in the same AWS region as the Supabase project; SSR makes several backend calls per page. PostHog EU is in Frankfurt regardless. |
| IAM OIDC provider thumbprints | Believed optional in the current AWS provider | Omit `thumbprint_list`; add it only if `plan` demands it. |

---

## Sources

**Versions (REGISTRY, read 2026-10-10)**

- GitHub Releases API: `hashicorp/terraform` v1.16.5 (2026-10-02); `hashicorp/terraform-provider-aws` v6.68.0 (2026-10-07); `supabase/terraform-provider-supabase` v1.11.0 (2026-09-02); `hashicorp/terraform-provider-random` v3.9.1; `supabase/cli` v2.120.0 (2026-10-06); `aws-actions/configure-aws-credentials` v6.3.0 (2026-09-15); `hashicorp/setup-terraform` v4.0.1; `supabase/setup-cli` v3.0.1; `terraform-linters/tflint` v0.64.0; `terraform-linters/setup-tflint` v6.3.2; `awslabs/aws-lambda-web-adapter` v1.1.0; `opentofu/opentofu` v1.13.1; `umami-software/umami` v3.4.0; `terraform-aws-modules/terraform-aws-ecs` v7.6.1, `-vpc` v6.7.3, `-alb` v10.5.1; `aws-actions/amazon-ecs-deploy-express-service` v1.2.2; `docker/build-push-action` v7.4.0.
- npm registry: `posthog-node` 5.55.1 (2026-10-08, engines `^20.20.0 || >=22.22.0`); `posthog-js` 1.438.7; `supabase` 2.120.0; `@sveltejs/adapter-node` 6.0.0 (repo locks 5.5.7).
- unpkg, `@sveltejs/adapter-node@5.5.7` `files/env.js`: the environment variables that version reads.

**Official documents read**

- [AWS App Runner availability change](https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html): closed to new customers, ECS Express Mode recommended, custom domain by editing the ALB listener. MEDIUM (a second source, [AWS service availability updates](https://aws.amazon.com/about-aws/whats-new/2026/03/aws-service-availability), gives the 2026-04-30 date).
- [Amazon ECS Express Mode overview](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html): what it provisions, pricing, Terraform support.
- [`aws_ecs_express_gateway_service` provider doc](https://raw.githubusercontent.com/hashicorp/terraform-provider-aws/main/website/docs/r/ecs_express_gateway_service.html.markdown): arguments, caveats, deprecated attribute. LOW (single source).
- [Terraform S3 backend](https://developer.hashicorp.com/terraform/language/backend/s3): `use_lockfile`, DynamoDB deprecation, IAM permissions, versioning. MEDIUM.
- Supabase Terraform provider v1.11.0 docs: [settings](https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/resources/settings.md), [edge_function_secrets](https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/resources/edge_function_secrets.md), [edge_function](https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/resources/edge_function.md), [project](https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/resources/project.md), [apikeys data source](https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/data-sources/apikeys.md), [provider index](https://raw.githubusercontent.com/supabase/terraform-provider-supabase/v1.11.0/docs/index.md).
- [Supabase Management API: update auth config](https://supabase.com/docs/reference/api/v1-update-auth-service-config): `PATCH /v1/projects/{ref}/config/auth`, the twenty fields, token permissions.
- [Supabase CLI reference: config push, link, db push, functions deploy, secrets set](https://supabase.com/docs/reference/cli/supabase-config-push); [Branching configuration](https://supabase.com/docs/guides/deployment/branching/configuration) and [CLI v2 config as code](https://supabase.com/blog/cli-v2-config-as-code): `[remotes.*]` blocks and their limits.
- [Supabase: IPv4 and IPv6 compatibility](https://supabase.com/docs/guides/troubleshooting/supabase--your-network-ipv4-and-ipv6-compatibility-cHe3BP.md) and [API keys](https://supabase.com/docs/guides/api/api-keys.md) (via search summaries). LOW to MEDIUM.
- [GitHub: OIDC in AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws): provider URL, audience, subject formats including the post-2026-07-15 id-bearing format, required permissions.
- [PostHog capture API](https://posthog.com/docs/api/capture): endpoints, EU host, anonymous events, batch size. [PostHog sessions](https://posthog.com/docs/data/sessions.md): UUIDv7 requirement. [PostHog Node library](https://posthog.com/docs/libraries/node): queue defaults, `disableGeoip`, shutdown. [PostHog cookieless tracking](https://posthog.com/docs/privacy/cookieless-tracking) (read from the docs repository source): modes, hash inputs, limitations. [PostHog self-hosting](https://posthog.com/docs/self-host): unsupported, hobby sizing, Kubernetes ended. MEDIUM where two of these agree, LOW otherwise.
- [SvelteKit adapter-node](https://svelte.dev/docs/kit/adapter-node): environment variables, graceful shutdown, proxy headers.

**Secondary**

- [Aqua Security](https://www.aquasec.com/blog/trivy-supply-chain-attack-what-you-need-to-know), [CrowdStrike](https://crowdstrike.com/en-us/blog/from-scanner-to-stealer-inside-the-trivy-action-supply-chain-compromise) and [Snyk](https://snyk.io/articles/trivy-github-actions-supply-chain-compromise/) on the March 2026 `trivy-action` tag hijack. MEDIUM.
- [EDPB Guidelines 2/2023, version 2.0](https://www.edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en): existence and scope only; the text was not read. LOW.
- Third-party pricing summaries for Supabase and PostHog plans. LOW.

**Repository files read**

`render.example.yaml`, `docker-compose.dev.yml`, `apps/frontend/Dockerfile`, `apps/supabase/supabase/config.toml`, `.github/workflows/{main.yaml,release.yml,docs.yml}`, `.env.example`, `.yarnrc.yml`, the tracking service and `UmamiAnalytics.svelte`, `hooks.server.ts`, `jobStore.ts`, the deployment docs page, and the seven standing todos the milestone absorbs.

---

*Stack research for: v2.17 Full Deployment — AWS by Terraform, Hosted Supabase & Analytics Relay*
*Researched: 2026-10-10*
