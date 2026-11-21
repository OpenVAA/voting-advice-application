---
phase: 182-analytics-relay
plan: 25
subsystem: frontend-analytics
tags: [analytics, tracking, types, vocabulary, compile-time]
status: complete

requires:
  - phase: 182-04
    provides: EventName, EventAttributes (events.schema.ts)
  - phase: 182-14
    provides: call sites that already send payloads the schema accepts
provides:
  - TrackingEventName, TrackingEventData<TName>, generic TrackingEvent<TName> derived from events.schema.ts
  - TrackingDataArgument<TName> (data argument required exactly when the event has a required attribute)
  - generic startEvent / track signatures on TrackingService
  - trackingEvent.type.test.ts, the compile-time controls (six calls that must not compile)
affects: [182-15, 182-16, 182-26]

estimate:
  tokens: 65000
  tasks: 2
actuals:
  tokens: 5100      # chars/4 over the plan's source diff (20347 chars)
  tasks: 2
  commits: 3        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the SUMMARY and roadmap commits follow
plan_head_before: 36d08d0e02d61da34131c72a36e06618fa159142
plan_head_after: d67875816d166f03f478dd1012115003a057d8e5

tech-stack:
  added: []
  patterns:
    - "A rest-tuple data argument chosen by the event's required keys: [data?: D] when it has none, [data: D] otherwise"
    - "Compile-time controls as a Vitest file whose expect-error directives the typecheck enforces"

key-files:
  created:
    - apps/frontend/src/lib/contexts/app/tracking/trackingEvent.type.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/25-gates.txt
  modified:
    - apps/frontend/src/lib/contexts/app/tracking/trackingEvent.type.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
    - apps/frontend/src/lib/components/video/Video.svelte
    - apps/frontend/src/lib/components/video/Video.type.ts
    - apps/frontend/src/lib/components/analytics/umami/UmamiAnalytics.svelte

key-decisions:
  - "startEvent returns the buffered event as the wide TrackingEvent, not TrackingEvent<TName>: an empty default for an optional data argument cannot be proven valid for a generic name without a cast"
  - "The data argument is optional when the event's attributes have no required key (RequiredKeys over Pick), not via Partial<D> extends D, which fails for the empty strict object's Record<string, never>"
  - "The Video play-error flag shouldPlayError is sent under the schema name error"
  - "Video leaves out duration and endAt while the element reports a non-finite duration"

requirements-completed: []

duration: 6min
completed: 2026-10-19
---

# Phase 182 Plan 25: Tracking calls typed by the closed vocabulary Summary

**`startEvent` and `track` are now generic over the vocabulary's names (minus `pageview`), with the data argument typed by `EventAttributes` of `events.schema.ts` and required exactly when the event has a required attribute. A control file pins six calls that must not compile. The typecheck, the whole frontend unit run and lint are green on the commit that makes the tree whole.**

## Performance

- **Start sha:** `36d08d0e02d61da34131c72a36e06618fa159142`
- **Started:** 2026-10-19T11:22:14Z
- **Completed:** 2026-10-19T11:28Z
- **Tasks:** 2 of 2 (both auto)
- **Files:** 1 created and 7 modified source/test files, plus 1 gate record

## Accomplishments

- **`trackingEvent.type.ts`:** the hand-written 30-name union is gone. `TrackingEventName = Exclude<EventName, 'pageview'>`, `TrackingEventData<TName> = EventAttributes<TName>`, and `TrackingEvent<TName = TrackingEventName>` with `{ name: TName; data: TrackingEventData<TName> }`. The file imports from `$lib/analytics/events.schema` and its only string literal is the excluded `'pageview'`.
- **`trackingService.type.ts`:**
  - `startEvent` and `track` are `<TName extends TrackingEventName>(name: TName, ...data: TrackingDataArgument<TName>)`.
  - `TrackingDataArgument` is `[data?: D]` when `RequiredKeys<D>` is `never` and `[data: D]` otherwise.
  - `TrackingHandler` is `(event: { name: string; data: Record<string, JSONData> }) => void`.
  - `startPageview`, `submitAllEvents`, `resetAllEvents` and `sendTrackingEvent` are unchanged.
- **`trackingService.svelte.ts`:** types only. The two arrow fields take the generic signatures. The buffer stays `Array<TrackingEvent>`. `track` and `submitAllEvents` both send through a private `#send(name: string, data: Record<string, JSONData>)` arrow field, which holds the gate check, the session-id stamping, the debug log and the handler call, all as before. `#send` is a private field, so it is not an own-enumerable member. The eight-member test passes.
- **`trackingEvent.type.test.ts`:**
  - Six `@ts-expect-error` calls: an unknown name, `results_ranked_candidate`, `feedback_sent` with `description`, `filters_active` with `activeFilters` (beside a valid `count`, so the extra key is the only error), `results_ranked_entity` with no data, and `startEvent('pageview', …)`.
  - Three calls that must compile: `startEvent('menu_open')`, `startEvent('answer', { questionId, value })` and `track('maintenance_shown')`.
  - One runtime assertion.
- **Call sites:** none of the five candidate files needed a change. `answerState.svelte.ts`, `EntityDetails.svelte`, `Layout.svelte` and both results layouts compile as they are, so they were left unedited. The typecheck named three files outside the list instead (see Deviations).

## Task Commits

1. **Task 1:** `19148b4c4` feat(182-25): derive the tracking types from the event vocabulary, with compile-time controls
2. **Task 2:** `37b08909a` feat(182-25): every tracking call site compiles against the derived vocabulary types
3. **Gate record:** `d67875816` docs(182-25): the closing typecheck, unit and lint gate record

## Verification

- **Task 1:** `yarn workspace @openvaa/frontend test:unit src/lib/contexts/app/tracking` exits 0 (7 files, 326 tests, including the unchanged eight-member assertion). The three-grep verify exits 0 under bash. Under zsh the `\$lib` grep exits 1 because of the shell's quoting; the pattern itself matches.
- **Working-aid typecheck** before the Task 1 commit: the only errors were at the Video, Umami and producer-test sites fixed in Task 2. The producer compiled, and no expect-error directive was reported unused.
- **Closing gates** ran on `37b08909a`, attempt `20261019T112713Z.37b08909a`. The tree was clean before and after, and HEAD did not change.
  - `TYPECHECK_EXIT=0`: svelte-check, 3049 files, 0 errors, 0 warnings. The log names no unused `@ts-expect-error`, so all six controls fail to compile as intended.
  - `UNIT_EXIT=0`: 250 files passed and 1 skipped; 5820 tests passed and 31 skipped.
  - `LINT_EXIT=0`.
- `evidence/25-gates.txt` is a `cmp`-equal copy of the attempt file, and the plan's pointer verify exits 0.
- The `any` grep over the tracking directory and `answerState.svelte.ts` exits 1 (no match).
- For each `(182-25):` commit, `git show --stat --format= <sha> -- apps/frontend/src/lib/analytics` and `-- tests` print nothing.

## Deviations from Plan

**1. [Rule 3 - Blocking] The typecheck named three files outside the candidate list. They were edited and are listed above.**
- `Video.type.ts`: `VideoTrackingEventData` is now `TrackingEventData<'video'>`, and `onTrack` takes `TrackingEvent<'video'>`. The old type passed a data type as `TrackingEvent`'s parameter, which is now the name. The member documentation moved into the type's doc block.
- `Video.svelte`: the event is typed as `TrackingEvent<'video'>`. `addToEvent({ shouldPlayError: true })` became `addToEvent({ error: true })`. That passes the member under its schema name, as the plan allows. The old name is not in the vocabulary, so a strict parse would have dropped the whole video event.
- `UmamiAnalytics.svelte`: `sendUmamiEvent` takes `Parameters<TrackingHandler>[0]`.

`Layout.svelte`'s `onTrack={({ data }) => track('video', data)}` then compiles unchanged.

**2. [Rule 3 - Blocking] One line of `trackingService.svelte.test.ts` changed.** The case "track() is a no-op when shouldTrack is false" called `svc.track('pageview', { href: '/x' })`, which no longer compiles (svelte-check covers test files). It now calls `svc.track('menu_open')`. The case still asserts that nothing is sent. No assertion was changed, and the eight-member case is untouched.

**3. [Rule 1 - Bug, carried from the 182-04 note] Video leaves out non-finite values.** Before metadata loads, the element reports `NaN` for `duration`, and `endAt` became `currentTime / NaN`. A zod check confirms `NaN` fails `z.number()`. `endVideoEvent` now sends `duration` only when it is finite, and `endAt` only when the video is at the end or the duration is finite. A zero duration still gives `endAt: 0`, as before.

**4. [Design] `startEvent` returns the wide `TrackingEvent`, not `TrackingEvent<TName>`.** An empty default for the optional data argument cannot be shown to fit `TrackingEventData<TName>` for a generic `TName` without a cast. No caller uses the return value. The plan's interfaces block does not fix the return type, and 182-15 only requires that `track` returns void.

**5. [Convention] The type parameter is `TName`, not `N`.** The workspace ESLint `naming-convention` rule requires type parameters to match `^T[A-Z]`.

## Notes for Later Plans

- **182-15:**
  - `TrackingHandler` and the private `#send` path exist only until the send handler is removed.
  - The buffered `TrackingEvent.data` is now the vocabulary's attribute type and is assignable to `Record<string, JSONData>`. Note that `JSONData` is `any` (`Parameters<typeof JSON.stringify>[0]`).
  - Checked with zod: `z.strictObject({ rating: z.number().optional() })` accepts `{ rating: undefined }` and outputs `{}`. An `undefined` value under an optional member therefore does not fail the schema, so `Feedback.svelte`'s `{ rating }` with no star chosen is harmless. An `undefined` value under a required member, or `NaN` anywhere, does fail it.
- **Video:** the video attributes may now hold `duration: undefined` / `endAt: undefined` keys. They are optional members, so the parse removes them (see the zod check above).
- **Control file:** a new event added to `events.schema.ts` needs no change here. Removing `description`/`activeFilters` from the controls, or adding either to the schema, makes the typecheck red.

## Known Stubs

None.

## Threat Flags

None. T-182-59 and T-182-101 are mitigated by the generic signatures and the control file, and T-182-102 by the no-cast and no-`any` call sites. The lint gate ran on the commit. No new surface was added.

## Self-Check: PASSED

- FOUND: `trackingEvent.type.test.ts`, `evidence/25-gates.txt` and all seven modified files
- FOUND: `19148b4c4`, `37b08909a` and `d67875816` are ancestors of HEAD
