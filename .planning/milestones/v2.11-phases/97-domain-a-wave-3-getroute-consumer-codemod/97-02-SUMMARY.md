---
phase: 97-domain-a-wave-3-getroute-consumer-codemod
plan: 02
subsystem: ui
tags: [svelte5, runes, getRoute, codemod, context, derived, migration]

# Dependency graph
requires:
  - phase: 97-01
    provides: CONS-03 adminContext spread→delegating getters + AdminNav destructure→$derived (leaves getRoute a store so this plan's codemod stays atomic)
  - phase: 96
    provides: Tier-2 rune-native context factories (voterContext/candidateContext) exposing getters
  - phase: 95
    provides: Tier-1 leaf contexts exposing .current getters
provides:
  - Rune-native getRoute producer ($derived.by over page.params/page.route/page.url per-field; no writable, no afterNavigate republish)
  - Additive .current getters on appSettings/dataRoot/locale/darkMode reading the same underlying $state (D-08 Option A)
  - Whole-frontend consumer codemod off the store bridges (~145 $store.X → .current, ~133 $getRoute( → getRoute.current()
  - candidateContext fully off svelte/store (CTX-07 tail complete)
affects: [98-domain-a-wave-4-cleanup, 99-view-transitions, 101-suite-re-enable]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rune-native route builder: $derived.by reading page.params/page.route/page.url as separate fields bypasses the toStore short-circuit trap"
    - "Additive .current getter via { ...store, get current() } spread — store shape survives for same-commit-unmigrated consumers, enabling an atomic producer+consumer swap"
    - "One-shot idempotent dry-run-by-default codemod with a mandatory human full-diff review gating a single atomic mechanical commit"

key-files:
  created:
    - .planning/phases/97-domain-a-wave-3-getroute-consumer-codemod/97-UAT.md
    - .planning/archive/spike-009-store-codemod.mjs
  modified:
    - apps/frontend/src/lib/contexts/app/getRoute.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.svelte.ts
    - apps/frontend/src/lib/contexts/app/appContext.type.ts
    - apps/frontend/src/lib/contexts/data/dataContext.svelte.ts
    - apps/frontend/src/lib/contexts/data/dataContext.type.ts
    - apps/frontend/src/lib/contexts/candidate/candidateContext.svelte.ts
    - apps/frontend/src/routes/admin/(protected)/+page.svelte
    - apps/frontend/src/routes/admin/login/+page.svelte
    - "~71 template .svelte files across voter/candidate/admin/component surfaces (codemod --apply)"

key-decisions:
  - "D-09: getRoute producer rewrite folded into the atomic codemod commit (was a standalone Wave-2 plan) so no commit boundary builds red — resolves the cross-AI review's HIGH finding"
  - "D-08 Option A: additive .current getters over the same $state the legacy store wraps, landing atomic with the codemod --apply"
  - "Live-count discipline: ~145/~133 site counts re-captured by the pre-apply dry-run, not hard-coded; authoritative gate is post-apply grep → 0"

patterns-established:
  - "Atomic producer+consumer migration: keep the old store shape additive, rewrite the producer and run the codemod in ONE commit; build green before and after, transiently red only mid-task"
  - "Human-verify diff gate before a large mechanical commit (D-02)"

requirements-completed: [CTX-08, CONS-01, CONS-02, CONS-03]

# Metrics
duration: ~25min
completed: 2026-06-05
---

# Phase 97 Plan 02: getRoute Rune-Native Producer + Consumer Codemod Summary

**`getRoute` is now a pure rune-native `$derived.by` producer and the entire frontend (~278 sites) is migrated off the legacy store bridges in a single atomic commit — with no red build at any commit boundary.**

## Performance

- **Duration:** ~25 min (across initial executor + 2 continuation agents; one continuation hit a transient API socket error after committing, recovered by the orchestrator)
- **Completed:** 2026-06-05
- **Tasks:** 5/5 (Task 3 = human-approved diff review; Task 4 = admin UAT **deferred to verify-work**)
- **Files modified:** 75 in the atomic commit + UAT/archive artifacts

## Accomplishments

- **CTX-08 — rune-native `getRoute`:** rewrote `getRoute.svelte.ts` to a pure `$derived.by` reading `page.params`/`page.route`/`page.url` as separate fields, returning `{ readonly current: RouteBuilder }`. Removed the `writable<RouteBuilder>` store and the custom `afterNavigate` republish workaround. No `svelte/store` import remains. This bypasses the `toStore` short-circuit trap that broke param-only navigation.
- **CONS-01 / CONS-02 — whole-frontend codemod:** rewrote ~145 `$store.X` template auto-subscribe sites to `.current` and ~133 `$getRoute(` call sites to `getRoute.current(` across ~71 `.svelte` files, plus 13 script-block `getRouteState.current(...)` migrations. Counts re-captured live by the dry-run.
- **D-08/D-09 atomicity:** the producer rewrite + `appContext.type.ts` type change + additive `.current` getters + 13 script-block migrations + the ~278 template rewrites all landed in ONE commit (`35c68e85c`) — no commit boundary ever built red. Resolves the cross-AI review's HIGH finding.
- **CTX-07 tail:** `candidateContext.svelte.ts` no longer imports from `svelte/store`.
- **D-06 cleanup:** the one-shot codemod was deleted from the app tree and archived under `.planning/archive/`.

## Task Commits

1. **Tasks 1+2: codemod `$getRoute(` pass + additive `.current` getters + getRoute producer rewrite + 13 script-block migrations + `--apply`** — `35c68e85c` (feat, atomic per D-08/D-09; 75 files, +417/−329)
2. **Task 3: human full-diff review (D-02)** — approved by human → gated the atomic commit above (no separate commit)
3. **Task 4 (UAT persist):** `b946858db` (test) — admin auth-reactivity UAT persisted as **pending** (deferred to verify-work)
4. **Task 5: delete + archive one-shot codemod (D-06)** — `a0a7a25c0` (chore)

## Files Created/Modified

See `key-files` frontmatter. Headline: `getRoute.svelte.ts` (rune-native producer), `appContext.svelte.ts`/`dataContext.svelte.ts` (additive `.current` getters via spread), `appContext.type.ts`/`dataContext.type.ts` (type changes), `candidateContext.svelte.ts` (svelte/store dropped), 2 admin `+page.svelte` (script-block migrations), ~71 template `.svelte` files (mechanical codemod).

## Decisions Made

- **D-09** (added during the `--reviews` replan): fold the getRoute producer into the atomic codemod commit. Rationale: rewriting the producer a wave before the consumer codemod would break ~133 `$getRoute(...)` template sites at the producer-plan commit boundary. Treating getRoute like the other four stores (additive shape + atomic landing) eliminates the red intermediate.
- **D-08 Option A**, **D-03 dry-run-by-default**, **D-06 archive** — followed as planned.

## Deviations from Plan

None to the implementation. One **process** event: the continuation agent that ran Task 5 + SUMMARY hit a transient `API Error: socket connection closed` AFTER committing Task 5 (`a0a7a25c0`) but BEFORE writing this SUMMARY. The orchestrator verified git/filesystem state (commits + UAT file + codemod archived all present, working tree clean of code changes) and wrote this SUMMARY + ROADMAP/STATE updates directly to finish the plan. No code was affected.

## Issues Encountered

None functional. All automated gates green on the committed tree:
- Build: 11/11 packages (frontend green)
- Unit: 46 files / 725 tests passed
- Codemod idempotency: `Files to change: 0`, by-store all 0, `$getRoute: 0`
- Destructure-trap count: 1 (intentional `DestructureTrapConsumer` demo)
- `getRoute.svelte.ts`: `svelte/store`=0, `afterNavigate`=0, `writable`=0, `$derived.by`=1
- `getRouteState` / `fromStore(getRoute)` / bare-`$getRoute` value uses: 0

## User Setup Required

None — no external service configuration.

## Self-Check

**PASSED (automated scope).** All automated must_haves verified on the committed tree. **One must-have is PENDING manual verification:** "Admin nav reacts to login without a hard refresh" — deferred to `/gsd-verify-work 97` (no automated admin E2E exists). Recorded as a pending test in `97-UAT.md`. The CONS-03 *code* is delivered (Plan 01 fix + the rewritten `getRoute.current('AdminApp*')` nav links); only its manual UAT remains.

## Next Phase Readiness

Phase 98 (Domain A Wave 4 — Cleanup) can now remove the last `persistedState`/`StackedState` callers — they were the consumers this codemod migrated. Blocker for phase-level completion: the admin auth-reactivity UAT must pass via `/gsd-verify-work 97`.

---
*Phase: 97-domain-a-wave-3-getroute-consumer-codemod*
*Completed: 2026-06-05*
