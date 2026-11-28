---
phase: 185-aws-frontend-stack-first-apply-by-hand
reviewed: 2026-11-14T19:24:52Z
depth: standard
files_reviewed: 41
files_reviewed_list:
  - .env.example
  - .github/workflows/main.yaml
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/server/shutdown/shutdownLog.ts
  - apps/frontend/src/lib/server/shutdown/shutdownLog.test.ts
  - apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
  - apps/frontend/src/routes/api/diagnostics/+server.ts
  - apps/frontend/src/routes/api/diagnostics/server.test.ts
  - infra/bootstrap/main.tf
  - infra/bootstrap/outputs.tf
  - infra/bootstrap/variables.tf
  - infra/bootstrap/example.tfvars
  - infra/bootstrap/terraform.tfvars
  - infra/envs/example/aws/main.tf
  - infra/envs/example/aws/outputs.tf
  - infra/envs/example/aws/variables.tf
  - infra/envs/example/aws/terraform.tfvars
  - infra/envs/staging/aws/main.tf
  - infra/envs/staging/aws/outputs.tf
  - infra/envs/staging/aws/variables.tf
  - infra/envs/staging/aws/terraform.tfvars
  - infra/modules/frontend-service/alerts.tf
  - infra/modules/frontend-service/edge.tf
  - infra/modules/frontend-service/main.tf
  - infra/modules/frontend-service/origin.tf
  - infra/modules/frontend-service/outputs.tf
  - infra/modules/frontend-service/scaling.tf
  - infra/modules/frontend-service/service.tf
  - infra/modules/frontend-service/variables.tf
  - infra/modules/frontend-service/task-environment.json
  - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
  - infra/modules/frontend-task-role/main.tf
  - infra/modules/frontend-task-role/outputs.tf
  - infra/modules/frontend-task-role/variables.tf
  - infra/scripts/build-push-image.sh
  - infra/scripts/build-push-image.test.ts
  - infra/scripts/request-loop.sh
  - infra/scripts/request-loop.test.ts
  - packages/dev-seed/tests/infraValidateJobGate.test.ts
  - infra/envs/example/aws/.terraform.lock.hcl
  - infra/envs/staging/aws/.terraform.lock.hcl
findings:
  critical: 1
  warning: 6
  info: 12
  total: 19
  necessity: 3
status: issues_found
---

# Phase 185: Code Review Report

**Reviewed:** 2026-11-14T19:24:52Z
**Depth:** standard
**Files Reviewed:** 41
**Status:** issues_found

## Summary

Scope: every non-markdown, non-`.planning/` file changed in `d3da5d1b2~1..HEAD`. That covers the frontend-service and frontend-task-role modules, the bootstrap and AWS env roots, the two infra scripts and their tests, the shutdown log, the task-environment contract test, the diagnostics allow-list and the CI module-test step. The runbooks were read for context only.

The serving path holds up under tracing. The ALB accepts 443 only from the CloudFront origin-facing prefix list, and its listener answers 403 to any request without the 48-character alphanumeric origin secret. CloudFront overrides a viewer-sent `x-origin-verify`. The default behaviour is `CachingDisabled`, so no page, form post, `/api/*` response or `Set-Cookie` response is cached at the edge. Only `/_app/immutable/*` is cached. sirv serves those files before the hooks run, so no cookie-bearing response can land in that cache. `XFF_DEPTH=2` is correct for CloudFront appending the viewer address and then the ALB appending the edge address. The client-supplied prefix of `x-forwarded-for` is never trusted. The timeouts are consistent with each other today: `KEEP_ALIVE_TIMEOUT` 65 > ALB idle 60, `HEADERS_TIMEOUT` 66 > 65, and `SHUTDOWN_TIMEOUT` 25 < `stopTimeout` 30. The shutdown listener matches adapter-node 5.5.7: it emits `sveltekit:shutdown` after `close`, and its own `SIGTERM`/`SIGINT` listeners keep the process alive. The diagnostics allow-list keeps `x-origin-verify` out of the body.

The defects that remain:

- The image script's central promise (an image tag names a fetchable commit) does not hold for gitignored files. It can bake local secrets into the pushed image.
- No HSTS is sent anywhere.
- The execution role uses the wildcard AWS-managed policy with no confused-deputy condition.
- The CI module-test step installs providers with no lock file.
- Several invariants live in two places, or only in prose: the parameter path, the timeout relations, and the PostHog stand-in.

The WAF is deliberately deferred to phase 188 (D-08) and is not flagged. The necessity rubric was read and applied.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The image build context includes gitignored host files, so a pushed tag does not name a commit and local secrets can ship in the image

**File:** `infra/scripts/build-push-image.sh:5-6, 178-181, 251-252` (with `.dockerignore:1-10`, `apps/frontend/Dockerfile:17,30,45`)
**Issue:** The header says "a tag in the registry always names a commit anyone can fetch from origin. The script refuses every tree for which that would not hold."

- The cleanliness check is `git status --porcelain --untracked-files=all`, which never lists **ignored** files.
- The build context is the live working tree (`cd "$REPO" && docker buildx build ... .`).
- `.dockerignore` excludes only `**/node_modules`, `**/build`, `**/.env`, `**/.env.*` and `infra`.
- The Dockerfile's `base` stage runs `COPY apps apps` / `COPY packages packages`. `production` inherits `base` through `frontend`, so everything copied there is in the pushed image.

In this worktree, `git ls-files --others --ignored --exclude-standard` lists these files, and all of them would enter the image:

- `apps/supabase/supabase/.temp/start-secrets/` (a mode-0700 directory of local edge-runtime secrets)
- `apps/supabase/supabase/snippets/`
- `apps/frontend/.svelte-kit/`
- `apps/frontend/src/lib/paraglide/`
- `apps/frontend/project.inlang/cache/`
- every `packages/*/dist/`

An operator-local `apps/frontend/data/` would also be copied into the build output and served. So two images tagged with the same SHA can differ, and an image can carry files no commit contains, including secrets. That is exactly what the script claims to refuse.
**Fix:** Build from the commit, not the working tree. For example, export the tree and use that as the context:
```bash
CONTEXT="$WORK/context"
mkdir "$CONTEXT"
git -C "$REPO" archive --format=tar "$SHA" | tar -x -C "$CONTEXT"
(cd "$CONTEXT" && "$DOCKER" buildx build --platform "$PLATFORM" --target "$BUILD_TARGET" \
  --build-arg "BUILD_SHA=$SHA" --provenance=false --sbom=false -f "$DOCKERFILE" -t "$image" --load .) >&2
```
At minimum, add a refusal when `git status --porcelain --ignored=matching --untracked-files=all -- apps packages scripts` lists anything outside `node_modules/` and `build/`. Add a self-test case for an ignored file.

## Warnings

### WR-01: No HSTS on the public site

**File:** `infra/modules/frontend-service/edge.tf:106-114` (and `:93-101`)
**Issue:** Viewers are redirected to HTTPS (`viewer_protocol_policy = "redirect-to-https"`), but nothing sends `Strict-Transport-Security`. No `response_headers_policy_id` is set on either cache behaviour, and nothing under `apps/frontend` sets the header (searched). A first plain-HTTP visit, or any visit after the browser forgets the redirect, can be downgraded or SSL-stripped before the redirect. The site carries a cookie-based session for candidates.
**Fix:** Attach a response headers policy with HSTS to both behaviours. You can use the managed `Managed-SecurityHeadersPolicy` (id `67f7725c-6f97-4210-82d7-5512b31e9d03`) or a custom one:
```hcl
resource "aws_cloudfront_response_headers_policy" "security" {
  name = "${local.name}-security"
  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
  }
}
# response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id  (both behaviours)
```

### WR-02: The execution role uses `AmazonECSTaskExecutionRolePolicy` (Resource `*`), and its trust policy has no confused-deputy condition

**File:** `infra/modules/frontend-task-role/main.tf:22-32, 48-52`
**Issue:** The AWS-managed policy grants these actions on `Resource: "*"`:

- `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer` and `ecr:BatchCheckLayerAvailability`
- `logs:CreateLogStream` and `logs:PutLogEvents`

So the role can pull every repository in the account, and any cross-account repository that admits the account. It can also write into every log group. The repository's stated goal for this layer is least privilege: the parameter policy beside it is scoped to one path. The trust policy also admits `ecs-tasks.amazonaws.com` with no `aws:SourceAccount` / `aws:SourceArn` condition, which AWS recommends for task execution roles.
**Fix:** Replace the managed attachment with a customer-managed policy:

- `ecr:GetAuthorizationToken` on `*` (it supports no resource scoping)
- `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer` and `ecr:BatchCheckLayerAvailability` on the registry ARN, which bootstrap already has as `module.registry.repository_arn`
- `logs:CreateLogStream` and `logs:PutLogEvents` on `arn:aws:logs:${region}:${account}:log-group:/openvaa/${environment}/frontend:*`

Add this to the trust statement:
```hcl
condition {
  test     = "StringEquals"
  variable = "aws:SourceAccount"
  values   = [var.aws_account_id]
}
condition {
  test     = "ArnLike"
  variable = "aws:SourceArn"
  values   = ["arn:aws:ecs:${var.aws_region}:${var.aws_account_id}:*"]
}
```

### WR-03: The CI module-test step installs providers with no lock file, so it does not follow the job's own `-lockfile=readonly` rule

**File:** `.github/workflows/main.yaml:819-838`
**Issue:** `terraform -chdir="$module" init -backend=false -input=false` runs in `infra/modules/frontend-service`, which has no `.terraform.lock.hcl`. Every run resolves `hashicorp/aws ~> 6.60` and `hashicorp/random ~> 3.9` afresh and installs whatever is newest, with no hash verification. The job header (lines 757-758) says it uses `-lockfile=readonly` precisely so that `init` cannot rewrite or bypass the lock in the runner. The module step silently bypasses it. A provider release can therefore turn this step red, or green, without any change in the tree, and the downloaded binaries run unpinned in CI.
**Fix:** Commit a `.terraform.lock.hcl` for each tested module, with the `linux_amd64` hashes (`terraform providers lock -platform=linux_amd64 -platform=darwin_arm64`). Use `init -backend=false -input=false -lockfile=readonly` in the loop, as the root-validation step does.

### WR-04: The parameter path is defined twice, hard-coded in one module and free-form in the other

**File:** `infra/modules/frontend-task-role/main.tf:16-18`; `infra/modules/frontend-service/variables.tf:61-69`; `infra/envs/staging/aws/terraform.tfvars:16`
**Issue:** The execution role may read only `/openvaa/${environment}/frontend/*` (a hard-coded local). The task definition builds its `valueFrom` ARNs from a separately supplied `parameter_path` variable. Nothing ties the two together: bootstrap does not even output the module's `parameter_path`. A root that sets any other `parameter_path`, or whose `environment` differs from bootstrap's `frontend_environment`, passes plan and apply. Every task then fails at start with `ResourceInitializationError: unable to pull secrets`. The circuit breaker rolls that back, but only after a failed rollout.
**Fix:** Export `parameter_path` from bootstrap (`module.frontend_task_role.parameter_path`) and pass that exact value to the AWS root. Or have `frontend-service` validate it:
```hcl
validation {
  condition     = var.parameter_path == "/openvaa/${var.environment}/frontend"
  error_message = "parameter_path must equal the path the execution role may read."
}
```
That needs Terraform >= 1.9 cross-variable validation, which `>= 1.10` already guarantees.

### WR-05: Every `parameter` entry is wired unconditionally, which forces a stand-in PostHog key that the start-up check then accepts as real

**File:** `infra/modules/frontend-service/main.tf:42-48`; `infra/modules/frontend-service/task-environment.json:87-92`
**Issue:** `container_secrets` references every `parameter` entry, and ECS starts no task whose referenced parameter is missing. So the staging runbook (Step 2, item 2) has the operator create `ANALYTICS_POSTHOG_KEY` with the value `stand-in` while analytics is off. The analytics start-up check only tests presence (`apps/frontend/src/lib/server/analytics/config.ts:67-68`, `if (key === undefined)`). Suppose `ANALYTICS_PROVIDER` is later set to `posthog` and the parameter is not replaced. The server then starts, passes its check and forwards every event with an invalid key. Events are lost silently, which is the failure the start-up check exists to prevent. `omit_environment` cannot be used instead, because its own description says it is never written in `terraform.tfvars`.
**Fix:** Let the root say which optional parameters it supplies. For example, add a `parameters_enabled` / `optional_parameters` set, or derive it: drop `ANALYTICS_POSTHOG_KEY` from `container_secrets` unless `environment_values["ANALYTICS_PROVIDER"] == "posthog"`. Alternatively, make the analytics check refuse a key that lacks PostHog's `phc_` prefix.

### WR-06: The timeout relations are documented but not checked, although the module holds both sides of each

**File:** `infra/modules/frontend-service/origin.tf:59`; `infra/modules/frontend-service/service.tf:31`; `infra/modules/frontend-service/variables.tf:134-143`; `infra/modules/frontend-service/task-environment.json:39-56`
**Issue:** Three relations are stated only in descriptions:

- `KEEP_ALIVE_TIMEOUT` > ALB `idle_timeout` (hard-coded 60)
- `HEADERS_TIMEOUT` > `KEEP_ALIVE_TIMEOUT`
- `SHUTDOWN_TIMEOUT` < `stop_timeout_seconds`

Breaking the first gives intermittent 502s on reused connections. Breaking the third gives a SIGKILL mid-drain and no shutdown log line. The module receives all of these values (`local.environment_values` and `var.stop_timeout_seconds`), so it can refuse a bad combination at plan time. `environment_overrides` exists precisely to change such values for one apply.
**Fix:** Add preconditions on `aws_ecs_task_definition.app`, each guarded by `try(tonumber(...), null)` for omitted entries:
```hcl
precondition {
  condition     = try(tonumber(local.environment_values["SHUTDOWN_TIMEOUT"]) < var.stop_timeout_seconds, true)
  error_message = "SHUTDOWN_TIMEOUT must be below stop_timeout_seconds."
}
precondition {
  condition     = try(tonumber(local.environment_values["KEEP_ALIVE_TIMEOUT"]) > aws_lb.this.idle_timeout, true)
  error_message = "KEEP_ALIVE_TIMEOUT must exceed the load balancer's idle timeout."
}
```
Do the same for `HEADERS_TIMEOUT` > `KEEP_ALIVE_TIMEOUT`. The 60 s idle timeout could also move into a local so both sides read it.

## Info

### IN-01: The debug ingress path breaks client-address resolution at `XFF_DEPTH=2`

**File:** `infra/modules/frontend-service/main.tf:163-174`; `infra/envs/staging/aws/terraform.tfvars:33`
**Issue:** A request sent straight to the ALB from a debug address carries a single `x-forwarded-for` entry, appended by the ALB. If it carries the origin secret, adapter-node throws on `getClientAddress()` (depth > entries). If the client adds its own XFF, adapter-node trusts a spoofed value instead. This only affects observations, but it means any client-address result read over the debug path is unrepresentative.
**Fix:** Say so where the debug rule is declared, or apply `XFF_DEPTH=1` through `environment_overrides` for debug observations.

### IN-02: Subnet zones are chosen by list index

**File:** `infra/modules/frontend-service/main.tf:94-104`
**Issue:** `data.aws_availability_zones.available.names[count.index]` depends on the order and state of the account's available zones. A zone that changes state, or a newly opted-in zone, reorders the list. That forces replacement of both subnets, and with them the ALB and the service networking.
**Fix:** Take the two zone names as a variable (defaulting to `["eu-north-1a", "eu-north-1b"]`), or use `zone_ids` pinned in tfvars.

### IN-03: The inbound rule quota caps `debug_ingress_cidrs` at two addresses, but nothing validates that

**File:** `infra/modules/frontend-service/main.tf:152-174`; `infra/modules/frontend-service/variables.tf:156-168`
**Issue:** The comment notes the prefix list weighs 55 of the 60 inbound rules. Each debug address adds two rules (443 and 80), so a third address fails mid-apply with a quota error.
**Fix:** Add `length(var.debug_ingress_cidrs) <= 2` to the variable's validation, with the reason in the message.

### IN-04: The task definition does not harden the container

**File:** `infra/modules/frontend-service/service.tf:25-61`
**Issue:** The container runs as the image's default user, root (the Dockerfile `production` stage has no `USER`), with a writable root filesystem. The server needs neither.
**Fix:** Set `user = "node"` (or `"1000"`), and consider `readonlyRootFilesystem = true` with a tmpfs or volume for any write path the server needs.

### IN-05: Necessity (cargo-culted pattern): the port-80 listener has no non-debug path to it

**File:** `infra/modules/frontend-service/origin.tf:120-135`; `infra/modules/frontend-service/main.tf:62, 154-161`
**Category:** necessity
**Issue:** CloudFront reaches the origin `https-only` (`edge.tf:81`), and the load balancer's security group admits CloudFront on 443 only. Port 80 is reachable solely from `debug_ingress_cidrs`, and only because `setproduct(..., [443, 80])` opens it. The HTTP-to-HTTPS listener therefore serves no viewer. Viewer redirection is CloudFront's `redirect-to-https`. Whether observing the redirect from a debug address is worth a listener and two extra rules per address is a judgment call.
**Fix:** Drop the port-80 listener and the 80 entry of the debug product, or note that both exist only for debug observation.

### IN-06: Necessity (already defended elsewhere): the explicit `kms:Decrypt` statement adds a bootstrap ordering failure

**File:** `infra/modules/frontend-task-role/main.tf:54-58, 71-82`
**Category:** necessity
**Issue:** The comment itself says the AWS-managed `alias/aws/ssm` key policy "already admits that call". The phase research cites AWS: `kms:Decrypt` is required only for a customer-managed key. The statement grants nothing new. Its `data "aws_kms_alias" "ssm"` read fails until a SecureString exists, which forces the bootstrap apply to wait for the staging runbook's parameter step.
**Fix:** Remove the statement and the data source. If an explicit grant is wanted for documentation, express it with `kms:ViaService` on `arn:aws:kms:${region}:${account}:key/*` so no data source read is needed.

### IN-07: Necessity (generality without instantiation): one-time observation knobs in the production module interface

**File:** `infra/modules/frontend-service/variables.tf:76-86, 156-168`; `infra/envs/staging/aws/variables.tf:51-61, 83-87`
**Category:** necessity
**Issue:** `omit_environment` exists "so that a rollout with a variable missing can be observed". `environment_overrides` and `debug_ingress_cidrs` are likewise documented as command-line-only, for one observation. Each adds preconditions, test runs and root variables to the permanent module surface to serve a phase's verification steps. `omit_environment` in particular has no use once that observation is recorded.
**Fix:** Consider removing `omit_environment` after the phase closes. Keep `environment_overrides` and `debug_ingress_cidrs` only if they are a supported operator tool, and document them as that rather than as observation hooks.

### IN-08: Comment hygiene: a description addressed to agent tooling, and observation narrative in a tfvars comment

**File:** `infra/modules/frontend-service/task-environment.json:13`; `infra/envs/staging/aws/terraform.tfvars:30-32`
**Issue:**

- The anon-key description says it is a parameter because "secret scanners and the repository's reply screen refuse to see" it in a tracked file. "The repository's reply screen" means nothing to a reader cold. It refers to the agent harness, not to the code.
- The staging tfvars comment "The forwarding headers recorded on the running deployment are what confirm this number" refers to a past observation, not to the code as it is.

**Fix:** Reword the first as "kept in the parameter store because it is a signed token that secret scanners flag in tracked files". Replace the second with the derivation alone: CloudFront appends the viewer, the ALB appends the edge, so depth 2.

### IN-09: A stale job comment omits the new module-test step

**File:** `.github/workflows/main.yaml:765-766`
**Issue:** "The validation and type-check steps run even when an earlier step failed" no longer lists every `!cancelled()` step. The module-test step at line 819 also runs after a failure, and `infraValidateJobGate.test.ts` asserts all three.
**Fix:** "The validation, module-test and type-check steps run even when an earlier step failed…"

### IN-10: `build-push-image.sh` signs out a docker login the operator already had

**File:** `infra/scripts/build-push-image.sh:162-168`
**Issue:** `on_exit` runs `docker logout "$REGISTRY_HOST"` unconditionally after its own login. Any pre-existing credential for that registry in the operator's docker store is also removed.
**Fix:** Mention it in the header, or check `docker-credential-*` / `~/.docker/config.json` for an existing entry before logging in, and skip the logout when one existed.

### IN-11: The serving path has no request logs and no runtime alarm

**File:** `infra/modules/frontend-service/edge.tf:64-136`; `infra/modules/frontend-service/origin.tf:52-62`; `infra/modules/frontend-service/alerts.tf:9-22`
**Issue:**

- Neither CloudFront standard logs nor ALB access logs are enabled.
- The only alert is `SERVICE_DEPLOYMENT_FAILED`.

A healthy rollout followed by a crash loop, 5xx from the origin, or `UnHealthyHostCount > 0` mails nobody, and there is no request record to reconstruct an incident from.
**Fix:** Add at least a CloudWatch alarm on the target group's `UnHealthyHostCount` and on ALB `HTTPCode_Target_5XX_Count` to the same topic. Consider ALB access logs to a lifecycle-limited bucket.

### IN-12: The staging and example AWS roots are near-identical copies

**File:** `infra/envs/staging/aws/{main,variables,outputs}.tf`; `infra/envs/example/aws/{main,variables,outputs}.tf`
**Issue:** `diff -r` shows the two roots differ only in a header comment and the backend `bucket`/`key`. That is about 300 lines duplicated. The checklist asks for no repeated code, and any input or output added to one root must be mirrored by hand. CI validates both, but nothing checks that they stay alike.
**Fix:** Accept this as the cost of a copyable template, but add a check (for example in `infraValidateJobGate.test.ts`) that the two roots' `variables.tf` and `outputs.tf` are byte-identical and their `main.tf` differs only in the backend block.

---

_Reviewed: 2026-11-14T19:24:52Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
