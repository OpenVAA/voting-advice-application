# Phase 185: AWS Frontend Stack, First Apply by Hand - Context

**Gathered:** 2026-11-12
**Status:** Ready for planning

<domain>
## Phase Boundary

The frontend runs on AWS at `https://staging.openvaa.org` from `infra/envs/staging/aws`, applied by hand from the
repository. Everything the pipeline (187) will later automate is seen working once: the image push, the first apply,
a failed rollout that rolls back by itself, scaling, the observations of the frontend side (OBS-04, OBS-06, OBS-08,
OBS-10), a destroy that leaves the long-lived roots untouched, and a re-apply.

Closes INFRA-01 to INFRA-14, SUPA-12, OBS-04, OBS-06, OBS-08, OBS-10. Builds toward INFRA-16 (the deployment alert
is built and seen firing here), INFRA-19 (the `example` aws root gets the same wiring), PIPE-05, PIPE-06, PIPE-08,
OBS-09 and RELAY-09 (the WAF's place is fixed here and built in 188).

Not in this phase: the pipeline and the deploy role's widening (187), the smoke entry (186), the relay provider and
the WAF itself (188), the docs rewrite (189), bank authentication (A4), the parent-zone DNS migration.

The source document is `185-DISCUSSION-POINTS.md` (operator returned it 2026-11-12). Unticked decisions take its
★ option. The operator overruled two: A-01 and D-05.

</domain>

<decisions>
## Implementation Decisions

### Carried forward (settled by earlier rulings, not re-asked)
- Public subnets, no NAT gateway; only the load balancer reaches the tasks (D2). Staging runs one task (D1).
- No inline IAM policy anywhere (183 D-08 guard). Registry in `bootstrap`; zone and mail identity in `dns-mail`;
  both survive the destroy (183 D-02). The wiring exists twice, `envs/staging/aws` and `envs/example/aws` (183 D-01).
- The root holds no secret value its plan must read back (183 A-08: the plan role is denied
  `secretsmanager:GetSecretValue` and `kms:Decrypt`).
- Bank authentication excluded (A4); mail is one manual observation (E2); the smoke dataset seeded in 184 is reused
  (E1, 184 D-18). Parent zone `openvaa.org` stays at Cloudflare (183 D-05).
- Every exit status is read on the line after the command, never through a pipe (`infra/README.md`, Rules).

### A — Who runs it, and in what order
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

### B — The CDN and the proxy chain
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

### C — Compute, image and configuration
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

### D — Rollout, scaling, logs, alerts
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

### E — Observations, destroy and cost
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase scope and rulings
- `.planning/workstreams/deployment/ROADMAP.md` § Phase 185 — goal, success criteria, research flag, notes
- `.planning/workstreams/deployment/REQUIREMENTS.md` — INFRA-01..14, INFRA-16, INFRA-19, SUPA-12, OBS-04, OBS-06, OBS-08, OBS-09, OBS-10, RELAY-09
- `.planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-DISCUSSION-POINTS.md` — the filled source of these decisions
- `.planning/workstreams/deployment/v2.17-DISCUSSION-POINTS.md` — milestone rulings A2 (CDN and alerts added), A4, B8, C3, D1, D2, E1, E2
- `.planning/workstreams/deployment/research/SUMMARY.md` § Phase 185, `research/STACK.md`, `research/PITFALLS.md` — the stack and the pitfalls named for 185 (5, 6, 8, 13, 20)
- `.planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-CONTEXT.md` — D-01, D-02, D-05, D-07, D-08, A-08
- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-CONTEXT.md` — D-11, D-18, D-19, D-20, and the post-research amendments
- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/184-VERIFICATION.md` — the persistent project's first mail is still unsent

### Infrastructure on the tree
- `infra/README.md` — roots, state keys, rules of every apply (Roots table and Order to be corrected, D-02)
- `infra/envs/staging/aws/main.tf`, `variables.tf`, `terraform.tfvars` — the empty AWS root
- `infra/envs/example/aws/` — the template root that gets the same wiring
- `infra/modules/registry/main.tf` — immutable-tag ECR, in `bootstrap`
- `infra/modules/dns-zone/`, `infra/envs/staging/dns-mail/` — the delegated zone the records and validations go into
- `infra/modules/github-oidc/policies.tf` — deploy role (state + ECR only) and the plan role's denies
- `infra/bootstrap/outputs.tf` — registry URL and ARN, role names
- `infra/envs/staging/supabase/README.md` — the "Observations" table pattern, and the 2026-11-10 header record (`:1522-1523`)
- `infra/scripts/probe-hosted.mjs` — the conformance probe rerun after the destroy
- `infra/local/check-proxy-topology.sh` — 181's local proxy and SIGTERM checks, the model for the AWS observations

### Application
- `apps/frontend/Dockerfile` — `production` target, exec-form CMD, `BUILD_SHA`
- `apps/frontend/src/routes/api/health/+server.ts` — health endpoint
- `apps/frontend/src/routes/api/diagnostics/+server.ts` — header diagnostics (allow-list extended, D-06)
- `apps/frontend/src/lib/server/startup/requiredEnv.ts` — the start-up check
- `apps/frontend/src/lib/server/analytics/config.ts` — analytics variables and their start-up rules
- `apps/frontend/src/hooks.server.ts` — where the shutdown log line (D-16) may live
- `apps/frontend/svelte.config.js` — `version.name` from `BUILD_SHA`
- `.env.example` § Reverse proxy — `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH`
- `apps/supabase/supabase/migrations/00001_initial_schema.sql:1754-1870` — `behind_cloudflare` and the feedback bucket key

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `aws_ecr_repository.frontend` (bootstrap): immutable tags, scan on push. The root reads its URL through a variable
  or the bootstrap outputs, and creates no registry.
- `/api/health` and `/api/diagnostics`: health gate and header record are ready, apart from the allow-list addition.
- `check-proxy-topology.sh`: the request shapes for the spoof and form-post checks, already seen locally.
- `probe-hosted.mjs`: proves after the destroy that the hosted project was untouched.

### Established Patterns
- A thin root per environment calling `infra/modules/*`; tracked non-secret `terraform.tfvars`; `default_tags`
  `Project/Environment/Root/ManagedBy`; literal backend blocks; `allowed_account_ids`.
- Customer-managed policies only, one per concern (183 D-07/D-08), and `lint:check`'s inline-policy guard.
- Evidence files per plan, dated rows in a README Observations table, exit status read directly.
- All frontend configuration is `$env/dynamic/*`, so one image serves every environment.

### Integration Points
- The delegated zone (`dns-mail`) gets the alias, the origin record and four validation records from this root.
  The zone id is read via a data source by name, so that the destroy leaves the zone.
- The hosted project's URL and anon key enter as non-secret variables; `PUBLIC_PROJECT_ID` is the canonical id.
- 187 inherits the state key, the build script and the task-definition variables; 186 inherits the URL and the
  seeded dataset.

</code_context>

<specifics>
## Specific Ideas

- Every command starts by setting `AWS_PROFILE=openvaa-admin` and checking the account; the default shell
  credentials point to another AWS account.
- The secret parameter path is `/openvaa/staging/frontend/<NAME>`.
- The origin host name is `origin.staging.openvaa.org`.

</specifics>

<deferred>
## Deferred Ideas

- The WAF rate rule on the distribution: phase 188 (RELAY-09), off by default.
- The build-failure alert: phase 187 (INFRA-16).
- A measured cost figure, if 7 days of running do not fit inside the phase: a dated follow-up for 189.

### Reviewed Todos (not folded)
- `2026-10-03-auth-cookie-cache-control-vs-route-setheaders` — only cited in D-09's evidence; no route sets its own cache-control.
- `2026-10-21-migrate-openvaa-org-dns-from-cloudflare-to-route-53` — moves the parent zone and the long-lived `dns-mail` root; it does not belong in the phase that destroys the AWS root on purpose.
- `2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations` — phase 188 (OBS-09).
- The keyword matcher's other hits (answer store, header styling, auth code location, results button, base shades, svelte/motion) — frontend and UI work unrelated to the stack.

</deferred>

---

*Phase: 185-aws-frontend-stack-first-apply-by-hand*
*Context gathered: 2026-11-12*
