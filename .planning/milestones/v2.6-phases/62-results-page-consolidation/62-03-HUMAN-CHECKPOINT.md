# Phase 62 Plan 62-03 — Human Checkpoint Manifest

**Type:** `checkpoint:human-verify` (gate: blocking)
**Prerequisite tasks:** Task 1 + Task 2 complete and committed
**Approval signal:** reply `approved` on the orchestrator checkpoint prompt

---

## What was built (Tasks 1 + 2)

- URL-driven `/results/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` with Tabs + drawer both deriving from `page.params`; electionId stays as a persistent search param (per `PERSISTENT_SEARCH_PARAMS` in `$lib/utils/route/params.ts`).
- Filters re-enabled via `EntityListWithControls` + `filterContext` (auto-scoped per election × plural).
- Drawer-first paint — source-order markup + `content-visibility: auto` on the list container (D-10 cheapest-first mechanism, Open Question 4 RESOLVED).
- Canonical redirect: `/results` → `/results/candidates` via `results/+layout.ts` (preserves `?electionId=X&constituencyId=Y`).
- ROUTE templates + DEFAULT_PARAMS + EntityCard + EntityInfo migrated to the new 4-segment shape (carrying over 62-02 deviation #1).
- `voter-results.spec.ts` extended with 10 new Playwright tests covering every Phase 62 contract — the #10 drawer-first-paint gate asserts `compareDocumentPosition` + computed `content-visibility: auto`.

## Why human verification is still required

Automated Playwright gates cover the strict source-order + computed-style contract for D-10 and every structural contract listed in the plan. The checkpoint adds **three eyes-on confirmations** that the perceived UX holds, that no subtle console warnings surface during a real-user filter interaction, and that dark-mode contrast is preserved — concerns the automated layer cannot cheaply express.

## 9-step verification protocol

Follow every step. Reply `approved` only if all 9 are green. List any failing step with details (URL that broke, console errors observed, unexpected UI state) if not.

### 1. Start the stack fresh

```bash
yarn dev:reset-with-data
yarn dev
```

Wait until Supabase services are healthy and Vite reports `ready`.

### 2. Cold deeplink drawer-first paint (D-10, UI-SPEC row)

1. Open DevTools → Performance tab, start recording.
2. Browse `http://localhost:5173/results/candidates?electionId=<ELECTION_ID>` to find a candidate; copy its id from the card link.
3. Open a new tab, paste: `http://localhost:5173/results/organizations/candidate/<ID>?electionId=<ELECTION_ID>&constituencyId=<CONSTITUENCY_ID>`.
4. Observe that the drawer content (candidate detail) is visible BEFORE the organizations list below renders.
5. Stop Performance recording. Inspect the Layout/Paint timeline — the drawer frame should paint earlier than the list frame.

**Escalation:** if the cheap mechanism (content-visibility) visibly underperforms, note in the checkpoint feedback — the fallback is to stream a drawer-first `+page.ts` promise (follow-up, out-of-scope here).

### 3. Filter loop absence (RESULTS-01 smoke)

1. Navigate to `/results/candidates?electionId=<ELECTION_ID>`.
2. Open DevTools Console.
3. Click the Filter button (must be visible — if absent, skip to step 9 retired-TODO audit first). Check 2–3 filters quickly in succession. Close the modal.

**Confirm:** NO `effect_update_depth_exceeded` warnings. NO runaway repeated log messages. List narrows correctly.

### 4. Filter re-enablement (RESULTS-02)

1. Verify the Filter button is visible and clickable.
2. Toggle a filter → list narrows → filter badge shows count → reset button works.

Previously, this surface had the `<!-- TODO: Restore EntityListControls … -->` comment disabling filters. The comment is gone, and the button now works.

### 5. Filter scope reset (D-14)

1. On candidates, activate a filter (badge shows 1+).
2. Click organizations tab → badge shows 0.
3. Reactivate a filter on organizations → badge shows 1+.
4. Switch back to candidates → badge shows 0 again (NOT the previous value).

### 6. Drawer open/close preserves filters (D-15)

1. Activate a filter on candidates, note the narrowed list + badge.
2. Click a card → drawer opens.
3. Press ESC or click the backdrop → drawer closes.
4. Filter still active, list still narrowed.

### 7. Dark mode sanity (UI-SPEC Manual-Only Verification row)

1. Toggle dark theme via the app's theme toggle (if exposed; else via DevTools `html[data-theme="dark"]`).
2. Verify the filter-active badge warning tint remains legible (contrast ≥ 4.5:1 per UI-SPEC).

### 8. Route 404 + coupling redirect

1. Visit `/results/invalidplural?electionId=<ID>` → 404/error page.
2. Visit `/results/candidates/candidate?electionId=<ID>&constituencyId=<ID>` → should redirect silently to `/results/candidates?…`.

### 9. Retired-TODO audit

Run locally:

```bash
grep -n "TODO: Restore EntityListControls" apps/frontend/src/routes/\(voters\)/\(located\)/results/+layout.svelte
# expected: empty
test -e apps/frontend/src/routes/\(voters\)/\(located\)/results/\[entityType\]/\[entityId\]/+page.svelte
# expected: exits non-zero (file GONE)
test -e apps/frontend/src/routes/\(voters\)/\(located\)/results/+page.svelte
# expected: exits non-zero (file GONE)
test -e apps/frontend/src/routes/\(voters\)/\(located\)/results/+layout.ts
# expected: exits 0 (file EXISTS — canonical redirect)
```

All four checks must match the expected outcomes.

---

## Response format

- **All 9 steps green:** reply `approved`.
- **One or more failing:** list the step number(s) and specifics (URL that broke, console errors observed, unexpected UI state).

The orchestrator will not close Plan 62-03 — or Phase 62 — until this checkpoint is approved.
