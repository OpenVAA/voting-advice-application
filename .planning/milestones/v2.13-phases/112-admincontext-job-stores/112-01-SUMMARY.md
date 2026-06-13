---
phase: 112-admincontext-job-stores
plan: 01
subsystem: frontend/admin-context
tags: [svelte5, context-as-class, runes, jobStores, refactor]
requires:
  - "matchStore.svelte.ts (MatchStoreImpl) — class-wrapping-$derived analog"
  - "VideoController.svelte.ts — self-contained arrow-field class analog"
provides:
  - "JobStoresProvider class ($state Map registry + 3 $derived projections + arrow polling fields)"
  - "back-compat jobStores() factory wrapper (byte-identical adminContext call site)"
affects:
  - "apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts (consumes jobStores() — Plan 02)"
tech-stack:
  added: []
  patterns:
    - "CONVENTIONS §17 read-only prototype getters over private $derived (reactive via instance.X)"
    - "CONVENTIONS §18 arrow-function fields for detach-safe polling methods"
    - "D1 field-init order (#pastJobs declared before #pastJobsByFeature which reads it)"
key-files:
  created:
    - "apps/frontend/src/lib/contexts/admin/jobStores.svelte.test.ts"
  modified:
    - "apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts"
decisions:
  - "Kept isActive/filterByKnownNames as module-level functions (no this) rather than private static"
  - "#fetchAndUpdateJobs is a PRIVATE arrow field (read only by startPolling; off the JobStores surface)"
  - "Test avoids calling startPolling() (real setInterval+fetch); asserts function-field type + stopPolling no-op for the detach contract"
metrics:
  duration: ~2min
  completed: 2026-06-13
  tasks: 2
  files: 2
---

# Phase 112 Plan 01: jobStores → JobStoresProvider Class Summary

Converted the `jobStores()` closure-factory into a Svelte 5 `JobStoresProvider` class (private `$state` Map registry + three `$derived` projections as read-only prototype getters + detach-safe arrow polling fields), behind a byte-identical `jobStores()` back-compat factory wrapper, plus a new headless smoke test.

## What Was Built

- **`JobStoresProvider` class** (`apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts`): replaces the factory body verbatim in class form.
  - `#pollInterval` / `#lastPastJobsUpdate` plain private fields (delta-cursor JSDoc preserved).
  - `#jobs = $state<Map<string, JobInfo>>(new Map())` registry; `#fetchAndUpdateJobs` reassigns a NEW Map (Svelte 5 Map reactivity preserved — no in-place mutation).
  - `#pastJobs` (`$derived`), `#activeJobsByFeature` + `#pastJobsByFeature` (`$derived.by`); `#pastJobs` declared before `#pastJobsByFeature` (D1 field-init order, since the latter reads the former).
  - `startPolling` / `stopPolling` as arrow-function fields (detach-safe; called from `WithPolling.svelte`); `#fetchAndUpdateJobs` as a private arrow field.
  - Three read-only prototype getters (`activeJobsByFeature` / `pastJobs` / `pastJobsByFeature`) matching the `JobStores` type exactly.
  - `@internal` JSDoc noting the class is self-contained (no `$effect` → constructible outside any effect context, unlike the orchestrator providers).
- **Back-compat factory**: `export function jobStores(): JobStores { return new JobStoresProvider(); }` keeps adminContext's `const jobs = jobStores()` byte-identical until Phase 114 RENAME. Class exported as a value so the test can `new` it.
- **Module-level helpers** `isActive` + `filterByKnownNames` kept unchanged (no `this`).
- **New headless smoke test** (`jobStores.svelte.test.ts`): three projection-focused, network-free tests modeled on `VideoController.svelte.test.ts` (`$effect.root` + `flushSync()` setup + `afterEach` cleanup).

## Verification Results

- `yarn svelte-check`: **151 ERRORS** — exactly the baseline, **zero new errors**. No errors in `jobStores.svelte.ts`.
- `grep -c "class JobStoresProvider"` = 1; `grep -c "new JobStoresProvider()"` = 1.
- `yarn vitest run src/lib/contexts/admin/jobStores.svelte.test.ts`: **3 passed / 3** (780ms).
- adminContext call site untouched (owned by Plan 02).

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Convert jobStores() factory to class JobStoresProvider | 2ee6db1ba | jobStores.svelte.ts |
| 2 | Add headless smoke test for projections + arrow-field detach | 859b97ada | jobStores.svelte.test.ts |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts
- FOUND: apps/frontend/src/lib/contexts/admin/jobStores.svelte.test.ts
- FOUND commit: 2ee6db1ba
- FOUND commit: 859b97ada
