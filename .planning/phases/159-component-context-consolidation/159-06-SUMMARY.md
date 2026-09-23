---
phase: 159-component-context-consolidation
plan: 06
subsystem: ui
tags: [svelte5, runes, contexts, tracking, analytics, typescript, spread-safety]

# Dependency graph
requires:
  - phase: 159-01
    provides: the reactivity-safety spine and the Guard A source scan that forbids a `$derived` alias over an identity-stable `#version`-bridge accessor
  - phase: 113
    provides: inheritContextMembers, the descriptor-preserving forwarder whose wholesale tracking call this plan replaced
provides:
  - One tracking-service type (`TrackingService`) and one implementation (`TrackingServiceImpl`) — the second, rune-shaped `Omit`+re-declare layer is deleted
  - A narrowed consumer-facing tracking surface: the analytics session id and the tracking-enabled gate are absent from the declared type AND from the runtime surface of all four context classes
  - A selective six-member tracking forward in appContext, replacing the wholesale `inheritContextMembers` call, with the withheld members named in-place
  - `contexts/utils/reactiveHandle.type.ts` — the shared read-only/writable handle types relocated into the context utilities directory, imported by direct file path, no barrel
affects: [159-07, 159-11, any phase adding a public member to the tracking producer]

actuals:
  tokens: 30000
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Selective member forward: `Object.assign(this, { …explicit list })` for a producer whose surface is wider than the consumer contract (joins the existing componentCtx selective forward; `inheritContextMembers` stays for the WHOLE dataCtx surface, where accessor liveness is load-bearing)"
    - "Producer-wider-than-type: a class may implement a narrower published type and keep additional own members for producer-to-producer reads; the factory returns the implementation type so private holders keep their internal reads"

key-files:
  created:
    - apps/frontend/src/lib/contexts/utils/reactiveHandle.type.ts
  modified:
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
    - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/survey.svelte.ts

key-decisions:
  - "Chose RESEARCH mechanism (i), the selective forward, over making the producer's members private/non-enumerable: the producer's exact own-key lock stayed green and untouched, which is the tell the plan named for having picked the right mechanism."
  - "Used `Object.assign` rather than extending `inheritContextMembers` with a key filter: all six forwarded tracking members are data properties (a handle object + five arrow fields), so a value copy installs exactly what the descriptor-preserving forwarder would have. No accessor liveness is at stake, unlike `dataRoot`."
  - "The factory `trackingService()` now returns the implementation type instead of a second declared type, so `appContext`'s private `#tracking` keeps its two internal reads while consumers see only the narrowed `TrackingService`."
  - "Tasks 2 and 3 were resequenced at the file level: the narrowing is atomic (see Deviations), so the dangling re-declarations and the two EXPECTED_KEYS entries landed in Task 2's commit."

patterns-established:
  - "Withheld-member documentation: when a forward is narrowed, the forwarding site names the withheld members, says which internal reads keep them on the producer, and states why hiding them on the producer was rejected."
  - "Descriptive-not-literal member naming in docs where an acceptance grep pins a file to zero occurrences of a member name."

requirements-completed: []  # REVIEW-CMP-04 / REVIEW-CMP-05 are also declared by 159-07 and 159-11, which have no SUMMARY yet; `requirements.ready-ids` returned 0/2 ready (shared-ID gate #2388).

coverage:
  - id: D1
    description: "One tracking-service type and one implementation: the second, rune-shaped layer that subtracted three members from the first only to re-declare them is deleted."
    requirement: REVIEW-CMP-04
    verification:
      - kind: other
        ref: "grep -rn 'RuneTrackingService' apps/frontend/src | wc -l -> 0; grep -c 'Omit<' trackingService.svelte.ts -> 0"
        status: pass
      - kind: unit
        ref: "yarn typecheck (svelte-check, 0 errors 0 warnings across 22 tasks)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The analytics session id and the tracking-enabled gate are absent from the consumer-facing type AND from the forwarded runtime surface of all four context classes — not merely documented as internal."
    requirement: REVIEW-CMP-04
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts#`{ ...instance }` captures every AppContext member as an own-enumerable property"
        status: pass
      - kind: other
        ref: "temporary negative control (run then deleted): with the fixture restored to offer both members, Object.keys({ ...appContext }) does NOT contain them; the same control FAILS when the wholesale forward is temporarily reinstated (AssertionError: expected [ … 27 keys ] to not include 'sessionId')"
        status: pass
      - kind: other
        ref: "grep -rn \"readonly sessionId!: AppContext['sessionId']\" apps/frontend/src/lib/contexts | wc -l -> 0 (same for shouldTrack)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The producer is intact: both members stay, the persisted session-storage key is unchanged, and the producer's exact own-key assertion stayed green without being edited."
    requirement: REVIEW-CMP-04
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts#exposes EXACTLY the eight own-enumerable members appContext forwards"
        status: pass
      - kind: other
        ref: "git diff --name-only HEAD~3..HEAD does not list trackingService.svelte.test.ts; grep -c 'appContext-sessionId' trackingService.svelte.ts -> 1"
        status: pass
    human_judgment: false
  - id: D4
    description: "The shared reactive-handle type module resolves from contexts/utils/ with both importers rewritten to direct file paths and no barrel introduced."
    requirement: REVIEW-CMP-05
    verification:
      - kind: other
        ref: "ls contexts/utils/reactiveHandle.type.ts -> present; ls contexts/app/reactiveHandle.type.ts -> absent; ls contexts/utils/index.ts | wc -l -> 0"
        status: pass
      - kind: unit
        ref: "yarn typecheck + yarn workspace @openvaa/frontend test:unit (84 files, 1560 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "The uncovered review comment 'this ad hoc rollup is fixed in the last branch of the stack' is closed as already-fixed, with its commit named."
    verification:
      - kind: other
        ref: "git show ce0f5e746 -- appContext.svelte.ts (the diff replaces the two ad-hoc mechanisms with inheritContextMembers); appContext.svelte.ts:242 still states the forwarding is used INSTEAD of an instance spread"
        status: pass
    human_judgment: false
  - id: D6
    description: "End-to-end behaviour of the tracking/consent path after the runtime surface narrowed."
    verification: []
    human_judgment: true
    rationale: "The plan's <verification> block does not require an E2E run and this plan changes no component-visible behaviour (zero `.svelte` reads of either narrowed member, before and after). The full suite was green at 159-01's close (155/0) and the phase-level gate re-runs it; a per-plan re-run was not performed here, so the E2E evidence for this plan is inherited, not measured."

# Metrics
duration: 12 min
completed: 2026-09-02
status: complete
---

# Phase 159 Plan 06: Tracking Layer Collapse & Consumer-Surface Narrowing Summary

**Collapsed the two tracking-service type layers into one, cut the analytics session id and the tracking-enabled gate out of the consumer-facing surface at the forwarding mechanism (not just the type), and relocated the shared handle-type module into `contexts/utils/`.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-02T17:03:00Z
- **Completed:** 2026-09-02T17:15:00Z
- **Tasks:** 3
- **Files modified:** 9 (1 relocated, 8 edited)

## Accomplishments

- **One type, one implementation.** The second, rune-shaped layer (`Omit<TrackingService, 'sendTrackingEvent' | 'sessionId' | 'shouldTrack'> & { … }`) is deleted; `TrackingServiceImpl` implements the single `TrackingService` directly and `sendTrackingEvent` now uses the shared `WritableHandle` type. `grep -rn 'RuneTrackingService' apps/frontend/src` returns 0.
- **The narrowing is real at runtime, not just in the type.** The wholesale `inheritContextMembers(this, this.#tracking)` was replaced by an explicit six-member `Object.assign`. Measured with a temporary negative control: with the test fixture restored so the producer *offers* both members, `Object.keys({ ...appContext })` does not contain them — and the same control fails the moment the wholesale forward is put back. That is the Pitfall-6 trap (type and runtime surface are decoupled) proven closed, not assumed.
- **The producer is untouched where it matters.** Both members stay on `TrackingServiceImpl`, `appContext` still reads `this.#tracking.sessionId` producer-to-producer for `surveyLink(...)`, the `appContext-sessionId` storage key is byte-identical, and the producer's exact `Object.keys` lock passed without ever appearing in the diff — the plan's own tell that mechanism (i) was chosen.
- **Four context classes lost their re-declarations** (app, candidate, voter, admin), so the narrowing is not cosmetic, and the spread guard now proves the narrowed surface with no assertion weakened.
- **`reactiveHandle.type.ts` now lives in `contexts/utils/`** with both importers on direct file paths and no barrel introduced (the directory's deliberate convention).

## Task Commits

1. **Task 1: Relocate the reactive-handle type module** — `6449073df` (refactor)
2. **Task 2: Collapse the two tracking layers and narrow the forwarded surface** — `c2c423544` (refactor)
3. **Task 3: Narrow the spread guard's tracking fixture** — `f7e7464df` (test)

## Files Created/Modified

- `apps/frontend/src/lib/contexts/utils/reactiveHandle.type.ts` — relocated (100% rename) from `contexts/app/`; exports `ReactiveHandle` / `WritableHandle`, unchanged content.
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.type.ts` — the ONE tracking type. Lost `sessionId` and `shouldTrack`; `sendTrackingEvent` now typed with the shared `WritableHandle`. Header states the surface is deliberately narrower than the producer and why.
- `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.ts` — second type layer deleted; `export class TrackingServiceImpl implements TrackingService`; factory returns the implementation type. Producer members and the storage key unchanged.
- `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` — wholesale tracking forward replaced by an explicit six-member forward; the paragraph above it names the two withheld members, their internal reads, and why hiding them on the producer was rejected. Two re-declarations removed.
- `apps/frontend/src/lib/contexts/{candidate,voter,admin}/*Context.svelte.ts` — the two re-declarations removed from each.
- `apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts` — `EXPECTED_KEYS` narrowed to the forwarded six and both handles removed from the tracking fixture. No assertion weakened; the per-key `Object.keys` (not `in`) discipline is intact.
- `apps/frontend/src/lib/contexts/app/survey.svelte.ts` — import path only.

## Decisions Made

1. **Mechanism (i), selective forward** — as RESEARCH recommended. The producer's exact own-key lock stayed green *and unedited*, which the plan named as the signal that the right mechanism was chosen.
2. **`Object.assign` over a filtered `inheritContextMembers`** — all six forwarded members are data properties, so a value copy is byte-equivalent to what the descriptor-preserving forwarder installs for them, and it matches the selective componentCtx forward already in the file. `inheritContextMembers` remains for dataCtx, where accessor liveness is load-bearing.
3. **Factory returns the implementation type** — instead of introducing a replacement second type. `#tracking!: ReturnType<typeof trackingService>` therefore still sees both producer-internal members, which is what keeps the `surveyLink(...)` read and the producer's own test compiling.
4. **Descriptive member naming in two doc comments** — `trackingService.type.ts` and the spread test describe the withheld members ("the persistent analytics session id and the tracking-enabled gate") rather than naming them literally, because Task 2/3 acceptance greps pin those files to zero occurrences of the identifiers. The documentation value is preserved; nothing was silently dropped to satisfy a grep.

## Review comment closed as already-fixed

The uncovered triage comment *"This ad hoc rollup is fixed in the last branch of the stack"* (anchored in the explicit-forwarding block of `appContext.svelte.ts`) is **closed as already-fixed**. The fix landed in **`ce0f5e746`** — *"refactor(quick/260824-sdp): forward dataCtx and tracking via inheritContextMembers"* — whose diff replaces "the two ad-hoc mechanisms this block used to carry" with the shared forwarder. Confirmed from history and from the block itself, which still states the forwarding is used **INSTEAD of** a componentCtx / dataCtx / tracking instance spread (`appContext.svelte.ts:242`). **No code change was made on this comment's account.**

⚠ This plan *does* edit that same block — for the criterion-4 forwarding change (wholesale → selective). The comment is therefore closed as already-fixed on its own evidence, **not** silently absorbed by an unrelated edit.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] The narrowing is atomic; the plan's task split produces a red intermediate tree**

- **Found during:** Task 2 (collapse the tracking layers and narrow the forwarded surface)
- **Issue:** Task 2 narrows `TrackingService`, which immediately makes `readonly sessionId!: AppContext['sessionId']` (and the `shouldTrack` twin) a type error in all four context classes — three of which are Task 3's files. Task 2's own acceptance criteria require `yarn typecheck` **and** `test:unit` to exit 0, which is unreachable while those declarations remain, and unreachable while the spread guard's `EXPECTED_KEYS` still demands two members the new forward no longer installs.
- **Fix:** Pulled the four re-declaration removals and the two `EXPECTED_KEYS` entries into Task 2's commit, so the tree is green at every commit boundary. Task 3 kept its own remaining code change (removing the two handles from the spread test's tracking fixture, which D-H4 requires and which is green standalone) plus the review-comment closure.
- **Files modified:** `candidateContext.svelte.ts`, `voterContext.svelte.ts`, `adminContext.svelte.ts`, `appContext.svelte.ts`, `appContext.spread.svelte.test.ts`
- **Verification:** `yarn typecheck` 0 errors / 0 warnings and `test:unit` 84 files / 1560 tests green at **both** `c2c423544` and `f7e7464df`.
- **Committed in:** `c2c423544`

**2. [Rule 3 - Blocker] Task 3 acceptance grep is unsatisfiable as literally written**

- **Found during:** Task 3
- **Issue:** The criterion `grep -rn "readonly sessionId" apps/frontend/src/lib/contexts | wc -l` returns 0 cannot hold: the producer declares `readonly sessionId = sessionStorageState('appContext-sessionId', getUUID());`, and must-have truth 3 plus the second active prohibition both require the producer to keep it. Same for `readonly shouldTrack`. Satisfying the grep literally would mean dropping the `readonly` modifier purely to dodge a pattern — shaping code to a grep.
- **Fix:** Satisfied the criterion's **intent** (zero re-declarations on the context classes) and recorded the refined greps that prove it:
  - `grep -rn "readonly sessionId!: AppContext\['sessionId'\]" apps/frontend/src/lib/contexts | wc -l` → **0**
  - `grep -rn "readonly shouldTrack!: AppContext\['shouldTrack'\]" apps/frontend/src/lib/contexts | wc -l` → **0**
  - the literal greps return **1** each, both being the producer's own field, which the plan requires to stay.
- **Files modified:** none (measurement only)
- **Verification:** greps above; `git grep` shows the only remaining matches are `trackingService.svelte.ts:61` and `:71`.
- **Committed in:** n/a — filed to `.planning/WINDOWS.md` (kind `deviation`, phase 159).

---

**Total deviations:** 2 auto-fixed (2 × Rule 3 - blocking issue). Neither changed the plan's intent; both were ordering/wording defects in the plan itself.
**Impact on plan:** No scope creep. Every task's substantive work landed, every plan-level success criterion holds, and every commit boundary is green.

## Issues Encountered

**Stale documentation deliberately left in place.** `trackingService.svelte.test.ts:158-159` still reads *"exposes EXACTLY the eight own-enumerable members appContext forwards"* and explains the lock in terms of a blanket forward. The producer's surface is still eight and the assertion is still correct; only the *rationale* prose is now one step behind (appContext forwards six of the eight). Task 2's acceptance pins that file out of the diff — deliberately, as the tell for the rejected mechanism — so the wording was **not** corrected here. Filed to `.planning/WINDOWS.md` (kind `deviation`, phase 159) for a later pass.

**E2E not re-run for this plan.** The plan's `<verification>` block does not include an E2E run, and no `.svelte` file reads either narrowed member (0 before, 0 after), so no component-visible behaviour changed. The full suite was cardinal-clean at 159-01's close (155/0/0). Recorded as `human_judgment: true` in the coverage block (D6) rather than claimed as verified.

## Verification Results

| Check | Result |
|---|---|
| `yarn typecheck` | **0 errors, 0 warnings** (22/22 turbo tasks) |
| `yarn lint:check` | **exit 0** (0 errors; only pre-existing warnings, incl. one in `candidateContext.svelte.test.ts` untouched by this plan) |
| `yarn workspace @openvaa/frontend test:unit` | **84 files / 1560 tests passed** |
| producer exact own-key assertion | **green, file never edited** (`git diff --name-only HEAD~3..HEAD` does not list it) |
| `grep -rn 'RuneTrackingService' apps/frontend/src` | **0** |
| `grep -c 'appContext-sessionId' trackingService.svelte.ts` | **1** (key unchanged) |
| negative control (temp, then deleted) | narrowed forward **withholds both members**; reinstating the wholesale forward **fails** the control |

## Flagged planner assumption — status after execution

The plan surfaced one **unresolved** probe edge for REVIEW-CMP-04: whether "absent from the consumer-facing interface" means absent from the *forwarded* surface or absent from the *producer* too. This plan implemented the weaker-but-measured reading (absent from the declared type and from every context's runtime surface; retained on the producer for two internal reads). **The assumption remains unresolved and is for the verify step** — if the operator intended the stronger reading, this item needs re-planning with the two internal reads redesigned, not patching.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `159-07` (the shared question-rollup utility, REVIEW-CMP-05) can proceed: `contexts/utils/` is the established destination, still barrel-free, and now holds the shared handle types it may want.
- `159-11` closes REVIEW-CMP-04 / REVIEW-CMP-05 alongside the rest; both IDs stay open here by the shared-ID gate (`requirements.ready-ids` → 0/2 ready).
- One follow-up carried forward in `WINDOWS.md`: the stale eight-member rationale in the producer's own-key lock.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-02*

## Self-Check: PASSED

- `apps/frontend/src/lib/contexts/utils/reactiveHandle.type.ts` — present on disk.
- Commits `6449073df`, `c2c423544`, `f7e7464df` — all present in `git log`.
- `ce0f5e746` (the commit named as the review comment's fix) — present in `git log`.
- No untracked build or generated files left behind.
