---
phase: 185-aws-frontend-stack-first-apply-by-hand
verified: 2026-11-14T19:35:00Z
status: passed
score: 5/5 must-haves verified
covered_files:
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-01-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-01-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-02-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-02-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-03-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-03-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-04-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-04-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-05-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-05-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-06-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-06-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-07-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-07-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-08-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-08-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-09-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-09-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-10-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-10-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-11-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-11-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-12-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-12-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-13-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-13-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-14-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-14-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-15-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-15-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-16-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-16-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-17-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-17-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-18-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-18-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-19-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-19-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-20-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-20-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-21-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-21-SUMMARY.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-22-PLAN.md
  - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-22-SUMMARY.md
  - apps/frontend/src/hooks.server.ts
  - apps/frontend/src/lib/server/shutdown/shutdownLog.ts
  - apps/frontend/src/routes/api/diagnostics/+server.ts
  - apps/frontend/src/routes/api/health/+server.ts
  - infra/envs/example/aws/main.tf
  - infra/envs/staging/aws/README.md
  - infra/envs/staging/aws/main.tf
  - infra/envs/staging/aws/outputs.tf
  - infra/envs/staging/aws/terraform.tfvars
  - infra/envs/staging/aws/variables.tf
  - infra/modules/frontend-service/alerts.tf
  - infra/modules/frontend-service/edge.tf
  - infra/modules/frontend-service/main.tf
  - infra/modules/frontend-service/origin.tf
  - infra/modules/frontend-service/outputs.tf
  - infra/modules/frontend-service/scaling.tf
  - infra/modules/frontend-service/service.tf
  - infra/modules/frontend-service/task-environment.json
  - infra/modules/frontend-service/variables.tf
  - infra/modules/frontend-task-role/main.tf
  - infra/scripts/build-push-image.sh
  - infra/scripts/request-loop.sh
covered_digest: "v4:sha256:5ab09697fabadeb1dfe99e8768e55f839c254a008c25b207902335249a58067a"
behavior_unverified: 0
overrides_applied: 1
overrides:
  - must_have: "Roadmap success criterion 5, cost clause: a monthly estimate measured on the applied stack is recorded (INFRA-13)"
    reason: "The measured figure needs seven full UTC days of Root-tagged Cost Explorer data and the first full day of the window is 2026-11-15, so no measurement could exist at close. The phase records the priced inventory (50.78 USD/month at list price, labelled an inventory) and a dated todo for phase 189 (readable from 2026-11-23). INFRA-13 is PARTIAL and stays Pending in REQUIREMENTS.md."
    accepted_by: "operator (185-22, key 185-22-2, attempt 20261114T184916Z.86218573f, COST_RULING=follow-up)"
    accepted_at: "2026-11-14T00:00:00Z"
human_verification: []
---

# Phase 185: AWS Frontend Stack, First Apply by Hand Verification Report

**Phase Goal:** The frontend runs on AWS at `https://staging.openvaa.org`, applied by hand from the repository in stages, and everything the pipeline will later automate has been seen working once, a failed rollout and a teardown included.
**Verified:** 2026-11-14T19:35:00Z
**Status:** passed (one operator-ruled override, INFRA-13 partial, open code-review warnings)
**Re-verification:** No, initial verification

## Goal Achievement

The goal is achieved. The stack is live now: a read of `https://staging.openvaa.org/api/health` at 19:30Z returned HTTP 200, `build` equal to the tag `712947a1bd44a735f66ee8f51610f4748d76cd30`, `x-cache: Miss from cloudfront`, and `http://staging.openvaa.org/` returned 301 to the HTTPS origin. The evidence files are detailed, record exit statuses and read back from AWS, and the SUMMARY claims I compared against them agree with them.

### Observable Truths (roadmap success criteria)

| # | Truth | Status | Evidence |
| - | ----- | ------ | -------- |
| 1 | Served from an image under a commit-named tag; second push refused; HTTP redirects to HTTPS; DNS-validated certificate; Fargate behind an ALB in two AZs as explicit Terraform; task floor a variable; public subnets, no NAT; tasks accept only the load balancer; `eu-north-1` with the Supabase region stated | VERIFIED | `185-12` (tag = `BUILD_SHA` = pushed commit = `/api/health` build; `SECOND_PUSH_EXIT=1`, ECR "tag is immutable", digest unchanged, `IMMUTABLE` repository), `185-14` (both ACM certs `DNS:SUCCESS`, 301, chain verifies, `NAT_GATEWAYS=0`, `TASK_SG_INGRESS=1 from=load-balancer-sg`, direct task and ALB requests no answer), `terraform.tfvars` (`task_floor = 1`, `aws_region = "eu-north-1"`), `infra/README.md` line 74 states the Supabase project is in `eu-north-1` |
| 2 | Env plus secrets from the parameter store with `PUBLIC_PROJECT_ID`, no service-role key; template variables alone read from Supabase; health check with grace period; a form post succeeds; a spoofed forwarded address is not taken; header depth set from the record; feedback limit buckets by client | VERIFIED | `185-14` (task env names equal `task-environment.json`, 16 names; page carries `data-project-id`; 5 SSR Supabase reads; rendered first statement seen; `GRACE_PERIOD=60`, `/api/health`, healthy; form post with foreign origin 403, with the public origin passes the origin check), `185-15` (`DEPTH_VERDICT=2-confirmed`, spoof entry stays first of 3, resolved client is the viewer, both ALB locks 403/403/200), `185-18` (admin sign-in form post through CloudFront 303; OBS-10: 5 admitted, 6th refused `P0001`, phone admitted in the same window, workstation still refused). `task-environment.json` has 0 `SERVICE_ROLE` names. `taskEnvironment.test.ts` passes (re-run by me). |
| 3 | Bad rollout rolls back by itself while requests complete; SIGTERM reaches Node; count between floor and ceiling; scheduled action raises floor; logs retained; CDN caches immutable assets and never pages | VERIFIED | `185-16` (circuit breaker, `FAILED_TASKS=3`, rollback, old target healthy in 13 of 13 reads, loop 692 requests `non_2xx=0`, `SERVICE_DEPLOYMENT_FAILED` mail arrived, start-up line names `ORIGIN`), `185-16`/`185-17` (three SIGTERM records in the stopping task's stream), `185-17` (raise at 15:40Z, lower at 15:50Z, `MAX_RUNNING_SEEN=2`, `BELOW_FLOOR_SEEN=no`), `185-14` (`LOG_RETENTION_DAYS=90`; page `Miss` twice with no `Age`, immutable asset `Hit` on the second read, `max-age=31536000,immutable`) |
| 4 | One invitation mail through real SMTP arrives with the staging origin and the link signs in; recorded with its date | VERIFIED | `185-18`: mail arrived 2026-11-14 08:55Z, link origin `https://staging.openvaa.org`, path `/en/api/auth/callback`, following it signed the recipient in (landed on set-password). Manual observation by the operator, as ROADMAP defines OBS-06. |
| 5 | State remote and locked, own variables and outputs; destroy once on purpose removes the stack cleanly and leaves the hosted project untouched; the stack applied again; every resource carries the cost tags; a monthly estimate measured on the applied stack is recorded | VERIFIED for the first four clauses; PASSED (override) for the measured estimate | `185-14` (state `AES256`, versioned, second concurrent plan refused with the lock error; 26 of 26 taggable resources carry `Project`, `Environment`, `Root`, `ManagedBy`), `185-19` (40 of 40 destroyed, state empty; image, both parameters, zone, role survive; `dns-mail` plan empty), `185-20` (`supabase` plan "No changes" after the destroy, probe 22 PASS and no FAIL; single re-apply `40 added`, `REAPPLY_EXIT=0`, second plan clean, health build matches). Cost: priced inventory only, see the override and INFRA-13 below. |

**Score:** 5/5 truths verified, one of them with the operator's cost-clause override.

### Operator-ruled facts and overrides (judged as rulings)

1. **185-13 fix-and-reapply.** The first apply stopped at 39 of 40 on an EC2 description character. That is a defect found by the first real apply, fixed with an offline test (`descriptions_use_the_ec2_character_set`, `Success! 33 passed`), and the single from-nothing apply was then shown in 185-20 (`Plan: 40 to add`, `Apply complete! 40 added`, `REAPPLY_EXIT=0`, second plan `No changes`). Accepted as a ruling. Not a failure.
2. **185-19 sweep residue.** The Tagging API still lists the `INACTIVE` ECS cluster and service after the destroy. They cannot be deleted further. The operator accepted them (`RULING_SWEEP_RESIDUE`). Every real resource is gone, and they are `ACTIVE` again since the re-apply. Accepted as a ruling. INFRA-10 "destroyed cleanly" is read with that classified residue.
3. **185-22 cost follow-up.** See the override and INFRA-13 below.
4. **Regression.** 185-21 recorded lint, format and unit all exit 0 and a non-void E2E run of 548 of 548 on `e7dc9b721`. Since then only `infra/envs/staging/aws/README.md` changed outside `.planning/` (`git diff --stat 5df4aac85..HEAD -- . ':!.planning'`: one file, 12 insertions, 4 deletions), so the evidence still covers the code. I re-ran `taskEnvironment`, `shutdownLog`, `diagnostics` and `health` specs (49 passed) and `yarn test:unit:infra` (102 passed).

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `infra/modules/frontend-service/{main,origin,edge,service,scaling,alerts,variables,outputs}.tf`, `task-environment.json` | the module | VERIFIED | explicit resources, 33 `terraform test` runs recorded in 185-13/185-10; applied for real twice |
| `infra/modules/frontend-task-role/main.tf` | execution role, parameter read | VERIFIED (see WR-02) | role exists on AWS (`185-19` `ROLE_SURVIVES=yes`) |
| `infra/envs/staging/aws/{main,variables,outputs}.tf`, `terraform.tfvars`, `README.md` | root, inputs, runbook | VERIFIED | literal S3 backend with `use_lockfile = true`, key `pipeline/staging/aws/terraform.tfstate`; `.terraform.lock.hcl` tracked |
| `infra/envs/example/aws/` | example root with stand-ins | VERIFIED | present; belongs to INFRA-19 (phase 187), built toward only |
| `infra/scripts/build-push-image.sh`, `request-loop.sh` and their tests | image script, request loop | VERIFIED with CR-01 | tests pass (102 in the infra suite) |
| `apps/frontend/src/routes/api/{health,diagnostics}/+server.ts`, `lib/server/shutdown/shutdownLog.ts`, `hooks.server.ts` | health, allow-listed diagnostics, shutdown record | VERIFIED | 49 unit tests pass; the stop line was read from three hosted streams |
| `infra/envs/staging/supabase` and `infra/modules/supabase/main.tf` | long-lived Supabase root, `prevent_destroy`, separate state key | VERIFIED | `prevent_destroy = true` at line 31; key `hand/staging/supabase/terraform.tfstate`, separate from the AWS key |

### Requirements Coverage

All 19 IDs appear in plan frontmatter (union of the 22 plans) and in REQUIREMENTS.md mapped to Phase 185. No orphaned requirement.

| Requirement | Status | Evidence |
| ----------- | ------ | -------- |
| INFRA-01 | SATISFIED for the pushed image, with CR-01 warning | `185-12`: immutable tags, second push refused, tag = commit. The script's own "refuses every tree for which the tag would not name the commit" guarantee does not hold for gitignored files (CR-01). The image actually pushed was built from a fresh detached worktree, so its tag does name its commit. |
| INFRA-02 | SATISFIED | Fargate service, ALB, two subnets, floor variable, 185-13/14/20 |
| INFRA-03 | SATISFIED | 185-14 certs, 301, chain |
| INFRA-04 | SATISFIED | `/api/health` target health, 60 s grace, 185-14/16 |
| INFRA-05 | SATISFIED | 16-name list guard, no service-role, start-up failure naming `ORIGIN` seen in the hosted log (185-16) |
| INFRA-06 | SATISFIED | `ORIGIN`, `XFF_DEPTH=2`, spoof test (185-15), 403 on foreign-origin post, admin sign-in 303 |
| INFRA-07 | SATISFIED | 185-17 |
| INFRA-08 | SATISFIED | log group, 90 days, streams per task |
| INFRA-09 | SATISFIED | 185-16 rollback; SIGTERM seen three times. No hosted stop had a request in flight (`inFlightAtSignal=0` each time); drain-with-traffic rests on the 692-request loop with zero non-2xx across a rollout and a restore. |
| INFRA-10 | SATISFIED, with the ruled sweep residue | remote locked state, destroy 40 of 40, re-apply |
| INFRA-11 | SATISFIED | direct requests no answer, one ingress rule per group, no NAT |
| INFRA-12 | SATISFIED | `eu-north-1`; the Supabase project's region is stated in `infra/README.md` (not in the AWS root's own README) |
| INFRA-13 | PARTIAL | Tags: satisfied (26 of 26, cost-allocation tags `Active`). Measured monthly estimate: NOT measured. Only a priced inventory of 50.78 USD/month at list price exists, with several upper-bound lines. Deferred by the operator to a dated todo for phase 189, earliest read 2026-11-23. Keep INFRA-13 Pending. |
| INFRA-14 | SATISFIED | 185-14 item 6 and the 185-18 `private, no-store` cookie response not cached |
| SUPA-12 | SATISFIED | `prevent_destroy`, separate state key, `supabase` plan "No changes" and probe PASS after the destroy |
| OBS-04 | SATISFIED | 185-15 header record, 7 allow-listed headers recorded; the Edge Function and PostgREST sides were recorded in phase 184 |
| OBS-06 | SATISFIED | 185-18 |
| OBS-08 | SATISFIED | 185-14 / 185-20 |
| OBS-10 | SATISFIED, inferred from behaviour | 185-18; "behind_cloudflare set as deployed" is read from the two-network bucket behaviour, not from a settings read in this phase (the probe's `auth.other-settings` and the phase-184 record cover the setting) |

### Anti-Patterns and Code Review (185-REVIEW.md, advisory; all dispositions still `open`)

| Finding | Severity | My check | Effect on this verdict |
| ------- | -------- | -------- | ---------------------- |
| CR-01 image build context includes gitignored files | critical in the review | CONFIRMED: `build-push-image.sh` line 178 uses `git status --porcelain --untracked-files=all` (ignored files are not listed), the build runs in the live tree, `.dockerignore` excludes only `node_modules`, `build`, `.env*`, `infra`, and the Dockerfile copies `apps` and `packages`. | WARNING, not a blocker: the only pushed image came from a clean detached worktree of a source-only commit (185-12), so the observed tag does name its commit. The script's header promise is overstated. Fix before phase 187 builds from a runner or an operator runs it from a working checkout (`git archive` context, or refuse on ignored files, plus a self-test). |
| WR-01 no HSTS | warning | CONFIRMED: no `strict_transport` or `response_headers_policy` in the module | not in a requirement of this phase; warn |
| WR-02 execution role uses the wildcard managed policy, no confused-deputy condition | warning | CONFIRMED (`AmazonECSTaskExecutionRolePolicy` attached) | INFRA-11 asks for least-privilege roles; the roles are scoped on the parameter read and nothing broader is granted beyond the AWS-managed policy, and the inline-IAM guard passes. Warn. |
| WR-03 module test step has no lock file | warning | CONFIRMED: no `.terraform.lock.hcl` under `infra/modules` | warn, CI hardening |
| WR-04 to WR-06, IN-01 to IN-12 | warning / info | not individually re-verified | none blocks a truth |
| `deferred-items.md` | info | multi-line log record, and the form-post check posts to a page with no action | recorded by the phase, no gap |

A grep for `TBD`, `FIXME` and `XXX` over the changed frontend, module, root and script files found none. No stub patterns found in the artifacts I read.

### Human Verification Required

None. The operator-only observations (the alert mail, the invitation mail and the phone insert) are recorded with attempt ids and dates.

### Gaps Summary

No blocking gap. Three things the next step must carry:

1. **INFRA-13 is partial.** Do not tick it complete. The measured figure is the dated todo `.planning/todos/pending/2026-11-14-measure-the-staging-aws-stack-monthly-cost.md` for phase 189 (readable from 2026-11-23). Phase 189's own success criteria do not name this measurement, so the closure of that phase should list the todo explicitly, or the window will be forgotten (and it restarts if the stack is destroyed or re-applied first).
2. **CR-01 should be fixed (or consciously dispositioned) before phase 187 automates the build.**
3. **Review dispositions are all `open`.** Triage them (fix, skip or defer) so WR-01 to WR-03 do not carry into phases 187 and 188 unrecorded.

---

_Verified: 2026-11-14T19:35:00Z_
_Verifier: Claude (gsd-verifier)_
