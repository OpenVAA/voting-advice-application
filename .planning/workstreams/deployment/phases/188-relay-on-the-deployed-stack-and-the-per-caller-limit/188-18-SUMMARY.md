---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "18"
subsystem: infra
tags: [k6, load-test, capacity, staging, OBS-11]
status: complete

requires:
  - phase: 188-07
    provides: "load-check.sh, voter-journey.js, figure.mjs, journey-from-trace.mjs and the method README"
  - phase: 188-09
    provides: "SUPABASE_PLAN=pro, SUPABASE_STEP_CAP=40, SUPABASE_NOTICE_NEEDED=no"
  - phase: 188-17
    provides: "staging restored to its tfvars (:20, posthog, no web ACL), a plan with nothing set reading No changes."
provides:
  - "OBS-11's recorded capacity figure: 40 voter journeys a minute (a lower bound, bound none-reached), 2026-11-19, build a7003b490, 1 task at 44.86 % CPU"
  - "infra/scripts/load-check/staging-journey.json: one recorded staging voter journey, 77 requests, no header, cookie or key"
  - "evidence/188-18-load-summary.json: the k6 summary of the run"
  - "A dated Observations row in infra/envs/staging/aws/README.md linking the method"
affects: [189]

actuals:
  tokens: 19850
  tasks: 3
  commits: 5
plan_head_before: 2b35710a7c4cb5cf15eab38a1bebe466e5afe990
plan_head_after: 65dd017e40e3a70075fd95295c0723f412cfd908

tech-stack:
  added: []
  patterns:
    - "An observe-only k6 threshold (a bound no step reaches) keeps a tagged sub-metric in the summary without changing which steps are met"
    - "A Playwright 1.63 trace keeps a POST body as postData._file beside an empty text; read the resource first"

key-files:
  created:
    - infra/scripts/load-check/staging-journey.json
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-18-load-check.md
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-18-load-summary.json
  modified:
    - infra/scripts/load-check/journey-from-trace.mjs
    - infra/scripts/load-check/voter-journey.js
    - infra/scripts/load-check.test.ts
    - infra/envs/staging/aws/README.md

key-decisions:
  - "The capacity figure is 40 journeys a minute and is a lower bound: every step met every threshold, so LOAD_BOUND=none-reached and 40 is the step cap from the hosted project's plan, not a capacity reached"
  - "The figure rests on a pageview-only journey (trackEvents=false, set by the operator); a deployment with trackEvents on carries more relay load per journey"
  - "The data requests' per-step p95 is kept in the summary by an observe-only threshold, so the bound rule can tell a slower Supabase project from a busy task"

requirements-completed: []

coverage:
  - id: D1
    description: "One voter journey recorded on staging and committed with methods, URLs and RPC bodies only"
    requirement: OBS-11
    verification:
      - kind: other
        ref: "evidence/188-18-load-check.md Task 1; plan Task 1 verify with its node check applied to .requests, exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The stepped run with provider log yields a dated figure with its commit, task count, task CPU and bound; the generator's CPU and network recorded per step"
    requirement: OBS-11
    verification:
      - kind: other
        ref: "plan Task 3 verify, exit 0; evidence/188-18-load-check.md sitting three"
        status: pass
    human_judgment: true
    rationale: "Whether a lower bound at the step cap is an adequate capacity figure for OBS-11 is the phase verifier's judgment"
  - id: D3
    description: "The stack restored by a plain hand apply, read back, a plan after it reads No changes., the smoke run green after each rollout"
    verification:
      - kind: other
        ref: "RESTORE_* lines; tests/e2e-runs/188-18-obs-20261119T173229Z and 188-18-restore-20261119T180406Z, VERDICT OK 2 tests each"
        status: pass
    human_judgment: false

duration: about 80 min of work, 16:44Z to 18:06Z, with two stopped sittings in between
completed: 2026-11-19
---

# Phase 188 Plan 18: The voter-journey load check on staging Summary

**40 voter journeys a minute, a lower bound (`LOAD_BOUND=none-reached`).** Measured 2026-11-19 on build `a7003b490b4ff92fc72bef5d225c593b222d6c4e`. At that step 1 task ran, with CPU at most 44.86 % (43.52 % as a one-minute average) and memory at 20.46 %. Every step of 2, 5, 10, 20 and 40 journeys a minute met every threshold: page p95 under 1000 ms, relay p95 under 300 ms and errors under 1 %. So no resource bound the figure, and 40 is the step cap set from the hosted project's plan, not a capacity that was reached. The journey was recorded with `trackEvents=false`, so it is pageviews only, and the relay load per journey is lower than on a deployment with `trackEvents` on.

## Results

| Step | Rate/min | Page p95 ms | Relay p95 ms | Data p95 ms | Errors | Met | Tasks | Task CPU max % | Generator CPU max % (of 14 CPUs) | Network max Mbit/s |
| ---- | -------- | ----------- | ------------ | ----------- | ------ | --- | ----- | -------------- | -------------------------------- | ------------------ |
| 1    | 2        | 288.4       | 125.9        | 525.3       | 0.0000 | yes | 1     | 17.84          | 0.06                             | 9.3                |
| 2    | 5        | 237.4       | 105.1        | 129.5       | 0.0000 | yes | 1     | 17.25          | 0.06                             | 21.25              |
| 3    | 10       | 201.4       | 105.2        | 123.5       | 0.0000 | yes | 1     | 29.24          | 1.49                             | 46.4               |
| 4    | 20       | 177.9       | 96.9         | 126.1       | 0.0001 | yes | 1     | 40.61          | 4.93                             | 87.05              |
| 5    | 40       | 202.6       | 109.0        | 139.7       | 0.0000 | yes | 1     | 44.86          | 1.31                             | 170.24             |

- **Totals:** 387 journeys and 36,378 requests, 1 of them failed. `k6_exit=0`, not aborted. 11.72 GB was received, almost all of it the 50 portraits per journey from Supabase storage, about 30 MB a journey. Task 1 had estimated about 1 GB.
- **Host CPU:** the workstation's CPU was close to full in steps 3 and 4 from other work, a `tsgo` typecheck among it. The k6 container stayed under 70 % of one CPU, and the p95s of those steps do not rise.
- **Restore:**
  - Task definition `:22`, the same digest, `ANALYTICS_PROVIDER=posthog`, PostHog host `https://eu.i.posthog.com`, flush 2000, stop timeout 40, scaling 1 to 2. One deployment `COMPLETED`, 1 of 1 running.
  - `/api/health` answers 200 with build `a7003b490…`, and the tfvars hold no override.
  - A plan after the restore reads `No changes. Your infrastructure matches the configuration.`
  - The smoke run after the restore is green, `2 passed`, verdict exit 0.
- **Override on the stack:** from about 17:31Z to 18:03Z. No `tfplan` file or plan JSON is left anywhere.

## Task Commits

1. **Task 1: The journey and the step plan.** `bc679d7ef` (fix, the extractor), `1312f24e7` (feat)
2. **Task 2: Operator approval.** No commit. Attempt `20261119T165213Z.1312f24e7`, bound by the orchestrator. `bound` and `has '^answer_load=approve$'` were re-checked before each sitting, each exit 0.
3. **Task 3: The load, the figure and the restore.** `6d21a6099` (docs, sitting one stopped on the expired SSO session), `f778834e0` (feat, the observe-only data p95), `65dd017e4` (docs, the record, the summary, the runbook row)

`commits: 5` is measured from `plan_head_before`, before this SUMMARY's own commit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The extractor lost the RPC bodies**
- **Found during:** Task 1
- **Issue:** Playwright 1.63 stores a POST body as `postData._file` (`resources/<sha1>.json`) beside an empty `text`. `journey-from-trace.mjs` took the empty `text`, so both RPCs had an empty body.
- **Fix:** A named resource now wins over `text`. A name that would leave the resources directory counts as a missing body.
- **Tests:** Two new tests.
- **Commit:** `bc679d7ef`

**2. [Rule 2 - Missing critical] No per-step data p95 for the bound rule**
- **Found during:** Task 3, before the load
- **Issue:** The bound rule names Supabase when "the data requests' p95 rose", but k6 keeps a tagged sub-metric in its summary only when it has a threshold. The data requests had none.
- **Fix:** An observe-only threshold, `p(95)<3600000` on `http_req_duration{kind:data,step:<i>}`. No step can reach it, so the figure and the steps met are unchanged.
- **Checks:** a test, and a `k6 inspect` of the script that lists the five data sub-metrics.
- **Commit:** `f778834e0`, made while the override was on and before the load started

**3. [Rule 3 - Blocking] The wrapper is not executable**
- **Found during:** Task 3, first start of the load
- **Issue:** `infra/scripts/load-check.sh` has mode 644, and the runner called it directly. The shell exited 126 before the wrapper ran, so no container started and no request was sent.
- **Fix:** The runner calls `bash infra/scripts/load-check.sh`. The load started again 71 s later.
- **Not changed:** the file's mode in the tree.

### Process deviations

- **Task 1 verify (stale check):** run verbatim, it exits 1 at `Array.isArray(j)`. Since 188-07 the journey is the object `{base, routeId, locale, requests}`, which the wrapper requires. The same check applied to `.requests` exits 0. The verify was not edited.
- **Extraction form:** the README's (an unzipped trace and `--resources`), not `unzip -p`. The RPC bodies are resources.
- **Three sittings:**
  - Sitting one stopped because terraform init could not refresh the expired SSO token (`CreateToken` 400).
  - Sitting two stopped on the coordinator's 70-minute token rule before any plan.
  - The coordinator then replaced that rule with a refresh proved right before the apply and before the restore. Sitting three is the run. Nothing was written to any hosted service before sitting three.
- **Active runs before the apply:** two short `Claude Code` `issue_comment` runs on `main`, neither `deploy.yml` nor `destroy.yml`. Both had completed by the next read, and the apply waited for a read of 0.
- **Generator network:** counted from the host's `en0` (all of the host's traffic) and, for the last steps, from the k6 container's own counters too. The container's counters agree with the step 5 maximum.

**Total deviations:** 3 auto-fixed (1 bug, 1 missing observation, 1 blocking), plus 5 process notes. **Impact:** none on the method's rule. The prohibitions hold:
- The load started only after the approval, and no step exceeded `SUPABASE_STEP_CAP`.
- It ran with provider `log`, and the override is off the stack.
- The trace was deleted.

## Issues Encountered

- Task 1 estimated the bytes per journey from the trace, which does not record the storage responses' sizes. The run received about ten times the estimate, 11.7 GB, still a small part of the egress included in Supabase Pro.
- The figure stops at the step cap. A capacity beyond 40 journeys a minute needs a higher cap, which the hosted project's plan sets (D-06).

## Known Stubs

None.

## Threat Flags

None. No endpoint, auth path or schema was added. The journey file and the summary were checked for tokens and header names.

## Next Phase Readiness

- OBS-11 has its recorded figure, with the date, the commit and the method. It stays open for the phase verifier, as the dispatch requires.
- Phase 189 carries the figure into the guide and the runbook, as a lower bound under `trackEvents=false`.
- Staging is on `:22`, which differs from the pipeline's revision only in its number. A plan with nothing set reads `No changes.`

## Self-Check: PASSED

- FOUND: infra/scripts/load-check/staging-journey.json, evidence/188-18-load-check.md, evidence/188-18-load-summary.json, infra/envs/staging/aws/README.md
- FOUND: bc679d7ef, 1312f24e7, 6d21a6099, f778834e0, 65dd017e4 (ancestors of HEAD)
- Task 3 verify exit 0. Task 2 verify exit 0. Task 1 verify exits 1 verbatim on its stale array check and 0 on `.requests`. `bound 188-18-2 OPERATOR_REPLY plan=188-18 task=2` exit 0. `yarn test:unit:infra` passes 421 tests in 16 files, and `assert:comment-hygiene` exits 0.
