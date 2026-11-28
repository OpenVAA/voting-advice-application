---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "06"
status: complete
subsystem: infra
tags: [analytics, relay, posthog, hogql, curl, bash, self-test, RELAY-09, RELAY-04]
requires:
  - "188-04: wave ordering only; this plan uses nothing it built"
provides:
  - "infra/scripts/relay-refusals.sh: the nine C-01 cases against https://staging.openvaa.org or a loopback origin, one line `c01_<case> status=<n> expected=<n> result=PASS|FAIL` each, last line `c01_summary cases=9 failed=<m>`"
  - "infra/scripts/posthog-read.sh: modes settings, probe-count, window-count and privacy against https://eu.posthog.com, printing `ph_*` named counts only; key from POSTHOG_PERSONAL_API_KEY"
  - "Local proof of C-01 against the real relay with provider `log`: 9/9 PASS, the control event logged once, the dropped and refused events not at all"
affects:
  - "188-09 (runs each posthog-read mode against the real project and fixes any HogQL that errors before a capture)"
  - "188-11 and later deployed sittings (C-01 against staging with provider posthog; B-03/B-04/B-06/B-07 reads)"
tech-stack:
  added: []
  patterns:
    - "In-process subshell self-test, so a loopback host is accepted only inside the self-test and no environment value can widen the host allowlist"
    - "Secret passed to curl through a 077 header file (`-H @file`), written by the printf builtin, so it reaches no command line"
    - "Leak check with a control: the stand-in's answers carry the fake key and a marker, and the self-test proves both streams lack them"
key-files:
  created:
    - infra/scripts/relay-refusals.sh
    - infra/scripts/relay-refusals.test.ts
    - infra/scripts/posthog-read.sh
    - infra/scripts/posthog-read.test.ts
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-06-local-refusals.md
  modified: []
decisions:
  - "Every refusal case's body is a valid envelope holding one answer event with its own suffixed question id, so a 403 or 400 can only come from the origin or envelope rule, and a wrongly accepted request would show at the provider under that id"
  - "The control event's time is set with `ago: 0`, which makes it the relay's receive time; the wire event has no time field"
  - "posthog-read.sh takes `--host`, but accepts only https://eu.posthog.com outside its own self-test; the self-test runs the read in a subshell with a script-local loopback origin"
  - "The geoip presence check lists nine `$geoip_` properties instead of scanning the keys of the properties, which keeps the HogQL to plain property reads; ph_persons is a scalar subquery over person_distinct_ids"
  - "An answer of another shape prints the one named line `ph_result=unexpected_shape` and exits 1; a missing answer prints `ph_query_status=000`"
metrics:
  duration: 11min
  completed: 2026-11-18
  tasks: 2
  files: 5
estimate:
  tokens: 70000
  tasks: 2
actuals:
  tokens: 12125
  tasks: 2
  commits: 5
plan_head_before: a9103a07adb83f6db904815ece4f4b43837656db
plan_head_after: 166b1ca1c87d8798301b5afeb5d00ab414dae040
requirements-completed: []
---

# Phase 188 Plan 06: The refusal check and the PostHog read, Summary

**Two scripts for the deployed relay sittings. `relay-refusals.sh` sends the nine C-01 cases and names each status. It was run against this checkout's relay with provider `log`, and every case passed: the control event reached the provider once and none of the dropped or refused events reached it. `posthog-read.sh` asks the EU project one of four fixed HogQL questions and prints only `ph_*` counts. The key goes through a 077 header file and never appears on a command line or in output.**

`requirements-completed` is empty on purpose. The dispatch keeps RELAY-09 and RELAY-04 open until the deployed plans and the phase verifier close them.

## Performance

- **Duration:** 11 min
- **Started:** 2026-11-18T19:02:51Z
- **Completed:** 2026-11-18T19:14Z
- **Tasks:** 2 (Task 1 a tracer)
- **Files created:** 5

## Local proof (evidence/188-06-local-refusals.md)

```
c01_cross_site status=403 expected=403 result=PASS
c01_foreign_origin status=403 expected=403 result=PASS
c01_declared_33k status=413 expected=413 result=PASS
c01_chunked_33k status=413 expected=413 result=PASS
c01_envelope_destination status=400 expected=400 result=PASS
c01_envelope_host status=400 expected=400 result=PASS
c01_event_url status=204 expected=204 result=PASS
c01_event_host status=204 expected=204 result=PASS
c01_control status=204 expected=204 result=PASS
c01_summary cases=9 failed=0
LOCAL_SCRIPT_EXIT=0
LOCAL_CONTROL_LINES=1
LOCAL_URL_EVENT_LINES=0
LOCAL_HOST_EVENT_LINES=0
LOCAL_REFUSED_REQUEST_EVENT_LINES=0
LOCAL_PROBE_SUBSTRING_LINES=1
LOCAL_DEV_SERVER_STOPPED=yes
```

- Dev server: `yarn workspace @openvaa/frontend dev` on port 5274 with `ANALYTICS_PROVIDER=log`. It was healthy after 3 s and stopped at the end; `lsof -i :5274` then exited 1.
- The chunked case went out with `Transfer-Encoding: chunked` and no `Content-Length`, which a loopback listener confirmed. Locally, then, its 413 comes from the streamed-body check.
- Tracer gate (auto mode): the task's `<verify>` was run again after the commit and exited 0, so execution went on to Task 2.

## Task Commits

1. **Task 1: The refusal script against the real relay**: `ab480fb82` (test, RED: 5/5 failing, no script yet), `fa151ba1e` (feat: script and local evidence, 5/5 green)
2. **Task 2: The PostHog read that prints counts and nothing else**: `967d1f1e0` (test, RED: 5/5 failing), `a3f0da557` (feat, 5/5 green)
3. Follow-up: `166b1ca1c` (docs: neutral probe ids in the refusal script's usage examples, comment-only)

## Verification

- Task 1 `<verify>` exited 0. Acceptance: `relay-refusals.sh --base-url https://example.org --probe x` exits 2, and `lsof -i :5274` exits 1.
- Task 2 `<verify>` exited 0: the call without the key exited 2. Acceptance: `grep -c HogQLQuery infra/scripts/posthog-read.sh` prints 6, and the verbose vitest run lists all 5 tests of `posthog-read.test.ts` as passed.
- The whole infra suite, `yarn test:unit:infra`: 15 files, 399 tests passed. ESLint and Prettier are clean on both test files.
- No E2E run. The plan changes no frontend source, spec or fixture, so the targeted-run rule names no project. Project test-count delta: 0.

## Self-test coverage

- `relay-refusals.sh --self-test`, 21 cases. A rules stand-in that applies the relay's order: each of the nine cases passes, the script exits 0 and no body is recorded. An always-204 stand-in: cross_site FAILs, 6 cases fail and the script exits 1. A dead port: every case reads `000` and the script exits 1. A foreign base URL exits 2.
- `posthog-read.sh --self-test`, 19 cases:
  - each mode prints its exact named lines, and only named lines
  - every query is a `HogQLQuery` POST that carries the Bearer key and the window
  - a 401 prints `ph_query_status=401` and exits 1, for both a query and settings
  - an answer of another shape exits 1 with `ph_result=unexpected_shape`
  - a dead port prints `ph_query_status=000`
  - neither stream holds the fake key or the marker, and a control case proves the stand-in's answers carry both

## Decisions Made

See frontmatter `decisions`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The posthog-read leak check passed without checking anything**
- **Found during:** Task 2, first self-test run
- **Issue:** The script runs under `set -f`, so `cat "$ST"/*.out` did not expand. `key-in-neither-stream` and `no-body-printed` then passed against an empty file.
- **Fix:** The streams are now collected by name. A `streams-collected` case requires the file to hold a known line, and a `stand-in-answers-carry-the-key-and-the-marker` control case proves the leak check can fail.
- **Files modified:** infra/scripts/posthog-read.sh (before its first commit)
- **Committed in:** a3f0da557

**2. [Rule 3 - Setup] The flush interval was set explicitly, and the run had a warm-up request**
- **Found during:** Task 1, local run
- **Issue:** The plan starts the dev server with `FRONTEND_PORT=5274 ANALYTICS_PROVIDER=log`. The 5-second count wait would then rest on whatever flush interval the root `.env` sets, and that file is only checked with `test -f`. The usage route was also not yet compiled, and the first timed case could have hit curl's 10-second limit.
- **Fix:** Added `ANALYTICS_FLUSH_INTERVAL_MS=2000`, the default, to the server's environment. Before the timed cases, sent one cross-site POST with body `{}`: it got 403 and carries no event. The evidence file records both.
- **Committed in:** fa151ba1e (the evidence)

**3. [Comment hygiene] Example probe ids in the script headers**
- The header examples first used `p188c01…` and `p188b03…` probe ids, which embed planning ids. They now use neutral ids. Committed in 166b1ca1c for relay-refusals.sh, and before the first commit for posthog-read.sh.

**Total deviations:** 3 (1 bug, 1 setup, 1 hygiene). **Impact:** none on scope. The first fix is what makes the A-04 leak assertion real.

## Known Stubs

None.

## Assumptions carried to 188-09

- The HogQL is research assumption A10, and the script header says so: `properties['openvaa.app']`, `properties.questionId`, the nine `$geoip_` names, `toDateTime(…, 'UTC')`, `toString(properties.$process_person_profile)`, and the `person_distinct_ids` subquery. Plan 188-09 Task 3 runs each mode against the real project and fixes any query that errors.
- The `settings` mode reads `anonymize_ips` from `GET /api/projects/<id>/`. That this field holds the "discard client IP data" setting is also unverified against the real API.

## Threat Flags

None. Both scripts add only workstation-side outbound requests to targets that are allowlisted in the threat model: T-188-18, -19 and -20 are mitigated as planned, and no package was installed (T-188-SC).

## Self-Check: PASSED

- FOUND: infra/scripts/relay-refusals.sh, infra/scripts/relay-refusals.test.ts, infra/scripts/posthog-read.sh, infra/scripts/posthog-read.test.ts, evidence/188-06-local-refusals.md
- FOUND in HEAD's history: ab480fb82, fa151ba1e, 967d1f1e0, a3f0da557, 166b1ca1c
