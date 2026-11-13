---
phase: 182-analytics-relay
plan: 09
subsystem: frontend-analytics
tags: [analytics, relay, endpoint, privacy, source-scan, production-build, posthog-standin]
status: complete

requires:
  - phase: 182-08
    provides: relay (relay.ts), createQueue and registerShutdownFlush (queue.ts)
  - phase: 182-07
    provides: createProvider and ProviderDeps (providers/index.ts)
  - phase: 182-05
    provides: analyticsConfig (env.ts), the start-up rule analyticsStartupProblems
  - phase: 182-03
    provides: RELAY_PATH (constants.ts), PAGEVIEW_ROUTES
provides:
  - apps/frontend/src/routes/api/usage/+server.ts (POST /api/usage)
  - apps/frontend/src/lib/server/analytics/runtime.ts (handleUsageRequest; the process's one provider and queue)
  - apps/frontend/src/lib/server/analytics/noAddressOrAgent.test.ts (the standing source scan)
  - evidence/09-production-relay.txt (the production-build observation)
affects: [182-11, 182-14, 182-15, 182-20, 182-22, 182-28, 185, 188]

start_sha: 84c848e43bcaaafcaf039263166f0052cdbcdb15
actuals:
  tokens: 4200      # chars/4 over the code diff of this plan (16852 chars, four files)
  tasks: 3
  commits: 4        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 84c848e43bcaaafcaf039263166f0052cdbcdb15
plan_head_after: 61c2d040ec5310d66a9865ed62bbfefc7aae0d65

tech-stack:
  added: []
  patterns:
    - "A thin endpoint that destructures only request and url and answers new Response(null, { status })"
    - "The process's analytics runtime is built once at module scope; provider none builds no queue, no timer and no listener"
    - "A source scan over named roots with a per-root non-vacuity check, an asserted exclusion rule and an in-memory control"

key-files:
  created:
    - apps/frontend/src/lib/server/analytics/runtime.ts
    - apps/frontend/src/routes/api/usage/+server.ts
    - apps/frontend/src/routes/api/usage/server.test.ts
    - apps/frontend/src/lib/server/analytics/noAddressOrAgent.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/09-production-relay.txt
  modified: []

key-decisions:
  - "The shutdown flush is attached with registerShutdownFlush(queue): lib/server/startup/shutdown.ts is not tracked, so there is no onShutdown to register through"
  - "With provider none the runtime builds nothing and hands the relay an enqueue that keeps nothing"
  - "The runtime passes globalThis.fetch bound to globalThis, a write that calls process.stdout.write, and crypto.randomUUID"
  - "The route test reads the event through a Proxy that throws on every member but request and url, which is stricter than throwing on getClientAddress and cookies alone"
  - "The scan's fixture exclusion is the full source path lib/analytics/events.fixtures.ts, not a basename, so a same-named file elsewhere is scanned"

requirements-completed: [RELAY-03, RELAY-06, RELAY-21]

duration: ~7 min
completed: 2026-10-19
---

# Phase 182 Plan 09: The usage endpoint, the source scan and the production-build observation Summary

**`POST /api/usage` is a three-line adapter over `handleUsageRequest(request, url.origin)`, which runs the relay against one process-wide queue; a standing Vitest scan forbids address, user-agent, forwarded-address and hash code in all four analytics roots; and the production build was seen answering 204/403/413/415, writing two structured lines with provider `log`, nothing with `none` on the same build, and one clean `POST /batch/` to a PostHog stand-in, with the event sent just before `SIGTERM` still delivered.**

## What was built

- `runtime.ts`: builds the provider and the queue once, at module scope, from `analyticsConfig`. With provider `none` it builds nothing and passes `() => 0`. Otherwise it calls `createProvider(analyticsConfig, { fetch, write, randomId })` and `createQueue({ provider })`, then `registerShutdownFlush(queue)`. `fetch` is `globalThis.fetch.bind(globalThis)`, `write` calls `process.stdout.write`, and `randomId` calls `crypto.randomUUID()`. It exports `handleUsageRequest(request, origin)`, which returns the relay's status.
- `routes/api/usage/+server.ts`: `POST({ request, url }: RequestEvent)` calls `handleUsageRequest(request, url.origin)` and returns `new Response(null, { status })`. It has no `json`, no `error`, no condition and no other member of the event. Its TSDoc says the body is always empty, so a dropped request cannot be told from an accepted one.
- `noAddressOrAgent.test.ts`: scans the non-test source under `lib/server/analytics`, `lib/analytics`, `lib/contexts/app/tracking` and `routes/api/usage`. It forbids ten case-insensitive tokens: `getClientAddress`, `user-agent`, `userAgent`, `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`, `true-client-ip`, `createHash`, `createHmac` and `subtle.digest`. The file asserts, in order:
  - each of the four roots has at least one scanned file;
  - the exclusion rule keeps application source in the scan;
  - the scan finds nothing;
  - the same `findForbidden(text, label)` reports each token when given an in-memory fixture.

## Tests

- `server.test.ts` (9): each of 204, 400, 403, 413 and 415 comes back with a null body and empty text; the call passes exactly `(request, origin)`; the endpoint reads only `request` and `url` (the Proxy throws on any other member); a control shows the event really throws on `getClientAddress` and `cookies`; and the route directory equals `routes` plus `RELAY_PATH` and holds `+server.ts`.
- `noAddressOrAgent.test.ts` (18): 4 non-vacuity checks, 2 checks on the exclusion rule, 1 scan, 10 per-token controls and 1 negative control.
- Mutation check, not committed: one `x-forwarded-for` line added to `+server.ts` turned the scan red, naming `routes/api/usage/+server.ts:17`. The file was restored with `git checkout --` on that one file.
- Plan verify 1: `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics src/routes/api/usage` exited 0 (8 files, 189 tests).
- Plan verify 2 (the gate record check) exited 0.

## Production-build observation (evidence/09-production-relay.txt)

Attempt `20261019T114415Z.8b75341d1`, `GATE_HEAD` = `GATE_HEAD_AFTER` = `8b75341d1`, tree clean before and after: `BUILD_EXIT=0` (`yarn build`, 14/14 turbo tasks, private cache), `TYPECHECK_EXIT=0`, `LINT_EXIT=0`. Every server ran from `apps/frontend/build` with a cleared environment (`env -i`) on a free loopback port, with `PUBLIC_SUPABASE_URL=http://127.0.0.1:9`.

1. **`log`:** the request got 204. Standard output then held exactly two lines: `"msg":"pageview"` (routeId `/(voters)/about`, locale `en`, duration 5000, params `{}`) and `"msg":"menu_open"`. Both had `"openvaa.app":"voter"`. Neither output file contained `ua-planted-zz9plural` or `203.0.113.77`.
2. **Same server:** with `Sec-GPC: 1` the answer was 204 and no line was added (2 lines before, 2 after). `Sec-Fetch-Site: cross-site` got 403, the 40000-byte body got 413, and `text/plain` got 415.
3. **`none`, same build:** the request got 204 and no line was written. The `stat` timestamps of `build`, `build/index.js` and `build/handler.js` were the same before the `log` start and after the `none` start, so the provider changed without a rebuild.
4. **`posthog` against a stand-in:** the stand-in recorded one `POST /batch/`. Its headers were `content-type: application/json` plus undici defaults (`user-agent: node`, `accept-language: *`, `sec-fetch-mode: cors`). Neither planted value appeared in the stand-in's record or in either server output file. Each item had `$process_person_profile=false` and `$geoip_disable=true`, and the pageview and `menu_open` items had different random `distinct_id`s.
   - **At `SIGTERM`:** one more request (204), then `SIGTERM` at once. The stand-in went from 1 to 2 requests, so the shutdown flush delivered the event, and the server exited with code 0.
5. **`posthog` with no key:** phase 181's `init` check is in the tree and wired. First `hooks.server.ts` logged one error record naming `ANALYTICS_POSTHOG_KEY` (`reason: missing`). Then `init` threw `Required environment variables are not set: ANALYTICS_POSTHOG_KEY`, and the process exited with code 1 without listening.

After the run, none of the five ports used had a listener. The stand-in, the request bodies, the scripts and the server output files are all under the ignored `tmp/182-evidence/`.

## Deviations from Plan

### Interpretations recorded

- **The order of keys in the record:** the plan lists the keys first and the date and observations after. In the record, `BUILD_EXIT` comes before the observations, and `TYPECHECK_EXIT`, `LINT_EXIT` and the second sample come after them, because each key was written when its step finished. Each key is still written once, and the verify does not depend on order.
- **The build's environment:** a root `.env` exists in this checkout, so no example values were passed to `yarn build` (the plan passes them only when no root `.env` exists). The root `.env` was neither read nor printed. The production servers ran under `env -i`, with only the variables named in the plan plus `HOST`, `NODE_ENV=production`, `PATH` and `HOME`.
- **A formatting flaw in the record:** the request-body file has no trailing newline, so the quoted body line and the "Oversized body: 40000 bytes." line run together on one indented line. Nothing was edited after the run, because the record must equal the attempt file.
- **Requirements closed:** the plan lists RELAY-01, -03, -06, -10 and -21. This plan closes RELAY-03 (provider by configuration, `none` by default, changed by a restart, seen on the production build), RELAY-06 (the standing scan over the browser and server analytics roots, with its control) and RELAY-21 (structured lines on the production server's standard output). It leaves open:
  - RELAY-01: "never blocks the interface" is the browser transport, which the browser does not use until 182-15. 182-20 and 182-28 carry it.
  - RELAY-10: the `trackEvents` half is browser-side, in 182-15 and 182-19.
  - The other open ids the 182-08 note listed (-07, -08, -13, -15, -16, -17) are not on this plan's list, so they stay open.

### Auto-fixed Issues

None. Typecheck and lint were green on the first attempt.

## TDD Gate Compliance

- Task 1: `9d9e85659` (test) failed because `./+server` was missing. `4a547a349` (feat) turned it green with 9 tests.
- Task 2: the guard is a test-only file over a tree that is already clean, so it had no failing state of its own on the unchanged tree. The in-memory control cases and the uncommitted mutation above show that it can fail.

## Known Stubs

None.

## Threat Flags

None. The endpoint is the surface the plan's threat model names (T-182-36 to T-182-40), and each mitigation was applied and observed.

## Notes for Later Plans

- **182-11 (the operator's stack window before the cutover):** this plan changes nothing that its E2E runs see. The browser still sends to the old path until 182-15, so `/api/usage` gets no traffic from the suite, and the red and baseline runs are not affected. The dev server serves the new route under whatever `ANALYTICS_PROVIDER` the run sets.
- **Re-running this observation:** the ignored scratch script `tmp/182-evidence/09-gates.20261019T114415Z.8b75341d1.observe.sh` (stand-in: `…standin.mjs` beside it) can be run again after `yarn build`, with no Supabase stack needed. It appends to its own attempt file, so copy it under a new attempt id first. The tracked record `evidence/09-production-relay.txt` holds what was seen.
- **182-15 (browser transport):** post to `RELAY_PATH` with `Content-Type: application/json` and `credentials: 'omit'`. A browser `fetch` sends `Sec-Fetch-Site: same-origin` and `Origin` on a same-origin POST, which the relay requires.
- **185 / 188 (deployed stack):** on adapter-node, the `SIGTERM` flush delivered the last event and the process exited 0. adapter-node waits for open connections to close before it emits `sveltekit:shutdown`, so a long-lived keep-alive from a proxy may delay it. Measure this behind the load balancer.
- **188 (PostHog):** the onward request carries undici's default `user-agent: node` and `accept-language: *`, not the visitor's. Expect PostHog to classify these events by that user agent.
- **Shutdown wiring:** if phase 181 later adds `lib/server/startup/shutdown.ts` with a single listener, change `runtime.ts` to register through its `onShutdown` and remove the `registerShutdownFlush` call. Do not install both.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/server/analytics/runtime.ts, apps/frontend/src/routes/api/usage/+server.ts, apps/frontend/src/routes/api/usage/server.test.ts, apps/frontend/src/lib/server/analytics/noAddressOrAgent.test.ts, evidence/09-production-relay.txt
- FOUND commits: 9d9e85659, 4a547a349, 8b75341d1, 61c2d040e
