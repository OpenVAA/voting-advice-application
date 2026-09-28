---
phase: 70
plan: 02
subsystem: frontend/admin
tags: [svelte5, hygiene, slot-element-deprecated, snippet, warn-01]
requires:
  - "Phase 69 (Alliance Card Lane A) closed — phase dependency satisfied"
provides:
  - "Cat B (slot_element_deprecated) surface fully resolved — 0 sites remain"
  - "WithPolling.svelte uses Svelte 5 Snippet API (Pattern 2)"
affects:
  - "apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte"
tech-stack:
  added: []
  patterns:
    - "Svelte 5 Snippet API (children: Snippet + {@render children?.()})"
key-files:
  created: []
  modified:
    - "apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte"
decisions:
  - "Applied Pattern 2 (3-part Snippet patch) verbatim per PATTERNS.md Site B1; no Option B fallback needed (no DaisyUI / styling concern at this site)."
  - "Did NOT touch startPolling() / onDestroy() lifecycle — Plan-70-04 owns the SSR fetch-eagerness fix. Diff is minimal and reviewable per the wave-1 / wave-2 sequencing handoff."
  - "Task 2 manual children-render smoke deferred to phase-close cold-start protocol (`/gsd-verify-work 70`) per CONTEXT.md D-04 — same handling pattern used by Plan-70-01."
metrics:
  duration_minutes: 4
  completed_date: 2026-05-09
  tasks_total: 2
  tasks_executed: 2
  files_modified: 1
  files_created: 0
  commits: 1
---

# Phase 70 Plan 02: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup — Category B (`<slot />` → `{@render children()}`) Summary

**One-liner:** Migrated `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` from the legacy `<slot />` API to the Svelte 5 Snippet API (`children: Snippet` in `$props()` + `{@render children?.()}`), eliminating the sole remaining `slot_element_deprecated` warning in the codebase per the canonical analog at `apps/frontend/src/routes/admin/+layout.svelte:17-19,58`.

## Outcome

WARN-01 SC-2 (Cat B) closed. Phase 70's Cat B surface is now fully resolved (1 site → 0 warnings). The 16 other `+layout.svelte` files in `apps/frontend/` were already on the Svelte 5 Snippet API per RESEARCH.md §Pattern 2 — `WithPolling.svelte` was the sole laggard.

## Site Fixed

| Site | File | Line:Col | Element |
|------|------|----------|---------|
| B1 | `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 28:1 | `<slot />` |

## 3-Part Patch Applied

Exactly as specified in PATTERNS.md §Site B1 + 70-02-PLAN Task 1:

1. **Type import:** added `import type { Snippet } from 'svelte';` immediately after the existing `onDestroy` import.
2. **Props destructure:** inserted `let { children }: { children: Snippet } = $props();` as the first statement after the import block (above the `getAdminContext()` destructure).
3. **Render tag:** replaced `<slot />` on line 28 with `{@render children?.()}` (the `?.` guard matches the analog's safe-render pattern).

The doc-comment block at lines 1-14 was preserved verbatim. `startPolling()` / `onDestroy(() => stopPolling())` were NOT touched (Plan-70-04 owns that lifecycle change).

## Verification Results

### Cat B static gate (Task 1 + Task 2)

```bash
yarn workspace @openvaa/frontend check 2>&1 | grep -v '^#' | grep -cE "(slot_element_deprecated|missing render tag)"
# expected: 0
```

**Pre-patch:** 1 hit (`WithPolling.svelte:28:1` reporting `slot_element_deprecated`).
**Post-patch:** **0 hits.** ✅

### svelte-check baseline regression check

| Metric | Pre-patch | Post-patch | Δ |
|--------|-----------|------------|----|
| Total errors | 160 | 160 | 0 (no regression) |
| Total warnings | 2 | 1 | −1 (Cat B removed; Cat C `Input.svelte:521` remains for Plan-70-03) |
| Files with problems | 37 | 36 | −1 |

The remaining warning is the expected Cat C `a11y_no_noninteractive_element_interactions` at `Input.svelte:521`, which Plan-70-03 owns. No new errors or warnings introduced.

### Acceptance criteria (all PASS)

- ✅ `yarn workspace @openvaa/frontend check 2>&1 | grep -v '^#' | grep -cE "(slot_element_deprecated|missing render tag)"` returns `0`
- ✅ `git grep -n "{@render children" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` → 1 line (`{@render children?.()}` at line 31)
- ✅ `git grep -n "import type { Snippet } from 'svelte'" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` → 1 line at line 19
- ✅ `git grep -n "let { children }: { children: Snippet } = \$props()" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` → 1 line at line 21
- ✅ `git grep -n "<slot" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` → 0 lines
- ✅ svelte-check baseline does not regress (160 errors unchanged)

## Manual Children-Render Smoke (Task 2)

**Status: DEFERRED to phase-close cold-start protocol (`/gsd-verify-work 70`).**

**Rationale:** Per CONTEXT.md D-04, the canonical Phase 70 smoke gate is the cold-start protocol (`rm -rf apps/frontend/.svelte-kit node_modules/.vite/ && yarn dev`, voter-flow happy path) run once at phase close, not per-plan. Plan-70-01 used the same deferral for its reactivity smoke (recorded in STATE.md: "Manual reactivity smoke deferred to /gsd-verify-work 70 cold-start protocol"). Plan-70-02 follows the same convention for consistency.

**Phase-close smoke instructions** (for `/gsd-verify-work 70`):
- Navigate to `/admin/jobs` (or any admin feature-jobs page using `<WithPolling><FeatureJobs feature={ADMIN_FEATURE.<F>} /></WithPolling>`).
- Confirm the inner FeatureJobs / job list UI renders inside the `<WithPolling>` wrapper — page must NOT be blank.
- Confirm polling network requests still trigger (DevTools → Network → filter `jobs/active`).

The static gate (zero `slot_element_deprecated` warnings) and the unchanged svelte-check baseline jointly establish high confidence that the children-render path is correct; the manual smoke at phase close is the final UX confirmation.

## Commits

- `5f3ed42a2` — `fix(70-02): migrate WithPolling.svelte to Svelte 5 Snippet API`

## Deviations from Plan

None — plan executed exactly as written.

## Plan-70-04 Handoff

**Plan-70-04 (Cat D, Wave 2) DEPENDS ON the post-Plan-70-02 file shape of `WithPolling.svelte`.** The current shape after this plan (verbatim, top of file at lines 16-26):

```svelte
<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  startPolling();
  onDestroy(() => stopPolling());
</script>

{@render children?.()}
```

Plan-70-04 will (per PATTERNS.md §Plan-70-04 D1):
- Replace `import { onDestroy } from 'svelte';` with `import { onMount } from 'svelte';` (Option A) OR keep `onDestroy` and add `import { browser } from '$app/environment';` (Option B fallback).
- Replace the `startPolling(); onDestroy(() => stopPolling());` pair with `onMount(() => { startPolling(); return () => stopPolling(); });` (Option A) OR `if (browser) startPolling(); onDestroy(() => browser && stopPolling());` (Option B).

The Snippet/children plumbing landed by this plan is independent of the lifecycle change and remains untouched in Plan-70-04.

## Self-Check

**File-existence checks:**
- ✅ `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` (modified — verified by `git grep` outputs above)

**Commit-existence checks:**
- ✅ `5f3ed42a2` (`git log --oneline | grep 5f3ed42a2` → present)

## Self-Check: PASSED
