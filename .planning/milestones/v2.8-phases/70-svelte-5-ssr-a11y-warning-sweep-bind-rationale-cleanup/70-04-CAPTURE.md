# Phase 70 Plan 04 — Cat D Cold-Start Capture

**Captured:** 2026-05-09
**Protocol:** D-04 (`rm -rf apps/frontend/.svelte-kit node_modules/.vite/` then `yarn workspace @openvaa/frontend dev`, then SSR exercise of voter happy path + admin routes)
**Cold-start log:** `/tmp/70-04-cold-start.log` (18 lines total at capture)
**Run mode:** auto-chain (no live operator browser; SSR triggered via `curl -sL` against unauthenticated routes)
**Warning count (raw, `fetch.*eagerly`):** 0
**Unique site count:** 0 (from the curl-driven SSR pass)

## Cold-Start Procedure

1. `rm -rf apps/frontend/.svelte-kit node_modules/.vite/` — caches wiped.
2. `yarn workspace @openvaa/frontend dev` started in background; tee'd to `/tmp/70-04-cold-start.log`.
3. Vite ready in 2316 ms on `http://localhost:5174/` (port 5173 was already in use by another local process).
4. SSR triggered via `curl -sL` (follows redirects):
   - `GET /` → `200 /`
   - `GET /en` → `200 /en` (voter home, locale param)
   - `GET /fi` → `200 /fi` (voter home, locale param)
   - `GET /elections` → `200 /constituencies?electionId=…` (voter elections SSR pass)
   - `GET /results` → `200 /constituencies?electionId=…` (voter results SSR pass; redirected because no constituency selected)
   - `GET /admin` → `200 /admin/login?errorMessage=loginFailed` (admin redirected to login)
   - `GET /admin/jobs` → `200 /admin/login?errorMessage=loginFailed` (admin-protected; redirected to login WITHOUT mounting `WithPolling.svelte`)
5. Dev server killed.
6. `grep -cE "(fetch.*eagerly|Avoid calling fetch eagerly)" /tmp/70-04-cold-start.log` → `0`.

## Sites Surfaced By This Run

| # | File | Line | Caller | SSR-needed? | Fix Pattern |
|---|------|------|--------|-------------|-------------|
| (none from this run) | — | — | — | — | — |

## Coverage Gap — `WithPolling.svelte` SSR Path Not Exercised

The static-analysis MEDIUM-confidence candidate from RESEARCH.md (§Confirmed Warning Sites Category D + A3) is `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte:27` — `startPolling()` runs synchronously at component-init, which on the SSR pass triggers `fetchAndUpdateJobs()` at `apps/frontend/src/lib/contexts/admin/jobStores.svelte.ts:32` before `onMount` would gate it client-only.

**Why this run did NOT trigger the warning at that site:**
- `WithPolling.svelte` is rendered only by `admin/jobs` and similar admin feature-jobs pages.
- All admin routes are protected: `GET /admin/jobs` redirects to `/admin/login?errorMessage=loginFailed` BEFORE the `WithPolling` component is reached in the SSR render tree.
- This run had no authenticated admin session (auto-chain executor, no operator browser).
- Therefore the SSR pass that would render `WithPolling` did not execute — and the warning could not surface.

**Why the candidate is still confirmed structurally:**
- RESEARCH.md §Per-Category Fix Patterns 4 + Pitfall 6 record this as the canonical SSR anti-pattern: a side-effecting fetch call at component-init time runs during SSR even when admin pages are protected, BECAUSE protected admin routes still mount their layout/component tree under SSR before the auth guard redirects (the redirect IS the response, but the SSR-side render+fetch can still kick off if the layout precedes the guard).
- The fix applies regardless of whether the runtime warning surfaces in this particular curl-driven run: `startPolling()` at module/component eval is simply the wrong lifecycle for a browser-only fetch.
- Pattern 4 Option A (`onMount(() => { startPolling(); return () => stopPolling(); })`) is the canonical Svelte 5 / SvelteKit fix and matches the in-tree analog at `apps/frontend/src/lib/components/video/Video.svelte:220`.

**Decision (per Plan-70-04 fallback protocol in the spawn prompt):**
> "If the cold-start dev-server start fails or hangs (timeout > 60s): Document the failure in 70-04-CAPTURE.md, fall back to static-grep enumeration per RESEARCH.md §1, apply fix to WithPolling.svelte:24 (the MEDIUM-confidence candidate), and note the cold-start gap as a phase-verification followup."

This run did not fail or hang, but it DID fail to exercise the `WithPolling` SSR path due to admin auth. Same disposition applies: proceed with the WithPolling.svelte fix per Pattern 4 Option A, defer authenticated-admin cold-start re-verification to `/gsd-verify-work 70` (which has the cold-start protocol as part of its phase-close gate; the operator drives the admin sign-in step there).

## Sites Confirmed For Fix (Source of Truth = Static Analysis + Pattern 4)

| # | File | Line | Caller | SSR-needed? | Fix Pattern |
|---|------|------|--------|-------------|-------------|
| D1 | `apps/frontend/src/lib/admin/components/jobs/WithPolling.svelte` | 27 (post-Plan-70-02 line; pre-fix file) | `startPolling()` at component-init (`<script>` body) | NO (admin polling = browser-only enrichment; admin pages do not need polling data in SSR initial paint) | Pattern 4 Option A — `onMount(() => { startPolling(); return () => stopPolling(); })`; remove `onDestroy` import + standalone call (semantics absorbed into onMount cleanup return) |

## Notes

- The cold-start gate (run on the curl-driven SSR pass) returned `0` `fetch.*eagerly` warnings, but that is **insufficient to claim Cat D is empty** because the `WithPolling.svelte` SSR render path was not exercised.
- Authenticated cold-start re-verification is deferred to `/gsd-verify-work 70` (phase-close gate). The operator drives admin sign-in + admin/jobs navigation; the warning-count assertion (expect `0`) re-runs on that pass.
- No additional Cat D sites surfaced from voter-flow SSR (home, elections, constituencies, results redirects).
- This pre-fix capture establishes the baseline. Task 2 applies the WithPolling fix; Task 3 re-runs the capture and appends `## Post-Fix Verification`.

## Confidence

- **Source-of-truth gap:** This run cannot empirically confirm whether `WithPolling.svelte:27` fires the warning at SSR time (admin-protected route + no auth context). Confidence is now **HIGH-on-correctness** (the fix is the canonical Svelte 5 lifecycle pattern; no downside) but **MEDIUM-on-empirical-trigger** (we apply the fix without seeing the warning surface in THIS run).
- **Phase-close re-verification:** `/gsd-verify-work 70` runs the cold-start protocol with operator-driven admin sign-in, which surfaces the warning empirically before the fix and confirms its absence after. The fix landing in this plan is independent of empirical pre-confirmation.

---

## Post-Fix Verification

**Captured:** 2026-05-09 (immediately after Task 2 commit `a3c142c23`)
**Cold-start log:** `/tmp/70-04-cold-start-post.log` (18 lines total at capture)
**Procedure:** Identical to pre-fix run.

1. `rm -rf apps/frontend/.svelte-kit node_modules/.vite/` — caches re-wiped.
2. `yarn workspace @openvaa/frontend dev` started in background; ready in 1708 ms on `http://localhost:5174/`.
3. Same SSR pass via `curl -sL`:
   - `GET /` → 200
   - `GET /en` → 200
   - `GET /fi` → 200
   - `GET /elections` → 200 (redirected to `/constituencies?electionId=…`)
   - `GET /results` → 200 (redirected to `/constituencies?electionId=…`)
   - `GET /admin` → 200 (redirected to `/admin/login?errorMessage=loginFailed`)
   - `GET /admin/jobs` → 200 (redirected to `/admin/login?errorMessage=loginFailed`)
4. Dev server killed.
5. `grep -cE "(fetch.*eagerly|Avoid calling fetch eagerly)" /tmp/70-04-cold-start-post.log` → **`0`** ✅

**Result:** Post-fix `fetch.*eagerly` count is `0`, matching the pre-fix run. The voter SSR pass surfaces no Cat D warnings either before or after the WithPolling fix (no regression). The admin/jobs SSR coverage gap (auth-protected) persists identically for both runs.

### Manual Admin Polling DevTools Smoke

**Status: DEFERRED to phase-close `/gsd-verify-work 70`.**

**Rationale:** The auto-mode executor has no operator browser session, so the canonical admin-polling DevTools smoke (sign in to /admin/jobs → Network tab → confirm initial fetch + interval fetch + cleanup-on-unmount) cannot be performed in this run. Per the spawn-prompt auto-mode handling protocol:

> "auto-mode accepts this gap and defers the manual smoke to `/gsd-verify-work 70` at phase close"

This matches the deferral pattern used by Plans 70-01, 70-02, and 70-03 — all reactivity / render / a11y manual smokes are deferred to the phase-close cold-start protocol per CONTEXT.md D-04.

### Static-gate confirmation (svelte-check baseline)

`yarn workspace @openvaa/frontend check` post-Task-2 reports:

| Metric | Pre-Plan-70-04 | Post-Plan-70-04 | Δ |
|--------|----------------|-----------------|----|
| Total errors | 160 | 160 | 0 (no regression) |
| Total warnings | 0 | 0 | 0 (Plan 70-03 already eliminated the last Cat C warning; no new ones introduced) |
| Files with problems | 35 | 35 | 0 |
| WithPolling.svelte errors | 0 | 0 | 0 |
| WithPolling.svelte warnings | 0 | 0 | 0 |

### Acceptance criteria

- ✅ `70-04-CAPTURE.md` contains a `## Post-Fix Verification` section.
- ✅ The section records the post-fix cold-start `grep -c "fetch.*eagerly"` count: **`0`**.
- ✅ The section records the manual polling smoke disposition (DEFERRED to phase-close, with rationale per the auto-mode protocol).
- ✅ No additional CAPTURE.md sites surfaced; nothing remains to fix in this plan.

### Phase-close handoff

`/gsd-verify-work 70` MUST run the authenticated cold-start protocol (operator-driven admin sign-in to /admin/jobs) and record:
- `grep -c "fetch.*eagerly" /tmp/<phase-close-log>` → expected `0` (this fix's structural correctness).
- DevTools Network tab observation: initial polling fetch fires after page mount; interval fetches continue; cleanup on navigate-away. Expected PASS based on the canonical lifecycle pattern (`onMount(() => { fetch + setInterval; return () => clearInterval(); })`).
