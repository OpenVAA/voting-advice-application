---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "19"
subsystem: infra
tags: [closing, end-state, requirement-trace, posthog, staging]
status: complete

requires:
  - phase: 188-10
    provides: "DEPLOY_COMMIT=a7003b490, BUILD_DIGEST=sha256:e35bde28…182a, PostHog on through the pipeline"
  - phase: 188-16
    provides: "E06 hosted per-caller limit lines"
  - phase: 188-18
    provides: "the load figure, and staging restored to :22 with a plan reading No changes."
provides:
  - "evidence/188-19-closing.md: the phase's end state, one TRACE_ line per requirement (146 named evidence lines, checked), the open items named, the final plan and the read key's fate"
affects: [189]

actuals:
  tokens: 7073
  tasks: 3
  commits: 4
plan_head_before: 6792d15fb77f03cf53a784e45d9d0e0d1aa18627
plan_head_after: 802b3e9c6330d942879bbc818b06d9f14feadf94

tech-stack:
  added: []
  patterns:
    - "A trace line names its evidence file before each backticked whole line, so a script can check every citation mechanically"

key-files:
  created:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-19-closing.md
  modified: []

key-decisions:
  - "TRACE_COMPLETE=yes was written only after a whole-line check of all 146 cited lines (0 missing) and a negative control that failed as it should"
  - "trackEvents was read through the public anon REST read the voter app makes (false, updated 10:59:26Z), not taken from the record alone"
  - "READ_KEY=revoked: the keychain item is absent locally (exit 44); the PostHog-side revocation rests on the operator's answer"

requirements-completed: [OBS-09, OBS-11]   # marked at the v2.17 milestone audit (2026-11-21) from the phase VERIFICATION.md

duration: 20min
completed: 2026-11-19
---

# Phase 188 Plan 19: The phase's end state, its requirement trace, and the read key Summary

**Staging ends phase 188 as its tfvars say. It serves a7003b490 by digest on `:22` with PostHog on, a flush interval of 2000, a stop timeout of 40, a floor of 1, a ceiling of 2 and no web ACL. A final plan with the running digest only reads `No changes.`. Every success criterion is traced to named evidence lines, and the personal PostHog read key is revoked.**

## The four trace lines

The full lines, with every cited evidence line in backticks, are in `evidence/188-19-closing.md` § The trace.

- **`TRACE_RELAY_04`** (48 lines, 6 files). Clauses and evidence:
  - PostHog on, EU host: 188-10, 188-11 `B03_REGION_PROVEN=eu`.
  - Key from the parameter store: 188-10 `TD_POSTHOG_KEY_SOURCE=parameter`, `TD_POSTHOG_KEY_IN_ENVIRONMENT=0`.
  - Anonymous capture: 188-09 `PH_ANONYMIZE_IPS=true`; 188-11 `B03_EVENTS=12`, and every `B03_*_PRESENT`, `B03_PERSON_PROFILE_EVENTS` and `B03_PERSONS` count 0.
  - Five of five batched: 188-11 `B08_EVENTS=5`.
  - Seven of seven at SIGTERM: 188-12 `B04_EVENTS=7`, `B04_TIMER_TICK_IN_WINDOW=no`.
  - Fail-open: 188-14 `B06_SMOKE_VERDICT_EXIT=0`, `B06_POST_STATUS=204`, `B06_FORWARD_FAILURES_ENOTFOUND=6`.
  - `none` without rebuild: 188-15 `B07_DIGEST_UNCHANGED=yes`, `B07_NO_NEW_RUN=yes`, 0 events under `none` against 11 in the control window.
- **`TRACE_RELAY_09`** (55 lines, 6 files). Clauses and evidence:
  - Unit and terraform tests: 188-08 gates, 188-06 local refusals.
  - Nine deployed refusals: 188-11 `c01_summary cases=9 failed=0`, and 0 events at PostHog for the url, host and refused cases.
  - Full queue: 188-13 `C02_DROPPED=60`, `C02_EVENT_LINES_TOTAL=1000`, `C02_MEMORY_FLAT=yes`.
  - WAF: 188-17. Off reads `No changes.`, on reads `Plan: 1 to add, 1 to change, 0 to destroy.`, not applied, 0 `wafv2` actions on the deploy role, cost 5.00 + 1.00 USD a month + 0.60 per million requests, read 2026-11-19.
- **`TRACE_OBS_09`** (25 lines, 5 files). Clauses and evidence:
  - `BEHIND_CLOUDFLARE=true`.
  - pgTAP: 188-04 `PGTAP_EXIT=0`.
  - Function tests.
  - Local proof: 188-05 `LOCAL_31ST_STATUS=429`, other caller 200.
  - Hosted push: 188-10 `MIGRATIONS_PUSHED=00023`, account-access `ACTIVE`.
  - Hosted limit: 188-16 `E06_CS_FIRST_429=31` while `E06_WS_FIRST_STATUS=200` in the same window (`E06_SAME_WINDOW=yes`), the workstation's own 31st 429, and 200 again after the window.
- **`TRACE_OBS_11`** (18 lines, 2 files). Clauses and evidence:
  - The digest-pinned k6 method and the dry run: 188-07.
  - The figure: 188-18 `LOAD_FIGURE_JOURNEYS_PER_MINUTE=40`, 2026-11-19, commit a7003b490, 1 task, `LOAD_BOUND=none-reached`, `LOAD_FIGURE_IS_LOWER_BOUND=yes`, `JOURNEY_TRACK_EVENTS=false`.
- **`TRACE_COMPLETE=yes`**. A script checked all 146 lines as whole lines of their files and found 0 missing. A negative control exited 1, as it should.

## Results

| Task | Result |
| ---- | ------ |
| 1, end state, read-only | `SERVED_BUILD=a7003b490…`, `FINAL_DIGEST` equal to `BUILD_DIGEST`, `:22`, 1 task. `FINAL_PROVIDER=posthog`, `FINAL_FLUSH_INTERVAL_MS=2000`, `FINAL_STOP_TIMEOUT=40`, `FINAL_FLOOR=1`, `FINAL_CEILING=2`, `FINAL_WEB_ACL=none`. `TFVARS_PROVIDER=posthog`, `TFVARS_OVERRIDES=0`, `TFVARS_RELAY_RATE_LIMIT=unset`. `DESTROY_PATH_SINCE_188_10=no`. `TRACK_EVENTS_NOW=false` |
| 2, operator | attempt `20261119T182037Z.9ce39a692`: `answer_read_item=revoked`, `answer_settled_on=2026-11-19`, `answer_final_plan=approve`. `bound` exit 0 |
| 3, final plan and key | no run active. SSO refreshed (init and sts exit 0). Plan with `image_digest` only: `FINAL_PLAN_EXIT=0` (`-detailed-exitcode`), `FINAL_PLAN_LINE=No changes.`, JSON with 0 resource changes and 0 output changes. `FINAL_PLAN_REMOVED=yes`, `FINAL_APPLIED=no`. `READ_KEY=revoked`, `READ_KEY_SETTLED_ON=2026-11-19`, keychain item absent (exit 44). `PHASE_188_DEPLOYED_HALF=complete` |

## Open items named for the verifier

These are recorded in `evidence/188-19-closing.md` § What the trace does not close:

1. `BILLING_OTHER_PRODUCTS=operator-set` overrules A-02. 188-09's verify fails on it as recorded. The limit is 20 USD.
2. The red 188-05 targeted run (`net::ERR_NETWORK_CHANGED`), accepted by the operator. It stays a failure on record.
3. The 188-14 override stayed on staging for 57 minutes because of a host sleep.
4. `trackEvents` is false, and the voter smoke fails when it is on (pending todo). B-03 rests on one consenting journey.
5. 188-18's 40 journeys a minute is a lower bound at the step cap, with a pageview-only journey and provider `log`.
6. 188-17 made two extra rule-on plans, and the first one's error cause is unread.
7. Plan-verify defects:
   - 188-18 Task 1's `Array.isArray` check;
   - 188-09's enum check;
   - 188-03's module-alone validate;
   - 188-12's tick window;
   - 188-13's memory window;
   - 188-15's changed-keys reading;
   - 188-08's 548;
   - 188-02's module-resource reference;
   - 188-06's flush-interval setup;
   - the load wrapper's mode 644.
8. Residuals:
   - `code-sign-in` is outside the take;
   - IPv6 /64 keying is proven by pgTAP only;
   - the chunked 413 may come from the declared-length check on CloudFront;
   - 60 rather than 50 dropped;
   - the sequential-scan todo;
   - the duplicate `distinct_id` placement.

## Task Commits

1. **Task 1: The end state, read-only, and the requirement trace.** `4d8626f13` (docs)
2. **Task 2: Operator answer.** No commit. The orchestrator bound it under attempt `20261119T182037Z.9ce39a692`.
3. **Task 3: The final plan reads no change, and the key's fate on record.** `802b3e9c6` (docs)

`commits: 4` is measured from `plan_head_before`. Two of those commits are the orchestrator's, `635a8d21d` (the CDN todo) and `9ce39a692` (the STATE todo list), which landed between this plan's task commits.

## Verification

- Task 1 `<verify>`, run verbatim: exit 0. The tracer gate re-ran it: exit 0.
- Task 2 `<verify>` (`TRACE_COMPLETE=yes`): exit 0.
- Task 3 `<verify>`, run verbatim: exit 0.
- Acceptance: `bash "$A" bound 188-19-2 OPERATOR_REPLY plan=188-19 task=2` exit 0. The trace check was re-run after Task 3's edit: 146 lines checked, 0 missing.
- Every status was read on its own line, never through a pipe.
- No E2E run. This plan changes no file under `apps/`, `packages/` or `tests/`. `git diff --quiet d523abcd5..HEAD -- apps packages tests` exits 0, so `tests/e2e-runs/188-close2-20261119T071844Z` (729 passed) still stands for the tree. Project test-count deltas: 0.

## Deviations from Plan

### Auto-added

**1. [Rule 2 - Correctness] A mechanical check of the trace's citations, with a negative control**
- **Found during:** Task 1
- **Issue:** the plan writes `TRACE_COMPLETE=yes` only "when every named line exists in its file". Checking 146 citations by eye would not be reliable.
- **Fix:** a scratch node script checks each backticked line against the file named before it, as `grep -qxF` would. It caught one prose phrase in backticks before the first commit.
- **Commit:** `4d8626f13`

**2. [Rule 2 - Correctness] `trackEvents` read live, and a second reading of the final plan**
- **What:** Task 1 read `analytics.trackEvents` through the public anon REST read, without printing the key. Task 3 used `-detailed-exitcode` and a `jq` count of the plan JSON as well as reading the plan's text line.
- **Commit:** `4d8626f13`, `802b3e9c6`

### Process notes

- **A leftover Terraform plan file from earlier work.** A wider search of `$TMPDIR` found `openvaa-bootstrap.T5fcmB/s9a-plan.json`, a Terraform plan JSON of 2026-11-16 (phase 187), and an empty `openvaa-aws.*` directory of 2026-11-18. Neither is from this plan, so neither was removed. They are named here for the operator.
- **What "revoked" rests on.** The PostHog-side revocation rests on the operator's answer. The keychain item's absence was read here (exit 44).

**Total deviations:** 2 auto-added checks and 2 process notes. **Impact:** none on scope. Nothing was applied, and no requirement was ticked.

## Known Stubs

None.

## Threat Flags

None. T-188-51: the key is revoked. T-188-52: the final plan reads `No changes.`. T-188-SC: no package was installed.

## Next Phase Readiness

- The phase verifier can read phase 188 from `evidence/188-19-closing.md`. The four requirements stay unticked for it.
- Phase 189 has no PostHog read key. It needs a new one if it is to read events.
- Staging is on `:22`, `a7003b490`, PostHog on, `trackEvents` false.

## Self-Check: PASSED

- FOUND: evidence/188-19-closing.md
- FOUND: 4d8626f13, 802b3e9c6 (ancestors of HEAD)
- Task 1, Task 2 and Task 3 verifies exit 0, and `bound 188-19-2` exits 0
