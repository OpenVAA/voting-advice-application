---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "11"
subsystem: infra
tags: [analytics, relay, posthog, privacy, staging, refusals]
status: complete

requires:
  - phase: 188 (plan 10)
    provides: staging serving a7003b490 with ANALYTICS_PROVIDER=posthog on task definition :10
  - phase: 188 (plan 09)
    provides: PostHog EU project 347462 and the read-only key in the keychain
  - phase: 188 (plan 06)
    provides: infra/scripts/relay-refusals.sh and infra/scripts/posthog-read.sh
provides:
  - "B-03 on the deployed relay: 12 events of one consenting journey at PostHog EU, every presence count 0, no person"
  - "B-08: one relay request of five events yields five events"
  - "C-01: the nine refusals seen with the provider on, c01_summary cases=9 failed=0, dropped events absent at PostHog"
  - "A dated Observations row in infra/envs/staging/aws/README.md"
affects: [188-16, 188-19]

actuals:
  tokens: 3000
  tasks: 3
  commits: 4
plan_head_before: 73d30e0be0009ed578d8d5c7ed476541cd4b3647
plan_head_after: 7f4032f3eb4802d0c3bf76ea15738ed7142d1648

tech-stack:
  added: []
  patterns:
    - "PostHog reads repeated until the count holds across two reads two minutes apart, after one read found an event ingested late"

key-files:
  created: []
  modified:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-11-capture-and-refusals.md
    - infra/envs/staging/aws/README.md

key-decisions:
  - "B-03 is judged on the second, consenting journey (attempt 20261119T092846Z.e16a1b011); the first journey ran while staging's analytics.trackEvents was false and sent pageviews only"
  - "PostHog reads the top-level distinct_id when both placements are set (capture docs, read 2026-11-19), so the provider's duplicate in properties does nothing"

requirements-completed: []
---

# Phase 188 Plan 11: Anonymous capture, batching and the deployed refusals Summary

On staging with PostHog on, one consenting browser journey reached PostHog EU as 12 events. None of them carried an address, GeoIP, user agent, URL, referrer or host, and no person was created. One relay request of five events came out as five events at PostHog. All nine refusal cases got the status expected, and the dropped events never reached PostHog.

## Performance

- **Started:** 2026-11-19T09:15:39Z (Task 1); Task 3 at 09:33:13Z
- **Completed:** 2026-11-19T09:47Z
- **Tasks:** 3 (Task 1 readiness, Task 2 the operator's journey and approval, Task 3 the reads, the posts and the record)
- **Files modified:** 2

## Results

- **B-03** (window 09:29:51Z to 09:32:12Z): `B03_EVENTS=12`, `B03_PAGEVIEWS=7`, `B03_OTHER_EVENTS=5`, `B03_OTHER_SESSION_ID_PRESENT=5`, `B03_PAGEVIEW_SESSION_ID_PRESENT=0`. The counts for IP, GeoIP, user agent, URL, referrer, host, person-profile events and persons are all 0. `B03_REGION_PROVEN=eu`. `B03_DISTINCT_ID_PLACEMENT=top-level`.
- **B-08:** `B08_STATUS=204`, `B08_EVENTS=5` (probe `p188b0820261119T093335Z`).
- **C-01:** `C01_EXIT=0`, `c01_summary cases=9 failed=0`. Statuses: cross-site 403, foreign Origin 403, declared 33k 413, chunked 33k 413, envelope `destination` 400, envelope `host` 400, event `url` 204, event `host` 204, control 204. At PostHog: `C01_CONTROL_EVENTS=1`, `C01_URL_EVENTS=0`, `C01_HOST_EVENTS=0`, and the four refused cases' ids also 0.
- **Last hosted call:** the last relay POST at 09:33:44Z and the last PostHog read at 09:45:42Z. `account-access` was never called.

## Task Commits

1. **Task 1: Readiness** - `b614fde3a` (docs)
2. **Task 2: The operator's journey and approval** - no commit of its own. The orchestrator bound the reply under attempt `20261119T092846Z.e16a1b011`, and its record is in the Task 3 commit.
3. **Task 3: The privacy read, the batch, the refusals and the record** - `7f4032f3e` (docs)

`commits: 4` is measured from `plan_head_before`. Two of those commits belong to others: `e16a1b011` (188-16's readiness) and `eda544276` (the orchestrator's B-03 note in 188-CONTEXT.md).

## Deviations from Plan

### Operator-side

**1. [Deviation - environment] `analytics.trackEvents` was off for the first journey**
- **Found during:** Task 2, first attempt `20261119T092133Z.e16a1b011` (journey 09:24:57Z to 09:25:39Z)
- **Issue:** The staging project's `analytics.trackEvents` was `false`, the shipped default. The voter app therefore showed no consent prompt and sent only the identifier-free pageview. A read over that window, taken as supporting evidence, found 7 events, all pageviews, and every presence count 0.
- **Fix:** The operator set `trackEvents=true` on the hosted project. The orchestrator read it back with `updated_at` 2026-11-19T09:30:36Z, and the operator walked a second, consenting journey. It is recorded as `TRACK_EVENTS_BEFORE=false`, `TRACK_EVENTS_SET_AT=2026-11-19T09:30:36Z` and `TRACK_EVENTS_NOW=true`, and in 188-CONTEXT.md B-03 (`eda544276`). The executor changed no hosted setting.

### Auto-fixed Issues

None. Two read behaviours are worth knowing:
- The plan's stop rule ("retry until `ph_events` stops growing") stopped at 11 after two equal reads. A later read found 12, because one journey event was ingested late. Two more reads held at 12, and 12 is the count recorded. All four reads had every presence count at 0.
- The probe events took about five minutes to become queryable: 0 at 09:36Z and 09:38Z, then 5 and 1 from 09:40Z onward. Before that showed up, I ran a diagnostic HogQL count query (counts only, no event bodies) to confirm the events were present and that `properties.questionId` equality matches. Nothing was changed.

## Issues Encountered

None blocking. After the posts, the privacy read over 09:33Z to 10:30Z (supporting only) counted one pageview that the read cannot attribute, either to the operator's open tab or to another visit. Its presence counts were 0 as well.

## Next Phase Readiness

- Plan 188-16 can start its 10-minute pre-window counting from the last hosted call at 2026-11-19T09:45:42Z (the last relay POST was at 09:33:44Z).
- `analytics.trackEvents` stays `true` on staging. Turning it off is the operator's decision.

## Self-Check: PASSED

- FOUND: evidence/188-11-capture-and-refusals.md (Task 3 verify exit 0)
- FOUND: infra/envs/staging/aws/README.md row (prettier --check exit 0)
- FOUND: b614fde3a, 7f4032f3e in HEAD's history
