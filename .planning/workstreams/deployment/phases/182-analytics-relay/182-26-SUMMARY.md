---
phase: 182-analytics-relay
plan: 26
subsystem: frontend-analytics
tags: [analytics, relay, tracking, contexts, root-layout, span]
status: complete

requires:
  - phase: 182-15
    provides: AppContext.setPageVisible, AppContext.analyticsGate, startPageview(routeId, params); the send-handler member removed; SPAN_START_SHA in evidence/15-span.txt
provides:
  - the three app contexts declaring exactly the tracking members the app context forwards
  - the root layout starting views by route id and parameters, flushing on navigation, on hidden and on pagehide, and starting a new view on a back/forward-cache pageshow
  - the third-party analytics component unmounted
  - evidence/26-gates.txt (typecheck, whole frontend unit run, lint and build green on fc57b160b)
affects: [182-16, 182-17, 182-23]

estimate:
  tokens: 60000
  tasks: 2
actuals:
  tokens: 4200      # chars/4 over the plan's source diff (16910 chars, apps/ only)
  tasks: 2
  commits: 4        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: ac558361e0580f7bc8d48a9bea4905c9a06fe28b
plan_head_after: 654c1f5b5ec983a7a9f299cf486d676979e58e14

tech-stack:
  added: []
  patterns:
    - "A page-lifecycle effect keyed on a $derived boolean read through appCtx.analyticsGate.current, so a change of consent does not re-register the listeners"
    - "A stand-in app context whose tracking members are one hoisted reference each, so a test can compare what a downstream context holds with what the app context forwards"

key-files:
  created:
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/26-gates.txt
  modified:
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
    - apps/frontend/src/lib/contexts/contestant/contestantContext.svelte.test.ts
    - apps/frontend/src/lib/contexts/utils/reactiveHandle.type.ts
    - apps/frontend/src/routes/+layout.svelte
    - apps/frontend/src/lib/contexts/app/tracking/gates.ts

key-decisions:
  - "isGlobalPrivacyControlSet takes any object and looks globalPrivacyControl up with `in`: the DOM Navigator type does not declare the property, so the weak-type parameter failed the closing typecheck on the producer's call"
  - "The root layout's lifecycle listeners are registered while analyticsGate.current.projection.active is true, read through a $derived boolean so that a consent change does not tear them down and re-add them"
  - "TrackingHandler stays exported from trackingService.type.ts until plan 182-16 deletes the Umami directory (operator-level decision, carried from 182-15)"

requirements-completed: []   # left to the orchestrator; see Next

duration: 15min
completed: 2026-10-19
---

The span is over: the frontend typechecks and builds again from commit fc57b160b1739fea42f8f2572a4494c2d4403f22; the executors of phases 181 and 183 are no longer held.

# Phase 182 Plan 26: The app contexts and the root layout on the relay Summary

**The voter, contestant and admin contexts declare `setPageVisible` and `analyticsGate` and no longer declare the send handler. The root layout starts each view by `to.route.id` and `to.params`, and flushes on client navigation, on the tab becoming hidden and on `pagehide`. A `pageshow` from the back/forward cache starts a new view. The layout no longer mounts the Umami component. Typecheck, the whole frontend unit run, lint and build are green on fc57b160b, which closes the span plan 182-15 opened.**

## Performance

- **Start sha:** `ac558361e0580f7bc8d48a9bea4905c9a06fe28b`
- **SPAN_START_SHA:** `96901eb99abf4c1d23b9fa62723f7ff0eecd47e5` (from `evidence/15-span.txt`)
- **Gate attempts:**
  - `20261019T173840Z.773d0f7f4`: red on the typecheck. Kept, and not the record.
  - `20261019T174243Z.fc57b160b`: green. This is the record.
- **Completed:** 2026-10-19T17:44Z
- **Tasks:** 2 of 2
- **Files:** 7 source/test files modified, 1 evidence file created

## Accomplishments

**Task 1: the three app contexts.**
- In each class's list of inherited app context members, I deleted the `sendTrackingEvent` declaration. I added `readonly setPageVisible!: AppContext['setPageVisible'];` and `readonly analyticsGate!: AppContext['analyticsGate'];` after `resetAllEvents`.
- How each context installs the members, and whether a test of it names them:

| Context | How the members are installed | A test that names the tracking members |
|---------|-------------------------------|----------------------------------------|
| voter | `inheritContextMembers(this, this.#appContext)` copies every own-enumerable member, so no list of names needed editing | none. The voter context has no test that names them, and no new test file was written. The `implements` clause is checked by the typecheck gate. |
| contestant | `inheritContextMembers(this, this.#appContext)`, the same as the voter context | `contestantContext.svelte.test.ts`, extended here |
| admin | `inheritContextMembers(this, this.#appContext)`, the same as the voter context | none. The same applies as for the voter context. |

- In `contestantContext.svelte.test.ts`:
  - The stand-in app context now has the seven tracking members the app context forwards. Each one is a single hoisted reference. `analyticsGate` is a `{ current }` handle over a box.
  - A new block, "the tracking members of the app context", holds the three behaviours:
    1. `setPageVisible` and `analyticsGate` are the same references the app context forwards, and `current` is a getter.
    2. The context has no own member whose name contains "tracking".
    3. An `$effect` that reads `provider.analyticsGate.current` re-runs with the new input when the gate input (a `$state.raw`) changes.
- `reactiveHandle.type.ts`: the `WritableHandle` doc comment no longer cites the removed member. No other writable handle uses the type, so the example was dropped. The exported types are unchanged.

**Task 2: the root layout.**
- The destructure is now `setDataRoot, openFeedbackModal, popupQueue, setPageVisible, startPageview, submitAllEvents, t`. `umamiRef` and its effect are gone.
- `afterNavigate(({ to }) => { startPageview(to?.route?.id ?? null, to?.params ?? null); … })` passes no URL, and the focus handling is unchanged. `onNavigate` still calls `submitAllEvents()` first, and `onDestroy` still flushes.
- One effect registers three listeners and removes them on teardown. It runs while `analyticsActive`, a `$derived` of `appCtx.analyticsGate.current.projection.active`, is true:
  - `visibilitychange` on the document: when hidden, `setPageVisible(false)` and then `submitAllEvents()`; when visible, `setPageVisible(true)`.
  - `pagehide` on the window: `submitAllEvents()`.
  - `pageshow` on the window: when `persisted` is true, `startPageview(page.route.id, page.params)`, with `page` from `$app/state`.
- The `<!-- Handle analytics loading -->` template block is deleted.
- The header comment now says that the layout starts a page view on every navigation and flushes on navigation, on hidden and on page hide, and that analytics goes only to the application's own relay with no third-party script. The `analytics.platform` Settings line is gone.

## Task Commits

1. **Task 1:** `a9d4819da` feat(182-26): declare the app context's current tracking members on the three app contexts
2. **Task 2 (layout):** `773d0f7f4` feat(182-26): start views by route id and flush at the page lifecycle in the root layout
3. **Task 2 (fix 1 of 2 allowed):** `fc57b160b` fix(182-26): accept the DOM navigator in the Global Privacy Control check
4. **Task 2 (record):** `654c1f5b5` docs(182-26): closing gates green on the first whole tree after the cutover

## Verification

- **Task 1:** `yarn workspace @openvaa/frontend test:unit src/lib/contexts` exits 0, with 29 files and 653 tests, and does not print "No test files found".
  - The declaration grep loop over the three files prints nothing.
  - `git grep -n -e sendTrackingEvent -- apps/frontend/src/lib/contexts` exits 1.
- **Task 1 RED:** against the contestant class from before the edit, "has no own member for a send handler" fails, because the declared field makes an own member that holds `undefined`. The other two cases pass on the old class too. The installer copies every own-enumerable member, so the new members arrived before they were declared; the declarations are needed for the `implements` clause, which the typecheck checks.
- **Task 2:**
  - The `startPageview(to?.route?.id ?? null, to?.params ?? null)` / `pagehide` / `pageshow` grep exits 0.
  - The `umamiRef` / `UmamiAnalytics` / `sendTrackingEvent` grep on the layout exits 1.
  - The `sessionStorageState('appContext-sessionId'` grep over `apps/frontend/src` exits 1.
- **Closing gates, attempt `20261019T174243Z.fc57b160b`:**

| Gate | Exit |
|------|------|
| `TYPECHECK_EXIT` | 0 (3058 files, 0 errors) |
| `UNIT_EXIT` | 0 (254 files passed and 1 skipped; 5922 tests passed and 31 skipped) |
| `LINT_EXIT` | 0 |
| `BUILD_EXIT` | 0 (14 of 14 turbo tasks) |

  - `GATE_HEAD` and `GATE_HEAD_AFTER` are both `fc57b160b1739fea42f8f2572a4494c2d4403f22`, and the tree was clean both times.
  - The plan's record verify exits 0. `evidence/26-gates.txt` is `cmp`-equal to the attempt file.
- `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics/noAddressOrAgent.test.ts` exits 0 (18 tests).
- No `(182-26):` commit lists a path under `tests/`.
- **Foreign commits in the span:** the `--invert-grep` command of the objective prints nothing for `apps/frontend/src/lib/contexts` and `apps/frontend/src/routes/+layout.svelte`.

## Deviations from Plan

**1. [Rule 1 - Bug] The closing typecheck was red on the producer's call of `isGlobalPrivacyControlSet(navigator)`.**
- **Found during:** Task 2, gate attempt `20261019T173840Z.773d0f7f4`. Unit, lint and build were 0 in that attempt.
- **Issue:** `src/lib/contexts/app/tracking/trackingService.svelte.ts:89:70` failed with "Type 'Navigator' has no properties in common with type '{ globalPrivacyControl?: unknown; }'". The DOM `Navigator` type does not declare `globalPrivacyControl`, so TypeScript's weak-type check rejects it. The error appeared only now because the frontend had not typechecked since 182-15's first commit.
- **Fix:** `gates.ts` (from plan 182-13; neither 182-15 nor 182-26 lists it) now takes `nav?: object` and checks `nav !== undefined && 'globalPrivacyControl' in nav && nav.globalPrivacyControl === true`. The behaviour is unchanged. The `isGlobalPrivacyControlSet` cases in `gates.test.ts` pass without edits, and the tracking directory passes 336 tests.
- **Fix allowance:** this was fix 1 of the 2 the plan allows. All four gates were run again as a new attempt and were green.
- **Commit:** `fc57b160b`.

**2. [Wording] The header comment's analytics line under Settings was dropped rather than replaced.** The layout reads no analytics setting now; the gates in the tracking service read `trackEvents`. Both new lines went into the description list: the flush points, and the relay with no third-party script. A Settings entry for a setting the layout does not read would have been false.

**3. [Layout] The span line is the first line of the body, directly after the YAML frontmatter.** 182-15 did the same: the frontmatter must start at line 1 for the summary tooling.

## Known Stubs

None.

## Threat Flags

None. No new surface. T-182-64 is mitigated: the mount block and the handler are gone, and the `git grep` on the layout confirms it. T-182-104 is mitigated: both members are declared on all three classes, and the typecheck is green. T-182-105 is mitigated: the contestant context test checks that the live gate handle follows its input. T-182-106 is mitigated: no gate ran before 773d0f7f4, and the record is from the current attempt only. T-182-124 is closed: the span is over.

## Notes for later plans

- **182-16:**
  - Delete `apps/frontend/src/lib/components/analytics/umami/`. Nothing mounts it any more.
  - Delete `TrackingHandler` and its doc comment from `trackingService.type.ts` (see `deferred-items.md`). Afterwards, `git grep -n TrackingHandler -- apps/frontend/src` should print nothing.
  - The stale `persistedState.svelte.ts` comment from `deferred-items.md` is still there.
- **Stale comments, out of this plan's scope:** the class comments of `contestantContext.svelte.ts` and `adminContext.svelte.ts` say the app context members are installed with `Object.assign(this, this.#appContext)`. Both constructors call `inheritContextMembers`. These comments predate this plan and are worth rewording when one of those files is next edited.
- **182-17 / 182-23:** the layout's flush points are `onNavigate` (`submitAllEvents()` before the view transition), `visibilitychange` to hidden, and `pagehide`. A `pageshow` with `persisted` starts a new view from `page.route.id` and `page.params`. The listeners exist only while `projection.active` is true, so with provider `none` no listener is registered. The E2E origin assertion that was red in 182-11 should now see requests only to `/api/usage`. That has not been run here, because this plan runs no E2E.
- **Requirements:** this plan lists RELAY-02, RELAY-05, RELAY-15 and RELAY-19. 182-15 deferred RELAY-05/10/11/15/16/17/18 until "the cutover as a whole". None were marked here, so the orchestrator should decide when to mark them.

## Next

The span is closed. Plans 182-16 and later can run, and so can the held executors of phases 181 and 183.

## Self-Check: PASSED

- FOUND: all seven modified source/test files and `evidence/26-gates.txt`.
- FOUND commits: `a9d4819da`, `773d0f7f4`, `fc57b160b`, `654c1f5b5`. Each is an ancestor of HEAD.
