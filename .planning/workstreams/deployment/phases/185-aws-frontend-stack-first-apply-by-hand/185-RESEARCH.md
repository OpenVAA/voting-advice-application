# Phase 185: AWS Frontend Stack, First Apply by Hand - Research

**Researched:** 2026-11-12
**Domain:** Terraform (`hashicorp/aws` 6.68.0) for ECS Fargate + ALB + CloudFront + ACM + Route 53 records, adapter-node behind a two-hop proxy, hand-run rollout and teardown observations
**Confidence:** MEDIUM-HIGH (stack and repo facts HIGH; three runtime behaviours only observable on the applied stack are flagged)

**Citation convention.** The project's instructions ask for content anchors, not line numbers, so in-repo claims cite
`file` + symbol or heading, with the values quoted verbatim beside them. Provider attribute names were read from a
`terraform providers schema -json` dump of `hashicorp/aws` 6.68.0 made in a scratch directory this session
(`[VERIFIED: provider schema 6.68.0]`).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Carried forward (settled by earlier rulings, not re-asked)
- Public subnets, no NAT gateway; only the load balancer reaches the tasks (D2). Staging runs one task (D1).
- No inline IAM policy anywhere (183 D-08 guard). Registry in `bootstrap`; zone and mail identity in `dns-mail`;
  both survive the destroy (183 D-02). The wiring exists twice, `envs/staging/aws` and `envs/example/aws` (183 D-01).
- The root holds no secret value its plan must read back (183 A-08: the plan role is denied
  `secretsmanager:GetSecretValue` and `kms:Decrypt`).
- Bank authentication excluded (A4); mail is one manual observation (E2); the smoke dataset seeded in 184 is reused
  (E1, 184 D-18). Parent zone `openvaa.org` stays at Cloudflare (183 D-05).
- Every exit status is read on the line after the command, never through a pipe (`infra/README.md`, Rules).

#### A — Who runs it, and in what order
- **D-01 (A-01, OVERRULED by the operator):** The agent runs every AWS command itself, `apply` and `destroy`
  included, **with no per-apply approval checkpoint**. This replaces 183 D-10 / 184's "the operator applies, and
  the agent holds no credential" for this phase. It runs in the operator's IAM Identity Center session: every
  command sets `AWS_PROFILE=openvaa-admin` and checks the account (`471112560111`) first. The shell's default
  credentials belong to another account (`173787562496`) and must never be used; `allowed_account_ids` in the root
  is the backstop. Constraints that still hold, because they come from earlier rules and not from A-01:
  - The agent applies only `envs/staging/aws`. A plan of `bootstrap`, `dns-mail` or `supabase` is read only
    (E-03's before-and-after checks); none of those roots is applied in this phase, and a plan of any of them that
    shows a destroy or replacement is never applied (`infra/README.md`, Rules).
  - Secret values come from the operator, who either runs the `put-parameter` themselves or gives the value for one
    shell session. No secret value is written to a file, to evidence or to the transcript (`infra/README.md`, Rules).
  - An expired SSO session is a stop: the agent asks the operator to sign in again (`aws sso login --profile
    openvaa-admin`) and does not look for other credentials.
  - Operator-only steps stay checkpoints: the SNS subscription confirmation, activating cost-allocation tags in
    Billing, reading the invitation mail and the phone half of OBS-10.
  — **Reversibility:** reversible — a process rule; the operator can reinstate per-apply approval at any checkpoint.
- **D-02 (A-02):** Keep the state key `pipeline/staging/aws/terraform.tfstate`. This phase applies it by hand with
  administrator rights. 187's deploy role takes over the same state, and its first run should be a no-change plan.
  Correct the `infra/README.md` Roots table and Order diagram ("by hand in 185, by the deploy workflow from 187").
- **D-03 (A-03):** Build and push the image first, then make **one** plan and one apply of `staging/aws` with
  `image_tag` set. The certificate validation waits inside that apply (`aws_acm_certificate_validation`). No
  `-target` and no stage switch variables.

#### B — The CDN and the proxy chain
- **D-04 (B-01):** CloudFront sits in front of the whole site. `staging.openvaa.org` (the delegated zone's apex) is
  an alias A/AAAA to the distribution, and the load balancer is its only origin. `/_app/immutable/*` uses the
  managed `CachingOptimized` policy. The default behaviour (pages, form posts, `/api/*`, `/_app/version.json`) uses
  `CachingDisabled` with an origin request policy that forwards all cookies, query strings and viewer headers
  except Host. All methods are allowed. The image does not change; `ORIGIN=https://staging.openvaa.org`.
  — **Reversibility:** costly — the proxy depth, the certificates, the origin lock and the WAF scope all follow
  from it.
- **D-05 (B-02):** Two locks on the origin. (1) The load balancer's security group admits 443 only from the
  managed prefix list `com.amazonaws.global.cloudfront.origin-facing`. Research checks the security-group rule
  quota this list consumes. (2) CloudFront adds a secret origin header, and the listener's default action is a
  fixed 403 unless the header matches. The value is a `random_password` in the root's state. Each lock is seen
  refusing once: a direct request to the load balancer, and a request with the header missing.
- **D-06 (B-03):** `ADDRESS_HEADER=x-forwarded-for` and `XFF_DEPTH=2`, set **from the recorded headers**, not
  assumed. Add `cloudfront-viewer-address` and `x-amz-cf-id` to the allow-list of `/api/diagnostics`. Switch it
  on (`DEPLOYMENT_DIAGNOSTICS=true`) for the observation only, call it with and without a spoofed
  `X-Forwarded-For`, then switch it off. If the record contradicts depth 2, the record wins and the deviation is
  noted.
- **D-07 (B-04):** Two ACM certificates, both DNS-validated in the delegated zone. One is in `us-east-1` for
  `staging.openvaa.org` on the distribution, through a provider alias. The other is in `eu-north-1` for
  `origin.staging.openvaa.org` on the load balancer, and CloudFront reaches the origin over HTTPS. HTTP goes to
  HTTPS on the viewer side and on the listener (80 → 443). The README states that every resource is in
  `eu-north-1` except the CloudFront certificate (and a future WAF), and that the Supabase project is in
  `eu-north-1` (INFRA-12).
- **D-08 (B-05):** RELAY-09's WAF rate rule will attach to the distribution (`CLOUDFRONT` scope, `us-east-1`), off
  by default. This phase writes only its name and place in the README; 188 builds it.
- **D-09 (B-06):** "HTML never cached" is observed. Two requests for one page through the CDN both show a miss
  (`Miss`/`RefreshHit`, no `Age`), and the second request for one `/_app/immutable/*` file shows `Hit`. The
  evidence records the origin's `cache-control` on a response that sets an auth cookie. No route-level
  `setHeaders({'cache-control'})` is added (todo `2026-10-03-auth-cookie-cache-control-vs-route-setheaders`).

#### C — Compute, image and configuration
- **D-10 (C-01):** ARM64 (Graviton) Fargate; the image is built natively for `linux/arm64` on the arm64
  workstation. Whether 187 builds on `ubuntu-24.04-arm` runners is researched in 187.
  — **Reversibility:** reversible — the architecture is a task-definition field plus a build platform flag.
- **D-11 (C-02):** 0.5 vCPU / 1 GB, a variable in both environments; 188's load check may change it.
- **D-12 (C-03):** The secret store is SSM Parameter Store `SecureString`, and the parameters are created
  **outside Terraform** under `/openvaa/staging/frontend/<NAME>`. The root builds the ARNs as strings into the task
  definition's `secrets`, with no data source, so a plan never decrypts. The execution role may read that path only
  (customer-managed policy, plus `kms:Decrypt` scoped to the key the parameters use). The parameters survive the
  destroy. This phase stores `ANALYTICS_POSTHOG_KEY` with its real value from the operator, and
  `ANALYTICS_PROVIDER` stays `none` until 188. A task that starts proves the secret path, because ECS refuses to
  start one whose secret cannot be read. The service-role key reaches the task in no form (INFRA-05).
  — **Reversibility:** costly — 187's pipeline and the `example` root inherit the out-of-band parameter pattern.
- **D-13 (C-04):** The task's environment comes from one list in the module, with each variable named and
  described. The `example` root passes stand-in values, and the README lists the same names. A unit-level guard
  compares the module's list with `REQUIRED_ENV` (`apps/frontend/src/lib/server/startup/requiredEnv.ts`) and the
  `.env.example` names. OBS-08 is seen when the staging task, started with exactly that list, renders a voter page
  from the smoke dataset.
- **D-14 (C-05):** The tag is the full 40-character SHA, built only from a clean tree whose `HEAD` is pushed to
  `origin`, with `BUILD_SHA` set to the same value. The build-and-push is a committed script (187 reuses it). A
  second push of the same tag is seen refused (`ImageTagAlreadyExistsException`).

#### D — Rollout, scaling, logs, alerts
- **D-15 (D-01):** The failed rollout is a revision whose new tasks fail the start-up check: the current image with
  `ORIGIN` dropped, through a variable that exists for this. The new tasks exit with the variable named in the log,
  which also shows INFRA-05's "fails and names the variable" on AWS. The circuit breaker rolls back, and the old
  task keeps serving. A request loop through the public URL runs from before the apply until the rollback is
  complete, and its non-2xx count is recorded (expected 0). A normal apply then restores the variable. Pointing the
  target group's health check at a missing path is ruled out, because it fails the old task too.
- **D-16 (D-02):** Add one server log line on adapter-node's `sveltekit:shutdown` event, naming the signal and the
  requests in flight. SIGTERM is seen as that line in the log of a task the rollout stopped, beside ECS's stop
  reason and exit code 0. Deregistration delay 30 s; container `stopTimeout` 30 s.
- **D-17 (D-03):** Build the deployment alert here: an EventBridge rule on ECS `SERVICE_DEPLOYMENT_FAILED` sends to
  an SNS topic with an email subscription to the operator (the address is a variable, not tracked in tfvars if it
  is personal). It is seen firing in D-15's rollback. The operator confirms the subscription once. The build-failure
  alert stays in 187.
- **D-18 (D-04):** Floor 1 and ceiling 2, as variables. Target tracking holds CPU at 60 %. A scheduled action pair
  raises the floor to 2 and lowers it again, applied with times a few minutes ahead. The task count is seen going
  to 2 and back, and then the pair is removed or moved into the past.
- **D-19 (D-05, OVERRULED by the operator):** Log retention is **90 days**, a variable. The log group goes with
  the destroy, so the logs that are evidence (D-15, D-16) are copied into `185-*/evidence/` before it runs.

#### E — Observations, destroy and cost
- **D-20 (E-01):** OBS-10: two clients on different networks (the workstation, and the operator's phone off Wi-Fi,
  as a checkpoint) each send feedback through the public URL until one is limited, while the other is still
  admitted. Research first confirms which feedback writer the deployed app uses: the browser straight to Supabase
  (`apps/frontend/src/lib/api/adapters/supabase/feedbackWriter/supabaseFeedbackWriter.ts`), or a server route. If
  it is a server route, every voter shares the task's address; that is a finding to fix in this phase.
- **D-21 (E-02):** OBS-06: the first administrator, signed in at the staging URL, invites a candidate at the
  operator's second address (a plus-address). The operator reads the mail, checks the link's origin and follows
  it, and the recipient is signed in. The address is recorded only as "operator's second mailbox". The invitation
  is removed afterwards. This is also the persistent project's first mail from its functions (184-VERIFICATION
  `harden`).
- **D-22 (E-03):** The destroy: first the evidence logs are copied, and the `dns-mail` and `supabase` plans are
  both seen empty. One `terraform destroy` of `staging/aws` exits 0, and no resource tagged `Root=aws` is left
  (Resource Groups Tagging API). After it, both plans are still empty, the 184 conformance probe is green against
  the persistent project, the registry still holds the image, and the SSM parameters are still there. Then the
  stack is applied again from the same commit and serves. This closes SUPA-12's last clause and INFRA-10.
- **D-23 (E-04):** The operator activates `Project`, `Environment` and `Root` as cost-allocation tags at the first
  apply. After at least 7 full days of the stack running, the agent reads Cost Explorer filtered by `Root=aws` and
  scales it to a month, cross-checked against a priced inventory (rough expectation 40 to 60 USD/month, not
  measured). If 7 days do not fit, the measured figure becomes a dated follow-up for 189 and the phase records the
  inventory figure as such.
- **D-24 (E-05):** A new runbook, `infra/envs/staging/aws/README.md`, has "Not yet observed" and "Observations"
  tables as in the supabase root's README (184 D-20). Raw evidence goes in `185-*/evidence/185-NN-*.md`.
- **D-25 (E-06):** No todo is folded (see Deferred).

### Claude's Discretion
- The plan split and wave order, as long as D-03's order holds (image, then the one apply). The operator-only steps
  in D-01 are checkpoints; nothing else needs one under D-01.
- The module layout under `infra/modules/` (for example one `frontend-service` module or several), resource names,
  and the request-loop tool for D-15.
- How the `example` root's stand-in values look, within 183 D-01.
- The exact wording of the runbook, the Observations rows and the evidence files.

### Deferred Ideas (OUT OF SCOPE)
- The WAF rate rule on the distribution: phase 188 (RELAY-09), off by default.
- The build-failure alert: phase 187 (INFRA-16).
- A measured cost figure, if 7 days of running do not fit inside the phase: a dated follow-up for 189.

#### Reviewed Todos (not folded)
- `2026-10-03-auth-cookie-cache-control-vs-route-setheaders` — only cited in D-09's evidence; no route sets its own cache-control.
- `2026-10-21-migrate-openvaa-org-dns-from-cloudflare-to-route-53` — moves the parent zone and the long-lived `dns-mail` root; it does not belong in the phase that destroys the AWS root on purpose.
- `2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations` — phase 188 (OBS-09).
- The keyword matcher's other hits (answer store, header styling, auth code location, results button, base shades, svelte/motion) — frontend and UI work unrelated to the stack.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Push the image to a registry whose tags are immutable and name the commit | Registry exists in `bootstrap` with `IMMUTABLE` tags; build from a pushed source-only commit (Open Question 2); refusal needs a *different* digest under the same tag (Pitfall 9) |
| INFRA-02 | ECS Fargate behind an HTTPS ALB, explicit resources, two AZs, floor a variable | Resource set in "Architecture Patterns"; the inline-IAM guard bans non-local module sources, so no registry module may be used |
| INFRA-03 | Custom domain, DNS-validated certificate, HTTP→HTTPS | Two ACM certs validated in the delegated zone; the viewer redirect is the observable one; the port-80 listener conflicts with the prefix-list quota (Pitfall 1, Open Question 4) |
| INFRA-04 | Health endpoint without Supabase; LB health check uses it with a grace period | `/api/health` exists and calls no upstream; target group `path=/api/health`, service `health_check_grace_period_seconds` |
| INFRA-05 | Config as environment, secrets from a store, `PUBLIC_PROJECT_ID`, no service-role key, a missing variable fails by name | Task env from one JSON list in the module; SSM SecureString via `secrets`; `init` hook throws naming the variable; exits before listening |
| INFRA-06 | Proxy config: origin, client-address header and depth; form posts succeed; spoof refused | Chain viewer→CloudFront→ALB→task appends two addresses; `XFF_DEPTH=2` picks the viewer; `ORIGIN` fixes CSRF; both origin locks needed so no one reaches the ALB with a forged chain |
| INFRA-07 | Scale between floor and ceiling; scheduled action raises the floor | `aws_appautoscaling_target`/`_policy`/`_scheduled_action`; `ignore_changes = [desired_count]`; scale-in back to 1 is not immediate (Pitfall 12) |
| INFRA-08 | Durable log store with retention | `aws_cloudwatch_log_group` `retention_in_days = 90` (D-19); copy evidence before destroy |
| INFRA-09 | Health-gated rollout, auto rollback, drain, SIGTERM reaches Node | `deployment_circuit_breaker {enable, rollback}` (threshold 3 at desired 1); `sveltekit:shutdown` fires only after drain (Pitfall 6); SIGTERM is seen on the restore deployment, not the failed one |
| INFRA-10 | Remote locked state, per-env vars/outputs, clean destroy | Backend already literal with `use_lockfile`; destroy leaves INACTIVE task definitions and out-of-band state (see "State outside this root") |
| INFRA-11 | Least privilege; only the LB reaches tasks; public subnets, no NAT | Execution role has no home in `staging/aws` under 183 D-07 (Open Question 1, BLOCKING); task SG admits 3000 from the ALB SG only; `assign_public_ip = true` |
| INFRA-12 | `eu-north-1`, Supabase region stated beside it | Only the CloudFront cert is in `us-east-1`; Supabase `region = "eu-north-1"` already in `envs/staging/supabase/terraform.tfvars` |
| INFRA-13 | Cost tags; measured monthly estimate | `propagate_tags = "SERVICE"` or Fargate cost is untagged (Pitfall 15); priced inventory from the public price list ≈ 50 USD/month |
| INFRA-14 | CDN serves immutable assets; HTML never cached | Managed policy ids verified; adapter-node sets `public,max-age=31536000,immutable` on `/_app/immutable/`; `CachingDisabled` on everything else |
| SUPA-12 | AWS teardown leaves the database untouched | Destroy of `staging/aws` only; read-only plans of `dns-mail` and `supabase` before and after; the `supabase` plan needs the operator's secrets in the session (Open Question 7) |
| OBS-04 | Forwarded headers at the frontend container recorded | `/api/diagnostics` allow-list extension; the record shows the chain shape; addresses recorded by role, not value |
| OBS-06 | One invitation mail through real SMTP, correct origin, signs in | There is no Admin App invitation screen: `create_invitations` RPC + `account-access` `request-link`, gated by the project's registration-mode matrix (Open Question 6) |
| OBS-08 | Frontend started from the template's variables alone reads from Supabase | The module's JSON list is the template; the guard ties it to `REQUIRED_ENV` and `.env.example` |
| OBS-10 | Feedback rate limit buckets by client with `behind_cloudflare` as deployed | Confirmed: the browser writes straight to PostgREST, so no server-route fix is needed; 5 per 5 minutes per bucket |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **E2E cardinal rule:** no task completes while any E2E test fails; "did not run" counts as failure; a void run (exit 8, `VOID-host-suspend.txt`) is no evidence. This phase changes frontend code (`/api/diagnostics` allow-list, a shutdown log line), so the phase gate needs a green full run via `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/<name> --no-db-reset`. Standing practice (memory): targeted E2E within the phase, one full run at the end.
- **Comment hygiene** for `apps/`, `packages/`, `tests/`: no historical narrative, no planning references beyond `see phase N`, nothing addressed to the reviewer; TSDoc on exported symbols. `infra/` is not in that list, but the inline-IAM guard reads comments: a comment naming a banned form is a finding ("Comments under `infra/` say 'an inline policy' rather than naming the resource type" — `scripts/assert-no-inline-iam-policies.mjs` header).
- **TypeScript strictly**, no `any`; **localisation**: no new user-facing string is planned in this phase (a log line is not user-facing).
- **Never commit secrets**: no `.env`, no plan file, no state, no raw plan/apply log (`infra/README.md` Rules).
- **Code review checklist** `/.agents/code-review-checklist.md` applies to code changes.
- **Global instructions:** shell commands handed to the operator wrap at 60 characters (80 at most) with `\` continuations, one block per step, with the expected output stated after it. Commit or push only when the user asks; branch first if on the default branch.
- **Gates are read by exit status, never through a pipe** (memory and `infra/README.md`).

## Summary

The tree has everything this phase rests on: an empty `staging/aws` root with a literal S3 backend, `allowed_account_ids` and `default_tags`; an immutable-tag ECR repository in `bootstrap`; the delegated `staging.openvaa.org` zone in `dns-mail` (public DNS answers four `awsdns` name servers and no A record yet); a hosted Supabase project in `eu-north-1` that already serves `https://staging.openvaa.org` as its site URL; and a frontend image whose health route, start-up check, proxy variables and SIGTERM handling were proven locally in 181. What is missing is the module itself, two small frontend changes (the diagnostics allow-list and a shutdown log line), a guard that ties the task environment to `REQUIRED_ENV`, the build-and-push script, and the runbook.

Four findings change the plan's shape. **(1) The execution role has no allowed home.** 183 D-07 says "Only hand-applied roots write IAM, so the pipeline cannot create or change IAM", and `staging/aws` becomes a pipeline root in 187. A role written there would force the 187 deploy role to hold IAM write. The role and its customer-managed SSM policy belong in `bootstrap`, which 183 D-02 already names as the home of "the roles and policies". That needs one additive `bootstrap` apply, and CONTEXT D-01 forbids it. This is an operator ruling and blocks planning. **(2) The CloudFront prefix list weighs 55 rules against a default quota of 60.** A second prefix-list rule for port 80 cannot be added, so D-07's listener-side 80→443 redirect is unreachable and can't be observed. Lock (2), the header, can only be seen refusing if a temporary `/32` rule lets the workstation reach the ALB directly. **(3) "HEAD is pushed to origin" collides with the standing practice of not publishing `.planning/` to the public repository.** The image must be built from a source-only commit that is pushed, so its SHA is the tag. **(4) The feedback limit needs no fix.** The browser posts straight to PostgREST, so OBS-10 tests the Supabase trigger, and `behind_cloudflare` is already true on the persistent project.

The proxy chain is fully documented. CloudFront appends the viewer's TCP address to `X-Forwarded-For`, and the ALB appends the edge's address, so the container sees `[client-sent…, viewer, edge]`. adapter-node takes `addresses[addresses.length - xff_depth]`, so depth 2 is the viewer. A forged chain can only reach the container if someone reaches the ALB without CloudFront, which is why both locks matter. Three behaviours can only be settled on the applied stack: whether a task that crashes right after start trips the circuit breaker (AWS's own example reason is "task failed to start", which makes it likely), whether the Tagging API lists INACTIVE task definitions after the destroy, and how long target tracking takes to scale 2→1.

**Primary recommendation:** Rule first on where the execution role lives (recommended: a new `bootstrap` module, applied once as an additive plan). Then write one `infra/modules/frontend-service` module from explicit `aws_*` resources, with the task environment in a `task-environment.json` read by `jsondecode(file())` (the 183 `hosted-settings.json` pattern). Build the image from a pushed source-only commit, and run the observations in an order that reuses each deployment twice.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| TLS for viewers, HTTP→HTTPS, immutable-asset caching | CDN (CloudFront) | — | Only tier the viewer touches; `us-east-1` cert |
| Origin lock (who may reach the app) | Network (ALB SG prefix list) | ALB listener rule (secret header) | Two independent locks, D-05 |
| TLS edge→origin, routing, health checks, draining | ALB | — | `origin.staging.openvaa.org` cert in `eu-north-1` |
| Client address resolution, CSRF origin check | Frontend server (adapter-node env) | — | `ADDRESS_HEADER`/`XFF_DEPTH`/`ORIGIN` are adapter settings, not app code |
| Start-up refusal on missing config | Frontend server (`init` hook) | ECS (task exits, circuit breaker counts it) | Already in `hooks.server.ts` |
| Secret delivery | ECS agent (execution role → SSM) | — | The container never calls AWS; no task role is needed |
| Feedback rate limit per client | Database (PostgREST trigger) | Cloudflare (sets `cf-connecting-ip`) | Browser writes directly; the frontend server is not on the path |
| Invitation mail | Supabase Edge Function `account-access` + SES | Database (`create_invitations`, registration matrix) | The frontend only hosts the link target `/<locale>/api/auth/callback` |
| Deployment alert | EventBridge (default bus) → SNS email | — | AWS service events are free on the default bus |
| Scaling | Application Auto Scaling | ECS service | Target tracking + scheduled actions |
| State, locking | S3 backend (`use_lockfile`) | — | Already literal in the root |

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| Terraform | 1.16.5 (`infra/.terraform-version`) | IaC | Pinned; workstation has 1.16.5 `[VERIFIED: terraform version]` |
| `hashicorp/aws` | 6.68.0 (lock file of `staging/aws`, constraint `~> 6.60`) | All AWS resources | Already locked `[VERIFIED: infra/envs/staging/aws/.terraform.lock.hcl]` |
| `hashicorp/random` | 3.9.1 (newest matching `~> 3.7`, installed and "signed by HashiCorp" in a scratch init this session) | `random_password` for the origin header (D-05) | Official HashiCorp provider `[VERIFIED: terraform init output]` |
| ECS Fargate, ARM64 | platform `LATEST` | Compute | `EUN1-Fargate-ARM-*` SKUs exist in the public price list for eu-north-1 `[VERIFIED: AWS price list API 2026-11-11]` |
| ALB | — | HTTPS origin, health gate, drain | INFRA-02 |
| CloudFront + managed policies | — | CDN | D-04 |
| ACM (DNS validation in Route 53) | — | Certificates | D-07 |
| SSM Parameter Store `SecureString` (default key `alias/aws/ssm`) | — | Secrets | D-12 |
| CloudWatch Logs (`awslogs` driver) | — | Logs | INFRA-08 |
| EventBridge default bus + SNS email | — | Deployment alert | D-17 |
| Application Auto Scaling | — | Floor/ceiling/schedule | INFRA-07 |

**Managed CloudFront policy ids** `[CITED: docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html, using-managed-origin-request-policies.html]`:
- `CachingOptimized` `658327ea-f89d-4fab-a63d-7e88639e58f6`: min TTL 1 s, default 86 400 s, max 31 536 000 s, no cookies or query strings in the key, compression on.
- `CachingDisabled` `4135ea2d-6df8-44a3-9df3-4b5a84be39ad`: all TTLs 0, nothing in the key.
- `AllViewerExceptHostHeader` `b689b0a8-53d0-40ab-baf2-68738e2966ac`: "All headers in the viewer request ***except*** for the `Host` header", all cookies, all query strings, and "additional CloudFront request headers for HTTP protocol, HTTP version, TLS version, and all device type and viewer location headers".

Prefer looking these up by name with `data "aws_cloudfront_cache_policy" { name = "Managed-CachingOptimized" }` and `data "aws_cloudfront_origin_request_policy" { name = "Managed-AllViewerExceptHostHeader" }`. Both data sources exist in 6.68.0 `[VERIFIED: provider schema 6.68.0]`, and the plan role's `ReadOnlyAccess` can read them. The `Managed-` name prefix is `[ASSUMED]`; the ids above are the fallback.

### Supporting

| Item | Purpose | When to Use |
|------|---------|-------------|
| `data "aws_ec2_managed_prefix_list"` `name = "com.amazonaws.global.cloudfront.origin-facing"` | ALB SG ingress source | Lock (1) `[CITED: CloudFront LocationsOfEdgeServers; VERIFIED data source exists in schema]` |
| `data "aws_route53_zone"` `name = "staging.openvaa.org"` | Zone id without reading `dns-mail` state | The destroy leaves the zone (code_context) |
| `aws_vpc_security_group_ingress_rule` / `_egress_rule` | One rule per resource, with `prefix_list_id` / `referenced_security_group_id` | Instead of inline `ingress {}` blocks `[VERIFIED: schema]` |
| `docker buildx build --platform linux/arm64` | Native image build | Workstation is arm64, buildx 0.36 present `[VERIFIED: docker buildx version]` |
| `aws resourcegroupstaggingapi get-resources --tag-filters Key=Root,Values=aws` | D-22 empty check | Run **in both** `eu-north-1` and `us-east-1` (Pitfall 14) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Provider alias for the `us-east-1` cert (D-07 wording) | Per-resource `region = "us-east-1"` on `aws_acm_certificate` and `aws_acm_certificate_validation` | Provider v6 adds `region` to most resources "without requiring multiple provider configurations" `[CITED: provider v6.68.0 docs, guides/enhanced-region-support]`. One provider block keeps `allowed_account_ids` and `default_tags` in one place; an alias must repeat both or the cert goes untagged (Pitfall 13). See Open Question 3 |
| Community `terraform-aws-modules/*` | — | **Forbidden:** the inline-IAM guard fails on "a `module` block whose `source` is not a local path", and INFRA-02 says explicit resources |
| Secrets Manager | SSM SecureString | Locked by D-12 |

**Installation:** no npm or PyPI package is added. Terraform providers:

```bash
terraform -chdir=infra/envs/staging/aws init -upgrade=false
terraform -chdir=infra/envs/staging/aws providers lock \
  -platform=linux_amd64 -platform=darwin_arm64 \
  -platform=darwin_amd64
```

Repeat for `infra/envs/example/aws`. The CI job runs `init -backend=false -input=false -lockfile=readonly`, so a lock file without the `random` provider's `linux_amd64` hashes fails CI (183-RESEARCH used these three platforms) `[VERIFIED: .github/workflows/main.yaml job infra-validate]`.

## Package Legitimacy Audit

No npm, PyPI or crates package is installed by this phase, so `package-legitimacy check` has nothing to check. The one new external artifact is a Terraform provider:

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| `hashicorp/random` 3.9.1 | registry.terraform.io | years (official) | n/a | github.com/hashicorp/terraform-provider-random | OK (signed by HashiCorp in `terraform init` this session) | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
 viewer (browser, curl)                         Supabase (eu-north-1, behind Cloudflare)
   |  https://staging.openvaa.org                    ^            ^
   v                                                 |            | browser: PostgREST (feedback),
 Route 53 (delegated zone, dns-mail root)            |            | functions (account-access)
   |  A/AAAA alias staging.openvaa.org               |            |
   v                                                 |            |
 CloudFront (cert us-east-1)                         |            |
   |-- /_app/immutable/*  -> CachingOptimized -> cache HIT? -> answer from edge
   |-- default (*)        -> CachingDisabled + AllViewerExceptHostHeader
   |   viewer HTTP -> 301 to HTTPS
   |   adds X-Forwarded-For: <client-sent...>,<viewer>
   |   adds custom header  x-origin-verify: <random_password>
   v  HTTPS to origin.staging.openvaa.org (alias A -> ALB)
 ALB (2 public subnets, 2 AZs, cert eu-north-1)
   SG: 443 only from prefix list com.amazonaws.global.cloudfront.origin-facing (weight 55)
   listener 443: default action fixed 403
                 rule: http-header x-origin-verify == secret -> forward to target group
   appends X-Forwarded-For: ...,<edge>; health check GET /api/health (direct to targets)
   v  HTTP :3000
 Fargate task (ARM64, public IP, SG: 3000 only from ALB SG; egress 443 anywhere)
   adapter-node: ORIGIN, ADDRESS_HEADER=x-forwarded-for, XFF_DEPTH=2
   init hook: missing required env -> throw -> exit 1 -> circuit breaker counts it
   SIGTERM -> close -> drain (SHUTDOWN_TIMEOUT 30) -> 'sveltekit:shutdown' -> exit
   |-- SSR reads -> Supabase REST (anon key)       |-- logs -> CloudWatch (90 days)
   |-- secrets at start: execution role -> SSM /openvaa/staging/frontend/*
 ECS service events -> EventBridge rule (SERVICE_DEPLOYMENT_FAILED) -> SNS -> operator mail
 App Auto Scaling: target 60 % CPU, min/max vars, scheduled min raise
```

### Recommended Project Structure

```
infra/
├── modules/
│   ├── frontend-service/            # NEW: the whole AWS stack of one environment
│   │   ├── versions.tf              # aws ~> 6.60, random ~> 3.9
│   │   ├── network.tf               # VPC, 2 public subnets, IGW, route table
│   │   ├── security.tf              # ALB SG, task SG, rules
│   │   ├── certificates.tf          # 2 ACM certs + validation records
│   │   ├── load-balancer.tf         # ALB, target group, listeners, header rule
│   │   ├── cdn.tf                   # CloudFront, origin secret, alias records
│   │   ├── service.tf               # cluster, log group, task definition, service
│   │   ├── scaling.tf               # scalable target, CPU policy, scheduled actions
│   │   ├── alerts.tf                # EventBridge rule, SNS topic + policy + subscription
│   │   ├── task-environment.json    # the ONE env list (names, descriptions, kind)
│   │   ├── variables.tf / outputs.tf
│   └── frontend-task-role/          # NEW, called from bootstrap (Open Question 1)
│       └── main.tf                  # execution role, trust, SSM read policy, attachments
├── envs/staging/aws/   main.tf variables.tf terraform.tfvars outputs.tf README.md (runbook, D-24)
├── envs/example/aws/   same wiring, stand-in values
└── scripts/build-push-image.sh      # NEW, D-14 (or under tests/scripts? keep infra/scripts)
```

### Pattern 1: The task environment as one JSON list (D-13)
**What:** `infra/modules/frontend-service/task-environment.json` lists every variable the task gets: `name`, `description`, `kind` (`plain` | `secret`), and `required`. The module reads it with `jsondecode(file("${path.module}/task-environment.json"))`, builds `environment` from the `plain` entries (values from a `map(string)` variable) and `secrets` from the `secret` entries (ARNs built as strings).
**Why:** This is the precedent 183 D-14 set: "The security-relevant hosted values sit in one JSON file in the Supabase module, and the HCL reads it with `jsondecode(file(…))`. The guard parses that JSON … with Node built-ins only" `[VERIFIED: 183-CONTEXT.md D-14]`. A Node or vitest guard can't read HCL, but it can read this JSON.
**Guard placement:** a vitest file in the **frontend** workspace (e.g. `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts`). It can import `REQUIRED_ENV` and `ANALYTICS_ENV` through the `$lib` alias and read the JSON and `.env.example` with `fs`. The infra vitest config (`infra/vitest.config.ts`, root `infra/`, include `scripts/**/*.test.ts`) has no `$lib` alias, and `requiredEnv.ts` imports `$lib/server/analytics/config` `[VERIFIED: requiredEnv.ts first line "import { analyticsStartupProblems } from '$lib/server/analytics/config';"]`, so importing it from there would fail.
**What the guard asserts:** every `REQUIRED_ENV` name (`'PUBLIC_SUPABASE_URL', 'PUBLIC_SUPABASE_ANON_KEY', 'PUBLIC_PROJECT_ID', 'ORIGIN'` `[VERIFIED: requiredEnv.ts REQUIRED_ENV]`) is in the JSON. Every JSON name appears in `.env.example`, commented-out lines included, since `ORIGIN`, `ADDRESS_HEADER` and `XFF_DEPTH` are commented there on purpose (`.env.example` § Reverse proxy, "KEEP THEM COMMENTED OUT."). And the forbidden name `SUPABASE_SERVICE_ROLE_KEY` is absent (INFRA-05).

Recommended list (the planner fixes the final one):

| Name | Kind | Staging value source |
|------|------|----------------------|
| `PUBLIC_SUPABASE_URL` | plain | `https://cofbsatfrdysyphajsky.supabase.co` `[ASSUMED: URL form from project ref "cofbsatfrdysyphajsky" in envs/staging/supabase/terraform.tfvars]` |
| `PUBLIC_SUPABASE_ANON_KEY` | plain (public by design) | the persistent project's legacy anon key; the operator gives it, and it may sit in tfvars because it is public |
| `PUBLIC_PROJECT_ID` | plain | `00000000-0000-0000-0000-000000000001` `[VERIFIED: envs/staging/supabase/terraform.tfvars public_project_id]` |
| `ORIGIN` | plain | `https://staging.openvaa.org` (= `public_origin` there) |
| `ADDRESS_HEADER` / `XFF_DEPTH` | plain | `x-forwarded-for` / `2` (D-06) |
| `KEEP_ALIVE_TIMEOUT` / `HEADERS_TIMEOUT` | plain | e.g. `65` / `66` (Pitfall 7) `[ASSUMED values]` |
| `ANALYTICS_PROVIDER` / `ANALYTICS_CONSENT_MODE` / `ANALYTICS_VISIT_ID_MODE` | plain | `none` / `gated` / `memory` |
| `ANALYTICS_POSTHOG_KEY` | secret | `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` |
| `PUBLIC_LOG_LEVEL` | plain | see Pitfall 6: the shutdown line must clear it |
| `DEPLOYMENT_DIAGNOSTICS` | plain | `false`, `true` only during D-06 |

`PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` are read into `constants` and nowhere else outside tests `[VERIFIED: grep of apps/frontend/src]`, so they are not needed. `PUBLIC_IDENTITY_PROVIDER_TYPE` defaults to `'signicat-ftn'` in `constants.ts`, and bank auth is out (A4). With `ANALYTICS_PROVIDER=none` the key is not required: `if (provider === 'posthog') { const key = …` is the only key check `[VERIFIED: analytics/config.ts resolveAnalyticsConfig]`.

### Pattern 2: The fault switch for D-15
A list variable `omit_environment` (default `[]`, validated against the JSON names) removes the named entries before the container definition is built. Setting `["ORIGIN"]` produces a revision whose tasks exit at start: `throw new Error(\`Required environment variables are not set: ${missing.join(', ')}\`)` in the `init` hook `[VERIFIED: hooks.server.ts export const init]`. adapter-node awaits `server.init(...)` at module top level `[VERIFIED: node_modules/@sveltejs/adapter-node/files/handler.js "await server.init({"]`, so the throw ends the process before `listen`. The same variable exists in `example` with an empty default.

### Pattern 3: Origin lock observation through a temporary `/32`
Lock (1) is seen as a direct `curl --resolve origin.staging.openvaa.org:443:<alb-ip>` that gets no answer (connect timeout; the SG drops it). Lock (2) can only be seen by a request that passes the SG, and only CloudFront's addresses do. Give the module a variable `debug_ingress_cidrs` (default `[]`) that adds one `/32` ingress rule on 443 (weight 1; 55 + 1 = 56 ≤ 60). Then, from the workstation:
- without the header → `403` from the listener's fixed response;
- with the header (value read into a shell variable from a sensitive output, never printed) → `200`;
then apply again with the list empty. This also shows the listener rule is what admits CloudFront.

### Pattern 4: Deployment order inside the phase (reuses each rollout)
Each env change is a new task-definition revision and a rolling deployment of a few minutes. Batch the observations:
1. Apply #1: everything, `DEPLOYMENT_DIAGNOSTICS=true`, `XFF_DEPTH=2` as the candidate. Record headers (D-06), form post, OBS-08, D-09 caching, origin locks (with the `/32`).
2. Apply #2: diagnostics off, `/32` removed, depth confirmed or corrected from the record.
3. Apply #3: `omit_environment=["ORIGIN"]`, with the request loop running: failed rollout, rollback, alert mail (D-15, D-17).
4. Apply #4: restore, with the loop running: the old task is drained and stopped, which is where the SIGTERM line is seen (D-16). See Pitfall 5.
5. Apply #5: the scheduled action pair (D-18). Scale-in to 1 stops a task and gives a second SIGTERM record.
6. Apply #6: remove the pair. Then OBS-10, OBS-06, evidence copy, D-22 destroy + re-apply, and 7 days later D-23.

### Pattern 5: A build from a pushed, source-only commit (D-14)
`git status --porcelain` empty, then a source-only commit (the tree with `.planning` removed, built through a temporary index as the CI-evidence memory describes) pushed to a `deploy-evidence/185-…` branch. `deploy-evidence/**` is the name PIPE-10 reserves, and no workflow listens to it yet. Then `git worktree add --detach <tmp> <sha>`, verify `git ls-remote origin` lists `<sha>`, and build from that worktree with `BUILD_SHA=<sha>` and tag `<sha>`. See Open Question 2.

### Anti-Patterns to Avoid
- **IAM resources in `envs/staging/aws`:** they turn the 187 deploy role into an IAM writer, against 183 D-07.
- **`desired_count` without `ignore_changes`:** every apply after a scaling action fights App Auto Scaling.
- **A health-check path change to make a rollout fail:** it fails the old task too (CONTEXT D-15).
- **`random_password` with special characters as the header value:** ALB header conditions treat `*` and `?` as wildcards and match case-insensitively `[CITED: ELB rule-condition-types, HTTP header conditions]`. Use `special = false`.
- **An encrypted SNS topic with the AWS-managed `aws/sns` key:** EventBridge cannot publish to it `[ASSUMED]`. Leave SSE off; the topic carries no secret.
- **Logging client addresses in evidence:** the diagnostics body carries real viewer addresses. Record them by role (`viewer`, `edge`, `spoof`).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CloudFront IP list for the SG | A list from `ip-ranges.json` | `com.amazonaws.global.cloudfront.origin-facing` prefix list | AWS maintains it |
| Cache/forwarding policies | Custom policies | The three managed policies | Exactly the D-04 semantics |
| Rollback on bad deploy | A script polling ECS | `deployment_circuit_breaker { enable = true, rollback = true }` | Native; emits the event D-17 needs |
| Waiting for stable | A `sleep` loop | `wait_for_steady_state = true` on `aws_ecs_service` | "like `aws ecs wait services-stable`" `[CITED: provider docs r/ecs_service]`; 187 relies on the same exit status |
| Cert validation wait | A polling script | `aws_acm_certificate_validation` | D-03 |
| Client address parsing | App code over `x-forwarded-for` | adapter-node `ADDRESS_HEADER`/`XFF_DEPTH` | Already the app's mechanism |
| Secret injection | Fetching SSM in app code | Task-definition `secrets` | No task role and no AWS SDK in the image |
| Destroy check | A list of hand-written ARNs | Tagging API on `Root=aws` (both regions) | Catches what the plan forgot |

**Key insight:** every behaviour this phase observes already exists as a managed AWS feature or an adapter-node setting. The only new application code is two small, testable additions.

## State Outside the AWS Root's Terraform State

The phase is not a rename, but D-22 is a teardown, so here is what survives the destroy or is created outside the plan:

| Category | Items | Action |
|----------|-------|--------|
| Stored data | SSM parameters `/openvaa/staging/frontend/*` (operator-created); ECR images (bootstrap); Supabase rows: the OBS-10 feedback rows, the OBS-06 invitation, its claimed grant and the invitee's auth user | Parameters and images are meant to survive. Tag the parameters **without** `Root=aws` or the D-22 check flags them. Clean up the OBS-06 objects explicitly (Open Question 6) |
| Live service config | SNS email subscription (pending until confirmed; a new one after re-apply) | The operator confirms again after the re-apply. A pending subscription cannot be deleted by Terraform; it goes with the topic `[CITED: provider docs r/sns_topic_subscription NOTE]` |
| OS/account-registered state | Service-linked roles `AWSServiceRoleForECS`, `AWSServiceRoleForElasticLoadBalancing`, `AWSServiceRoleForApplicationAutoScaling_ECSService`, created on first use and outside Terraform `[ASSUMED names]` | Record them in the INFRA-17 account read; they survive the destroy and are not inline policies |
| Secrets/env vars | `TF_VAR_alert_email` (if personal) per session; the origin header secret in `pipeline/` state, which the plan role **can** read | Accepted by D-05; the 187 PR plan job will be able to read it (Security Domain) |
| Build artifacts | INACTIVE task-definition revisions, one per apply; they stay in the account indefinitely `[CITED: ECS task-definition-state docs via search]` | They may appear in the Tagging API check (Pitfall 14). Either delete them with `aws ecs delete-task-definitions` after deregistration, or classify them in the check |

## Common Pitfalls

### Pitfall 1: The CloudFront prefix list costs 55 of the SG's 60 rules
**What goes wrong:** a second rule referencing the list (port 80, or the IPv6 list) makes the SG exceed its quota, and the apply fails.
**Why:** "the weight of a Amazon CloudFront managed prefix list is 55 … The default quota is 60 rules, leaving room for only 5 additional rules" `[CITED: docs.aws.amazon.com/vpc/latest/userguide/working-with-aws-managed-prefix-lists.html]`.
**How to avoid:** one ingress rule, 443 only, IPv4 list only (CloudFront reaches custom origins over IPv4 unless `ip_address_type` says otherwise `[ASSUMED]`). Do not add an `80` listener rule from the prefix list (Open Question 4). The D-05 `/32` debug rule fits (56).
**Warning signs:** `RulesPerSecurityGroupLimitExceeded` on apply.

### Pitfall 2: The execution role in a pipeline root
**What goes wrong:** placing `aws_iam_role` in `staging/aws` works by hand in 185, then 187's deploy role must get `iam:CreateRole`/`iam:PutRolePolicy`-class rights or the first pipeline plan shows a replace it can't apply.
**Why:** `infra/README.md` Rules: "IAM is written only by roots applied by hand, and only as customer-managed policies under the path `/openvaa/`, because no workflow role may create or change a permission and no permission may depend on an inline policy." `[VERIFIED: infra/README.md § Rules of every apply]`
**How to avoid:** Open Question 1.

### Pitfall 3: Terraform removes the default egress rule
**What goes wrong:** tasks can't pull the image or reach SSM/CloudWatch/Supabase (`CannotPullContainerError … i/o timeout`, `ResourceInitializationError`).
**Why:** Terraform removes AWS's default allow-all egress from an `aws_security_group` it creates `[ASSUMED, long-standing provider behaviour]`. With no NAT, the task also needs `assign_public_ip = true` `[VERIFIED: schema attribute network_configuration.assign_public_ip]`.
**How to avoid:** explicit task egress 443 to `0.0.0.0/0`. ALB egress to the task SG on 3000.

### Pitfall 4: The circuit breaker and a task that crashes right after start
**What goes wrong:** if the crashing task briefly counts as RUNNING, stage 1 is skipped and stage 2 only counts health-check replacements, so the rollback might not trigger as quickly as expected.
**What is documented:** threshold `3` at desired count 1 (`BOUNDED_PERCENT`, value 50, min 3); stage 1 counts "tasks that do not transition to the RUNNING state"; the failure event's example reason is `"ECS deployment circuit breaker: task failed to start."`; rollback goes to the last `COMPLETED` deployment, and with none "the deployment is stalled" `[CITED: docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html, ecs_service_deployment_events.html]`.
**How to avoid:** apply #1 must reach `COMPLETED` before the fault apply. Run the fault apply with a time budget (e.g. 20 minutes; ECS spaces relaunches of failing tasks further apart). If it doesn't trip, record that and fall back to a container `healthCheck` (`wget -qO- http://127.0.0.1:3000/api/health`), so stage 2 has a failing check. Provider 6.68.0's `deployment_circuit_breaker` has only `enable` and `rollback` `[VERIFIED: schema]`, so the threshold can't be lowered from Terraform. With `wait_for_steady_state = true` the fault apply exits non-zero; that is expected and recorded.
**Warning signs:** the deployment sits `IN_PROGRESS` with `failedTasks` rising and no rollback event.

### Pitfall 5: SIGTERM is not seen in D-15's rollback
**What goes wrong:** the plan expects the SIGTERM line in the failed rollout, but the old task is never stopped (rollback keeps it), and the failing tasks exit by themselves with code 1.
**How to avoid:** observe SIGTERM on apply #4 (the restore replaces the old task) and on the scale-in after D-18. Expected order (ECS deregisters, waits the deregistration delay, then signals) `[ASSUMED]`: the drain completes before SIGTERM, so "requests in flight" is usually 0.

### Pitfall 6: `sveltekit:shutdown` fires after the drain, and `info` lines are dropped
**What goes wrong:** (a) a listener on `sveltekit:shutdown` alone cannot name "requests in flight" at signal time. The adapter emits it inside `httpServer.close((error) => { … process.emit('sveltekit:shutdown', reason); })`, after every connection closed, and its own counter `let requests = 0;` is module-private `[VERIFIED: node_modules/@sveltejs/adapter-node/files/index.js graceful_shutdown]`. (b) The server's default level is `warn` in production: `const fallback: LogLevel = dev || publicDebug ? 'debug' : 'warn';` `[VERIFIED: apps/frontend/src/lib/utils/logLevel.ts resolveLogLevel]`, so a `log.info` line never appears.
**How to avoid:** two lines. `process.once('SIGTERM'…)` at receipt (signal name, an app-level in-flight count kept by a `handle` counter, documented as approximate for streamed bodies), and `process.once('sveltekit:shutdown', reason => …)` at drain completion (reason, elapsed ms). Register both from the `init` hook, beside the analytics queue's existing `registerShutdownFlush`. Emit at a level the task's `PUBLIC_LOG_LEVEL` admits: set `PUBLIC_LOG_LEVEL=info` on staging, or emit at `warn`. That is the planner's choice, stated in the plan. Exit code 0 also requires the event loop to empty; 181 saw a non-137 exit locally (`check-proxy-topology.sh` leg 7).

### Pitfall 7: Node's keep-alive shorter than the ALB's idle timeout
**What goes wrong:** sporadic 502s on reused connections.
**Why:** Node's default `keepAliveTimeout` is 5 s `[ASSUMED]`, and the ALB's default idle timeout is 60 s `[ASSUMED]`. adapter-node reads `KEEP_ALIVE_TIMEOUT` and `HEADERS_TIMEOUT` in seconds: "Convert the keep-alive timeout from seconds to milliseconds" `[VERIFIED: adapter-node index.js]`.
**How to avoid:** `KEEP_ALIVE_TIMEOUT=65`, `HEADERS_TIMEOUT=66`, both in the JSON list.

### Pitfall 8: The ECS service fights App Auto Scaling, and the scalable target drifts
**What goes wrong:** a plan after a scheduled action shows `desired_count` and `min_capacity` changes.
**How to avoid:** `lifecycle { ignore_changes = [desired_count] }` on the service `[CITED: provider docs r/ecs_service, "ignore any changes to that count caused externally (e.g., Application Autoscaling)"]`. Expect the scalable target's `min_capacity` to read 2 during the window; don't apply between the two actions.

### Pitfall 9: Re-pushing an identical image does not show `ImageTagAlreadyExistsException`
**What goes wrong:** pushing the same digest under the same tag returns `ImageAlreadyExistsException` ("there were no changes to the manifest or image tag") or is treated as a no-op by the client, not the refusal D-14 wants to see.
**Why:** the two are distinct ECR errors; `ImageTagAlreadyExistsException` is "tagged with a tag that already exists. The repository is configured for tag immutability" `[CITED: docs.aws.amazon.com/AmazonECR/latest/APIReference/API_PutImage.html]`.
**How to avoid:** for the refusal, push a **different** image under the existing tag (e.g. a one-line `FROM <repo>:<sha>` + `LABEL` image tagged `<repo>:<sha>`) and record the error. Build with `--provenance=false --sbom=false` so the pushed artifact is a single manifest, not an index with attestation children that the untagged-expiry rule could touch `[ASSUMED risk]`.

### Pitfall 10: Cost-allocation tags don't cover Fargate unless tasks carry them
**What goes wrong:** Cost Explorer filtered by `Root=aws` shows the ALB and CloudFront but not Fargate.
**Why:** Fargate cost sits on tasks; tags reach tasks only through `propagateTags` (`SERVICE` or `TASK_DEFINITION`), which is off by default `[CITED: repost.aws knowledge-center ecs-troubleshoot-tagging-tasks, via search]`. Public IPv4 charges may not be attributable by tag at all `[ASSUMED]`.
**How to avoid:** `propagate_tags = "SERVICE"` (the service carries `default_tags`) and `enable_ecs_managed_tags = true`. Read Cost Explorer twice, by tag and by service/usage type for the VPC public IPv4 lines, and reconcile against the inventory.

### Pitfall 11: ALB header-condition semantics
**What goes wrong:** a secret containing `*` or `?` matches more than itself; case doesn't matter.
**Why:** "The header name and the match evaluation are not case-sensitive. The following wildcard characters are supported … \* … ?" `[CITED: ELB rule-condition-types]`.
**How to avoid:** `random_password { length = 48, special = false }` (an assumed value of 128 characters or fewer). The header name e.g. `x-origin-verify` must not be on CloudFront's deny-list: no `X-Amz-` or `X-Edge-` prefix, no `Host`, `Via` or `X-Real-Ip` `[CITED: CloudFront add-origin-custom-headers]`. CloudFront overwrites a viewer-sent header of the same name ("If a header is present, CloudFront overwrites the header value"), so a viewer can't inject it `[CITED: same page]`.

### Pitfall 12: The floor goes down, but the count stays at 2 for a while
**What goes wrong:** after the lowering action (min 1, max 2), desired stays 2 until target tracking scales in, which is deliberately conservative ("more aggressive in adding capacity … than it is in removing capacity") `[CITED: application-auto-scaling target-tracking-scaling-policy-overview]`. The scale-in alarm's span (commonly 15 one-minute datapoints) is `[ASSUMED]`.
**How to avoid:** budget about 20 minutes after the lowering action. Use `at(yyyy-mm-ddThh:mm:ss)` schedules with `timezone`. Remove the pair afterwards rather than moving it into the past (creating an `at()` action in the past may be refused `[ASSUMED]`).

### Pitfall 13: A provider alias without `default_tags` and `allowed_account_ids`
**What goes wrong:** the `us-east-1` certificate is untagged (the D-22 check misses it; the cost tags don't apply), and the account guard doesn't cover that alias.
**How to avoid:** either repeat both blocks in the alias, or use the per-resource `region` argument (Open Question 3). If an alias is kept, the module needs `configuration_aliases = [aws.us_east_1]` in its `required_providers`.

### Pitfall 14: The Tagging API is regional, and INACTIVE task definitions persist
**What goes wrong:** a check in `eu-north-1` alone misses the `us-east-1` certificate (and CloudFront, which the Tagging API serves from `us-east-1` `[ASSUMED]`). Deregistered task definitions "can currently be discovered in the account indefinitely" `[CITED: ECS task-definition-state docs, via search]`; whether `get-resources` lists them is unknown `[ASSUMED]`.
**How to avoid:** run the check in both regions; classify the leftovers; delete INACTIVE revisions with `aws ecs delete-task-definitions` if they are listed. Stopped tasks with propagated tags may linger about an hour `[ASSUMED]`, so wait before the check.

### Pitfall 15: Rolling deploys can 404 a new chunk from the old task
**What goes wrong:** during the overlap of an old and a new task, a new HTML page's `/_app/immutable/*` request can reach the old task and 404. CloudFront then caches the 404 for its default error-caching time `[ASSUMED: 10 s]` (Pitfall 13 of `research/PITFALLS.md`).
**How to avoid:** with one task the overlap is short; record any non-2xx asset requests in the loop. Out of scope to fix (stickiness is out of scope; an asset store is not planned).

### Pitfall 16: Plans of the long-lived roots need secrets in the session
**What goes wrong:** E-03's "both plans empty" fails before planning. `envs/staging/supabase/terraform.tfvars` says "Because this file sets smtp, a plan without TF_VAR_smtp_user and TF_VAR_smtp_password fails", and the provider needs `SUPABASE_ACCESS_TOKEN` `[VERIFIED: that file's header comment]`.
**How to avoid:** a checkpoint where the operator gives those values for one session (D-01 allows it), or runs the two plans themselves. The SMTP pair comes from `dns-mail` outputs with `terraform output -raw` in the same shell. The 184 probe after the destroy needs the same kind of session.

### Pitfall 17: SNS email confirmation, and the address in pipeline state
**What goes wrong:** the subscription stays `PendingConfirmation` until the operator clicks. Every re-apply after a destroy creates a new one. A personal address passed as `TF_VAR_alert_email` lands in `pipeline/` state, which the plan role can read.
**How to avoid:** checkpoint after apply #1 and after the D-22 re-apply. Prefer a non-personal role address that can sit in tfvars; otherwise `sensitive = true` per session, and note that 187 needs it as a GitHub secret.

## Code Examples

All attribute names below were read from the 6.68.0 schema dump `[VERIFIED: provider schema 6.68.0]`. Literal values that aren't quoted from the repository or the AWS docs are marked `[ASSUMED]` in comments.

### Origin lock: SG rule, listener default 403, header rule

```hcl
data "aws_ec2_managed_prefix_list" "cloudfront" {
  name = "com.amazonaws.global.cloudfront.origin-facing" # [CITED: CloudFront docs]
}

resource "aws_vpc_security_group_ingress_rule" "alb_from_cloudfront" {
  security_group_id = aws_security_group.alb.id
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
  prefix_list_id    = data.aws_ec2_managed_prefix_list.cloudfront.id # weight 55 of 60
}

resource "random_password" "origin_secret" {
  length  = 48    # [ASSUMED]
  special = false # ALB header match treats * and ? as wildcards
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate_validation.origin.certificate_arn
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "403"
    }
  }
}

resource "aws_lb_listener_rule" "from_cloudfront" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 1
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
  condition {
    http_header {
      http_header_name = "x-origin-verify" # [ASSUMED name]
      values           = [random_password.origin_secret.result]
    }
  }
}
```

### Target group, task definition, service

```hcl
resource "aws_lb_target_group" "app" {
  port                 = 3000 # Dockerfile: EXPOSE 3000
  protocol             = "HTTP"
  target_type          = "ip" # required for awsvpc / Fargate [ASSUMED: AWS rule]
  vpc_id               = aws_vpc.this.id
  deregistration_delay = 30 # D-16
  health_check {
    path    = "/api/health"
    matcher = "200"
  }
}

locals {
  env_spec = jsondecode(file("${path.module}/task-environment.json"))
  # omit_environment implements the D-15 fault
  kept     = [for v in local.env_spec.variables : v if !contains(var.omit_environment, v.name)]
}

resource "aws_ecs_task_definition" "app" {
  family                   = "${var.name_prefix}-frontend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.task_cpu    # 512 (D-11)
  memory                   = var.task_memory # 1024
  execution_role_arn       = var.execution_role_arn # from bootstrap (Open Question 1)
  # no task_role_arn: the container calls no AWS API
  runtime_platform {
    cpu_architecture        = "ARM64"
    operating_system_family = "LINUX"
  }
  container_definitions = jsonencode([{
    name         = "frontend"
    image        = "${var.registry_url}:${var.image_tag}"
    essential    = true
    portMappings = [{ containerPort = 3000, protocol = "tcp" }]
    stopTimeout  = 30 # D-16; Fargate allows up to 120 [ASSUMED]
    environment  = [for v in local.kept : { name = v.name, value = var.environment_values[v.name] } if v.kind == "plain"]
    secrets = [for v in local.kept : {
      name      = v.name
      valueFrom = "arn:aws:ssm:${var.aws_region}:${var.aws_account_id}:parameter${var.parameter_path}/${v.name}"
    } if v.kind == "secret"]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.app.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "frontend"
        mode                  = "non-blocking" # [ASSUMED option name]
      }
    }
  }])
}

resource "aws_ecs_service" "app" {
  name                               = "${var.name_prefix}-frontend"
  cluster                            = aws_ecs_cluster.this.id
  task_definition                    = aws_ecs_task_definition.app.arn
  launch_type                        = "FARGATE"
  desired_count                      = var.task_floor
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 60 # [ASSUMED]
  wait_for_steady_state              = true
  propagate_tags                     = "SERVICE" # Pitfall 10
  enable_ecs_managed_tags            = true
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }
  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.task.id]
    assign_public_ip = true # no NAT (D2)
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "frontend"
    container_port   = 3000
  }
  lifecycle { ignore_changes = [desired_count] }
  depends_on = [aws_lb_listener_rule.from_cloudfront]
}
```

`parameter_path = "/openvaa/staging/frontend"` gives `…:parameter/openvaa/staging/frontend/NAME`. Don't join with a second `/` (`parameter//openvaa…`) `[ASSUMED: ARN form for path names]`. The ECS docs' form is `arn:aws:ssm:{{region}}:{{aws_account_id}}:parameter/{{parameter_name}}` `[CITED: secrets-envvar-ssm-paramstore]`.

### CloudFront with two behaviours

```hcl
resource "aws_cloudfront_distribution" "this" {
  enabled         = true
  is_ipv6_enabled = true
  aliases         = [var.domain]  # staging.openvaa.org
  price_class     = "PriceClass_100" # [ASSUMED]

  origin {
    origin_id   = "alb"
    domain_name = "origin.${var.domain}"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
    custom_header {
      name  = "x-origin-verify"
      value = random_password.origin_secret.result
    }
  }

  ordered_cache_behavior {
    path_pattern           = "/_app/immutable/*"
    target_origin_id       = "alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    cache_policy_id        = data.aws_cloudfront_cache_policy.optimized.id
  }

  default_cache_behavior {
    target_origin_id         = "alb"
    viewer_protocol_policy   = "redirect-to-https"
    allowed_methods          = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods           = ["GET", "HEAD"]
    cache_policy_id          = data.aws_cloudfront_cache_policy.disabled.id
    origin_request_policy_id = data.aws_cloudfront_origin_request_policy.all_viewer_except_host.id
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.viewer.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021" # [ASSUMED]
  }
  restrictions {
    geo_restriction { restriction_type = "none" }
  }
}
```

adapter-node sets `res.setHeader('cache-control', 'public,max-age=31536000,immutable');` only for `/${manifest.appPath}/immutable/` with status 200 `[VERIFIED: adapter-node handler.js serve()]`, so `CachingOptimized` honours a year's TTL there.

### The deployment alert

```hcl
resource "aws_cloudwatch_event_rule" "deploy_failed" {
  event_pattern = jsonencode({
    source        = ["aws.ecs"]
    "detail-type" = ["ECS Deployment State Change"]
    resources     = [aws_ecs_service.app.id] # service ARN [ASSUMED: id is the ARN]
    detail        = { eventName = ["SERVICE_DEPLOYMENT_FAILED"] }
  })
}
# + aws_cloudwatch_event_target (arn = topic ARN, no role_arn needed for SNS [ASSUMED])
# + aws_sns_topic_policy allowing events.amazonaws.com sns:Publish with aws:SourceArn = rule ARN
#   (a resource policy: outside the inline-IAM rule, per the guard's own header)
# + aws_sns_topic_subscription protocol = "email", endpoint = var.alert_email
```

The detail-type, source and `eventName` values are quoted from AWS's event examples `[CITED: ecs_service_deployment_events.html]`.

### Certificate in `us-east-1` without an alias (Open Question 3)

```hcl
resource "aws_acm_certificate" "viewer" {
  region            = "us-east-1" # provider v6 per-resource region
  domain_name       = var.domain
  validation_method = "DNS"
}
resource "aws_acm_certificate_validation" "viewer" {
  region                  = "us-east-1"
  certificate_arn         = aws_acm_certificate.viewer.arn
  validation_record_fqdns = [for r in aws_route53_record.viewer_validation : r.fqdn]
}
# validation records: the provider doc's for_each over domain_validation_options, allow_overwrite = true
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| A provider alias per region | Per-resource `region` argument | AWS provider 6.0 | Simpler `us-east-1` cert (Open Question 3) |
| `aws_security_group` inline `ingress {}` | `aws_vpc_security_group_ingress_rule` | provider 5.x | One rule per resource, clear diffs |
| Circuit breaker fixed threshold | `thresholdConfiguration` (`COUNT`, `BOUNDED_PERCENT`) in the API | 2025–26 `[CITED: deployment-circuit-breaker]` | **Not** in provider 6.68.0 `deployment_circuit_breaker` (only `enable`, `rollback`) |
| Pay-as-you-go CloudFront only | Flat-rate plans (Free 0 USD: 1M requests, 100 GB) | 2025 `[CITED: aws.amazon.com/cloudfront/pricing]` | Staging traffic fits any tier; record which one applies |

**Deprecated/outdated:** the research's staged apply "registry, image, DNS/certificate, compute" is superseded by D-03, because the registry and zone now live in long-lived roots.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | A task exiting right after start trips the circuit breaker within ~20 min | Pitfall 4 | D-15 needs the container-health-check fallback |
| A2 | The Tagging API lists INACTIVE task definitions after the destroy | Pitfall 14 | The "no `Root=aws` resource left" check reads non-empty; classify or delete |
| A3 | Target-tracking scale-in 2→1 takes ~15–20 min at idle | Pitfall 12 | D-18 window longer than planned |
| A4 | Terraform strips default SG egress | Pitfall 3 | None if egress is written explicitly anyway |
| A5 | `Managed-*` names for the cache/origin-request policy data sources | Standard Stack | Use the cited ids instead |
| A6 | Node keep-alive 5 s / ALB idle 60 s defaults | Pitfall 7 | 502s; the fix is the same |
| A7 | EventBridge cannot publish to an `aws/sns`-encrypted topic | Anti-patterns | None if SSE is left off |
| A8 | Public IPv4 charges are not tag-attributable | Pitfall 10 | The tag-filtered cost under-reads; reconcile by usage type |
| A9 | `PUBLIC_SUPABASE_URL` = `https://<ref>.supabase.co` | Pattern 1 | Wrong URL: SSR reads fail, OBS-08 red |
| A10 | Priced inventory ≈ 50 USD/month (Fargate ARM 0.5 vCPU/1 GB 15.85 + ALB hours 17.48 + ~1 LCU 5.55 + 3 public IPv4 10.95 + logs/CF ~1) from list prices `EUN1-Fargate-ARM-vCPU-Hours:perCPU 0.0356`, `EUN1-Fargate-ARM-GB-Hours 0.00392`, ALB `0.02394`/h, LCU `0.0076`/h, `PublicIPv4:InUseAddress 0.005`/h `[VERIFIED: AWS price list API, publication 2026-11-04..11]`; the LCU count and IP count are assumed | E-04 | Only the inventory half; the measured half is D-23 |
| A11 | An ALB uses 2 public IPv4 addresses in 2 AZs at idle | A10 | Small cost difference |
| A12 | `at()` scheduled actions in the past are refused | Pitfall 12 | Either way, removal is the clean end |
| A13 | Terraform shows attributes derived from `random_password.result` as `(sensitive value)` in plan text | Security | If not, the 187 PR plan log would print the header secret; check the first plan's text |
| A14 | The x-cache value for `CachingDisabled` responses reads `Miss from cloudfront` | D-09 | The evidence wording changes; the "never Hit, no Age" test stands |

## Open Questions

1. **Where do the execution role and its SSM policy live? (BLOCKING — needs an operator ruling before planning)**
   - What we know: 183 D-07 "Only hand-applied roots write IAM, so the pipeline cannot create or change IAM"; 183 D-02 "`bootstrap` holds the state bucket, the OIDC provider, the roles and policies, the image registry and the budget"; CONTEXT D-01 "The agent applies only `envs/staging/aws` … none of those roots is applied in this phase". The ROADMAP note "The task and execution roles go in under the IAM check of phase 183" fixes the guard, not the root.
   - What's unclear: which rule gives way.
   - Recommendation: **(a)** a new `infra/modules/frontend-task-role` called from `bootstrap`: `aws_iam_role` with an `ecs-tasks.amazonaws.com` trust, `aws_iam_role_policy_attachment` of AWS-managed `service-role/AmazonECSTaskExecutionRolePolicy` (ECR pull + logs), and a customer-managed `aws_iam_policy` under `/openvaa/` with `ssm:GetParameters` on `arn:aws:ssm:eu-north-1:471112560111:parameter/openvaa/staging/frontend/*`. `bootstrap` outputs the ARN, and `staging/aws` takes it as a tfvars input. One `bootstrap` plan that shows only `+` creates, applied once. The operator either amends D-01 for that one additive apply or runs it as a checkpoint. **No `kms:Decrypt` statement is needed if the parameters use the default key**: "`kms:Decrypt` — Required only if your secret uses a customer managed key and not the default key" `[CITED: AmazonECS task_execution_IAM_role.html]`, which narrows D-12's "plus `kms:Decrypt`". (b) A new hand-applied root `envs/staging/aws-iam` (`hand/` key): cleaner separation, but it is a fifth root and still an apply outside `staging/aws`. (c) The roles in `staging/aws` now, moved in 187: a cross-root state move later, and against D-07.

2. **Which commit is "pushed to origin" (D-14)?**
   - What we know: the branch has no upstream (`git rev-parse @{u}` → "no upstream configured"). Standing practice (memory, CI evidence channel) is to push only source-only commits with `.planning` removed, because the repository is public. A source-only commit's SHA differs from the working `HEAD`.
   - Recommendation: build from a pushed source-only commit on `deploy-evidence/185-<n>` (Pattern 5). The tag and `BUILD_SHA` are that commit's SHA; the D-22 re-apply uses the same tag. Pushing needs the operator's go-ahead under the global "push only when asked" rule, so ask once and cover all pushes of the phase.

3. **Provider alias vs per-resource `region` for the `us-east-1` certificate (D-07 says alias).**
   - Recommendation: per-resource `region = "us-east-1"`. It keeps `allowed_account_ids` and `default_tags` in one block (Pitfall 13) and is documented for v6 `[CITED]`. If the operator keeps the alias, repeat both blocks in it.

4. **The listener-side 80→443 redirect (D-07).**
   - What we know: an 80 rule from the prefix list doesn't fit the 60-rule quota (55 + 55). CloudFront uses `https-only` to the origin, so no CloudFront request ever reaches port 80. Without an SG rule, a port-80 listener is unreachable by everyone, so nothing about it can be observed.
   - Recommendation: no port-80 listener on the ALB. INFRA-03's redirect is the viewer-side `redirect-to-https`, observed as a `301` from CloudFront for `http://staging.openvaa.org/`. Record the deviation. The alternative is a quota increase (L-0EA8095F) for a listener nobody reaches.

5. **Does the operator have the PostHog key now (D-12)?** REQUIREMENTS lists "a PostHog Cloud EU project, its token and a billing limit" as not yet given (needed by 188). If it is not available, store a clearly non-secret stand-in under the same name. The secret path is proven either way, and 188 overwrites it (`put-parameter --overwrite`, then a new deployment, since ECS injects at start `[CITED: secrets-envvar-ssm-paramstore]`).

6. **The OBS-06 invitation path.**
   - What we know: the Admin App has no invitation screen (`routes/admin/(protected)` holds `argument-condensation`, `jobs`, `question-info`). An invitation is a `create_invitations(p_project_id, p_invitations, p_confirm_entity)` call that "sends nothing". The mail comes from `account-access` `request-link`, and only when `invitation_link_request` returns an address. A candidate invitation is honoured "only under the registration mode its binding names … as the project's `contestantApp.registrationModes` matrix allows it", and "A project that stores no matrix honours no candidate or organization invitation". Deleting is allowed only for "an unclaimed row; a claimed row is kept" `[VERIFIED: apps/docs …/pre-registration-and-invitation/+page.md]`.
   - What's unclear: whether the persistent project's settings list the `email` mode for candidates, which candidate entity to target without changing what voters see (`p_confirm_entity` is required and confirms the entity when `true`), and how to remove the claimed row, the grant and the invitee's auth user afterwards.
   - Recommendation: a pre-step that reads the project's registration matrix. The admin's own session calls `create_invitations` through PostgREST for an existing **unconfirmed** test candidate, with `p_confirm_entity: false`. The operator requests the link on the Contestant App's email screen at the staging URL and follows it. Cleanup goes through SQL with the operator's database session, not the smoke dataset's prefix-scoped tooling. This is also the persistent project's first function mail (184 `harden`).

7. **Secrets for the read-only plans of `supabase` and for the probe (D-22).** These are Pitfall 16. They need a checkpoint, or the operator gives the values for one session.

8. **Log level of the shutdown line (D-16).** Either `PUBLIC_LOG_LEVEL=info` on staging, which raises log volume, or emit at `warn`. This is the planner's choice, stated in the plan (Pitfall 6).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Terraform | all roots | ✓ | 1.16.5 (darwin_arm64) | — |
| AWS CLI v2 | every AWS call | ✓ | 2.34.7 | — |
| Profile `openvaa-admin` | D-01 | ✓ (in `aws configure list-profiles`) | — | Operator re-runs `aws sso login` on expiry |
| Docker + buildx | image build | ✓ | 29.7.2 server arm64, buildx 0.36.0 | — |
| jq, curl, dig, git, shasum | observations | ✓ | jq 1.7.1 | — |
| Node 24 | frontend tests, guards | ✓ | `$HOME/.nvm/versions/node/v24.21.0` (prepend to PATH) | — |
| Request-loop tool | D-15 | `curl` loop ✓; `ab` present; `hey`/`oha`/`k6` absent | — | A bash `curl` loop writing `timestamp,status,build` per request, reading each exit status |
| Public DNS delegation | ACM validation, alias | ✓ `staging.openvaa.org` NS → four `awsdns` servers; no A record yet | — | — |
| SES production access (eu-north-1) | OBS-06 | ✓ "SES production access in eu-north-1 was already granted" `[VERIFIED: STATE.md Phase 183 line]` | — | — |
| Operator's phone off Wi-Fi | OBS-10 | checkpoint | — | — |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** load tools (a curl loop is enough).

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | vitest (frontend `vitest run`; infra `infra/vitest.config.ts`); Terraform `fmt`/`validate`; Node `assert:*` guards; Playwright E2E |
| Config file | `apps/frontend/vitest.config.ts`, `infra/vitest.config.ts`, `tests/playwright.config.ts` |
| Quick run command | `yarn workspace @openvaa/frontend test:unit -- src/routes/api/diagnostics src/lib/server/startup` |
| Full suite command | `yarn lint:check && yarn test:unit`, then `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-final --no-db-reset` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-05 / OBS-08 / D-13 | The JSON task env ⊇ `REQUIRED_ENV`, ⊆ `.env.example` names, no service-role key | unit | `yarn workspace @openvaa/frontend test:unit -- taskEnvironment` | ❌ Wave 0 |
| OBS-04 / D-06 | Allow-list adds `cloudfront-viewer-address`, `x-amz-cf-id`; never echoes the origin secret header or a cookie | unit | `yarn workspace @openvaa/frontend test:unit -- src/routes/api/diagnostics` | ✅ `server.test.ts` (extend) |
| INFRA-09 / D-16 | SIGTERM and `sveltekit:shutdown` each produce one line at an emitted level, once | unit (EventEmitter stand-in, as `registerShutdownFlush` takes a `target`) | `yarn workspace @openvaa/frontend test:unit -- shutdown` | ❌ Wave 0 |
| INFRA-02/11 | No inline IAM; no non-local module source | guard | `yarn assert:no-inline-iam-policies` | ✅ |
| INFRA-10 / INFRA-19 | `fmt` + `validate` of both aws roots, lock files with linux hashes | static | `terraform fmt -check -recursive infra` then per root `init -backend=false -lockfile=readonly` + `validate` | ✅ CI loop |
| INFRA-01, 03, 04, 06–09, 12–14, SUPA-12, OBS-06, OBS-10 | Hosted behaviours | manual-only, by design: observed on the applied stack, each with its exit status and evidence file | runbook steps in `infra/envs/staging/aws/README.md` | ❌ Wave 0 (runbook) |
| Regression | App unchanged for users | E2E | `tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/185-final --no-db-reset` | ✅ |

### Sampling Rate
- **Per task commit:** the quick vitest command for touched files, plus `terraform fmt -check` / `validate` for touched roots.
- **Per wave merge:** `yarn lint:check` (includes the IAM guard) and `yarn test:unit` (needs the local stack up, per memory).
- **Phase gate:** a full green E2E run (not void) after the last code change, before `/gsd-verify-work`.

### Wave 0 Gaps
- [ ] `apps/frontend/src/lib/server/startup/taskEnvironment.test.ts`: the D-13 guard
- [ ] `apps/frontend/src/lib/server/<shutdown module>.test.ts`: the D-16 lines
- [ ] Extend `apps/frontend/src/routes/api/diagnostics/server.test.ts` for the two new names and the secret header's absence
- [ ] `infra/envs/staging/aws/README.md` runbook with "Not yet observed" / "Observations" (D-24)

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | indirectly | Unchanged app auth; OBS-06 proves the link path on the deployed origin |
| V3 Session Management | yes | Pages that set cookies are never cached (`CachingDisabled`; origin sends `private, no-cache, no-store` on auth-cookie responses, per the todo cited by D-09) |
| V4 Access Control | yes | Origin reachable only via CloudFront (prefix list + secret header); task reachable only from the ALB SG; execution role reads one SSM path |
| V5 Input Validation | yes | Client address only from the trusted XFF position; `ORIGIN` pins the CSRF origin |
| V6 Cryptography | yes | ACM certs, TLS 1.2+ on both hops; no hand-rolled crypto |
| V7 Logging | yes | No secret and no visitor address in logs or evidence; the diagnostics route "writes nothing to any log" `[VERIFIED: diagnostics +server.ts TSDoc]` |
| V14 Configuration | yes | Secrets via SSM `secrets`; service-role key absent from the task; `DEPLOYMENT_DIAGNOSTICS` off outside D-06 |

### Known Threat Patterns for this stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Forged `X-Forwarded-For` reaching the container | Spoofing | Depth 2 counted from the right; both origin locks so no one reaches the ALB without CloudFront appending the true viewer |
| Origin bypass via another CloudFront distribution | Spoofing | Secret header rule on the listener (D-05 lock 2) |
| Origin secret disclosure | Information disclosure | `random_password` marked sensitive; the plan role **can** read `pipeline/` state (its deny covers `hand/` and `env:/` only, `[VERIFIED: github-oidc/policies.tf plan_deny]`), so a reader learns only what the prefix list still guards (accepted in D-05); rotate by tainting `random_password` |
| Cached personalised page | Information disclosure | `CachingDisabled` on the default behaviour; D-09 observation |
| Secret in plan/log/evidence | Information disclosure | Values only in one shell session; `put-parameter` run by the operator; evidence by name only |
| Wrong account | Tampering | `AWS_PROFILE=openvaa-admin`, `aws sts get-caller-identity` = `471112560111` before every command, `allowed_account_ids` |
| Destroy reaching long-lived data | Tampering/DoS | Separate roots and state keys; read-only plans of `dns-mail`/`supabase` before and after (D-22); zone `prevent_destroy` |

## Sources

### Primary (HIGH confidence)
- Repository, read this session: `infra/envs/staging/aws/*`, `infra/envs/example/aws/*`, `infra/bootstrap/*`, `infra/modules/{registry,github-oidc,dns-zone,mail-ses}/*`, `infra/README.md`, `infra/envs/staging/supabase/{terraform.tfvars,README.md § Observations}`, `.github/workflows/main.yaml` job `infra-validate`, `scripts/assert-no-inline-iam-policies.mjs` header, `apps/frontend/{Dockerfile,svelte.config.js,src/hooks.server.ts,src/routes/api/{health,diagnostics}/+server.ts,src/lib/server/startup/requiredEnv.ts,src/lib/server/analytics/{config,queue}.ts,src/lib/utils/{constants,logLevel}.ts,src/lib/contexts/app/appContext.svelte.ts,src/lib/api/feedbackWriter.ts}`, `apps/supabase/supabase/migrations/00001_initial_schema.sql` `check_feedback_rate_limit`, `node_modules/@sveltejs/adapter-node@5.5.7/files/{index,handler}.js`, `@sveltejs/kit@2.70.3`
- `hashicorp/aws` 6.68.0 schema dump; provider docs at tag v6.68.0 (`guides/enhanced-region-support`, `r/ecs_service`, `r/sns_topic_subscription`, `r/ecs_task_definition`, `r/acm_certificate_validation`)
- AWS docs: CloudFront managed cache and origin-request policies; custom-origin request behaviour (X-Forwarded-For); CloudFront request headers; custom origin headers; edge locations / prefix list; VPC managed prefix list weights; ECS circuit breaker; ECS deployment events; ECS SSM secrets; ECS task execution role; ECR PutImage errors; ECR tag mutability; ELB rule condition types; Application Auto Scaling target tracking
- AWS public price list API, eu-north-1 (AmazonECS, AWSELB, AmazonVPC, AmazonCloudWatch), published 2026-11-04 to 2026-11-11

### Secondary (MEDIUM confidence)
- [repost.aws: ECS tags for cost tracking / tagging tasks](https://www.repost.aws/knowledge-center/ecs-troubleshoot-tagging-tasks) (propagateTags)
- [AWS ECS task definition states](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-definition-state.html) (INACTIVE persistence, via search result)
- [CloudFront pricing](https://aws.amazon.com/cloudfront/pricing/) (flat-rate plans)

### Tertiary (LOW confidence)
- [oneuptime: circuit breaker blog](https://oneuptime.com/blog/post/2026-02-12-deployment-circuit-breaker-ecs/view) (startup crash counts as failure); [repost: deployment roll back failure](https://repost.aws/knowledge-center/ecs-deployment-roll-back-failure) (not readable, 403)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH. Provider schema read directly; managed policy ids and the prefix-list weight from AWS docs.
- Architecture: HIGH for the proxy chain and locks; MEDIUM for the IAM placement, which awaits a ruling.
- Pitfalls: MEDIUM. Three runtime behaviours (A1–A3) are only settled on the applied stack.
- Cost: MEDIUM. List prices verified; usage counts assumed.

**Research date:** 2026-11-12
**Valid until:** 2026-12-12 (AWS features move monthly; re-check the circuit-breaker provider block and CloudFront pricing)
