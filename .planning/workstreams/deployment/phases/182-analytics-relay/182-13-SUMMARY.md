---
phase: 182-analytics-relay
plan: 13
subsystem: frontend-analytics
tags: [analytics, relay, tracking, gates, pageview, keepalive, privacy, vitest]
status: complete

requires:
  - phase: 182-03
    provides: RELAY_PATH, MAX_BATCH_EVENTS, MAX_BATCH_BYTES (constants.ts); createUuidV7 (uuidv7.ts); AnalyticsProjection (modes.ts); isPageviewRoute, allowedPageviewParams (pageviewRoutes.ts)
  - phase: 182-04
    provides: EventSchema, EventName, WireEvent, isSensitiveEvent (events.schema.ts); parseBatch (batch.schema.ts); VALID_EVENTS (events.fixtures.ts)
  - phase: 182-07
    provides: wave ordering only
provides:
  - apps/frontend/src/lib/contexts/app/tracking/visitId.ts (getVisitId, resetVisitIdForTests)
  - apps/frontend/src/lib/contexts/app/tracking/relayTransport.ts (sendBatch)
  - apps/frontend/src/lib/contexts/app/tracking/gates.ts (GateInput, isGlobalPrivacyControlSet, relayUsable, maySendPageview, maySendEvents, shouldShowVoterPrompt, shouldShowContestantOptOut, mayAttachVisitId, mayFillSessionId)
  - apps/frontend/src/lib/contexts/app/tracking/viewTracker.ts (View, PageviewDraft, createViewTracker)
  - apps/frontend/src/lib/contexts/app/tracking/batchBuilder.ts (BufferedEvent, buildBatch)
affects: [182-14, 182-15, 182-25]

estimate:
  tokens: 90000
  tasks: 3
actuals:
  tokens: 10600     # chars/4 over the ten source and test files of this plan (42403 chars)
  tasks: 3
  commits: 7        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 32081efb99f4f00d8d508b80c242a728b475286d
plan_head_after: 9f0d2e2f5c4b865c0d6a81549b39cdf17d183ac1

tech-stack:
  added: []
  patterns:
    - "Browser tracking rules as pure modules with injected inputs (projection, signal, clock), so the rune service can become a thin shell"
    - "A gate test that pairs a hand-written table with a sweep over every combination of inputs"
    - "Byte cap computed incrementally from per-event JSON sizes plus separators, dropping from the end"

key-files:
  created:
    - apps/frontend/src/lib/contexts/app/tracking/visitId.ts
    - apps/frontend/src/lib/contexts/app/tracking/visitId.test.ts
    - apps/frontend/src/lib/contexts/app/tracking/relayTransport.ts
    - apps/frontend/src/lib/contexts/app/tracking/relayTransport.test.ts
    - apps/frontend/src/lib/contexts/app/tracking/gates.ts
    - apps/frontend/src/lib/contexts/app/tracking/gates.test.ts
    - apps/frontend/src/lib/contexts/app/tracking/viewTracker.ts
    - apps/frontend/src/lib/contexts/app/tracking/viewTracker.test.ts
    - apps/frontend/src/lib/contexts/app/tracking/batchBuilder.ts
    - apps/frontend/src/lib/contexts/app/tracking/batchBuilder.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/13-gates.txt
  modified: []

key-decisions:
  - "buildBatch sends each event in its EventSchema-parsed form, so transforms such as the video src query-string cut are applied in the browser too"
  - "buildBatch checks the pageview against the schema as well; caps never drop it, but a schema-failing pageview would be left out"
  - "ago is Math.max(0, Math.round(now - at)), so a clock that gives fractional milliseconds still yields a whole number"
  - "The view tracker keeps the view after its pageview is taken, so events buffered later still have a route id and locale for the envelope"
  - "start with a null or unlisted route id clears any previous view, so nothing is sent for the unlisted one"
  - "currentView and takePageview return copies, so a caller cannot change the stored view"

requirements-completed: []

duration: 6min
completed: 2026-10-19
---

# Phase 182 Plan 13: The browser side of the tracking path as pure modules Summary

**Five pure modules now hold the browser's tracking rules, each with tests:**

- **`getVisitId`:** a UUIDv7 kept only in a module variable. A spy on `Storage.prototype.setItem` and on the `document.cookie` setter shows nothing is written.
- **`sendBatch`:** one `fetch` to `RELAY_PATH` with `POST`, `keepalive: true`, `credentials: 'omit'` and only `Content-Type: application/json`. It drops both a rejected send and a synchronous throw without a console error.
- **The eight gate predicates:** each is pure, and one table pins them. Hand-written rows sit beside a sweep over all 256 input combinations.
- **`createViewTracker`:** each view gives exactly one pageview, whose duration counts only visible time. Only allowlisted params are kept, so the results route's entity id is never stored.
- **`buildBatch`:** round-trips through `parseBatch` with `dropped: 0` and the pageview first. The pageview never carries an id. The visit id goes only on events the modes allow. An event that fails the schema is left out. The 50-event cap and the 16 KiB UTF-8 byte cap are applied by dropping from the end.

No existing file was edited, and the running application is unchanged.

## Performance

- **Start sha:** `32081efb99f4f00d8d508b80c242a728b475286d`
- **Started:** 2026-10-19T11:07:34Z
- **Completed:** 2026-10-19T11:14Z
- **Tasks:** 3 of 3 (all auto, TDD)
- **Files:** 10 source and test files created, plus the gate record

## Accomplishments

- **Task 1.**
  - `visitId.test.ts` checks four things: the id is a UUIDv7, it is stable across calls, a reset gives a new value, and nothing is written to a storage or cookie spy. The last case also checks that `sessionStorage` and `localStorage` stay empty.
  - `relayTransport.test.ts` checks the exact `fetch` call. It also checks that a rejecting `fetch` raises no `unhandledRejection` on `process` and no `console.error`, and that a synchronously throwing `fetch` does not throw and logs nothing.
  - `relayTransport.ts` contains `keepalive: true`, `credentials: 'omit'` and `RELAY_PATH`, and not the literal `'/api/usage'`. `visitId.ts` imports only `createUuidV7`.
- **Task 2.**
  - `gates.test.ts` has 14 hand-written rows giving every gate's expected value, plus the full sweep. The sweep covers: active and inactive, `gated` and `free`, `memory` and `none`, the signal on and off, `trackEvents` on and off, the three consent values plus `undefined`, and whether the voter app is accessible.
  - The sweep also asserts that `maySendPageview` equals `relayUsable` in every row. `mayAttachVisitId` has its own 8-row table, and `isGlobalPrivacyControlSet` covers `true`, `false`, `undefined`, `'1'`, `{}` and no argument.
  - `gates.ts` has no `navigator.` or `window.`, and the signal is compared with `=== true`.
  - `viewTracker.test.ts` drives hidden, visible, hidden and navigate, and asserts one draft in total. It also covers:
    - hidden time is excluded
    - a view started hidden counts only from when it becomes visible
    - a repeated visibility report changes nothing
    - durations are whole milliseconds
    - a null or unlisted route leaves no view
    - the results route's `id` is absent from both the draft and `currentView()`
    - null params are treated as none
    - the view is kept after a take
    - a new view after a take can be taken once
    - a returned view cannot be changed by the caller
- **Task 3.**
  - `batchBuilder.test.ts` round-trips through `parseBatch`. It checks that the pageview has no `id` under all four mode pairs, and covers the four visit-id cases of the behaviour block.
  - It also checks: `ago` is clamped at 0; a schema-failing event is left out, and its marker text is not in the body; 60 buffered events give 50 with the pageview first.
  - For the byte cap, it checks that the uncapped body would exceed 16 KiB, the result fits, dropping happens from the end, and the next dropped event would not have fitted. A separate case uses multibyte text to show the cap is counted in UTF-8 bytes, not characters. Two cases return undefined.
  - `batchBuilder.ts` contains `mayAttachVisitId`, `isSensitiveEvent`, `MAX_BATCH_EVENTS` and `MAX_BATCH_BYTES`.

## Task Commits

1. Task 1 RED: `94681e302` test(182-13): the in-memory visit id and the keepalive relay transport
2. Task 1 GREEN: `bda683559` feat(182-13): the in-memory visit id and the keepalive relay transport
3. Task 2 RED: `a07cd9228` test(182-13): the browser gates and the one-pageview-per-view tracker
4. Task 2 GREEN: `143180d4a` feat(182-13): the browser gates and the one-pageview-per-view tracker
5. Task 3 RED: `91618f060` test(182-13): the batch builder's id rules, schema check and caps
6. Task 3 GREEN: `3e62998d1` feat(182-13): the batch builder for one flush
7. Gate record: `9f0d2e2f5` docs(182-13): the closing typecheck and lint gate record

`git show --stat` on each of the six code commits lists only files among the ten source and test files of `files_modified`.

## Verification

- `yarn workspace @openvaa/frontend test:unit src/lib/contexts/app/tracking` exits 0: 6 files and 325 tests. This includes the existing `trackingService.svelte.test.ts`.
- Closing gates ran on `3e62998d1` (attempt `20261019T111259Z.3e62998d1`). The tree was clean before and after, and HEAD was unchanged. Results: `TYPECHECK_EXIT=0` (svelte-check: 3048 files, 0 errors, 0 warnings) and `LINT_EXIT=0`.
- `evidence/13-gates.txt` is a `cmp`-equal copy of the attempt file, and the plan's record verify exits 0.

## TDD Gate Compliance

Each task has a `test(182-13)` commit before its `feat(182-13)` commit. Each RED run exited 1 with "Failed to resolve import" for the module under test. The GREEN runs passed: 7 tests for Task 1, 293 for Task 2, and 325 across the directory after Task 3. No REFACTOR commit was needed.

## Deviations from Plan

**1. [Rule 3 - Lint/format] Two test files were adjusted inside their GREEN commits.**
- In `viewTracker.test.ts`, an arrow-function `const take` became a function declaration, as `func-style` requires.
- `gates.test.ts` was reformatted by Prettier.
- In `batchBuilder.test.ts`, the import order was fixed by `simple-import-sort`, and one assertion was added before GREEN: the next dropped event would not have fitted.

Each change is in a file this plan owns.

**2. [Addition] Tests beyond the behaviour block.** These were added to pin edge cases the service will hit:
- a view that starts hidden
- a repeated visibility report
- fractional clock values
- a lone pageview
- the UTF-8-versus-characters byte-cap case
- caller-proof copies of the view

**3. [Reading] The schema check also covers the pageview.** The plan says each event is checked before it is added. The pageview is checked too. Its params come from the allowlist, so it always passes in practice. The caps still never drop it.

## Notes for Later Plans

- **182-15 (service shell):**
  - Pass `now: () => performance.now()` to `createViewTracker`, and use the same clock for `BufferedEvent.at` and for `buildBatch`'s `now`, because `ago` is computed from their difference.
  - Call `start(...)` from `afterNavigate`, and again on `pageshow` when `persisted`. Call `setVisible` from `visibilitychange`.
  - At each flush, call `takePageview()` (only when `maySendPageview`), then `buildBatch`, then `sendBatch`.
  - At navigation, flush with the old view before calling `start` for the new one. The envelope uses `view`, and a pageview draft must belong to that view.
  - Pass `getVisitId()` as `visitId` only when `maySendEvents`. `buildBatch` itself decides which events may carry it.
- **182-14 / 182-25:** `BufferedEvent.attributes` is `Record<string, JSONData>`. Events must not hold `undefined` attribute values, or the strict schema will drop them. `buildBatch` sends the parsed form of each event.
- **Requirements:** RELAY-02, -05, -11, -15, -16, -17 and -18 are only partly closed by this plan. They are completed when 182-15 wires these modules into the service, so none was marked complete here, matching 182-07.

## Known Stubs

None.

## Threat Flags

None. The plan's threat register covers every surface: T-182-50 to T-182-55 are each mitigated by the code and tests above.

## Self-Check: PASSED

- FOUND: all ten source and test files and `evidence/13-gates.txt`
- FOUND: `94681e302`, `bda683559`, `a07cd9228`, `143180d4a`, `91618f060`, `3e62998d1` and `9f0d2e2f5` are ancestors of HEAD
