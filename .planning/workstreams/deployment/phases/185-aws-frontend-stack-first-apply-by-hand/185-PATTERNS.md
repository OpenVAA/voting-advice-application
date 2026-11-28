# Phase 185: AWS Frontend Stack, First Apply by Hand - Pattern Map

**Mapped:** 2026-11-12
**Files analyzed:** 22 (new + modified)
**Analogs found:** 20 / 22
All analog paths below were checked with `git ls-files` (tracked source; no mirrors).

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `infra/modules/frontend-service/versions.tf` (or `main.tf` header) | config | - | `infra/modules/registry/main.tf` (lines 1-10) | exact |
| `infra/modules/frontend-service/{network,security,certificates,load-balancer,cdn,service,scaling,alerts}.tf` | module (IaC) | request-response (serving path) | `infra/modules/registry/main.tf`, `infra/modules/github-oidc/policies.tf` | role-match |
| `infra/modules/frontend-service/task-environment.json` + `jsondecode` locals | config | transform | `infra/modules/supabase/hosted-settings.json` + `infra/modules/supabase/settings.tf` (lines 1-30) | exact |
| `infra/modules/frontend-service/variables.tf` | config | - | `infra/modules/registry/variables.tf` | exact |
| `infra/modules/frontend-service/outputs.tf` | config | - | `infra/modules/registry/outputs.tf` | exact |
| `infra/modules/frontend-task-role/{main,variables,outputs}.tf` (execution role, Open Question 1) | module (IAM) | - | `infra/modules/github-oidc/main.tf` (105-130) + `policies.tf` (56-92) | exact |
| `infra/bootstrap/main.tf` (add module call), `outputs.tf` (execution role ARN) | config | - | same file, `module "github_oidc"` block / `output "deploy_role_arn"` | exact |
| `infra/envs/staging/aws/main.tf` (module call, `us-east-1` alias, `random` provider) | root | - | itself (lines 1-36) + `infra/envs/staging/dns-mail/main.tf` (module call) | exact |
| `infra/envs/staging/aws/variables.tf`, `terraform.tfvars`, new `outputs.tf` | config | - | itself; `infra/bootstrap/outputs.tf` for outputs | exact |
| `infra/envs/staging/aws/.terraform.lock.hcl` (add `random`, 3 platforms) | config | - | itself (regenerate with `providers lock`) | exact |
| `infra/envs/example/aws/{main,variables,terraform.tfvars,outputs}.tf` | root (template) | - | `infra/envs/example/aws/terraform.tfvars` (stand-in comment form) | exact |
| `infra/envs/staging/aws/README.md` (runbook, D-24) | docs/runbook | - | `infra/envs/staging/supabase/README.md` (§ Not yet observed 1469, § Observations 1475) | exact |
| `infra/README.md` (Roots table, Order, region statement, WAF place) | docs | - | itself | exact |
| `infra/scripts/build-push-image.sh` (D-14) | utility script | batch / file-I/O | `infra/scripts/account-inventory.sh`, `infra/scripts/check-drift.sh` (header style) | role-match |
| `infra/scripts/check-aws-frontend.sh` or runbook curl blocks (optional observation script) | utility script | request-response | `infra/local/check-proxy-topology.sh` | exact |
| `apps/frontend/src/routes/api/diagnostics/+server.ts` (allow-list, D-06) | route | request-response | itself, `FORWARDING_HEADERS` lines 6-14 | exact |
| `apps/frontend/src/routes/api/diagnostics/*.test.ts` (if a test exists / is added) | test | - | `apps/frontend/src/lib/server/startup/requiredEnv.test.ts` | role-match |
| `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` (D-13 guard) | test | file-I/O | `apps/frontend/src/lib/server/startup/requiredEnv.test.ts` | role-match |
| `apps/frontend/src/hooks.server.ts` or a server module (D-16 shutdown line) | hook | event-driven | `apps/frontend/src/hooks.server.ts` lines 19-40 (logger use) | role-match |
| `.env.example` (only if a new name, e.g. `KEEP_ALIVE_TIMEOUT`, enters the JSON) | config | - | itself § Reverse proxy | exact |
| `.planning/.../185-*/evidence/185-NN-*.md` | evidence | - | 184 evidence files | exact |
| `adapter-node` `sveltekit:shutdown` listener | hook | event-driven | none in repo | no analog |

## Pattern Assignments

### Module header (every new module file set) — analog `infra/modules/registry/main.tf` lines 1-10
```hcl
terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.60"
    }
  }
}
```
Add `random = { source = "hashicorp/random", version = "~> 3.9" }` in `frontend-service` (origin secret). For the `us-east-1` certificate, declare `configuration_aliases = [aws.us_east_1]` in the module's `aws` block and pass `providers = { aws = aws, aws.us_east_1 = aws.us_east_1 }` from the root.
Comment style: one `#` block above each resource saying what it guarantees ("Tags are immutable: once pushed, a tag always names the same image."), not how it was decided.

### `infra/modules/frontend-service/task-environment.json` + locals — analog `infra/modules/supabase/settings.tf` lines 1-30
```hcl
locals {
  hosted = jsondecode(file("${path.module}/hosted-settings.json"))
  auth_hook = { for k, v in local.hosted.auth_hook : k => v if var.enable_access_token_hook }
```
Apply as `local.task_env = jsondecode(file("${path.module}/task-environment.json"))`, then `for` expressions split `kind == "plain"` (value from `var.environment_values[name]`) and `kind == "secret"` (`valueFrom = "arn:aws:ssm:${region}:${account}:parameter/openvaa/${env}/frontend/${name}"`, string-built, no data source), filtered by `!contains(var.omit_environment, e.name)` (D-15). Copy the settings.tf type-trap note: filter key by key, never `cond ? {...} : {}`.

### `variables.tf` / `outputs.tf` — analogs `infra/modules/registry/variables.tf`, `outputs.tf`
```hcl
variable "max_images" {
  description = "Number of newest images kept. Older images are expired ... so this bounds how far back a rollback can reach."
  type        = number
  default     = 50
}
output "repository_url" {
  description = "URL of the image repository, used as the image name when pushing and pulling."
  value       = aws_ecr_repository.frontend.repository_url
}
```
Every variable has a full-sentence `description` and explicit `type`; defaults for tunables (cpu 512 / memory 1024, min 1 / max 2, log retention 90, `omit_environment = []`, `debug_ingress_cidrs = []`). The origin-secret output is `sensitive = true`.

### `infra/modules/frontend-task-role/` — analogs `infra/modules/github-oidc/main.tf` 105-130, `policies.tf` 56-92
```hcl
# Neither role carries a permission of its own; every permission is a managed policy attached by a
# separate resource in policies.tf.
resource "aws_iam_role" "deploy" {
  name               = "${var.name_prefix}-${var.environment}-deploy"
  path               = var.iam_path
  assume_role_policy = data.aws_iam_policy_document.deploy_trust.json
}
# With an empty list, the next apply removes any inline policy someone adds to a role by hand.
resource "aws_iam_role_policies_exclusive" "deploy" {
  role_name    = aws_iam_role.deploy.name
  policy_names = []
}
resource "aws_iam_policy" "ecr_push" {
  name        = "${var.name_prefix}-ecr-push"
  path        = var.iam_path
  description = "Push images to the one image repository."
  policy      = data.aws_iam_policy_document.ecr_push.json
}
```
Copy exactly: `data "aws_iam_policy_document"` with `sid`, customer-managed `aws_iam_policy` under `var.iam_path` (`/openvaa/`), `aws_iam_role_policy_attachment`, `aws_iam_role_policies_exclusive` with `[]`. Trust principal `ecs-tasks.amazonaws.com`; SSM statement on `parameter/openvaa/staging/frontend/*`. Comments must not name the inline-policy resource type (guard `scripts/assert-no-inline-iam-policies.mjs` reads comments). No IAM in `envs/staging/aws` (183 D-07).

### `infra/bootstrap/main.tf` / `outputs.tf` — analog: same files
```hcl
module "registry" {
  source = "../modules/registry"

  repository_name = var.registry_name
}
output "registry_arn" {
  description = "ARN of the image repository."
  value       = module.registry.repository_arn
}
```
Add `module "frontend_task_role"` beside `github_oidc`, passing `name_prefix`, `iam_path`; add an output with a description. Header comment of bootstrap/outputs.tf: "None of these is a secret. The operator copies them into ... the other roots after the apply." — the ARN enters `staging/aws` as a tfvars value.

### `infra/envs/staging/aws/main.tf` — analog: itself (lines 1-36) and `infra/envs/staging/dns-mail/main.tf`
Keep the literal backend and the `allowed_account_ids` + `default_tags` provider. Add a second provider block `alias = "us_east_1"`, `region = "us-east-1"` with the **same** `allowed_account_ids` and `default_tags` (Research Pitfall 13). Module call style:
```hcl
# The zone and the mail identity live in this root so that they outlive any root that is destroyed and
# created again. This root reads no other root's state.
module "dns_zone" {
  source = "../../../modules/dns-zone"
```
Zone is read via `data "aws_route53_zone"` by name (no remote state). Also add `random` to `required_providers`, then `terraform providers lock` for the 3 platforms (`linux_amd64`, `darwin_arm64`, `linux_arm64`) in both aws roots — CI runs `-lockfile=readonly`.

### `infra/envs/staging/aws/terraform.tfvars` and `infra/envs/example/aws/terraform.tfvars`
Staging header: `# Tracked on purpose: the public record of this root's inputs. Nothing secret belongs here.` Example form:
```hcl
# A stand-in. The provider refuses credentials for any account other than this one, so the root
# cannot be applied until this value is replaced with your own account id.
aws_account_id = "000000000000"
```
Every new input in example gets a stand-in with a `# A stand-in.` comment. Alert email: variable without a tracked value if personal (D-17), supplied via `TF_VAR_alert_email`.

### `infra/envs/staging/aws/README.md` — analog `infra/envs/staging/supabase/README.md`
Section skeleton to copy: `## Rules of this root` (13), `## What you paste back` (45), `## Before you start` (67), `## Flow overview` (89), numbered `### Step N: ...`, then `## Not yet observed` (1469) and `## Observations` (1475):
```markdown
| Date (UTC)    | Observation |
| ------------- | ----------- |
| 2026-10-22    | The import of the throwaway project in Step 2 left no database password in state (`s7_password_in_state=false`). |
```
Each step's command block starts with `export AWS_PROFILE=openvaa-admin` + `aws sts get-caller-identity` account check, and reads `$?` on the next line (never piped).

### `infra/scripts/build-push-image.sh` — analogs `infra/scripts/account-inventory.sh` (1-25), `infra/scripts/check-drift.sh` (1-30)
Header form: `#!/usr/bin/env bash`, `# name.sh -- one-line purpose.`, then `# Usage:` with fenced example and each flag marked `REQUIRED.`/`OPTIONAL.`, a `--self-test` that needs no credentials (account-inventory precedent), and a refusal when the caller is not `OPENVAA_ACCOUNT_ID` (account-inventory: "When the caller is not in OPENVAA_ACCOUNT_ID, only the caller line is printed and the status is 1"). Checks: clean tree, `HEAD` listed by `git ls-remote origin`, tag = 40-char SHA, `--platform linux/arm64`, `--build-arg BUILD_SHA=<sha>`, target `production`.

### Observation script (optional) — analog `infra/local/check-proxy-topology.sh`
Copy the `--out <dir>` + `summary.txt` lines `label | expected: ... | observed: ... | PASS`, control-before-observation ordering, and `curl --resolve` request shapes (spoof `X-Forwarded-For: 203.0.113.99`, cross-site form POST 403 control, diagnostics 404/200 switch). For AWS: `curl --resolve origin.staging.openvaa.org:443:<alb-ip>` for the origin-lock checks.

### `apps/frontend/src/routes/api/diagnostics/+server.ts` — analog: itself lines 5-14
```ts
/** The request headers the response reports. An allow-list, so a header that carries a credential is never echoed. */
const FORWARDING_HEADERS: ReadonlyArray<string> = [
  'host', 'x-forwarded-for', 'x-forwarded-proto', 'x-forwarded-port', 'x-forwarded-host', 'forwarded', 'via'
];
```
Append `'cloudfront-viewer-address'`, `'x-amz-cf-id'`. Never add the origin-secret header name.

### `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts` — analog `requiredEnv.test.ts` lines 1-40
```ts
import { describe, expect, it } from 'vitest';
import { missingRequiredEnv, REQUIRED_ENV } from './requiredEnv';
/**
 * Specification for `missingRequiredEnv`: ...
 */
```
Same TSDoc-on-top specification block and TSDoc on helpers. Read `infra/modules/frontend-service/task-environment.json` and root `.env.example` with `node:fs` (path from `import.meta.url`), assert: every `REQUIRED_ENV` name present; every JSON name in `.env.example` (commented lines count); `SUPABASE_SERVICE_ROLE_KEY` absent. Lives in the frontend workspace because `requiredEnv.ts` imports `$lib/...` (no alias in `infra/vitest.config.ts`).

### D-16 shutdown line — analog `apps/frontend/src/hooks.server.ts` lines 19-40
```ts
configureLogger({ level: logLevel });
...
for (const problem of analyticsConfigProblems) {
  log.error('The analytics configuration is unusable; no analytics events are sent.', { ...problem });
}
```
Module-top-level registration beside these; `process.on('sveltekit:shutdown', (reason) => log.<level>('...', { reason, ... }))`, guarded like `init` (`if (dev || building) return`, lines 134-139). Level must clear the deployed `PUBLIC_LOG_LEVEL` (Research Pitfall 6). Comments: present-tense, no phase narrative (CLAUDE.md Comment Hygiene).

## Shared Patterns

### Provider guard and tags (all AWS roots/aliases)
Source: `infra/envs/staging/aws/main.tf` 22-36 — `allowed_account_ids = [var.aws_account_id]`, `default_tags { Project, Environment, Root = "aws", ManagedBy }`. Apply to the `us_east_1` alias too, and propagate tags to ECS tasks (`propagate_tags = "SERVICE"`, Pitfall 10).

### IAM only as customer-managed policies, only in hand-applied roots
Source: `infra/modules/github-oidc/main.tf` 105-130, `policies.tf` 56-92. Resource policies (SNS topic policy for EventBridge) are allowed in `frontend-service`.

### Gate/exit-status discipline
Source: `infra/README.md` Rules — status read on the next line, never through a pipe; no secret in files/evidence; no plan files committed.

### Script headers
Source: `infra/scripts/check-drift.sh` 1-30 — long `#` header stating what is checked, what is not, Usage block, flag list.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| CloudFront / ALB / ECS / autoscaling / EventBridge resources | IaC | request-response | No such resources exist yet; use RESEARCH.md § Code Examples (lines ~517-745) for resource bodies, with the module conventions above |
| `sveltekit:shutdown` listener | hook | event-driven | No process-signal handling in the app; use RESEARCH.md Pitfalls 5-6 |

## Metadata
**Analog search scope:** `infra/**` (git-tracked), `apps/frontend/src/hooks.server.ts`, `apps/frontend/src/routes/api/diagnostics`, `apps/frontend/src/lib/server/startup`
**Files scanned:** ~25
**Pattern extraction date:** 2026-11-12
