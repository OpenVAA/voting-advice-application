---
phase: 112-admincontext-job-stores
reviewed: 2026-06-13T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts
  - apps/frontend/src/lib/contexts/admin/jobStores.svelte.test.ts
  - apps/frontend/src/lib/contexts/admin/adminContext.svelte.ts
  - apps/frontend/src/lib/contexts/admin/index.ts
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 112: Code Review Report

**Reviewed:** 2026-06-13
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Phase 112 converted two admin-context constructs to the Svelte 5 class pattern (CLASS-07): the `jobStores()` closure-factory into `JobStoresProvider`, and the `adminContext` factory into `AdminContextProvider`. The phase-specific concerns are well-handled: the v2.11 auth-forwarding fix is preserved verbatim (live `isAuthenticated` prototype getter, four auth arrow-field forwards, zero authContext spread/assign); the getter-collision audit passes (appContext carries no auth keys, so `Object.assign(this, this.#appContext)` cannot overwrite `isAuthenticated`); D1 field-init order is correct (`#pastJobs` declared before `#pastJobsByFeature`); no `$effect` is introduced; the barrel correctly narrows to a type-only class export.

Two warnings and one info item were found. No blockers.

## Warnings

### WR-01: ES2025 Iterator helpers used without precedent in the codebase

**File:** `apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts:56,62`

**Issue:** `this.#jobs.values().filter(...)` and `this.#jobs.values().find(...)` use `Iterator.prototype.filter` / `Iterator.prototype.find` — ES2025 iterator-helper methods (TC39 proposal shipped Chrome 122+, Safari 17.4+, Firefox 131+, Node 22+). These are NOT in the ES2022 lib used by the shared tsconfig (`packages/shared-config/tsconfig.base.json:10`), but they ARE in SvelteKit's generated `.svelte-kit/tsconfig.json` (`lib: ["esnext"]`), so TypeScript accepts them without error. The call sites are the only two uses of iterator helpers in the entire `apps/frontend/src/` tree — all other callsites use `[...collection].filter(...)` or a for-of loop.

The runtime concern is production users on slightly older-but-not-ancient browsers (Chrome 121, Safari 17.3, or Firefox 130) which lack these methods. Vite's default `esnext` target does not transpile or polyfill iterator helpers. These are admin-only code paths, but the admin panel is in production scope.

**Note:** This was already present in the PRE-PHASE-112 factory (the original `jobStores()` at `HEAD~6` used the same two calls). Phase 112 faithfully preserved them. This is not a regression, but the class conversion is the right moment to flag the pattern before it spreads.

**Fix:** Replace with spread-then-filter (or a for-of loop) to match the rest of the codebase and guarantee ES2022 compat:

```typescript
// Line 56 — replace:
#pastJobs = $derived(
  [...this.#jobs.values().filter((j) => !isActive(j))].sort((a, b) => compareDates(a.startTime, b.startTime))
);

// With:
#pastJobs = $derived(
  [...this.#jobs.values()].filter((j) => !isActive(j)).sort((a, b) => compareDates(a.startTime, b.startTime))
);

// Line 62 — replace:
const job = this.#jobs.values().find((j) => j.jobType === feat && isActive(j));

// With (spread once for both loops, or use a for-of):
const job = [...this.#jobs.values()].find((j) => j.jobType === feat && isActive(j));
```

---

### WR-02: Delta cursor advanced before JSON parsing — past jobs silently skipped on parse failure

**File:** `apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts:120,122`

**Issue:** `this.#lastPastJobsUpdate` is set to `new Date().toISOString()` (line 120) BEFORE `await Promise.all([activeRes.json(), pastRes.json()])` (line 122). If the JSON parse throws (malformed response, network truncation), the `catch` block swallows the error, and on the next poll the `startFrom` query parameter is set to the advanced timestamp. Any past jobs that completed during the failed interval are permanently skipped — they are never fetched again because the server will treat them as "before the cursor".

**Note:** Pre-existing in the original factory (same ordering at `HEAD~6:jobStores.svelte.ts:97,99`). Preserved faithfully by Phase 112. Not a regression, but worth fixing.

**Fix:** Move the cursor advance to AFTER successful JSON parsing:

```typescript
// Current (wrong order):
this.#lastPastJobsUpdate = new Date().toISOString();   // line 120 — TOO EARLY
let [activeJobs, pastJobsData] = (await Promise.all([activeRes.json(), pastRes.json()])) as [...];

// Fixed (advance cursor only after successful parse):
let [activeJobs, pastJobsData] = (await Promise.all([activeRes.json(), pastRes.json()])) as [...];
this.#lastPastJobsUpdate = new Date().toISOString();   // moved here
```

---

## Info

### IN-01: Smoke test does not exercise mutation → reactivity path

**File:** `apps/frontend/src/lib/contexts/admin/jobStores.svelte.test.ts`

**Issue:** The three tests cover: empty initial state, getter return types and stability, and arrow-field detach. No test verifies that mutating `#jobs` (the `$state` Map) via a simulated `#fetchAndUpdateJobs` call causes `pastJobs`, `activeJobsByFeature`, or `pastJobsByFeature` to update reactively. If the `$derived` chain were silently broken (e.g., by incorrect field-init ordering or an accidental `$state` mutation instead of reassignment), the current tests would still pass.

**Fix:** Add a test that directly calls `#fetchAndUpdateJobs` via a mock fetch (or bypasses the private field by patching `globalThis.fetch`) and then asserts the projections update. Alternatively, expose a test-seam `_setJobs(map: Map<string, JobInfo>)` in `@internal` JSDoc. Low-priority since the D1 ordering is verified by svelte-check and the projections are structurally identical to the pre-class factory — but any future refactor of the field-init order would go undetected.

---

_Reviewed: 2026-06-13_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
