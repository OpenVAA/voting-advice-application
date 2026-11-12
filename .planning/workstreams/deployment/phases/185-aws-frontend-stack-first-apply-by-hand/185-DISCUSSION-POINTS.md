# Phase 185 — Discussion points

**Phase:** AWS Frontend Stack, First Apply by Hand (workstream `deployment`)
**Written:** 2026-11-12, from a scout of the tree at `04cc3ce87`
**Closes:** INFRA-01 to INFRA-14, SUPA-12, OBS-04, OBS-06, OBS-08, OBS-10
**Builds toward:** INFRA-16, INFRA-19, PIPE-05, PIPE-06, PIPE-08, OBS-09, RELAY-09

## How to fill this

- Each decision lists its options as checkboxes. Exactly one is marked **★ RECOMMENDED**.
- **If you leave every box in a decision unticked, the ★ option is chosen.** Tick a box only to overrule it.
- Tick one other box to overrule. A `**NOTE:**` or `**EDIT:**` line beats any box.
- **⚠ DECIDE** marks the five decisions that change the shape of the phase: **A-01, B-01, B-02, C-03, D-01**. Read those first.

Not asked here, because a ruling already settles them:

- Public subnets with no NAT gateway, and only the load balancer reaches the tasks (D2).
- Staging runs one task; the production-shaped variables allow more (D1).
- No inline IAM policy anywhere, enforced by the 183 guard (183 D-08).
- The wiring exists twice: `envs/staging/aws` and `envs/example/aws`, the second validated and never applied (183 D-01, A1).
- The registry is in `bootstrap` with immutable tags; the zone and the mail identity are in `dns-mail`. Both must survive the destroy (183 D-02).
- The root may not hold a secret value it must refresh, because the plan role is denied `secretsmanager:GetSecretValue` and `kms:Decrypt` (183 A-08, `infra/modules/github-oidc/policies.tf:109-118`).
- Bank authentication is not part of the deployed test (A4). Mail is one manual observation, not a gate (E2). The smoke dataset was seeded once in 184 (E1, 184 D-18).
- The parent zone `openvaa.org` stays at Cloudflare; `staging.openvaa.org` is delegated to Route 53 (183 D-05).

---

## Factual baseline (re-verified 2026-11-12)

| Claim the phase inherits | On the tree | Evidence |
|---|---|---|
| The AWS root exists | Provider, backend and tags only; it has no resources. Backend key `pipeline/staging/aws/terraform.tfstate` | `infra/envs/staging/aws/main.tf` |
| Who applies `staging/aws` | The README says "the deploy workflow, never by hand". **That contradicts this phase's goal** | `infra/README.md`, Roots table and Order step 5 |
| Deploy role | State access and ECR push only. Phases 185 and 187 add what is seen to be needed | `infra/modules/github-oidc/policies.tf:31-87`, 183 D-07 |
| Health endpoint | `GET /api/health` answers `{status, build}` with `no-store` and makes no Supabase call | `apps/frontend/src/routes/api/health/+server.ts` |
| Start-up check | Refuses to start without `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_PROJECT_ID` or `ORIGIN`, plus the analytics rules | `apps/frontend/src/lib/server/startup/requiredEnv.ts` |
| Configuration is runtime | Every env read is `$env/dynamic/*`, so one image serves any environment | grep over `apps/frontend/src` (17 private, 25 public) |
| Image | `production` target, exec-form `CMD ["node", …]`, port 3000, `BUILD_SHA` build argument | `apps/frontend/Dockerfile` (tail) |
| Proxy variables | `ORIGIN`, `ADDRESS_HEADER`, `XFF_DEPTH` documented and commented out | `.env.example:120-137` |
| Header diagnostics | `GET /api/diagnostics` behind `DEPLOYMENT_DIAGNOSTICS=true`. Its allow-list has no `cloudfront-*` header | `apps/frontend/src/routes/api/diagnostics/+server.ts:6-14` |
| SIGTERM on the server | Nothing in `apps/frontend/src` logs a shutdown. 181 saw it only locally, through `check-proxy-topology.sh --sigterm-only` | grep `SIGTERM` |
| Supabase side of OBS-04 | Recorded 2026-11-10: `cf-connecting-ip` is set by Cloudflare and cannot be chosen by a client; `behind_cloudflare` is true on both projects | `infra/envs/staging/supabase/README.md:1522-1523, 1563` |
| Smoke dataset and first administrator | On the persistent project, 1001 anon-readable nominations; the administrator signs in with a password | same README `:1565-1566` |
| Secret values the staging task needs | Possibly none that is truly secret: the anon key is public, and bank auth (IdP secret) and LLM are off. `ANALYTICS_POSTHOG_KEY` arrives with the relay (188) | `apps/frontend/src/lib/server/analytics/config.ts`, A4 |
| Tooling | Terraform 1.16.5 and Docker 29.7 on an **arm64** host | `terraform version`, `docker version` |
| AWS session | `AWS_PROFILE=openvaa-admin` resolves to account `471112560111`. **The shell's default credentials are a different account** (`173787562496`); `allowed_account_ids` refuses them | `aws sts get-caller-identity`, `infra/envs/staging/aws/main.tf` |

---

## A — Who runs it, and in what order

### A-01 — Who runs the AWS commands ⚠ DECIDE

183 D-10 and 184 said "the operator applies, and the agent holds no credential". You have now signed in to `openvaa-admin` for this phase. This phase has more applies than any phase so far (first apply, the failed rollout, scaling, destroy, re-apply).

- [ ] ★ RECOMMENDED — **The agent runs the commands in your SSO session; you approve each change.** Every command sets `AWS_PROFILE=openvaa-admin` and checks the account first. The agent runs reads, `plan`, image builds and pushes, and HTTP observations freely. Every `apply`, `destroy` and `put-parameter` is a checkpoint: the agent shows the saved plan's summary, you answer "approved", and the agent applies that saved plan file. Secret values are typed by you only (C-03). When the SSO session expires, the agent stops at a checkpoint and asks you to sign in again.
- [ ] As in 183 and 184: the agent writes command blocks and you paste and run every one of them, including plans. This keeps D-10 unchanged, but it means about 40 round-trips, and the observations (request loops during the rollout) depend on what you paste back.
- [x] The agent runs everything, applies included, with no per-apply approval. Fastest, but an unreviewed destroy or replace in this account is not covered by any guard. The only guards are `allowed_account_ids` and the separate roots.

### A-02 — The state key and the "never by hand" line

- [ ] ★ RECOMMENDED — Keep `pipeline/staging/aws/terraform.tfstate`. This phase applies it by hand with administrator rights; phase 187's deploy role takes over the same state, so the pipeline's first run is a no-change plan. Correct the README Roots table and the Order diagram to say "by hand in 185, by the deploy workflow from 187".
- [ ] Apply under a `hand/…` key now, and move the state to `pipeline/…` in 187. That is one more state migration, and the plan role's deny would hide this root from the plan job until then.

### A-03 — The order of the staged apply

The research topic "registry, image, DNS and certificate, compute" was written before the registry moved into `bootstrap`. The zone is in `dns-mail`. So only the image and the AWS root are left to order.

- [ ] ★ RECOMMENDED — **Image first, then one apply.** Build and push the image for a commit; then make one plan and one apply of `staging/aws` with `image_tag` set. The certificate validation waits inside that apply (`aws_acm_certificate_validation`). No `-target`. This is the order phase 187 will automate.
- [ ] Two applies with `-target`: certificates and DNS first, everything else second. Shows each stage separately, but `-target` is a partial plan that the pipeline will never run, so it rehearses something nobody automates.
- [ ] Stage switches as variables (`enable_compute = false`, then `true`). Repeatable, but it adds variables that exist only for a first apply.

---

## B — The CDN and the proxy chain

INFRA-14 was added by A2 after the research, so nothing here was researched. Where the CDN sits changes four other things: the proxy depth (INFRA-06), the certificate region (INFRA-12), the header record (OBS-04) and the WAF scope (RELAY-09).

### B-01 — The shape of the CDN ⚠ DECIDE

- [ ] ★ RECOMMENDED — **CloudFront in front of the whole site, with two behaviours.** `staging.openvaa.org` is an alias to the distribution, and the load balancer is its only origin. `/_app/immutable/*` uses the managed `CachingOptimized` policy. Every other path (pages, form posts, `/api/*`, `/_app/version.json`) uses `CachingDisabled` with an origin request policy that forwards all cookies, query strings and viewer headers except Host. All methods are allowed. The image does not change, and `ORIGIN` stays the public URL.
- [ ] A separate assets host (`assets.staging.openvaa.org`) through `paths.assets`, with HTML served straight from the load balancer. Pages skip one hop, but `paths.assets` is build-time configuration in SvelteKit, so the image would name its environment. That breaks one image for every environment.
- [ ] No CDN in this milestone. This is a scope change: INFRA-14 would be reworded and moved to the future list.

### B-02 — Keeping the load balancer closed to everything but the CDN ⚠ DECIDE

With CloudFront in front, a client that reaches the load balancer directly can send its own `X-Forwarded-For` at the depth the server trusts. That is exactly the spoof INFRA-06 must refuse.

- [ ] ★ RECOMMENDED — **Both locks.** (1) The load balancer's security group admits 443 only from the AWS-managed prefix list `com.amazonaws.global.cloudfront.origin-facing`. (2) CloudFront adds a secret origin header, and the listener's default action is a fixed 403 unless that header matches. The header value is a `random_password` in this root's state. The value guards the origin only, so a state reader learning it is no worse than the open load balancer the prefix list already prevents. Each lock is seen refusing once: a direct request to the load balancer, and a request through it with the header missing.
- [ ] The prefix list only. One lock, no secret, but any CloudFront distribution (someone else's) can reach the origin and pass a forged header chain.
- [ ] The secret header only. The load balancer stays open to the internet and answers 403, and anyone who learns the header can go around the CDN.

### B-03 — Which client-address header the server trusts (INFRA-06, OBS-04)

Viewer → CloudFront → load balancer → task. CloudFront appends the viewer to `X-Forwarded-For`, and the load balancer appends the CloudFront edge.

- [ ] ★ RECOMMENDED — `ADDRESS_HEADER=x-forwarded-for` with `XFF_DEPTH=2`, set **from the recorded headers**. The diagnostics endpoint gets `cloudfront-viewer-address` and `x-amz-cf-id` added to its allow-list. It is switched on for the observation only, called with and without a spoofed `X-Forwarded-For`, and switched off again. The depth goes in once the record shows that the viewer is the second entry from the right.
- [ ] `ADDRESS_HEADER=cloudfront-viewer-address`. It is set by CloudFront alone, but its value is `ip:port`, so the server would need code to strip the port, and the header must be added to the origin request policy.
- [ ] `XFF_DEPTH=1`, the adapter's default. That would take the CloudFront edge as the client, so every viewer behind one edge shares one address.

### B-04 — Certificates and regions (INFRA-03, INFRA-12)

CloudFront accepts certificates only from `us-east-1`.

- [ ] ★ RECOMMENDED — Two ACM certificates, both DNS-validated in the delegated zone. One is in `us-east-1` for `staging.openvaa.org` on the distribution, through a provider alias. The other is in `eu-north-1` for an origin name, `origin.staging.openvaa.org`, on the load balancer, and CloudFront reaches the origin over HTTPS. The README states that every resource is in `eu-north-1` except the CloudFront certificate (and the WAF, if it is ever switched on), and that the Supabase project is in `eu-north-1` too. Redirect HTTP to HTTPS on the viewer side (CloudFront) and on the listener (port 80 → 443).
- [ ] One certificate in `us-east-1`, with CloudFront reaching the load balancer over plain HTTP. One certificate fewer, but traffic from the edge to the origin, cookies included, crosses the internet unencrypted.

### B-05 — Where the WAF variable of RELAY-09 will attach (built in 188)

- [ ] ★ RECOMMENDED — On the distribution (`CLOUDFRONT` scope, `us-east-1`), off by default. A rate rule there keys on the viewer's address with no header parsing. This phase writes only the variable's name and where it belongs into the README, and 188 builds it.
- [ ] On the load balancer (`REGIONAL`). Then the rule must key on a forwarded header, at the depth from B-03.

### B-06 — How "rendered HTML is never cached" is shown

- [ ] ★ RECOMMENDED — Two requests for the same page through the CDN both answer `x-cache: Miss from cloudfront` (or `RefreshHit`), with no `Age` header, while two requests for one `/_app/immutable/*` file show `Hit` on the second. The evidence also records the origin's own `cache-control` on a page that sets an auth cookie, which is `private, no-cache, no-store` (todo `2026-10-03-auth-cookie-cache-control…`). No route-level `setHeaders` is added, so that todo's trap is not triggered.
- [ ] Read the behaviour configuration in the plan and do not observe it. Cheaper, but INFRA-14 is a claim about what the edge serves.

---

## C — Compute, image and configuration

### C-01 — CPU architecture

- [ ] ★ RECOMMENDED — **ARM64 (Graviton) Fargate.** This workstation is arm64, so the image builds natively. Graviton costs about 20 % less per vCPU-hour. Phase 187 can build on GitHub's `ubuntu-24.04-arm` runners, which are free for public repositories (research checks this in 187).
- [ ] X86_64. This matches the default GitHub runner, but every build on this Mac runs under QEMU emulation, which for this monorepo's `yarn build` is many times slower and a known source of flaky builds.

### C-02 — Task size

- [ ] ★ RECOMMENDED — 0.5 vCPU / 1 GB, a variable in both environments. The load check of 188 (OBS-11) can change it on evidence.
- [ ] 0.25 vCPU / 0.5 GB. Cheapest, but the SSR server, the matching and the build-time chunk cache risk running out of memory under the load check.
- [ ] 1 vCPU / 2 GB. Headroom nobody has measured a need for, at twice the cost.

### C-03 — The secret store, and what goes in it (INFRA-05) ⚠ DECIDE

The root may not hold a value that its plan must read back (A-08). Staging's task may not need any truly secret value in this phase.

- [ ] ★ RECOMMENDED — **SSM Parameter Store `SecureString`, created by you outside Terraform.** You run `aws ssm put-parameter` once per value under `/openvaa/staging/frontend/<NAME>`. The root only builds the ARNs as strings and puts them in the task definition's `secrets`. It has no data source, so the plan never decrypts. The execution role may read that path only. The parameters survive the destroy, as the Supabase project does. In this phase the store holds `ANALYTICS_POSTHOG_KEY` with its real value, and `ANALYTICS_PROVIDER` stays `none` until 188 switches it on. A task that starts proves the secret path end to end, because ECS refuses to start a task whose secret cannot be read. Standard parameters cost nothing.
- [ ] Secrets Manager, with the secret's container in the root and its value put by hand. The container goes with the destroy, so it needs `recovery_window_in_days = 0`, and the value has to be put again after every re-apply. It costs 0.40 USD per secret per month.
- [ ] Terraform writes the value, as `value_wo` or a write-only argument. Fewer manual steps, but the provider's read path and the plan role's `kms:Decrypt` deny are untested together, and a wrong guess shows up first in 187's pipeline.

### C-04 — The template that OBS-08 starts from

- [ ] ★ RECOMMENDED — The task's environment comes from one list in the module, with each variable named and described. The `example` root passes stand-in values, and the README lists the same names. OBS-08 is seen when the staging task, started with exactly that list and no other variable, renders a voter page from the smoke dataset. A unit-level guard compares the module's list with `REQUIRED_ENV` and the `.env.example` names, so a new required variable cannot be left out of the stack.
- [ ] Treat `.env.example` as the template and copy its values into `terraform.tfvars` by hand. There is no single list, so the next required variable is likely to be missed in one of three places.

### C-05 — Image tag and build

- [ ] ★ RECOMMENDED — The tag is the full 40-character commit SHA, built only from a clean tree whose `HEAD` is pushed to `origin`, with `BUILD_SHA` set to the same value, for `linux/arm64`. A second push of the same tag is seen refused (`ImageTagAlreadyExistsException`) and recorded. The build-and-push is a committed script, because 187 will run the same steps.
- [ ] The short 12-character SHA. Easier to read, but it can collide in theory, and 186's smoke run compares the served build with a full SHA.

---

## D — Rollout, scaling, logs, alerts

### D-01 — How the rollout is made unhealthy on purpose (INFRA-09) ⚠ DECIDE

- [ ] ★ RECOMMENDED — **A revision whose new tasks fail the start-up check.** One apply uses the current image with `ORIGIN` left out, through a variable that drops it. The new tasks exit with the variable's name in the log, which also shows INFRA-05's "fails and names the variable" on AWS. The deployment circuit breaker rolls back, and the old task keeps serving. A request loop through the public URL runs from before the apply until the rollback completes, and the evidence counts its non-2xx answers (expected zero). Then a normal apply puts the variable back, and Terraform's state matches the service again.
- [ ] A purpose-built image whose health endpoint answers 500. This tests the load balancer's health gate rather than the start-up exit, but it needs a deliberately broken commit and leaves its image in the immutable registry.
- [ ] Point the target group's health-check path at a missing page. **Not recommended:** the health check belongs to the target group and not to the revision, so the old task fails it too, and the result is an outage, not a rollback.

### D-02 — Seeing `SIGTERM` reach the Node process

- [ ] ★ RECOMMENDED — Add one log line to the server on adapter-node's `sveltekit:shutdown` event, naming the signal and how many requests were in flight. The observation is that line in the log store of a task stopped by a rollout, beside ECS's stop reason and exit code 0. The target group's deregistration delay is set to 30 s and the container's `stopTimeout` to 30 s, so draining has time.
- [ ] No code change: infer it from exit code 0 and the stop time. Weaker, because exit code 0 is also what a process killed before its handler runs can show, depending on how it exits.

### D-03 — The deployment alert (builds toward INFRA-16)

- [ ] ★ RECOMMENDED — Build it here. An EventBridge rule on ECS deployment state changes `SERVICE_DEPLOYMENT_FAILED` sends to an SNS topic with your address as an email subscription, and D-01's rollback is the time it is seen firing. You confirm the subscription mail once. The build-failure alert stays in 187.
- [ ] Leave it to 187, which then stages a failed rollout of its own to see it fire, as the roadmap note allows.

### D-04 — Scaling (INFRA-07)

- [ ] ★ RECOMMENDED — Floor 1 and ceiling 2 for staging, as variables. Target tracking holds CPU at 60 %. A scheduled action raises the floor to 2 at a set time and a second one lowers it again. One pair is applied with times a few minutes ahead, the task count is seen going to 2 and back, and then the pair is removed or set to a time in the past.
- [ ] Ceiling 3. Nothing measured asks for it before 188's load check.
- [ ] Only the scheduled action, with no target tracking. This leaves "scales between a floor and a ceiling" unshown.

### D-05 — Log retention (INFRA-08)

- [ ] ★ RECOMMENDED — 30 days, a variable. The group goes with the destroy, so the logs that are evidence (D-01, D-02) are copied into `185-*/evidence/` before the destroy runs.
- [ ] 14 days. Cheaper, but a gap of two weeks between phases loses the record.
- [x] 90 days. No need yet.

---

## E — Observations, destroy and cost

### E-01 — OBS-10, the feedback limit buckets by client

- [ ] ★ RECOMMENDED — Two clients on different networks (this workstation and a phone off Wi-Fi) each send feedback through `https://staging.openvaa.org` until one is limited. The other is still admitted. Research first confirms which writer the deployed app uses for feedback: the browser straight to Supabase (`supabaseFeedbackWriter.ts`), where `cf-connecting-ip` is the viewer; or a server route, where every voter would share the task's address. The second is a finding to fix in this phase.
- [ ] Read the trigger's bucket key from the database for two requests, and send no real feedback. Less noise in the data, but it does not show the deployed path.

### E-02 — OBS-06, one invitation mail

- [ ] ★ RECOMMENDED — The first administrator, signed in at `https://staging.openvaa.org`, invites a candidate at a second address of yours (a plus-address works). You read the mail and check that the link's origin is the staging URL, and follow it. The recipient is signed in. The address is recorded as "operator's second mailbox", never written out, and the invitation is removed afterwards.
- [ ] Ask for a sign-in link for the first administrator through `account-access`. That is simpler, but it is not an invitation, which is what OBS-06 names.

### E-03 — The destroy and the re-apply (INFRA-10, SUPA-12)

- [ ] ★ RECOMMENDED — Before the destroy: the evidence logs are copied, and the plans of `dns-mail` and `supabase` are both empty. Then one `terraform destroy` of `staging/aws` exits 0, and no resource tagged `Root=aws` is left (Resource Groups Tagging API). After it: both plans are still empty, the 184 conformance probe is green against the persistent project, the registry still holds the image, and the SSM parameters are still there. Then the stack is applied again from the same commit and serves.
- [ ] Destroy, and re-apply at the end of the phase only, without the before-and-after plans. This leaves "leaves the hosted project untouched" asserted, not seen.

### E-04 — The monthly estimate (INFRA-13)

- [ ] ★ RECOMMENDED — Activate `Project`, `Environment` and `Root` as cost-allocation tags in the Billing console at the first apply (your step). After at least 7 full days of the stack running, read Cost Explorer filtered by `Root=aws` and scale it to a month. Cross-check against a priced inventory of the applied resources. Expect roughly 40 to 60 USD a month (load balancer, two public IPv4 addresses, one ARM task, CloudFront, logs); this is an estimate until measured. If 7 days do not fit in the phase, the measured figure is a dated follow-up for 189.
- [ ] A priced inventory only. Ready at once, but INFRA-13 says "measured on the applied stack".

### E-05 — Where the runbook and the observations live

- [ ] ★ RECOMMENDED — A new `infra/envs/staging/aws/README.md` runbook. It has a "Not yet observed" table and an "Observations" table, as the supabase root's README does (184 D-20), and rows move from one table to the other. Raw evidence goes in `185-*/evidence/185-NN-*.md`. Phase 189 writes the user docs from the table.
- [ ] Observations in the phase directory only. Then 189 has to dig them out of the plans' evidence.

### E-06 — Pending todos

- [ ] ★ RECOMMENDED — Fold none. `2026-10-03-auth-cookie-cache-control…` is only cited in B-06's evidence. `2026-10-21-migrate-openvaa-org-dns-from-cloudflare-to-route-53` stays separate, because it moves the parent zone, not this stack. `2026-10-07-174-no-per-caller-limit…` is 188's (OBS-09). The keyword matcher's other hits are frontend and UI work.
- [ ] Fold the DNS migration: it would remove the Cloudflare step for future subdomains, but it changes a long-lived root (`dns-mail`) in the same phase that destroys the AWS root on purpose.

---

## Fill status

| Section | Decisions | ⚠ |
|---|---|---|
| A Who and order | 3 | 1 |
| B CDN and proxy chain | 6 | 2 |
| C Compute, image, configuration | 5 | 1 |
| D Rollout, scaling, logs, alerts | 5 | 1 |
| E Observations, destroy, cost | 6 | 0 |
| **Total** | **25** | **5** |
