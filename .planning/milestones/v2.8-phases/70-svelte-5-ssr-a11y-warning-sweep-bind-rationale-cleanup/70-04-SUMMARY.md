---
phase: 70
plan: 04
subsystem: frontend/admin
tags: [svelte5, hygiene, ssr, fetch-eagerness, onMount, warn-01]
requires:
  - "Plan 70-02 closed — WithPolling.svelte already on Svelte 5 Snippet API (post-Plan-70-02 baseline used)"
provides:
  - "Cat D (SSR fetch-eagerness) — WithPolling.svelte startPolling() lifecycle moved to onMount"
  - "70-04-CAPTURE.md — pre-fix + post-fix cold-start dev-server log analysis"
affects:
  - "apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte"
tech-stack:
  added: []
  patterns:
    - "Svelte 5 onMount with cleanup-return (replaces module-eval side effect + standalone onDestroy)"
    - "Pattern 4 Option A from 70-PATTERNS.md (Plan-70-04 D1)"
key-files:
  created:
    - ".planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-04-CAPTURE.md"
  modified:
    - "apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte"
decisions:
  - "Applied Pattern 4 Option A (onMount with cleanup return) verbatim per PATTERNS.md §Primary Site D1; Option B (`if (browser)` guard) not chosen because the cleanup-return form is more idiomatic for Svelte 5 and Video.svelte:220 establishes the canonical analog."
  - "onDestroy import + standalone call removed (semantics absorbed into onMount cleanup return); single lifecycle hook now owns kickoff + teardown."
  - "Cold-start curl-driven SSR pass surfaced 0 fetch.*eagerly warnings both pre-fix and post-fix because admin/jobs redirected to /admin/login (no auth context); WithPolling SSR mount path was NOT exercised in either run."
  - "Decision under auto-mode protocol: proceed with the static-analysis MEDIUM-confidence candidate fix per Pattern 4 Option A; defer authenticated-admin cold-start re-verification AND DevTools polling smoke to /gsd-verify-work 70 (operator-driven, phase-close gate)."
  - "Fix is structurally correct independent of empirical pre-confirmation: admin polling is browser-only enrichment (RESEARCH.md Pitfall 6), so onMount is the canonical SvelteKit lifecycle gate."
metrics:
  duration_minutes: 8
  completed_date: 2026-05-09
  tasks_total: 3
  tasks_executed: 3
  files_modified: 1
  files_created: 1
  commits: 3
---

# Phase 70 Plan 04: Svelte 5 / SSR / a11y Warning Sweep + bind-rationale Cleanup — Category D (SSR `fetch`-eagerness) Summary

**One-liner:** Wrapped `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte`'s `startPolling()` kickoff in `onMount(() => { ...; return () => stopPolling(); })`, eliminating the SSR `Avoid calling fetch eagerly during server-side rendering` anti-pattern at the static-analysis MEDIUM-confidence Cat D candidate site (`startPolling()` previously ran at component-init / module-eval, firing `fetchAndUpdateJobs()` synchronously during SSR before the client-only `onMount` lifecycle would gate it).

## Outcome

WARN-01 SC-1b (Cat D, per CONTEXT.md D-01) is closed at the structural-correctness bar. The single static-analysis Cat D candidate (WithPolling.svelte:24/27 in pre-fix shape) is fixed via the canonical `onMount` lifecycle wrap matching the in-tree analog at `apps/frontend/src/lib/components/video/Video.svelte:220`. Cold-start dev-server runs (pre- and post-fix) both surface `0` `fetch.*eagerly` warnings — though both runs share an admin-auth coverage gap (curl cannot trigger the WithPolling SSR mount path). Empirical confirmation that the warning surfaced AT the WithPolling site is deferred to `/gsd-verify-work 70`'s authenticated cold-start protocol; the fix lands independently because Pattern 4 Option A is the canonical SvelteKit lifecycle gate for browser-only enrichment fetches regardless of whether the runtime warning empirically fired in this run.

## Sites Fixed

| Site | File | Pre-fix Line:Col | Post-fix Lifecycle | Pattern Applied |
|------|------|------------------|--------------------|-----------------|
| D1 | `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 27:3 (`startPolling();` at module-eval) + 28:3 (`onDestroy(() => stopPolling())`) | `onMount(() => { startPolling(); return () => stopPolling(); })` at lines 27-30 | Pattern 4 Option A — onMount with cleanup-return; replaces both prior calls in a single lifecycle hook |

## Patch Applied

**Pre-fix (post-Plan-70-02 baseline):**
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

**Post-fix:**
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getAdminContext } from '$lib/contexts/admin';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const {
    jobs: { startPolling, stopPolling }
  } = getAdminContext();

  onMount(() => {
    startPolling();
    return () => stopPolling();
  });
</script>

{@render children?.()}
```

Three discrete edits in a single Edit call (per PLAN.md Task 2):
1. `import { onDestroy } from 'svelte';` → `import { onMount } from 'svelte';`
2. Removed the bare `startPolling();` line.
3. Replaced `onDestroy(() => stopPolling());` with `onMount(() => { startPolling(); return () => stopPolling(); });`.

The Snippet/children plumbing landed by Plan 70-02 (lines 19, 21, and 33) is untouched. The `<!--@component -->` doc-comment block at the top of the file (lines 1-14) is also untouched.

## Verification Results

### Pre-fix cold-start capture (Task 1)

Procedure (per CONTEXT.md D-04):
- `rm -rf apps/frontend/.svelte-kit node_modules/.vite/`
- `yarn workspace @openvaa/frontend dev` (background; tee'd to `/tmp/70-04-cold-start.log`); ready in 2316 ms on `http://localhost:5174/`.
- SSR pass via `curl -sL` against `/`, `/en`, `/fi`, `/elections`, `/results`, `/admin`, `/admin/jobs`.
- `grep -cE "(fetch.*eagerly|Avoid calling fetch eagerly)" /tmp/70-04-cold-start.log` → **`0`**.

Result: 0 raw warnings; 0 unique sites surfaced from the curl-driven SSR pass. **Coverage gap acknowledged** in 70-04-CAPTURE.md: admin/jobs redirected to /admin/login (no auth) so WithPolling SSR mount was not exercised.

### Post-fix cold-start re-capture (Task 3)

Same procedure post-Task-2 commit:
- Caches re-wiped; dev-server up on :5174 in 1708 ms.
- Same curl SSR pass; `grep -cE "(fetch.*eagerly|Avoid calling fetch eagerly)" /tmp/70-04-cold-start-post.log` → **`0`**.
- No regression introduced by the change. The voter SSR pass remains warning-clean.

### svelte-check baseline regression check

| Metric | Pre-Plan-70-04 | Post-Plan-70-04 | Δ |
|--------|----------------|-----------------|----|
| Total errors | 160 | 160 | 0 (no regression) |
| Total warnings | 0 | 0 | 0 |
| Files with problems | 35 | 35 | 0 |
| WithPolling.svelte errors | 0 | 0 | 0 |
| WithPolling.svelte warnings | 0 | 0 | 0 |

The 160 pre-existing frontend errors are tracked separately in v2.7 Phase 68 Plan 02's deferred list (95 of them) plus other long-standing typing issues; this plan introduces none and resolves none.

### Acceptance criteria (all PASS)

- ✅ `grep -cE "onMount\(\(\) =>" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` returns `1`.
- ✅ `grep -nE "^startPolling\(\);" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` returns 0 lines (no module-eval-time bare call).
- ✅ `grep -nE "onDestroy\(\(\) => stopPolling" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` returns 0 lines.
- ✅ `grep -n "import { onMount }" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` returns 1 line at line 17; `grep -n "import { onDestroy }"` returns 0 lines.
- ✅ `yarn workspace @openvaa/frontend check` reports 0 errors and 0 warnings for WithPolling.svelte (unchanged from pre-fix).
- ✅ `70-04-CAPTURE.md` exists with both pre-fix and post-fix sections (`grep -c "Post-Fix Verification" 70-04-CAPTURE.md` → 3, indicating section header + 2 body references).

### Per-Task Verification Map (from 70-VALIDATION.md)

- **70-04-01** (cold `yarn dev` 2>&1 \| grep "fetch.*eagerly" \| wc -l returns `0`): ✅ confirmed by both pre-fix (`0`) and post-fix (`0`) cold-start logs. The acceptance bar "after WithPolling.svelte fix moves startPolling() into onMount" is satisfied at the structural-correctness bar; full empirical surface coverage requires authenticated admin SSR (deferred to phase close).
- **70-04-02** (manual admin polling smoke): DEFERRED to `/gsd-verify-work 70` per the auto-mode protocol — no operator browser session in this run; consistent with Plans 70-01/02/03 deferral pattern.

## Acceptance-Criteria Precision Note

PLAN.md Task 2 acceptance criterion "`grep -nE \"^\\s*startPolling\\(\\);\" apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` returns 0 lines" is overly broad — `\s*` matches any leading whitespace including the 4 spaces inside the `onMount` block, so the criterion as literally written would require deleting the call entirely. The substantive intent (verified verbatim per the BEFORE/AFTER blocks in PLAN.md Task 2 §action) is "no module-eval-time bare call". The strict-anchor check (`^startPolling\\(\\);` with no whitespace) returns 0 lines, confirming the intent is satisfied. The 1 remaining match at line 28 (`    startPolling();`) is the desired call inside the `onMount(() => { ... })` block. Recording this nuance for any future grep-replay verifier; no functional deviation.

## Manual Admin Polling DevTools Smoke (Task 3, Step 4)

**Status: DEFERRED to phase-close `/gsd-verify-work 70`.**

**Rationale:** Per CONTEXT.md D-04 + the spawn-prompt auto-mode protocol, the canonical Phase 70 smoke gate is the cold-start protocol with operator-driven walkthrough run once at phase close, not per-plan. This plan's auto-chain run had no operator browser session, so the admin-jobs sign-in + DevTools Network observation cannot be performed in this execution.

**Phase-close smoke instructions (for `/gsd-verify-work 70`):**
1. Cold-start dev server with admin Supabase context (`yarn dev:reset && yarn dev`).
2. Sign in to the admin app at `/admin/login` (use seed credentials per dev docs).
3. Navigate to `/admin/jobs` (or any admin feature-jobs page rendering `<WithPolling><FeatureJobs feature={ADMIN_FEATURE.<F>} /></WithPolling>`).
4. Open DevTools → Network tab; filter by `jobs` or `fetch`.
5. Confirm: (a) initial polling fetch fires after page mount (`onMount` ran; the kickoff request is visible); (b) subsequent polling intervals fire (wait 5-10 seconds for the next periodic request); (c) navigating away from the page stops the polling (no further periodic requests).
6. Also confirm zero `fetch.*eagerly` warnings in the dev-server terminal during this walkthrough.

If any of (a)-(c) fail, this plan needs a hotfix patch and a re-run; the structural correctness of `onMount(() => { startPolling(); return () => stopPolling(); })` (matching `Video.svelte:220`'s analog and SvelteKit's documented lifecycle) makes such a failure unlikely.

## Commits

- `2e79daf32` — `docs(70-04): capture pre-fix Cat D cold-start baseline`
- `a3c142c23` — `fix(70-04): wrap WithPolling startPolling() in onMount to prevent SSR fetch-eagerness warning`
- `f16ccb960` — `docs(70-04): record post-fix Cat D cold-start re-verification`

## Deviations from Plan

**1. [Rule 3 — Blocking issue resolved] Cold-start authenticated admin SSR coverage gap**

- **Found during:** Task 1
- **Issue:** The auto-chain executor cannot authenticate to the admin app (no operator browser; admin/jobs redirects to /admin/login on every curl request). The static-analysis Cat D hypothesis (WithPolling.svelte:24 `startPolling()` at module-eval) cannot be empirically confirmed by SSR-walk in this run.
- **Resolution:** Per the spawn-prompt auto-mode handling protocol's explicit fallback ("If the cold-start dev-server start fails or hangs ... fall back to static-grep enumeration per RESEARCH.md §1, apply fix to WithPolling.svelte:24 ... and note the cold-start gap as a phase-verification followup"), proceeded with the canonical Pattern 4 Option A fix at the MEDIUM-confidence static-analysis candidate. The fix is structurally correct independent of pre-empirical confirmation.
- **Files modified:** `.planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-04-CAPTURE.md` (records the gap explicitly + transfers responsibility to `/gsd-verify-work 70`).
- **Commit:** documented in `2e79daf32` (CAPTURE.md baseline) and `f16ccb960` (post-fix section).
- **Phase-close handoff:** `/gsd-verify-work 70` runs the cold-start protocol with operator-driven admin sign-in. That walkthrough is the empirical confirmation gate for both the warning's prior presence at WithPolling and its absence post-fix.

No other deviations. The Pattern 4 Option A patch was applied verbatim per PATTERNS.md §Primary Site D1.

## Plan-70-05 Handoff

**Plan-70-05 (BIND-strip, Wave 2) does NOT touch WithPolling.svelte.** Per RESEARCH.md §Plan-70-05 wave-assignment overlap audit (line 579 of 70-RESEARCH.md): "WithPolling.svelte (Plan-70-02 + Plan-70-04 target) contains 0 `// bind:` comments [VERIFIED]". This plan introduced no `// bind:` comments. Plan-70-05's regex `// bind: (keep|ok|justified)` will not match anything in WithPolling.svelte either before or after this plan's edits.

## Phase 70 Wave 2 Status After This Plan

- ✅ Plan 70-04 (Cat D) — landed.
- ⬜ Plan 70-05 (BIND-strip) — pending; runs after this plan per Wave 2 ordering. Must run last among Wave 2 plans where it overlaps with Plans 70-01..04 file targets (none for WithPolling.svelte; 1 line preserved at Input.svelte:546 per Plan 70-03 SUMMARY).

## Self-Check

**File-existence checks:**
- ✅ `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` (modified — 33 lines; verified by `wc -l`)
- ✅ `.planning/phases/70-svelte-5-ssr-a11y-warning-sweep-bind-rationale-cleanup/70-04-CAPTURE.md` (created — 126 lines; both pre-fix + post-fix sections present)

**Commit-existence checks:**
- ✅ `2e79daf32` (`git log --oneline | grep 2e79daf32` → present)
- ✅ `a3c142c23` (`git log --oneline | grep a3c142c23` → present)
- ✅ `f16ccb960` (`git log --oneline | grep f16ccb960` → present)

## Self-Check: PASSED
