---
phase: 64
slug: voter-results-reactivity-completion
status: draft
shadcn_initialized: false
preset: not applicable
created: 2026-04-27
stack: SvelteKit + Tailwind 4 + DaisyUI 5 + Svelte 5 runes
inherits_from: phase-62-results-page-consolidation
---

# Phase 64 — UI Design Contract

> **Bug-fix completion phase, NOT greenfield UI.** Phase 64 closes 5 voter-results E2E failures deferred from the Phase 63 parity gate. The visual + interaction architecture is fully locked by Phase 62 (D-01..D-15). This UI-SPEC INHERITS Phase 62's visual contracts verbatim and ADDS only the binding interaction assertions for the 5 failing tests + the 9-step manual smoke checklist Phase 64 absorbs from Phase 62 (per Phase 64 D-10).
>
> **No new design tokens, color choices, spacing, copy, or components are introduced.** Every visual surface in scope already exists. The Phase 64 contribution is BEHAVIORAL CORRECTNESS under the Phase 62 reactivity refactor.

---

## Inheritance Manifest

| Pillar | Source of Truth | Phase 64 Action |
|--------|-----------------|-----------------|
| Design System (DaisyUI 5 + Tailwind 4 + Svelte 5) | `62-UI-SPEC.md` §Design System | INHERITED — no change |
| Spacing Scale (`gap-md`, `gap-lg`, `mb-md`, `my-lg`, `max-w-xl`, etc.) | `62-UI-SPEC.md` §Spacing Scale | INHERITED — no change |
| Typography (`--text-md` 15px / `--text-sm` 13px / `--text-xl` 20px / `--text-2xl` 23px; weights 400 + 700) | `62-UI-SPEC.md` §Typography | INHERITED — no change |
| Color Palette (DaisyUI semantic — base-100/200/300, primary `#2546a8`, warning `#a82525`, error `#a82525`, secondary `#666`) | `62-UI-SPEC.md` §Color | INHERITED — no change |
| Copywriting Contract (15 reused i18n keys; no destructive actions; empty-state inventory) | `62-UI-SPEC.md` §Copywriting Contract | INHERITED — no new keys; verify regression-free |
| Interaction Contract — Tabs, Search+Filter, Drawer, Filter Scoping, Loading/Error | `62-UI-SPEC.md` §Interaction Contract | INHERITED — Phase 64 adds binding assertions (below) |
| Route & Param Contract (4-segment optional shape, `entityTypePlural` ∈ {candidates, organizations}, `entityTypeSingular` ∈ {candidate, organization}, coupling rule) | `62-UI-SPEC.md` §Route & Param Contract | INHERITED — no change |
| Component Inventory (`EntityListWithControls`, `EntityList`, `EntityDetailsDrawer`, `Tabs`, `Modal`, `InfoBadge`, `filterContext`, `voterContext`) | `62-UI-SPEC.md` §Component Inventory | INHERITED — no new components |
| Accessibility Contract (focus trap, focus return, deeplink-shareable URLs, AA/AAA contrast) | `62-UI-SPEC.md` §Accessibility Contract | INHERITED — Phase 64 adds dark-mode contrast spot-check (manual, step 7) |
| Registry Safety | `62-UI-SPEC.md` §Registry Safety | INHERITED — N/A (no third-party UI registry) |
| Non-Goals | `62-UI-SPEC.md` §Non-Goals | INHERITED — extend with Phase 64-specific non-goals (below) |

> **Read order:** Implementers MUST read `62-UI-SPEC.md` first, then this delta. The delta is unintelligible without the parent contract.

---

## Test ID Inventory (binding for the 5 failing tests)

The 5 failing tests in `tests/tests/specs/voter/voter-results.spec.ts` query the testIds below. Each must remain present and reachable after Phase 64 fixes; renaming or stripping any of them is a regression.

| Test ID | Element | Source File:Line | Set By |
|---------|---------|------------------|--------|
| `entity-list-filter` | Filter trigger button (both inactive + warning-color variants) | `EntityListWithControls.svelte:161, 171` | Hard-coded in component (NOT controlled by `data-testid` prop) |
| `entity-list-with-controls` | Compound component wrapper `<div>` | `EntityListWithControls.svelte:143` | Hard-coded |
| `entity-list-with-controls-list` | Internal `<EntityList>` wrapper | `EntityListWithControls.svelte:221` | Hard-coded |
| `entity-list-search` | Search input | `EntityListWithControls.svelte:151` | Hard-coded |
| `voter-results-list` | The list rendered by layout (the `EntityListWithControls` instance via `data-testid` prop forwarded to its outer wrapper) | `+layout.svelte:381` | Layout passes via `data-testid` prop. **Note (existing inconsistency):** `EntityListWithControls.svelte:143` hard-codes `data-testid="entity-list-with-controls"` and uses `concatClass(restProps, ...)` for class only — the prop-forwarded `data-testid="voter-results-list"` does NOT currently override the hard-coded value. The fixture at `voter.fixture.ts:84` waits for `voter-results-list`. Phase 64 reproduction must verify whether this testid resolves on cold deeplinks or is part of the failure surface; if missing, restoring it is a binding fix-step. |
| `voter-results-list-container` | Wrapping `<div>` with `content-visibility: auto` and `bg-base-300` | `+layout.svelte:349` | Layout |
| `voter-results-drawer` | The `EntityDetailsDrawer` (drawer-first source-order) | `+layout.svelte:293` | Layout passes via `data-testid` prop |
| `voter-results-entity-tabs` | Tabs component for plural switching | `+layout.svelte:357` | Layout |
| `voter-results-candidate-section` | Wrapping `<div>` around the candidates list | `+layout.svelte:363-367` (conditional) | Layout |
| `voter-results-party-section` | Wrapping `<div>` around the organizations list | `+layout.svelte:363-367` (conditional) | Layout |
| `voter-results-card` | Each entity card in the rendered list | `EntityCard.svelte` (existing) | Component-level (not in Phase 64 scope) |
| `entity-card-action` | The wrapping `<a>` on entity cards (used to extract deeplink hrefs) | `EntityCard.svelte` (existing) | Component-level |
| `voter-results-ingress` | Ingress copy block above selectors | `+layout.svelte:303` | Layout |
| `voter-results-election-select` | Election `AccordionSelect` (visible iff >1 election) | `+layout.svelte:330` | Layout |

**Phase 64 binding rule:** No testId in this table may be renamed, removed, or moved. New testIds may be added if reproduction surfaces a gap (e.g. an explicit `voter-results-loading` if the deeplink fix needs a discrete loading sentinel). Any addition must be documented in the Phase 64 verification report.

---

## Binding Interaction Contracts (the 5 failing tests)

For each failing test, this section pins the EXACT pre-action / action / post-action visual + console state. Phase 64 PASSES iff every assertion below holds inside the canonical Playwright invocation `yarn playwright test -c ./tests/playwright.config.ts --workers=1 --reporter=json` (Phase 64 D-07).

### Contract 1 — RESULTS-01 + RESULTS-02 (filter toggle)

**Test:** `voter-results.spec.ts:150` — `filter toggle narrows list without effect_update_depth_exceeded`

| Phase | Visual / Console State |
|-------|------------------------|
| **Pre** | After `answeredVoterPage` lands on `/results/candidates?electionId=…`, the `voter-results-list` list is rendered; `entity-list-filter` button is present in the inactive variant (no badge, default ghost style). `voter-results-card` count = N (N > 0). Console error log: empty. |
| **Action** | (a) Click the `entity-list-filter` button → filter `<dialog>` (Modal) opens. (b) Check the first `<input type="checkbox">` inside the dialog. (c) Click the FIRST `<button>` inside the dialog (the `entityFilters.applyAndClose` button: "Close filters") → modal closes. (d) `await page.waitForTimeout(500)` for filter propagation. |
| **Post** | Modal is closed. The `entity-list-filter` button now renders the warning-color variant (`color="warning"` → DaisyUI `btn-warning`) with an `InfoBadge` showing `numActiveFilters` ≥ 1. The `voter-results-card` count = M, where `M ≤ N` (filter narrows or leaves equal — never expands). Console errors filtered for substring `effect_update_depth_exceeded` MUST equal `[]` (empty array). |
| **Negative assertion** | NO `effect_update_depth_exceeded` warnings emitted at any point in the test. (Direct hard fail.) |

### Contract 2 — D-14 (filter scope reset on plural-tab switch)

**Test:** `voter-results.spec.ts:199` — `filter state resets on plural tab switch (D-14)`

| Phase | Visual / Console State |
|-------|------------------------|
| **Pre** | `/results/candidates?electionId=…` rendered; filter activated as in Contract 1 → `entity-list-filter` is in warning-color variant, badge ≥ 1. |
| **Action** | Click the parties tab inside `voter-results-entity-tabs` (`getByRole('tab', { name: /parties/i })`). Wait for URL to match `/\/results\/organizations/`. |
| **Post** | URL = `/results/organizations?electionId=…` (or with original persistent search params). The `entity-list-filter` button on the organizations side is NOT in the warning-color variant — i.e., `page.getByTestId('entity-list-filter').filter({ has: page.locator('.btn-warning, [color="warning"]') })` MUST resolve to count = 0. (Equivalent: numActiveFilters for the (electionId, "organizations") tuple = 0; no leakage from the candidates tuple.) |

### Contract 3 — D-15 (filter persistence on drawer cycle)

**Test:** `voter-results.spec.ts:230` — `filter state survives drawer open/close (D-15)`

| Phase | Visual / Console State |
|-------|------------------------|
| **Pre** | `/results/candidates?electionId=…` rendered; filter activated as in Contract 1. Card count after filter = M (M ≤ N). The badge on the filter button shows ≥ 1. |
| **Action** | (a) Click the first `voter-results-card`'s wrapping `<a>` link → URL becomes `/results/candidates/candidate/[id]?…`. The `voter-results-drawer` is now visible. (b) `page.goBack()` → URL returns to `/results/candidates?…`. The drawer is no longer visible. |
| **Post** | The `voter-results-card` count = M (UNCHANGED from pre-action). The filter is still active — the badge is still ≥ 1. The list state did NOT reset across the drawer cycle. |

### Contract 4 — D-08 shape 3 (deeplink list+drawer)

**Test:** `voter-results.spec.ts:267` — `deeplink list+drawer URL renders both (RESULTS-03, D-08 shape 3)`

| Phase | Visual / Console State |
|-------|------------------------|
| **Pre** | A candidate id is harvested from the first `entity-card-action` href on the fixture's landing page (`parseResultHref(href)` returns `{ entityTypePlural: 'candidates', entityTypeSingular: 'candidate', id, search }`). |
| **Action** | Cold-navigate via `page.goto('/results/candidates/candidate/[id]?electionId=…')`. Wait for `domcontentloaded`. |
| **Post** | `voter-results-drawer` is visible within 5s (`expect(...).toBeVisible({ timeout: 5000 })`). `voter-results-list-container` is ALSO visible — the drawer overlays, does not replace, the list. Source order is preserved (drawer-first per Phase 62 D-10 — already automated by Test 10 in the same spec file: `voter-results.spec.ts:341`; Phase 64 must not regress it). |

### Contract 5 — D-08 shape 4 (deeplink edge case orgs+candidate-drawer)

**Test:** `voter-results.spec.ts:288` — `deeplink edge case: organizations list + candidate drawer (D-08 shape 4)`

| Phase | Visual / Console State |
|-------|------------------------|
| **Pre** | A candidate id is harvested as in Contract 4. |
| **Action** | Cold-navigate via `page.goto('/results/organizations/candidate/[id]?electionId=…')`. Wait for `domcontentloaded`. |
| **Post** | `voter-results-drawer` is visible within 5s — and renders for the CANDIDATE entity (singular = `candidate` from URL). Underneath the drawer, the list rendered is the ORGANIZATIONS list — `voter-results-party-section` testid MUST be present and visible. `voter-results-candidate-section` MUST be absent (we're on the orgs plural). This is the cross-type edge case from Phase 62 D-08 — the URL schema separates plural-list-mode from singular-drawer-entity precisely to support this shape. |

---

## Empty-State Inventory (Phase 64 regression-watch)

Phase 64 introduces no new empty-states; the inherited inventory from Phase 62 must remain regression-free.

| Scenario | Expected UI | Source |
|----------|-------------|--------|
| Filter narrows list to 0 entities | Inline hint via i18n key `entityList.controls.noFilterResults` ("The filters yielded no matches. You can try changing them.") rendered inside `EntityListWithControls.svelte:181-184`. List area stays mounted. Filter button stays present. | Inherited |
| Search narrows list to 0 entities | Inline hint via i18n key `entityList.controls.noSearchResults` ("The search yielded no matches. You can try changing it.") at the same location. | Inherited |
| Partial match (filtered.length < entities.length but > 0) | Inline hint via i18n key `entityList.controls.showingNumResults` ("Showing N results"). | Inherited |
| Drawer-target entity not found (deeplink to invalid id) | Drawer fails to open silently; debug-log only via `logDebugError` at `+layout.svelte:181-183`; `drawerEntity` stays `undefined`; list view renders as if deeplink was list-only. | Inherited (Phase 62 ‘Deeplink to entity not found' row) |
| No nominations for active election | `error.noNominations` fallback `MainContent` with Home + Questions buttons (`+layout.svelte:401-413`). | Inherited |

**Phase 64 regression rule:** the four list-state hints (`noFilterResults`, `noSearchResults`, `showingNumResults`, plus the `error.noNominations` page-level fallback) must continue to render under their respective conditions after the reactivity bridge fix lands. The reactivity refactor MUST NOT break the conditional branches in `EntityListWithControls.svelte:176-191` — they depend on `filtered.length` vs `entities.length` comparisons that the `$derived` (or its replacement per Phase 64 D-03) must keep accurate.

---

## Manual-Verification Contract (the 9-step smoke, absorbed per Phase 64 D-10)

Phase 64 absorbs the 9-step manual smoke checklist deferred from Phase 62 (`62-03-HUMAN-CHECKPOINT.md`). The 5 E2E tests above cover most steps automatically; the user runs the 9-step manual smoke ONCE after Phase 64's executor completes; both phases close on the same gate.

| # | Step | Auto-tested by E2E? | Owner |
|---|------|---------------------|-------|
| 1 | Start the stack fresh: `yarn dev:reset-with-data && yarn dev`; wait for Supabase healthy + Vite ready | Implicit (E2E setup runs `dev:reset-with-data` via fixtures) | Manual confirm |
| 2 | Cold deeplink drawer-first paint — DevTools Performance recording confirms the drawer frame paints before the list frame on `/results/organizations/candidate/[id]?…` | YES — `voter-results.spec.ts:341` `drawer paints before list on cold deeplink (D-10)` (DOM-order + computed `content-visibility: auto`) | Auto + manual eyes-on |
| 3 | Filter loop absence — open DevTools Console; rapid-toggle 2-3 filters; confirm NO `effect_update_depth_exceeded` warnings; list narrows correctly | YES — Contract 1 (negative assertion) | Auto + manual eyes-on |
| 4 | Filter re-enablement — filter button visible, clickable; toggle narrows list; badge appears; reset button works | YES — Contract 1 (positive assertions) | Auto + manual eyes-on |
| 5 | Filter scope reset on tab switch — activate filter on candidates, switch to organizations → badge clears; reactivate on organizations → badge ≥ 1; switch back to candidates → badge clears (NOT the previous candidate-side value) | PARTIAL — Contract 2 verifies the candidates → organizations direction; the round-trip back to candidates is manual-only | Auto + manual eyes-on |
| 6 | Drawer cycle preserves filters — activate filter, click card, ESC/backdrop close; confirm filter still active | YES — Contract 3 | Auto + manual eyes-on |
| **7** | **Dark-mode contrast — toggle dark theme; confirm `entity-list-filter` warning-color variant + InfoBadge contrast ≥ 4.5:1** | **NO — manual-only** (Playwright defaults to light theme; theme toggle is not currently exercised in voter-results.spec.ts) | **Manual-only** |
| 8 | Route 404 + coupling redirect — `/results/invalidplural?…` → 404; `/results/candidates/candidate?…` (singular without id) → redirect to `/results/candidates?…` | YES — `voter-results.spec.ts:323` (`invalid plural matcher returns 404`) and `:330` (`coupling-rule redirect`) | Auto |
| 9 | Retired-TODO audit — `grep` confirms `TODO: Restore EntityListControls` is gone from `+layout.svelte`; `+layout.ts` exists; old route files (`results/+page.svelte`, `results/[entityType]/[entityId]/+page.svelte`) are gone | Implicit (Plan 62-03 acceptance gates already verified; Phase 64 must not reintroduce them) | Manual confirm |

**Step 7 acceptance criterion (manual-only):** open the rendered `entity-list-filter` button in its warning variant in dark mode (toggle via the app's theme toggle if present; otherwise via DevTools `[data-theme="dark"]` attribute on `<html>`). The `btn-warning` background + `InfoBadge` text must achieve a foreground/background contrast ratio ≥ 4.5:1 measured by Chrome DevTools' Color Picker contrast indicator (or any equivalent WCAG AA tool). DaisyUI's dark-theme `--color-warning` token is the source; Phase 64 does NOT change it. This step is the only verification not covered by E2E.

---

## Non-Goals for Phase 64 (delta over Phase 62)

In addition to all Phase 62 non-goals (no new tokens, no new copy, etc., per `62-UI-SPEC.md` §Non-Goals), Phase 64 adds:

- **No new visual states.** The filter button has exactly 2 states (inactive, warning-active) — same as Phase 62. No new "loading filter" or "applying filter" states are introduced.
- **No new motion / transitions.** The existing `slide` transition on the showing-N-results hint stays as-is.
- **No new component variants.** `EntityListWithControls` keeps its single fixed layout (Phase 62 D-03).
- **No new route shapes.** The 4-segment `/results/[electionId]/[[entityTypePlural]]/[[entityTypeSingular]]/[[id]]` is binding (Phase 62 D-08).
- **No new design tokens.** Tailwind `@theme` block in `app.css` is read-only.
- **No new icons.** `filter` icon stays the trigger icon.
- **No new i18n keys.** The 15 keys reused in Phase 62 (`62-UI-SPEC.md` §Copywriting Contract) cover Phase 64 entirely. If reproduction reveals a need for a new user-visible string (highly unlikely), the planner triggers a discuss-phase before adding it.
- **No `@openvaa/filters` Svelte-specific code.** Phase 64 D-01 explicitly forbids `$state`, `$derived`, `svelte/store`, `svelte/reactivity` imports inside `packages/filters/`. UI-framework agnosticism is hard-constrained.
- **No `EntityList` consumer migration sweep.** Other surfaces using bare `<EntityList>` (candidate-app, etc.) are NOT migrated to `<EntityListWithControls>` in Phase 64 — that remains a deferred follow-up from Phase 62.
- **No imgproxy-related visual changes.** Phase 64 reclassifies imgproxy + 13 cascades into `DATA_RACE_TESTS` (per Phase 64 D-09). The visual surface of profile-image upload is OUT of scope.

---

## Component Inventory (Phase 64 Deltas)

Phase 64 introduces **0 new components**. The inventory is identical to Phase 62 (`62-UI-SPEC.md` §Component Inventory). Phase 64 may modify the INTERNALS of these components — specifically:

| Component | Allowed Phase 64 Modifications |
|-----------|-------------------------------|
| `filterContext.svelte.ts` | Lifecycle audit + fix (Phase 64 D-02). May replace the version-counter bridge with a different reactivity primitive (e.g., `createSubscriber` from `svelte/reactivity`) per Phase 64 D-03 research outcome. The PUBLIC API may evolve (e.g., add `subscribe()` / `getSnapshot()` accessors). VISUAL OUTPUT must not change. |
| `EntityListWithControls.svelte` | Consumer-side bridge replacement allowed if D-03 research recommends it. The 4 visible states (controls row + list + showingNumResults / noFilterResults / noSearchResults hint) MUST remain pixel-equivalent. |
| `+layout.svelte` (results) | Drawer-rendering branch (`drawerEntity` derivation, `drawerVisible` gate) may be adjusted to fix the deeplink class (Phase 64 D-05 directions a/b). Source-order contract (drawer block BEFORE list container) MUST be preserved. `content-visibility: auto` on list container MUST be preserved. |
| `+layout.ts` / `+page.ts` (results) | Canonical redirect + coupling-guard may be adjusted to fix the deeplink class (D-05 direction b). User-visible URL shape MUST not change. |
| `voter.fixture.ts` | Fixture-level adjustments allowed only if reproduction confirms D-05 direction (c) — fixture short-circuit detection. The `voter-results-list` testid wait at line 84 stays as the terminal sentinel. |

`@openvaa/filters` may receive PURE-TS additions (no Svelte primitives) per Phase 64 D-01 if root-cause analysis demands it.

---

## Accessibility Contract (Phase 64 reaffirms + step 7 explicit)

Phase 64 INHERITS Phase 62's accessibility contract entirely. The single explicit Phase 64 addition:

- **Dark-mode contrast on the filter-active warning button** is verified manually as step 7 of the 9-step smoke. Light-mode contrast (`#a82525` on `#ffffff` = 6.25:1, AA) was already verified in Phase 62; dark-mode equivalent (DaisyUI dark `warning` token on dark `base-100`) is the new explicit step. Acceptance: ≥ 4.5:1 (WCAG AA). DaisyUI ships dark-theme tokens that pass this baseline; Phase 64 does NOT modify them.

All other accessibility lines (focus trap, focus return, deeplink-shareable URLs, keyboard nav on Tabs, ARIA on Modal, ARIA on Drawer) remain Phase 62-inherited and must not regress.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none — shadcn not applicable to Svelte stack | — | N/A — no third-party component imports introduced in Phase 64 |

Phase 64 imports only from existing workspace packages (`@openvaa/filters`, `@openvaa/data`, `@openvaa/core`, `@openvaa/app-shared`) and existing in-repo modules (`$lib/components/*`, `$lib/dynamic-components/*`, `$lib/contexts/*`). DaisyUI is already installed. No `npx shadcn` invocation. No new third-party dependencies.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (all i18n keys inherited from Phase 62; no new keys; empty/error/partial states inventory inherited; no destructive actions)
- [ ] Dimension 2 Visuals: PASS (component inventory inherited; binding interaction contracts pinned for the 5 failing tests; 9-step manual smoke contract listed)
- [ ] Dimension 3 Color: PASS (palette inherited; warning-color filter button visual contract pinned for Contracts 1 + 2; dark-mode contrast assertion explicit as step 7)
- [ ] Dimension 4 Typography: PASS (sizes + weights inherited from Phase 62 — 4 sizes md/sm/xl/2xl; 2 weights 400/700)
- [ ] Dimension 5 Spacing: PASS (tokens inherited from `app.css` `@theme`; no ad-hoc values; `content-visibility: auto` mechanism preserved)
- [ ] Dimension 6 Registry Safety: PASS (N/A — no third-party registry)

**Approval:** pending
