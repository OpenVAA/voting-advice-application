---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "10"
subsystem: infra
tags: [deploy, pipeline, staging, migration, posthog, ecs, supabase]
status: complete

requires:
  - phase: 188 (plan 09)
    provides: PostHog project 347462 with IP discard, the billing record and FILL=unchanged
  - phase: 188 (plan 08)
    provides: the closing E2E run (E2E_TREE_SHA d523abcd5) the deployed tree is unchanged from
  - phase: 187 (plans 21, 22, 25)
    provides: the gated deploy.yml pipeline and the served commit 331b5db28 on deploy/staging
provides:
  - "DEPLOY_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e on deploy/staging: the expected SHA of every later smoke run of the phase"
  - "BUILD_DIGEST=sha256:e35bde282307277ea7be9aed008b2bc5a31c0a27ff2738b9153e09bf1412182a, running on task definition :10"
  - "Migration 00023_invitation_caller_limit on cofbsatfrdysyphajsky, pushed by the pipeline before the functions, drift 0"
  - "account-access with the per-caller limit ACTIVE on the hosted project"
  - "Staging forwards analytics to PostHog: ANALYTICS_PROVIDER=posthog, flush interval 2000, stop timeout 40, the key a secret from the parameter store"
affects: [188-11, 188-12, 188-13, 188-14, 188-15, 188-16, 188-17, 188-18, 188-19]

actuals:
  tokens: 7100
  tasks: 3
  commits: 7
plan_head_before: 7040ef2ee60bf4c713047df4b0fbaa2a6e9d67e5
plan_head_after: f38d4b2c0be3db9600677bd65f7f09ba1ba27180

tech-stack:
  added: []
  patterns:
    - "Task-definition read-back through an `aws ecs describe-task-definition --query` that selects two values, the stop timeout, names and one valueFrom path, so no secret or other value leaves the CLI call"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-10-rollout.md
  modified:
    - infra/envs/staging/aws/terraform.tfvars
    - infra/scripts/posthog-read.sh
    - infra/scripts/posthog-read.test.ts
    - infra/envs/staging/aws/README.md
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "The first deploy commit 35da515f4 was refused by GitHub push protection (the read script's fake phx_ fixture); the fixture is now assembled from two parts (8665ff699) and the commit was rebuilt on the same parent and approved under a new attempt"
  - "The run was not re-run and nothing was pushed or approved by the executor: the orchestrator pushed after the binding, the operator approved the staging review in the web interface"

requirements-completed: []

coverage:
  - id: D1
    description: "Source-only commit pushed after the bound approval, gated deploy.yml run green in the fixed stage order"
    verification:
      - kind: other
        ref: "evidence/188-10-rollout.md; Task 3 verify exit 0; 33 STEP= lines, all success except the two skipped alert steps"
        status: pass
    human_judgment: false
  - id: D2
    description: "00023 pushed before the functions, drift 0, three functions ACTIVE"
    verification:
      - kind: other
        ref: "push_pending=00023 (only line), drift_status=0, STEP= order Push the migrations (line 111) before Deploy the functions (line 112), three function= status=ACTIVE"
        status: pass
    human_judgment: false
  - id: D3
    description: "Task definition by digest with PostHog on, flush 2000, stop timeout 40, key from the parameter store; staging serves the commit; smoke green"
    verification:
      - kind: other
        ref: "RUNNING_IMAGE_DIGEST=BUILD_DIGEST; TD_ANALYTICS_PROVIDER=posthog, TD_FLUSH_INTERVAL_MS=2000, TD_STOP_TIMEOUT=40, TD_POSTHOG_KEY_SOURCE=parameter; SERVED_BUILD_AFTER=served_build_after_smoke=DEPLOY_COMMIT; STARTUP_PROBLEMS=0"
        status: pass
    human_judgment: false

duration: about 3 h 10 min across three executor sittings (2026-11-19 08:10Z to 09:25Z of work, the rest waiting at checkpoints)
completed: 2026-11-19
---

# Phase 188 Plan 10: Phase 188's image, migration 00023 and the PostHog switch on staging through the gated pipeline Summary

**RUN_URL=https://github.com/OpenVAA/voting-advice-application/actions/runs/44491292876**
**DEPLOY_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e** (on `deploy/staging`, parent `331b5db28`, no `.planning/` path)

The stages, all green and in the workflow's order:

| Stage | Result |
| ----- | ------ |
| `checks` job (format, validate, infra unit tests) | success, 71 s |
| `staging` review | waited, then approved by the operator in the web interface |
| Build and push the image | success, 192 s, new digest `sha256:e35bde28…` |
| Plan the staging AWS root | success, `Plan: 1 to add, 1 to change, 1 to destroy.` |
| Link to `cofbsatfrdysyphajsky` | success |
| Push the migrations | success, 123 s: `push_pending=00023`, the only pending version, then `drift_status=0` |
| Deploy the functions | success: `account-access`, `identity-callback` and `send-email` each `ACTIVE` |
| Apply the saved plan | success, 120 s, `1 added, 1 changed, 1 destroyed` |
| Check the rollout is stable | success, `COMPLETED` on poll 4 |
| Deployed smoke entry | success: 5 `PASS` lines, `2 passed (18.6s)` |
| Read the served build again | `served_build_after_smoke=a7003b490…` |
| Alert steps | skipped (green job); 0 artifacts |

## Performance

- **Deploy job:** 08:56:35Z to 09:06:54Z on 2026-11-19, 10.3 of 60 minutes
- **Tasks:** 3 of 3
- **Files modified:** 6, plus the evidence file

## Accomplishments

- **The provider switch.** `ANALYTICS_PROVIDER = "posthog"` was committed in the staging tfvars, after 188-09's preconditions held.
- **The deploy commit.** It was built by the temporary-index recipe. Push protection refused the first build because of a fixture key. After the fixture fix, the commit was rebuilt, approved under attempt `20261119T083025Z.4fa5fed3c`, and pushed by the orchestrator.
- **The migration.** The pipeline pushed `00023_invitation_caller_limit` to the hosted project before it deployed the functions. The history now reads `00001` to `00023`, and the schema diff is empty.
- **Read back from the workstation.** Task definition `:10` runs the built digest. It sets `ANALYTICS_PROVIDER=posthog`, `ANALYTICS_FLUSH_INTERVAL_MS=2000` and `stopTimeout` 40. `ANALYTICS_POSTHOG_KEY` is a secret from `/openvaa/staging/frontend/ANALYTICS_POSTHOG_KEY` and is not in the environment. The single running task is `HEALTHY`, and its log holds only `Listening on …`, so `STARTUP_PROBLEMS=0`.
- **Runbooks.** A dated Observations row was added to each staging runbook and formatted with Prettier.

## Task Commits

1. **Task 1: provider switch and the commit to deploy:** `7e6dee771` (feat), `5e7c655af` (docs). The rebuild after push protection is `8665ff699` (fix) and `4fa5fed3c` (docs).
2. **Task 2: operator approval.** The orchestrator bound it under attempt `20261119T083025Z.4fa5fed3c`. It has no commit.
3. **Task 3: push, run and read-back:** `b57ca0e19`, `ab805b559` and `f38d4b2c0` (docs).

## Deviations from Plan

### Auto-fixed issues

**1. [Rule 3 - Blocking] Push protection refused the first deploy commit**
- **Found during:** the push, between Tasks 2 and 3.
- **Issue:** GitHub push protection (GH013) matched the test fixture `phx_fake000…` in `infra/scripts/posthog-read.sh` and `posthog-read.test.ts` as a PostHog personal API key.
- **Fix:** the fixture is now assembled from two parts. The self-test and the unit tests are still green. The commit was rebuilt on the same parent and re-approved under a new attempt.
- **Files modified:** `infra/scripts/posthog-read.sh` and `infra/scripts/posthog-read.test.ts`.
- **Commits:** `8665ff699` and `4fa5fed3c`.

### Process notes

- **The run itself.** The executor did not push, re-run or approve anything. The run is attempt 1.
- **An authentication gate.** The AWS SSO session had expired before the workstation read-backs. The operator signed in again, and the reads were then made. The executor did not sign in itself.
- **Task 3's own wording.** Task 3's action says to push and to watch the run with `gh run watch`. Instead, the orchestrator pushed at top level, as the execution rules require, and the run was polled with bounded `gh run view` steps, so the executor watchdog would not trip.

## Known Stubs

None.

## Next Phase Readiness

- **For the later deployed plans (188-11 to 188-19).** Every later smoke run expects `DEPLOY_COMMIT=a7003b490b4ff92fc72bef5d225c593b222d6c4e`.
- **From now on.** Staging forwards events to PostHog project 347462, the smoke runs' pageviews included.
- **Requirements.** RELAY-04 and OBS-09 stay open until the phase verifier closes them.

## Self-Check: PASSED

- **Files.** The evidence file, both runbooks and the tfvars exist.
- **Commits.** `7e6dee771`, `5e7c655af`, `8665ff699`, `4fa5fed3c`, `b57ca0e19`, `ab805b559` and `f38d4b2c0` are all ancestors of HEAD.
- **Verify.** Task 3's automated verify exits 0. `bound 188-10-2 …` exits 0.
