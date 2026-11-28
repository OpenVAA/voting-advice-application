---
phase: 182-analytics-relay
plan: 15
subsystem: frontend-analytics
tags: [analytics, relay, tracking, gates, consent, survey, svelte, span]
status: complete

requires:
  - phase: 182-13
    provides: getVisitId, sendBatch, GateInput and the gate functions, createViewTracker, buildBatch and BufferedEvent
  - phase: 182-03
    provides: AnalyticsProjection, INACTIVE_PROJECTION
  - phase: 182-05
    provides: the root data member page.data.analytics
  - phase: 182-25
    provides: TrackingEventName, TrackingEventData, the generic startEvent / track signatures
  - phase: 182-11
    provides: the red-run record that must exist before the cutover
provides:
  - the rewritten tracking producer (relay transport, gates, one pageview per view, in-memory visit id, nothing stored)
  - producer members setPageVisible, gate, surveySessionId; startPageview(routeId, params)
  - AppContext.analyticsGate, AppContext.setPageVisible; the send-handler member removed from AppContext
  - evidence/15-span.txt (SPAN_START_SHA for plan 182-26)
affects: [182-26, 182-16, 182-23]

estimate:
  tokens: 80000
  tasks: 3
actuals:
  tokens: 19300     # chars/4 over the plan's source diff (77153 chars, apps/ only)
  tasks: 3
  commits: 3        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 96901eb99abf4c1d23b9fa62723f7ff0eecd47e5
plan_head_after: 47af4587e56d28565f9f647ef7a9c9e9765b1626

tech-stack:
  added: []
  patterns:
    - "A rune shell over pure modules: the class holds the inputs and one $derived gate input; the view tracker, the buffer, the batch builder and the transport do the work"
    - "Under vi.resetModules the producer gets a fresh Svelte runtime; a test that changes a producer input after construction uses a SvelteMap imported after the reset, not a $state of the test file"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/15-span.txt
    - .planning/workstreams/deployment/phases/182-analytics-relay/deferred-items.md
  modified:
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.type.ts
    - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/appContext.popupCountdown.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/appContext.settingsRemerge.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/survey.svelte.test.ts

key-decisions:
  - "TrackingHandler stays exported from trackingService.type.ts until plan 182-16 deletes the Umami component that imports it; removing it here would make plan 182-26's closing typecheck red on files neither plan may edit"
  - "track() delegates to startEvent, so both buffer through one path and there is one batch per flush"
  - "The producer's clock is performance.now(), shared by the view tracker and the buffered events' ages; tests stand it in with a spy"
  - "startPageview reads the page's visibility from document.visibilityState when a document exists, and treats a missing document as visible"

requirements-completed: [RELAY-18]   # marked at the v2.17 milestone audit (2026-11-21) from the phase VERIFICATION.md

duration: 12min
completed: 2026-10-19
---

The frontend does not typecheck from this plan's first commit until plan 182-26 is complete; run plan 182-26 next and run no frontend typecheck, lint, build or E2E of any phase in between.

# Phase 182 Plan 15: The tracking producer and the app context on the relay Summary

**The tracking producer now sends only to the same-origin relay: one keepalive request per flush, built by `buildBatch` under the gates of `gates.ts`. It sends one identifier-free pageview per view, takes the visit id from memory, and writes nothing to the device. The app context gives it the projection and the locale, fills the survey link from `surveySessionId`, clears the buffer on every consent change and forwards the gate as `analyticsGate`.**

## Performance

- **Start sha:** `96901eb99abf4c1d23b9fa62723f7ff0eecd47e5` (equal to `SPAN_START_SHA`)
- **Span attempt:** `20261019T162150Z.96901eb99abf`, file `tmp/182-evidence/15-span.20261019T162150Z.96901eb99abf.txt`
- **Span started:** 2026-10-19T17:19:46Z
- **Completed:** 2026-10-19T17:32Z
- **Tasks:** 3 of 3 (1 blocking checkpoint, 2 auto with TDD)
- **Files:** 9 source/test files modified, 2 planning files created

## Accomplishments

- **Task 1 (checkpoint).** Attempt `20261019T162150Z.96901eb99abf` was started with `SPAN_START_SHA=96901eb99abf…` and the question line. The operator replied "span may start 20261019T162150Z.96901eb99abf". The reply was recorded with four-space quoting, followed by `OPERATOR_SPAN_ACKNOWLEDGED=yes attempt=… head=96901eb99abf…`.
- **Task 2: `trackingService.svelte.ts`.** The answer check of the environment block exited 0, and `SPAN_STARTED=` was appended before the first edit. The precondition held: `11-red-unchanged.txt` has `VERDICT_EXIT=0` and is `cmp`-equal to the file `11-red.current` names.
  - The producer has four private pieces: the view tracker, an array of `BufferedEvent`, a `$derived` `GateInput`, and the locale function. The `$derived` is built from the projection handle, the Global Privacy Control signal (read once when `browser` is true), `trackEvents` and the stored consent.
  - **Flush.** `submitAllEvents` always empties the buffer. With no current view it returns. It takes the pageview only under `maySendPageview` and the buffered events only under `maySendEvents`, discarding them otherwise. It passes `getVisitId()` only in visit-id mode `memory` when events are sent, and hands a defined body to `sendBatch`.
  - **Clearing.** `resetAllEvents` empties the buffer and leaves the view alone.
  - **`surveySessionId`.** It is `getVisitId()` under `mayFillSessionId`, and `undefined` otherwise.
  - **Removed:** the persisted-state helper, the element-id helper, `purgeNullish`, the log import, the stored id, the send-handler state, the compound fold and the debug log of events.
- **Task 2: `trackingService.type.ts`.** `startPageview(routeId, params)` is in. `setPageVisible` is added. `track` is documented as buffering. `sendTrackingEvent` is gone from `TrackingService`. `TrackingHandler` is kept (see Deviations).
- **Task 2: `trackingService.svelte.test.ts`.** The harness is kept: `handle`, `importTracking`, `vi.resetModules()`, and assertions inside `$effect.root`. `./relayTransport` is mocked to record bodies, and `performance.now` is a spy.
  - It has the fifteen behaviours of the plan, the GPC variant of the survey id, a spread case, and the eight-member lock: `startPageview`, `startEvent`, `track`, `submitAllEvents`, `resetAllEvents`, `setPageVisible`, `gate`, `surveySessionId`.
  - The `sessionStorage` stub is removed. A `Storage.prototype.setItem` spy asserts that nothing is stored.
- **Task 3: `appContext.svelte.ts`.**
  - A projection handle returns `page.data?.analytics` or `INACTIVE_PROJECTION`. It is passed to `trackingService(...)` together with `getLocale` from `$lib/paraglide/runtime`.
  - `surveyLink(...)` gets `this.#tracking.surveySessionId`.
  - The selective forward is now `startPageview`, `startEvent`, `track`, `submitAllEvents`, `resetAllEvents`, `setPageVisible`, and `gate` forwarded as `analyticsGate`. `surveySessionId` is withheld, and the comment says so.
  - `setDataConsent` calls `resetAllEvents()` after the preference write for every value, and starts `dataConsent_granted` only for `granted`.
  - `readonly setPageVisible!` and `readonly analyticsGate!` are declared, and the send-handler field is removed.
- **Task 3: `appContext.type.ts`.** `analyticsGate: ReactiveHandle<GateInput>` is added. Its doc comment says to read it as `ctx.analyticsGate.current` inside a tracking scope.
- **Task 3 tests.**
  - The spread test's key list drops the send handler and gains `setPageVisible` and `analyticsGate`.
  - A new "tracking wiring" block covers five things:
    - the exact forward, by reference, with no `surveySessionId`, no `gate` and no `send*` member except `sendFeedback`;
    - the `INACTIVE_PROJECTION` fallback, through both the producer input and `analyticsGate.current.projection`;
    - the survey input being the producer's `surveySessionId`;
    - the order `userPreferences.update` → `resetAllEvents` → `startEvent:dataConsent_granted`, with the earlier event absent from the next flush;
    - the `denied` case.
  - The two other stand-ins have the producer's current members.
  - The survey test gains one case per visit-id mode, fed by the real producer.
- **Span record.** `SPAN_15_LAST_COMMIT=3730f96fc…` was appended, the attempt file was copied with `cp` to `evidence/15-span.txt`, and the copy was committed alone.

## Task Commits

1. **Task 2:** `e8dfdf4bb` feat(182-15): rewrite the tracking producer as a rune shell over the relay modules. This is the first commit on which the frontend does not typecheck.
2. **Task 3 (source):** `3730f96fc` feat(182-15): wire the app context to the relay producer
3. **Task 3 (record):** `47af4587e` docs(182-15): span record with the commit before the span and the plan's last code commit

Task 1 has no commit, by design.

## Verification

Only the scoped unit runs were made. As the plan says, no typecheck, lint, build or whole unit run was made, and none is claimed.

- **RED before each GREEN:**
  - 14 of 18 producer cases failed on the old producer. The 4 that passed are the "sends nothing" cases and the log case, which the old producer also satisfies.
  - 6 app-context cases failed before the wiring.
- `yarn workspace @openvaa/frontend test:unit src/lib/contexts/app/tracking`: exit 0, 7 files, 336 tests.
- `yarn workspace @openvaa/frontend test:unit src/lib/contexts/app`: exit 0, 12 files, 371 tests.
- The Task 2 `git grep` for `sessionStorageState`, `appContext-sessionId`, `vaaSessionId`, `sendTrackingEvent` and `__${name}` under `lib/contexts/app/tracking` exits 1 (no match).
- The Task 3 `git grep -e sendTrackingEvent -- apps/frontend/src/lib/contexts/app` exits 1 (no match).
- The Task 3 span-record verify exits 0. That covers the key-once check, the question → acknowledgement → start order, `SPAN_START_SHA` being an ancestor of `SPAN_15_LAST_COMMIT`, that commit being the last `(182-15):` code commit, and `cmp` of the tracked copy.
- No `(182-15):` commit lists a path under `lib/contexts/voter`, `lib/contexts/contestant`, `lib/contexts/admin`, `routes/` or `tests/`.
- `trackingService.svelte.ts` contains `buildBatch`, `sendBatch`, `createViewTracker` and `getVisitId`, and makes no `log.` call.
- Prettier `--check` on the nine files: clean. This is a formatting check of this plan's own files, not the lint gate.

## Left for plan 182-26

From `git grep -n -e sendTrackingEvent -e startPageview -e '.sessionId' -- apps/frontend/src`, run after Task 3. These are the readers outside `lib/contexts/app`:

- `apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts`: declares `readonly sendTrackingEvent!: AppContext['sendTrackingEvent'];` and lacks `setPageVisible` and `analyticsGate`.
- `apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts`: the same, `sendTrackingEvent` declared and the two new members missing.
- `apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts`: the same, `sendTrackingEvent` declared and the two new members missing.
- The tests of those three contexts: the derive command names none of them. `contestantContext.svelte.test.ts` is plan 182-26's file to extend; no voter or admin context test names the tracking members.
- `apps/frontend/src/lib/contexts/utils/reactiveHandle.type.ts`: its doc comment cites "the producer's `sendTrackingEvent` surface" as the example of a read+write handle.
- `apps/frontend/src/routes/+layout.svelte`:
  - It destructures `sendTrackingEvent` from `appCtx`.
  - It keeps `umamiRef` typed by `sendTrackingEvent.current` and an effect that calls `sendTrackingEvent.set(...)`.
  - It calls `startPageview(to?.url?.href ?? '', from?.url?.href)` with URLs. It must pass `to.route.id` and `to.params`.

Outside plan 182-26's paths (see `deferred-items.md`): `lib/components/analytics/umami/*` (plan 182-16 deletes it) and a stale comment in `lib/contexts/utils/persistedState.svelte.ts`.

## Deviations from Plan

**1. [Rule 3 - Blocking for plan 182-26] `TrackingHandler` is kept in `trackingService.type.ts`.**
- **Found during:** Task 2.
- **Issue:** the plan removes the type. But `lib/components/analytics/umami/UmamiAnalytics.svelte` and `UmamiAnalytics.type.ts` import it. Plan 182-26 only unmounts that component, and plan 182-16 deletes it later (wave 19, after 182-26). svelte-check checks unmounted files too, so removing the type would make plan 182-26's closing typecheck red on files neither 182-15 nor 182-26 may edit.
- **Fix:** the type stays exported. Its doc comment now says the tracking service does not use it and only the Umami component imports it. `TrackingService` no longer refers to it, and `sendTrackingEvent` is gone. Plan 182-16 should delete it with the component (recorded in `deferred-items.md`).
- **Files:** `trackingService.type.ts`. **Commit:** `e8dfdf4bb`.

**2. [Test harness] One producer case uses a `SvelteMap` handle instead of a plain `{ current }` handle.**
- **Found during:** Task 2, GREEN.
- **Issue:** `vi.resetModules()` gives the dynamically imported producer a fresh Svelte runtime. A `$state` of the test file is then not a dependency the producer's `$derived` can track, so the "consent granted later" case could not change the gate.
- **Fix:** `importTracking` returns a `reactiveHandle` built on a `SvelteMap` imported after the reset, so it shares the producer's runtime. It is used only in that case. Every other case keeps the plain `handle`.
- **Commit:** `e8dfdf4bb`.

**3. [Layout] The SUMMARY's prescribed first line is the first line of the body, directly after the YAML frontmatter, rather than line 1 of the file.** The frontmatter has to start at line 1 for the summary tooling (`status: complete`).

## Known Stubs

None. The test stand-ins in the three app-context tests are test doubles, not product stubs.

## Threat Flags

None. No new surface beyond the plan's threat model. T-182-60, T-182-61, T-182-62 and T-182-65 are mitigated as planned, each with a unit case. T-182-63 is closed at the producer, and the root layout half is plan 182-26's.

## Next

Plan 182-26 runs directly after this plan, with nothing in between. It reads `SPAN_START_SHA=96901eb99abf4c1d23b9fa62723f7ff0eecd47e5` from `evidence/15-span.txt`. The executors of phases 181 and 183 stay held until plan 182-26 reports "The span is over" or "The span was reverted".

## Self-Check: PASSED

- FOUND: all nine modified source/test files, `evidence/15-span.txt`, `deferred-items.md`.
- FOUND commits: `e8dfdf4bb`, `3730f96fc`, `47af4587e` (each an ancestor of HEAD).
