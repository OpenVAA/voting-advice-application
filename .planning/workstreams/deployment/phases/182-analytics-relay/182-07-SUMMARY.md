---
phase: 182-analytics-relay
plan: 07
subsystem: frontend-analytics
tags: [analytics, relay, providers, posthog, opentelemetry, logging, privacy, vitest]
status: complete

requires:
  - phase: 182-04
    provides: EVENT_NAMES and EventName (events.schema.ts), VALID_EVENTS (events.fixtures.ts)
  - phase: 182-05
    provides: AnalyticsConfig and ProviderName (lib/server/analytics/config.ts); posthog member only for a sound posthog configuration, host already an origin
  - phase: 182-06
    provides: wave ordering only
provides:
  - apps/frontend/src/lib/analytics/mappers/toLogRecord.ts (toLogRecord)
  - apps/frontend/src/lib/analytics/mappers/toOtelLogRecord.ts (toOtelLogRecord, OtelLogRecord)
  - apps/frontend/src/lib/server/analytics/providers/provider.type.ts (AnalyticsProvider, ProviderDeps)
  - apps/frontend/src/lib/server/analytics/providers/none.ts (createNoneProvider)
  - apps/frontend/src/lib/server/analytics/providers/log.ts (createLogProvider)
  - apps/frontend/src/lib/server/analytics/providers/posthog.ts (toPostHogBatchItem, PostHogBatchItem, createPostHogProvider)
  - apps/frontend/src/lib/server/analytics/providers/index.ts (createProvider; re-exports AnalyticsProvider and ProviderDeps)
affects: [182-08, 182-09, 182-14, 188]

actuals:
  tokens: 10800     # chars/4 over the twelve code files of this plan (43096 chars)
  tasks: 3
  commits: 7        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 7877e2f4b52ea815defe84c01c9c12a1d9d598d6
plan_head_after: 046b4924f74bb697b5ac17104c2e8474159e94d3

tech-stack:
  added: []
  patterns:
    - "Providers take their side effects as injected deps (fetch, write, randomId); the caller supplies the real ones"
    - "A leak detector shared by the real provider and a deliberately leaky control in the same test file"
    - "Failure records carry a closed whitelist: a symbolic transport code or a numeric status"

key-files:
  created:
    - apps/frontend/src/lib/analytics/mappers/toLogRecord.ts
    - apps/frontend/src/lib/analytics/mappers/toLogRecord.test.ts
    - apps/frontend/src/lib/analytics/mappers/toOtelLogRecord.ts
    - apps/frontend/src/lib/analytics/mappers/toOtelLogRecord.test.ts
    - apps/frontend/src/lib/server/analytics/providers/provider.type.ts
    - apps/frontend/src/lib/server/analytics/providers/none.ts
    - apps/frontend/src/lib/server/analytics/providers/log.ts
    - apps/frontend/src/lib/server/analytics/providers/log.test.ts
    - apps/frontend/src/lib/server/analytics/providers/posthog.ts
    - apps/frontend/src/lib/server/analytics/providers/posthog.test.ts
    - apps/frontend/src/lib/server/analytics/providers/index.ts
    - apps/frontend/src/lib/server/analytics/providers/index.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/07-gates.txt
  modified: []

key-decisions:
  - "Envelope keys (openvaa.app, session.id) are spread after the payload in both mappers, so they win over any same-named attribute"
  - "toPostHogBatchItem ignores an id on a pageview and mints a fresh one, so a pageview cannot share an id with the visit even if the relay failed to strip it"
  - "The PostHog forward has a 10 s AbortSignal.timeout; an abandoned forward logs transport TIMEOUT"
  - "The PostHog response body is never read; it is cancelled to release the connection"
  - "The log provider logs one warn record with only a failure count when its stream throws"
  - "createProvider does not reference process.stdout; the real stream, global fetch and crypto.randomUUID are supplied by its caller (plan 182-09's runtime.ts)"

requirements-completed: []

duration: 10min
completed: 2026-10-19
---

# Phase 182 Plan 07: Event mappers and the three providers Summary

**Two pure mappers turn an `AnalyticsEvent` into the application's `LogRecord` (`level` 30, the event name as `msg`, `openvaa.app` and `session.id` beside the payload) and into the OpenTelemetry log data-model fields, with nanosecond times held as `BigInt` strings. No OpenTelemetry package is added. Three providers sit behind one `AnalyticsProvider` interface, and `createProvider` selects one from the resolved configuration, with `none` as the default. The `log` provider writes `JSON.stringify(toLogRecord(event))` plus a newline to the stream it is given. The PostHog provider sends one `POST` to `<host>/batch/` with `Content-Type` as its only header and `redirect: 'error'`, and it builds the body from the events alone. Every item carries `$process_person_profile: false` and `$geoip_disable: true`. A test shows the request holds no planted address, user agent, cookie or referrer, and no `$ip`, `$raw_user_agent`, `$current_url` or `$referrer` member. A deliberately leaky control is caught by the same detector. A failed forward resolves and logs only a transport code or a status.**

## Performance

- Duration: about 10 min
- Started: 2026-10-19T10:59:04Z
- Completed: 2026-10-19T11:09Z
- Tasks: 3 of 3
- Files: 12 code files created, plus the gate record
- Start sha: `7877e2f4b52ea815defe84c01c9c12a1d9d598d6`

## Accomplishments

- `toLogRecord(event)` and `toOtelLogRecord(event, observedTimeMs)` are pure and import types only. Each test file covers one sensitive event with a visit id (`answer`), one non-sensitive event without an id (`pageview`), input immutability, and a loop over every name of `EVENT_NAMES` built from `VALID_EVENTS`. The OTel test also pins exact nanoseconds beyond `Number.MAX_SAFE_INTEGER` and checks that no trace id, span id or body is present.
- `createLogProvider({ write })` writes one newline-terminated JSON line per event. It never calls the console or the application logger for an event. A throwing `write` is counted, and `capture` still resolves.
- `toPostHogBatchItem(event, randomId)` writes `distinct_id` at the top level and in `properties`, with the same value. That value is the visit id, or one `randomId()` call when there is none. `$session_id` is set only from a visit id. A pageview always gets a fresh id.
- `createPostHogProvider` sends one request per non-empty batch. Tests cover: the exact URL; the header key set, exactly `['Content-Type']`; the body keys `api_key` and `batch`; per-item ISO timestamps and properties; distinct ids within a batch; the pageview never sharing the visit id; and failures with no leak (rejected with `ENOTFOUND`, a non-symbolic code giving `unidentified`, and status 500 with a planted response body). In each failure case exactly one `warn` record is written, and it holds none of the host, key, visit id, attribute values or response body.
- `createProvider(config, deps)` passes the tests for `none`, `log`, `posthog` with settings, `posthog` without settings (gives `none`) and an unrecognised provider (gives `none`). `index.test.ts` runs every name of `EVENT_NAMES` through the log provider and the PostHog provider, and asserts the event name and both privacy properties for each.

## Task Commits

1. Task 1 RED: `e1925d572` test(182-07): the two event mappers over the whole vocabulary
2. Task 1 GREEN: `9b4a11d4c` feat(182-07): the LogRecord and OpenTelemetry log-record mappers
3. Task 2 RED: `a32e5a13c` test(182-07): the none and log providers against a recording stream
4. Task 2 GREEN: `8f7cdb1c1` feat(182-07): the provider interface, the none provider and the log provider
5. Task 3 RED: `0fe209445` test(182-07): the PostHog provider against a stand-in fetch, and the provider factory
6. Task 3 GREEN: `f28add41c` feat(182-07): the PostHog provider and the provider factory
7. Gate record: `046b4924f` docs(182-07): the closing typecheck and lint gate record

## Verification

- `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics/providers src/lib/analytics/mappers`: exit 0, 5 files, 154 tests passed.
- Closing gates on `f28add41c`, with the tree clean before and after and HEAD unchanged (attempt `20261019T110430Z.f28add41c`, record `evidence/07-gates.txt`): `TYPECHECK_EXIT=0` (svelte-check: 3038 files, 0 errors, 0 warnings) and `LINT_EXIT=0`. The plan's record verify exits 0.
- `git grep -n -i "opentelemetry" -- apps/frontend/package.json package.json` prints nothing.
- `git grep -n -i -e getClientAddress -e x-forwarded-for -e user-agent -- apps/frontend/src/lib/server/analytics/providers ':!*.test.ts'` prints nothing.
- `posthog.ts` contains `'/batch/'`, `$process_person_profile`, `$geoip_disable` and `redirect: 'error'`.

## TDD Gate Compliance

Each task has a `test(182-07)` commit before its `feat(182-07)` commit. Before each GREEN commit the RED run failed: for every new test file, the run failed with "Cannot find module" for the module under test. The GREEN run then passed: 68 mapper tests; 6 log/none tests; 154 tests over both directories. No REFACTOR commit was needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] A timeout on the PostHog forward**
- **Found during:** Task 3
- **Issue:** the plan gives the forward no time bound. A PostHog endpoint that never answers would keep `capture` pending forever, which threatens T-182-28 (a slow provider) for the queue of plan 182-08.
- **Fix:** `signal: AbortSignal.timeout(10_000)`. An abandoned forward logs the transport code `TIMEOUT` and resolves. It is not retried.
- **Files modified:** `apps/frontend/src/lib/server/analytics/providers/posthog.ts`
- **Commit:** `f28add41c`

**2. [Rule 2 - Missing critical functionality] A pageview never carries the visit id at the provider**
- **Found during:** Task 3
- **Issue:** the plan assigns stripping any id from a pageview to the relay (Pitfall 2). If that step failed, the provider alone would still link a pageview to the visit.
- **Fix:** `toPostHogBatchItem` treats a pageview's id as absent and mints a fresh one. A test passes a pageview that carries the visit id and asserts the id does not appear.
- **Commit:** `f28add41c`

**3. [Stale plan text] Where the real stream is supplied**
- Task 2's action says "`createProvider` in Task 3 supplies the real stream". The interfaces block, however, gives `createProvider(config, deps: ProviderDeps)`. Plan 182-09 makes `runtime.ts` "the only module that references `process.stdout` for analytics" and builds the deps there. `createProvider` therefore takes `deps.write` from its caller and does not reference `process.stdout`. This follows the intent of both plans.

**4. [Addition] Failure records of the log provider**
- "A throwing `write` is caught and counted" is implemented as one `log.warn` record per `capture` call, carrying only `{ failed: <count> }`. The caught error is not logged, because it may quote the line it could not write. The test asserts that the one record holds no planted visit id.

## Known Stubs

None. The PostHog provider is complete and tested against a stand-in `fetch`; real capture is observed in phase 188, and this plan does not claim it.

## Notes for Later Plans

- **182-08 / 182-09:** use `createProvider(analyticsConfig, { fetch, write, randomId })` from `$lib/server/analytics/providers` (the index re-exports `AnalyticsProvider` and `ProviderDeps`). `capture` never rejects; for a non-empty batch the PostHog provider makes exactly one request, bounded at 10 s. The relay must still strip ids from pageviews itself; the provider's guard is only a backstop.
- **Phase 188:** `distinct_id` is written both at the item's top level and in `properties`. Confirm against the live batch endpoint which placement it reads, and remove the other if PostHog objects. `$session_id` is the browser's UUIDv7 visit id, as PostHog requires.
- **Requirements:** RELAY-03, -07, -20 and -21 are only partly closed by this plan. The relay (182-08/09) completes them, so none was marked complete here. This matches 182-05 and 182-06, whose IDs are also still pending.

## Self-Check: PASSED

- All twelve code files and `evidence/07-gates.txt` exist.
- All seven commits (`e1925d572`, `9b4a11d4c`, `a32e5a13c`, `8f7cdb1c1`, `0fe209445`, `f28add41c`, `046b4924f`) are ancestors of HEAD.
