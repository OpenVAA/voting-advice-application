---
phase: 95-domain-a-wave-1-tier-1-leaf-contexts
plan: 04
subsystem: ui
tags: [svelte5, runes, popup-queue, fromStore, context, frontend]

# Dependency graph
requires:
  - phase: 95-domain-a-wave-1-tier-1-leaf-contexts
    provides: Wave-1 leaf-context rune-migration pattern (Pattern 1 get current() exposure) established in 95-01/02/03
provides:
  - "popupStore migrated to pure-rune queue-shaped Pattern-1 (get current() getter; zero svelte/store imports)"
  - "PopupStore type drops Readable<T>; exposes { readonly current; push; shift }"
  - "Single fromStore(popupQueue) consumer in routes/+layout.svelte migrated to popupQueue.current (O-3)"
  - "Wave-0 unit coverage for popupStore push/shift/current FIFO behavior"
affects: [96-domain-a-wave-2, 98-domain-a-wave-4-cleanup, popupStore, appContext, root-layout]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pattern 1 (reactive getter exposure): rune-native store exposes derived state via `get current()` instead of toStore + subscribe"
    - "Wave-0 rune unit test: store created inside `$effect.root` + `flushSync()`; reactive head asserted via content marker (not toBe identity — $state array proxies wrap items)"

key-files:
  created:
    - apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts
    - apps/frontend/src/lib/contexts/app/popup/popupStore.type.ts
    - apps/frontend/src/routes/+layout.svelte

key-decisions:
  - "Test asserts FIFO head via item props.marker content, not reference identity — Svelte 5 $state array wraps each item in a reactive proxy distinct from the source object, so toBe(item) fails by design"
  - "Reworded popupStore.type.ts doc comment to avoid the literal string 'svelte/store' so the acceptance grep returns 0 (comment only mentioned 'store bridge')"
  - "Only the popup fromStore consumer in +layout.svelte was migrated; appSettings/sendTrackingEvent fromStore bridges + the `import { fromStore, get }` line are left for the Wave-3 codemod per CLAUDE.md auto-subscribe caveat"

patterns-established:
  - "Pattern 1 reactive getter: { push, shift, get current() { return firstItem; } } replaces toStore(() => firstItem) + subscribe"
  - "Wave-0 rune-store test harness: $effect.root setup + flushSync + content-marker assertions for $state-proxied queue items"

requirements-completed: [CTX-05]

# Metrics
duration: 3min
completed: 2026-06-04
---

# Phase 95 Plan 04: popupStore CTX-05 Rune Migration Summary

**popupStore migrated to the pure-rune queue-shaped Pattern-1 (`get current()` getter, zero `svelte/store` imports); the single `fromStore(popupQueue)` consumer in `routes/+layout.svelte` migrated to `popupQueue.current` and the `Readable<T>` surface dropped from the type.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-06-04T12:20:08Z
- **Completed:** 2026-06-04T12:22:53Z
- **Tasks:** 2
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments
- `popupStore.svelte.ts` is now pure-rune: dropped `import { toStore } from 'svelte/store'` and the `subscribe` bridge; exposes `get current() { return firstItem; }`. The pre-existing `queue = $state([])`, `firstItem = $derived(queue[0])`, `push`, and `shift` were kept unchanged.
- `PopupStore` type changed from `Readable<PopupQueueItem | undefined> & { push; shift }` to `{ readonly current; push; shift }` — `Readable` import removed.
- The single direct `fromStore(popupQueue)` consumer in `routes/+layout.svelte` migrated: deleted `const popupQueueState = fromStore(popupQueue)`, popup renderer now reads `popupQueue.current` directly. Other `fromStore`/`get` bridges (appSettings, sendTrackingEvent) untouched (Wave 3 owns them).
- Added Wave-0 unit test `popupStore.svelte.test.ts` (4 cases: fresh `.current === undefined`; `push` makes head; FIFO `push(a); push(b)` keeps head `a` then `b` after `shift`; empty `shift` is safe).

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing Wave-0 test for `get current()`** - `4dbeb775f` (test)
2. **Task 1 (GREEN): migrate popupStore to `get current()` + update type + fix test assertion** - `5c6452927` (feat)
3. **Task 2: migrate `+layout.svelte` popup consumer to `popupQueue.current`** - `d410ec32a` (feat)

_TDD Task 1 produced a RED test commit then a GREEN implementation commit; no REFACTOR commit needed._

## Files Created/Modified
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts` - NEW Wave-0 unit coverage (push/shift/current FIFO + empty-shift safety)
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` - dropped `svelte/store`; returns `get current()`
- `apps/frontend/src/lib/contexts/app/popup/popupStore.type.ts` - dropped `Readable`; `{ readonly current; push; shift }`
- `apps/frontend/src/routes/+layout.svelte` - deleted `popupQueueState = fromStore(popupQueue)`; renderer reads `popupQueue.current`

## Decisions Made
- **Assert by content marker, not reference identity.** Svelte 5 `$state<Array<...>>` wraps each enqueued item in a reactive proxy, so `.current` is a proxy distinct from the original object — `expect(store.current).toBe(item)` fails despite identical content. The test gives each item a unique `props.marker` and asserts `store.current?.props?.marker`, which validates the FIFO-head behavior under test without depending on proxy identity.
- **Doc-comment wording.** The acceptance gate `grep -c "svelte/store" popupStore.type.ts` must return 0. The first draft mentioned `svelte/store` inside a JSDoc line; reworded to "no store bridge" so the gate passes (the import was already gone).
- **Scope discipline on `+layout.svelte`.** Only the popup consumer was migrated (O-3). The `import { fromStore, get } from 'svelte/store'` line and the `appSettings`/`sendTrackingEvent` bridges remain per CLAUDE.md's `$store` auto-subscribe caveat and 95-RESEARCH Consumer Impact — Wave 3 owns those.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test assertion used reference identity that fails under `$state` proxying**
- **Found during:** Task 1 (GREEN phase, after the implementation landed)
- **Issue:** The first test draft asserted `expect(store.current).toBe(item)`. Under Svelte 5, `queue = $state<Array<...>>` proxies its elements, so `.current` (reading `queue[0]` through the proxy) is not the same reference as the pushed object — two of the four cases failed with `Object.is` mismatch even though behavior was correct.
- **Fix:** Gave each `makeItem` a unique `props.marker` string and asserted on `store.current?.props?.marker` instead of object identity. This tests the FIFO-head behavior (the actual contract) and is robust to proxy wrapping.
- **Files modified:** apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts
- **Verification:** `yarn test:unit --run src/lib/contexts/app/popup/popupStore.svelte.test.ts` → 4 passed
- **Committed in:** 5c6452927 (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 bug — test-correctness only; no production-code change beyond the plan)
**Impact on plan:** The fix corrects the test harness to account for documented Svelte 5 `$state`-proxy semantics. No scope creep; production migration matches the plan and the spike analog exactly.

## Issues Encountered
- `yarn check` reports 150 pre-existing type errors across the frontend (`qs` declaration files, admin jobs API `cookies`, candidate settings, `runes-test/*` scaffolds). **None reference `popupStore.*` or `+layout.svelte`** — confirmed via `yarn check 2>&1 | grep ERROR | grep -iE "popupStore|\+layout\.svelte"` → NONE. These are out of scope (logged here, not fixed) and pre-date this plan.

## TDD Gate Compliance
Task 1 (`tdd="true"`): RED commit `4dbeb775f` (test fails — `.current` undefined) → GREEN commit `5c6452927` (test passes). Gate sequence satisfied.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- CTX-05 complete; `popupStore` is now Pattern-1 rune-native and its `Readable<T>` surface is gone.
- All five Wave-1 Tier-1 leaf-context migrations (95-01..05) plus the SSR-gap fix land the foundation for Wave 2 (95→96 chain).
- No blockers. The only remaining `svelte/store` references touching the popup path are the Wave-3-owned `appSettings`/`sendTrackingEvent` bridges in `+layout.svelte` (intentionally deferred) and the `runes-test/popup-rune` spike scaffold doc comment (out of tree scope).

## Self-Check: PASSED
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.test.ts` — FOUND
- `apps/frontend/src/lib/contexts/app/popup/popupStore.svelte.ts` — FOUND (get current(), 0 svelte/store)
- `apps/frontend/src/lib/contexts/app/popup/popupStore.type.ts` — FOUND (0 Readable, 0 svelte/store)
- `apps/frontend/src/routes/+layout.svelte` — FOUND (popupQueue.current ×3, 0 popupQueueState)
- Commit `4dbeb775f` — FOUND
- Commit `5c6452927` — FOUND
- Commit `d410ec32a` — FOUND

---
*Phase: 95-domain-a-wave-1-tier-1-leaf-contexts*
*Completed: 2026-06-04*
