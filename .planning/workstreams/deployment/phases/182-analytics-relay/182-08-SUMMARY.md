---
phase: 182-analytics-relay
plan: 08
subsystem: frontend-analytics
tags: [analytics, relay, queue, privacy, sec-gpc, same-origin, vitest]
status: complete

requires:
  - phase: 182-04
    provides: parseBatch (batch.schema.ts), WireEvent and isSensitiveEvent (events.schema.ts), VALID_EVENTS (events.fixtures.ts)
  - phase: 182-03
    provides: MAX_BODY_BYTES, MAX_VISIT_ID_SKEW_MS, MAX_PAGEVIEW_DURATION_MS, PAGEVIEW_DURATION_ROUNDING_MS, RELAY_PATH (constants.ts); uuidv7, isUuidV7, uuidV7TimestampMs; allowedPageviewParams; appOfRoute
  - phase: 182-05
    provides: AnalyticsConfig (lib/server/analytics/config.ts)
  - phase: 182-07
    provides: AnalyticsProvider (providers/index.ts)
  - phase: 182-25
    provides: wave ordering only
provides:
  - apps/frontend/src/lib/server/analytics/queue.ts (createQueue, registerShutdownFlush, EventQueue, ShutdownTarget)
  - apps/frontend/src/lib/server/analytics/relay.ts (relay, RelayInput, RelayDeps, RelayStatus)
affects: [182-09, 182-14, 188]

start_sha: 19ad2bb645942048c1a3fb2ae201d674788b9eb9
actuals:
  tokens: 11800     # chars/4 over the four code files of this plan (47300 chars of diff)
  tasks: 2
  commits: 6        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 19ad2bb645942048c1a3fb2ae201d674788b9eb9
plan_head_after: bf04e37e07251dc20a175b3354e0a869893cbcac

tech-stack:
  added: []
  patterns:
    - "The relay is a pure async function over a standard Request plus injected config, enqueue and clock; the route only adapts it"
    - "A bounded queue created by a factory, with an unref'd timer and a once-listener for sveltekit:shutdown"
    - "Every privacy detector is a single function used by the real case and by a deliberately wrong control"

key-files:
  created:
    - apps/frontend/src/lib/server/analytics/queue.ts
    - apps/frontend/src/lib/server/analytics/queue.test.ts
    - apps/frontend/src/lib/server/analytics/relay.ts
    - apps/frontend/src/lib/server/analytics/relay.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/08-gates.txt
  modified: []

key-decisions:
  - "The body is read as a stream and the read is cancelled as soon as the byte count passes MAX_BODY_BYTES (413); a stream error or a body that is not UTF-8 is 400"
  - "A batch whose envelope is valid but whose every event fails the vocabulary answers 204 and calls enqueue not at all"
  - "Sec-Fetch-Site decides alone when present: only same-origin passes, so none, same-site and cross-site are 403 whatever Origin says"
  - "The queue logs one warn record with the dropped count at the next flush; the relay logs one debug record with the parser's dropped count; neither logs a value"
  - "registerShutdownFlush stops the timer and starts one flush; adapter-node does not wait for it, so the last flush is best effort"

requirements-completed: []

duration: ~25 min
completed: 2026-10-19
---

# Phase 182 Plan 08: The relay function and the bounded queue Summary

**A pure `relay(request, origin, config)` that reads five named headers and the capped body, refuses with 403/413/415/400, drops Sec-GPC and provider-none requests silently, rebuilds every event (pageview from route id, locale, allowlisted params and a capped, rounded duration, never an id), applies the visit-id rules by mode, and enqueues without waiting; plus a bounded, timer-flushed queue with a once-only `sveltekit:shutdown` flush.**

## What was built

- `queue.ts`: `createQueue({ provider, maxSize = 1000, batchSize = 100, flushIntervalMs = 2000 })` returns a fresh queue each call. `enqueue` is synchronous, keeps what fits under the cap and counts the rest; `flush` takes the whole queue, sends it in order in slices, swallows a rejecting provider and never rejects; the interval timer is `unref`'d and cleared by `stop`. `registerShutdownFlush(queue, target = process)` attaches one `once` listener for `sveltekit:shutdown` that stops the timer and flushes.
- `relay.ts`: the seven steps in order, each returning as soon as it decides: provider `none` (204, request untouched); `Sec-GPC` (204, nothing kept); `Sec-Fetch-Site`, then `Origin` against the server's origin (403); media type `application/json` (415); declared `Content-Length` and the streamed byte count against `MAX_BODY_BYTES` (413); `JSON.parse` and `parseBatch` (400); `appOfRoute` of the envelope's route id (400 when undefined); then one `enqueue` call and 204.
- Event building: `time = now() - ago` from one clock reading; `app` from the route id; the pageview's attributes are exactly `routeId`, `locale`, `duration`, `params` (re-filtered by `allowedPageviewParams`); every other event keeps its parsed attributes and keeps its id only in `memory` mode, not when sensitive under `free`, and only as a UUIDv7 stamped within `MAX_VISIT_ID_SKEW_MS` of the clock (a NaN timestamp also removes it).

## Tests

- `queue.test.ts` (11): drop-when-full with the count-only warning, ordered slices, empty flush, rejecting provider, enqueue never calls the provider, fake-timer flush at exactly the interval, stopped timer, no shared state, shutdown on a stand-in emitter (once only, listener removed) and on `process`.
- `relay.test.ts` (44): one case per status; ten same-origin cases; the pageview build, clamp, rounding and id strip; every id rule over the whole vocabulary; the skew edges; planted values in `X-Forwarded-For`, `Forwarded`, `X-Real-IP`, `CF-Connecting-IP`, `True-Client-IP`, `User-Agent`, `Cookie`, `Authorization`, `Referer`, `Accept-Language` and `Sec-CH-UA` (each confirmed present on the request first) absent from queued events and every logger and console call.
- Controls, each through the same detector as its real case: the leaky wrapper that copies the user agent is reported by `plantedValuesIn`; the variant that awaits the provider is reported by `answersBeforeProviderResolves`; the request without `Sec-GPC` and the same request with provider `log` reach the queue by `reachesQueue`.
- Mutation check, not committed: removing the Sec-GPC step, the params re-filter, the skew check, the free-mode sensitive strip, or loosening the byte cap each turned the relay suite red (1 or 2 failures each); the restored file is green.

## Gates

- Plan verify 1: `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics`: exit 0, 6 files, 162 tests.
- Plan verify 2 (the gate record check): exit 0.
- `evidence/08-gates.txt`, attempt `20261019T113817Z.120d72840`, on HEAD `120d72840`, tree clean before and after: `TYPECHECK_EXIT=0`, `LINT_EXIT=0`.
- The first attempt `20261019T113648Z.449ad0fff` had `TYPECHECK_EXIT=1` (see deviation 3); it is kept under `tmp/182-evidence/` and not used.
- `git grep -i` for `getClientAddress`, `createHash`, `createHmac`, `subtle.digest`, `x-forwarded-for` and `user-agent` over `relay.ts` and `queue.ts` prints nothing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical functionality] The body is read as a capped stream, not with `request.text()`**
- **Found during:** Task 2
- **Issue:** the plan says to read the body as text and answer 413 when its byte length is above the cap. Reading the whole text first lets a body with no declared length make the server hold all of it before the check.
- **Fix:** `readBody` reads the stream chunk by chunk and cancels it as soon as the count passes `MAX_BODY_BYTES`. It decodes strict UTF-8, and a stream error or invalid UTF-8 is 400. A test checks that the cap counts bytes, not characters.
- **Files modified:** `apps/frontend/src/lib/server/analytics/relay.ts`
- **Commit:** 449ad0fff

**2. [Rule 2 - Missing critical functionality] The queue's slice size is never below one**
- **Found during:** Task 1
- **Issue:** a `batchSize` of 0 or a fraction would make the flush loop spin forever.
- **Fix:** the slice size is `Math.max(1, Math.floor(batchSize))`.
- **Files modified:** `apps/frontend/src/lib/server/analytics/queue.ts`
- **Commit:** 7688a3afe

**3. [Rule 1 - Bug] The default-target shutdown test did not typecheck**
- **Found during:** the closing typecheck gate
- **Issue:** `process.emit('sveltekit:shutdown')` matches none of Node's typed `process.emit` overloads. Vitest strips types, so the test passed, but svelte-check failed.
- **Fix:** the test emits through `const emitter: EventEmitter = process`. A new gate attempt ran on the fix commit.
- **Files modified:** `apps/frontend/src/lib/server/analytics/queue.test.ts`
- **Commit:** 120d72840

### Interpretations recorded

- **All events invalid:** step 7 says to call `enqueue` once with the built events. When the envelope is valid but every event is dropped, the relay answers 204 and does not call `enqueue` with an empty list.
- **An id that is not a UUIDv7:** the vocabulary's `VisitIdSchema` already drops such an event whole, before the relay's own check. The relay's `isUuidV7` check stays as a backstop. The test asserts that the event and its id never reach the queue.
- **`Sec-Fetch-Site: none`:** this is 403. Only `same-origin` passes, as the plan's rule reads.
- **Import order:** the RED test commit of Task 1 had an import-order lint error. The GREEN commit fixed it with `eslint --fix`.

## TDD Gate Compliance

Each task has a `test(182-08)` commit with the suite seen failing on the missing module, then a `feat(182-08)` commit that turns it green: 13ddc00a5 then 7688a3afe for the queue, and 8e38f7ea0 then 449ad0fff for the relay. No refactor commit was needed.

## Known Stubs

None.

## Notes for Later Plans

- **182-09 (route):** call `relay({ request, origin: url.origin }, { config: analyticsConfig, enqueue: queue.enqueue })` and answer `new Response(null, { status })`. Build one queue at module scope in runtime.ts with `createQueue({ provider: createProvider(analyticsConfig, { fetch, write, randomId }) })`, and call `registerShutdownFlush(queue)` once. The relay reads the body itself, so the route must not read it first. adapter-node's own `BODY_SIZE_LIMIT` still applies before the relay's 32 KiB cap.
- **182-09 / 182-14:** with provider `none` the relay never touches the request, so a route that wants to skip building the queue can rely on that.
- **Requirements:** RELAY-01, -06, -07, -08, -13, -15, -16 and -17 are closed at unit level only. The route (182-09) and the E2E plans complete them, so none was marked complete here, as in 182-05 and 182-07.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/server/analytics/queue.ts, queue.test.ts, relay.ts, relay.test.ts, evidence/08-gates.txt
- FOUND commits: 13ddc00a5, 7688a3afe, 8e38f7ea0, 449ad0fff, 120d72840, bf04e37e0
