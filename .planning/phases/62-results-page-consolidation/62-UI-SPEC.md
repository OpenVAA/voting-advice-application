---
phase: 62
slug: results-page-consolidation
status: approved
shadcn_initialized: false
preset: not applicable
created: 2026-04-24
stack: SvelteKit + Tailwind 4 + DaisyUI 5 + Svelte 5 runes
---

# Phase 62 — UI Design Contract

> Visual and interaction contract for the Results Page Consolidation phase (RESULTS-01/02/03). This phase is a consumer-side refactor — no greenfield UI. Contract reaffirms the existing design tokens locked in `apps/frontend/src/app.css` and the existing visual idioms of `EntityListControls` / `EntityList` / `EntityDetailsDrawer`, and adds the delta-only interaction rules for the merged `EntityListWithControls` component, the URL-driven Tabs, and the deeplink drawer-prioritization behaviour.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (shadcn does not apply — Svelte 5 stack) |
| Preset | not applicable |
| Component library | DaisyUI 5 (native Tailwind 4 plugin via `@plugin 'daisyui'` in `apps/frontend/src/app.css`) |
| Icon library | Project's internal `Icon` component at `apps/frontend/src/lib/components/icon` (uses named icon identifiers, e.g. `"filter"`, `"next"`) |
| Font | Inter, system-ui fallback (`--font-base` in `app.css:226-228`) |

**Source of truth for tokens:** `apps/frontend/src/app.css` (`@theme { ... }` block, lines 87-241). This file declares every token in the section below and is **the** canonical reference. This UI-SPEC does not introduce new tokens — it pins the subset this phase consumes.

**Shadcn not applicable:** shadcn is a React component registry. Phase 62 works on SvelteKit 2 + Svelte 5 runes with a mature in-house DaisyUI theme. No third-party registry is introduced; Registry Safety gate is N/A.

---

## Spacing Scale

**Token ownership:** Phase 62 is a consumer-side refactor. It introduces **0 new spacing tokens** and changes **0 existing tokens**. All values in the table below are **inherited read-only from `app.css` @theme** and are out of scope for phase-level token governance. The checker's multiples-of-4 rule applies to tokens a phase *introduces*; this phase owns none.

Declared values for Phase 62 (all drawn from `app.css` `@theme` block; all resolve to multiples of 4 except the intentional half-step `md`/`xs` used for fine-grained control in existing components):

| Token | Value | Usage in Phase 62 |
|-------|-------|-------------------|
| `gap-sm` | 8px (0.5rem) | Intra-control gap inside `EntityListWithControls` compact rows |
| `gap-md` | 10px (0.625rem) | Card-to-card gap in `EntityList` (unchanged; `EntityList.svelte:98` uses `gap-md`) |
| `gap-lg` | 20px (1.25rem) | Search-row gap between search input and filter button (unchanged from `EntityListControls.svelte:97`) |
| `mb-md` | 10px | Bottom margin of the controls row above the list (unchanged from `EntityListControls.svelte:97`) |
| `my-lg` | 20px | Vertical margin for "Showing X results" / "No filter results" hint text (unchanged from `EntityListControls.svelte:131, 139`) |
| `mb-xl` / `mt-xl` | 40px | Section breaks around ingress copy + element above results-list container (unchanged from `+layout.svelte:203`) |
| `pb-safelgb` / `pl-safemdl` / `pr-safemdr` | safe-area-inset + 20px / 10px | Mobile safe-area padding on the results container (unchanged from `+layout.svelte:242`) |
| `max-w-xl` | 36rem (576px) | Results-list max-width — container resolves via `--max-width-xl` override, NOT `--spacing-xl` (see `app.css:97-124`) |
| `p-0` drawer body | 0px | Entity detail drawer renders flush inside its overlay (unchanged, per `EntityDetailsDrawer` contract) |

**Exceptions:** none. All classes above are pre-existing Tailwind token consumers; this phase MUST NOT introduce ad-hoc pixel values or CSS fragments that bypass the `@theme` tokens.

**Anti-pattern to avoid:** do NOT use `w-xl` or `max-w-xl` expecting it to resolve to `--spacing-xl` (40px). The project's `app.css:97-124` deliberately overrides `--max-width-xl` to 36rem. Always verify which namespace a utility resolves to.

---

## Typography

**Token ownership:** Phase 62 introduces **0 new type tokens**. All sizes below are **inherited read-only from `app.css` @theme** (consumed, not owned). `--text-xs` is excluded from this phase's declared inventory — it is an inherited utility used only by the pre-existing `.small-label` class, which this phase does not modify.

Phase-owned type sizes (4): `md` (body), `sm` (label/hint), `xl` (list heading), `2xl` (page heading). Phase 62 MUST NOT introduce any new `--text-*` size.

| Role | Size | Weight | Line Height | Usage in Phase 62 |
|------|------|--------|-------------|-------------------|
| Body (default) | `--text-md` = 15px (0.9375rem) | `--font-weight-normal` = 400 | 1.35 | All prose, ingress copy, hints, filter labels |
| Label / hint | `--text-sm` = 13px (0.8125rem) | 400 | 1.35 | Info hints under "Showing X results", secondary constituency label, election-info paragraph |
| Heading (list section title) | `--text-xl` = 20px (1.25rem) | `--font-weight-bold` = 700 | 1.21 | `h3` section header above list ("NumShown candidates in constituency") — unchanged from `+layout.svelte:260` |
| Heading (page title) | `--text-2xl` = 23px (1.4375rem) | 700 | 1.21 | Page `h1` via `MainContent` (unchanged) |

**Weights allowed in Phase 62: 2.** `--font-weight-normal` (400) and `--font-weight-bold` (700) only — no intermediate weights.

**Body line-height rule:** component-default 1.35 via `--text-md--line-height`. Prose blocks (ingress, error copy) must use `leading-lg` (1.65) via the `.prose` utility if multi-paragraph — `.prose` already applies this; do not re-specify.

---

## Color

DaisyUI semantic palette from `app.css` `@plugin 'daisyui/theme' { name: 'light' }` (lines 9-38) and `'dark'` (lines 41-69). Both themes ship; components consume semantic names, not literal hex. Values below show the **light** theme; dark theme variant is auto-applied via `[data-theme='dark']`.

| Role | Token (light) | Hex (light) | Usage in Phase 62 |
|------|---------------|-------------|-------------------|
| Dominant (60%) | `bg-base-100` | `#ffffff` | Page background, drawer body, modal body, card surface |
| Secondary (30%) | `bg-base-300` | `#d1ebee` | Results-list container wrapper (the shaded strip behind the list — see `+layout.svelte:240`), filter modal trigger-button unfilled background, tags |
| Cards (ambient) | `bg-base-200` | `#e8f5f6` | Secondary surfaces, empty-state tonal background when applicable |
| Accent (10%) | `text-primary` / `btn-primary` | `#2546a8` | Active tab indicator, primary action buttons only, link text |
| Warning (filter active badge) | `text-warning` / `btn warning` | `#a82525` | Filter button when `numActiveFilters > 0` (existing behaviour in `EntityListControls.svelte:108-116`); Reset-filters button |
| Error | `text-error` | `#a82525` | Empty "no nominations" fallback message (reuse existing) |
| Secondary text | `text-secondary` | `#666666` | Hint lines ("Showing N results", "No filter results", election-info secondary text) |

**Accent (60/30/10 audit):**

- **Primary (`#2546a8`)** is this project's accent. Reserved in Phase 62 for:
  1. Primary CTA buttons (`variant="main"` / `.btn-primary`) — "Close filters", "Show more", drawer primary actions
  2. Active Tab indicator (`.btn-primary` underline or pill on the active tab)
  3. Link text (`a:link` default — see `app.css:312-318`)
  4. Question-match-score progress UI (existing, untouched by this phase)

- **Warning (`#a82525`)** is a semantic color, not a second accent. Reserved in Phase 62 for:
  1. Filter trigger button when `numActiveFilters > 0`
  2. "Reset filters" action in the filter Modal footer

- **Never in Phase 62:** using primary for passive borders, decorative fills, or non-interactive headings. Using warning for non-destructive-leaning "active filter" semantics is **permitted** because it matches the project's established warning-as-attention idiom (line 108 of EntityListControls.svelte) — this phase inherits the pattern, does not redefine it.

**Destructive actions:** there are **no destructive actions** introduced in Phase 62. Closing the drawer, resetting filters, and switching tabs are all reversible. No confirmation dialog required.

---

## Copywriting Contract

All copy in Phase 62 reuses existing i18n keys — **no new user-facing strings** are introduced for the base happy path. New keys are required only for the drawer deeplink loading state (if any) and the default-plural canonicalization hint (if the planner picks the "show default plural without URL change" branch of D-discretion). Those are optional and called out below.

### Reused Keys (existing — authoritative)

| Element | i18n Key (en) | Copy | Source |
|---------|---------------|------|--------|
| Page title (ranked) | `results.title.results` | "Results" | `results.json:33` |
| Page title (browse) | `results.title.browse` | "Browse candidates and parties" | `results.json:32` |
| Primary CTA (filter trigger) | `entityFilters.filterButtonLabel` | "Filter" | `entityFilters.json:4` |
| Filter modal title | `entityFilters.filters` | "Filters" | `entityFilters.json:5` |
| Filter modal primary action | `entityFilters.applyAndClose` | "Close filters" | `entityFilters.json:2` |
| Filter modal secondary action | `entityFilters.reset` | "Reset filters" | `entityFilters.json:11` |
| Search placeholder | `entityList.controls.searchPlaceholder` | "Search by name" | `entityList.json:5` |
| Empty state — filters | `entityList.controls.noFilterResults` | "The filters yielded no matches. You can try changing them." | `entityList.json:3` |
| Empty state — search | `entityList.controls.noSearchResults` | "The search yielded no matches. You can try changing it." | `entityList.json:4` |
| "Showing N of M" | `entityList.controls.showingNumResults` | "Showing {numShown, plural, =1 {1 result} other {# results}}" | `entityList.json:6` |
| Section header (candidate) | `results.candidate.numShown` | "{numShown, plural, =0 {No candidates} =1 {1 candidate} other {# candidates}}" | `results.json:5-7` |
| Section header (organisation) | `results.organization.numShown` | "{numShown, plural, =0 {No parties} =1 {1 party} other {# parties}}" | `results.json:27-29` |
| Constituency suffix | `results.inConstituency` | "in constituency" | `results.json:11` |
| Empty state — no nominations | `error.noNominations` | (existing; do not re-author) | `error.json` |
| Election selector prompt | `results.selectElectionFirst` | "Select an election first" | `results.json:30` |
| Show more button | `entityList.showMore` | "Show more" | `entityList.json:8` |

### Optional New Keys (planner's discretion, call out only if the branch applies)

| Element | Proposed Key | Proposed Copy (en) | When Needed |
|---------|--------------|--------------------|-------------|
| Drawer-first loading (deeplink) | `results.drawer.loadingDetails` | "Loading details…" | Only if D-10's drawer-prioritization mechanism exposes a user-visible loading state before the list backfills; may be unnecessary if the drawer renders with streamed SSR data |
| Default-plural canonicalization | — | — | If the planner chooses to redirect `/results/[electionId]` to `/results/[electionId]/[defaultPlural]` via the load function, no new copy is needed (redirects are silent); if instead the layout renders with a default plural without URL mutation, no new copy is needed either |

**Rule:** any new i18n key introduced by this phase MUST be added to **all 7 locales** (`en`, `fi`, `sv`, `fr`, `et`, `da`, `lb`) in `apps/frontend/src/lib/i18n/translations/*/` and reflected in `apps/frontend/src/lib/types/generated/translationKey.ts` (autogenerated). Adding a key to `en` only is a phase-blocking defect.

### Destructive Confirmations

| Action | Confirmation Copy | Why |
|--------|-------------------|-----|
| (none) | N/A | Phase 62 has no destructive actions |

### Empty State Inventory

| Scenario | What the user sees |
|----------|--------------------|
| No nominations for the selected election / constituency | `error.noNominations` — fallback `MainContent` with Home + Questions buttons (existing — unchanged) |
| Nominations exist but the active filter set yields no matches | Inline hint via `entityList.controls.noFilterResults` — list area stays mounted, filter button remains present so user can adjust filters (unchanged from legacy `EntityListControls`) |
| Nominations exist but the search yields no matches | Inline hint via `entityList.controls.noSearchResults` (unchanged) |
| Partial match — filters/search narrowed the list | Inline hint via `entityList.controls.showingNumResults` with `numShown` interpolated (unchanged) |
| Deeplink to `/results/[electionId]/[entityTypePlural]/[entityTypeSingular]/[id]` where entity is not found | Drawer fails to open; per `+layout.svelte:166-173` existing behaviour, the error is logged via `logDebugError` and `drawerEntity` stays `undefined`. List view renders as if deeplink was list-only. **New requirement:** planner should verify this silent degradation still meets users' mental model; a toast or soft-error surface is OUT of scope for this phase. |
| Election selection needed (voter in multiple-election state with no activeElectionId) | `results.selectElectionFirst` (existing, unchanged) |

---

## Interaction Contract — Phase 62 Deltas

This section is specific to Phase 62 because the refactor changes how users perceive state transitions. Keep these behaviors as the contract; the planner/executor must preserve them.

### Tabs (entityTypePlural → URL)

- Active tab is **derived from `page.params.entityTypePlural`** — no local `$state` flag (D-13).
- Click on a tab: pushes `/results/[electionId]/[clickedPlural]` (drawer-less) via SvelteKit `goto`. Browser Back/Forward must step through tab selections naturally.
- On `/results/[electionId]` (no plural segment): a sensible default plural is selected — planner's discretion whether to canonicalize via load-function redirect or render-with-default. Either branch is acceptable as long as the UI shows a selected tab and the user can see + click the other tab without jank.
- Tab transition animation: none — use the existing Tabs component's built-in active-indicator (no new motion).

### Search + Filter Controls (EntityListWithControls)

- Layout: fixed — search input on the right, filter trigger button on the left, `gap-lg` between them, `mb-md` below the row. (Preserves existing `EntityListControls.svelte:97-127` visual.)
- Filter trigger button state:
  - **Inactive filters:** default ghost/outline button, no badge, icon `filter`, text "Filter"
  - **Active filters (numActiveFilters > 0):** `color="warning"` variant, `InfoBadge` with count, same icon + text
  - Transition between the two states: instant (no fade; button swaps variants).
- Filter Modal: opens on trigger-button click. Closes on:
  - "Close filters" click → `entityFilters.applyAndClose` label
  - ESC key (existing Modal behaviour)
  - Overlay click (existing Modal behaviour)
- Search typing: debounced via existing `TextPropertyFilter` behaviour — no explicit debounce value introduced here.
- **Critical Svelte 5 rule (D-04):** filtered entity list MUST be computed via `$derived`, not via the legacy `filterGroup.onChange(updateFilters)` callback chain. The `$derived` computation reads `filterGroup.filters` directly (or a reactive view of it) and returns `filterGroup.apply(entities)`. Same rule applies to search.

### Drawer (entityDetailsSingular + id)

- Drawer visibility: **derived iff both `entityTypeSingular` and `id` are present in `page.params`** (D-09). No local `isDrawerOpen` flag.
- Entity click in the list: pushes `/results/[electionId]/[entityTypePlural]/[singular]/[id]` via SvelteKit `goto`. The list-card `<a>` link target is this URL — right-click opens in a new tab (existing behaviour, preserve).
- Drawer close: invokes `goto()` to strip `[singular]/[id]` from the path (returns to `/results/[electionId]/[entityTypePlural]`). Existing `handleDrawerClose` pattern in `+layout.svelte:186-188` preserves this — the new version updates the target path to match the new route schema.
- **Drawer-first paint (D-10):** on full-page-load to a detail URL, the drawer must reach first paint before the list. Mechanism is planner's discretion (streaming SSR, prioritized load function, or CSS paint-order hint). Acceptance check: manual Playwright trace or Lighthouse LCP indicates the drawer content is painted before the list body on a cold load to `/results/[electionId]/organisations/candidate/[id]`.
- Filter state survives drawer open/close (D-15) — no re-render of the list below, no filter-state loss.

### Filter Scoping (filterContext)

- Filter state is **scoped per `(electionId, entityTypePlural)` tuple** (D-14). Switching election or plural resets filters.
- User-visible effect: after switching tab from `candidates` to `organisations`, the filter badge shows `0` active filters even if the user had 3 active filters on candidates. Previous candidates-filters are discarded (not persisted across the tuple boundary). No confirmation dialog — this is the contract.
- A future LLM chat integration reads + mutates the same state via `getFilterContext()` (D-05, D-06). This phase exposes the API; chat integration is a deferred phase.

### Loading & Error States

- **Initial layout load:** `<Loading />` indicator shown until `activeMatches` is set — existing behaviour (`+layout.svelte:276-278`), preserve.
- **Deeplink drawer load failure:** silent degradation to list view; debug-log only. (Existing behaviour; see Empty State Inventory row "Deeplink to … entity not found".)
- **Filter-modal internal error** (e.g. filter fails to hydrate): existing `entityFilters.error` key ("The filter couldn't be loaded, sorry!") is already present and handled by `EntityFilters`. No new surface.

---

## Route & Param Contract

| Route | Visual behaviour |
|-------|------------------|
| `/results/[electionId]` | List view, default `entityTypePlural` active tab, no drawer |
| `/results/[electionId]/[entityTypePlural]` | List view with explicit plural tab selected, no drawer |
| `/results/[electionId]/[entityTypePlural]/[entityTypeSingular]/[id]` | List + Drawer, both rendered; drawer overlays the list (per existing `Drawer` component idiom) |
| `/results/[electionId]/organisations/candidate/[id]` | **Edge case:** organisations list (plural) renders underneath; candidate drawer (singular) overlays it. Org-card containing top-X candidates → candidate click opens candidate drawer over org list. |

**Param matchers:**

- `src/params/entityTypePlural.ts` accepts exactly `candidates | organisations` (plurals). Any other value → SvelteKit built-in 404.
- `src/params/entityTypeSingular.ts` accepts exactly `candidate | organisation` (singulars). Any other value → SvelteKit built-in 404.
- These mirror the existing `[[lang=locale]]` matcher idiom; the matcher file lives alongside `locale.ts`.

**Param coupling rule:** `entityTypeSingular` and `id` are always coupled. The load function guards: if exactly one is present, redirect to the parent list route or 404 (planner's discretion — 404 is preferred for URL hygiene; redirect is preferred for user forgiveness).

---

## Component Inventory (Phase 62 Deltas)

| Component | Status | Notes |
|-----------|--------|-------|
| `EntityListWithControls` | **new** (D-01) | `apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte`. Compound component: search + filter-trigger above, `EntityList` below. Fixed internal layout (D-03). Consumes `filterGroup` from `filterContext` preferentially; optional prop for off-context usage. |
| `EntityList` | unchanged | `apps/frontend/src/lib/dynamic-components/entityList/EntityList.svelte`. Kept as the primitive (D-02). |
| `EntityListControls` | **deleted after merge** | `apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte` removed once every call site in the results surface is migrated. Callers outside the results surface (if any) must be migrated first; follow-up todo captured in Deferred Ideas covers other surfaces at leisure. |
| `EntityDetailsDrawer` | unchanged | Existing component; consumed by the new shared route. |
| `Tabs` | unchanged | Existing DaisyUI-based Tabs component; now consumed URL-driven. |
| `AccordionSelect` (election selector) | unchanged | Already in `+layout.svelte`; phase does not modify it. |
| `TextEntityFilter` (search) | unchanged | Used inside `EntityListWithControls`; `variant="discrete"` preserved. |
| `Modal` (filter modal) | unchanged | Used inside `EntityListWithControls`; `sm:max-w-[calc(36rem_+_2_*_24px)]` sizing preserved. |
| `InfoBadge` (filter count) | unchanged | Rendered iff `numActiveFilters > 0`. |
| `filterContext` | **new** (D-05, D-06) | `apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts` + barrel. API: `{ filterGroup, setFilter(id, value), resetFilters(), addFilter(spec), removeFilter(id) }`. Bundled through `voterContext`. |
| `voterContext` | **updated** | Re-exposes `filterContext` accessors so `getVoterContext()` callers can reach filters without a second `getFilterContext()` call. |

---

## Accessibility Contract (reaffirm existing baselines)

- Keyboard: filter-modal trigger is a standard `<Button>` — tab-focusable, Enter/Space activates.
- Modal traps focus when open (existing `Modal` contract — do not break).
- Tabs: arrow-key navigation between tabs (existing Tabs contract). Active tab has `aria-selected="true"` (existing).
- Drawer: overlay has `role="dialog"` and focus returns to the invoking entity-card on close (existing `Drawer` contract — do not break).
- Deeplink URL on drawer means the detail view is crawlable and shareable (addresses "URL as single source of truth for drawer state" — D-09).
- Color contrast: DaisyUI light theme primary `#2546a8` vs `#ffffff` = 9.16:1 contrast (AAA). Warning `#a82525` vs white = 6.25:1 (AA). Both pass project's WCAG 2.1 AA requirement (CLAUDE.md §Important Implementation Notes).

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none — shadcn not applicable to Svelte stack | — | N/A — no third-party component imports introduced in this phase |

No third-party UI registry is introduced. Phase 62 imports only from:
- `@openvaa/filters` (existing workspace package — read-only, D-07)
- `@openvaa/data` / `@openvaa/core` (existing workspace packages)
- `$lib/components/*` and `$lib/dynamic-components/*` (existing in-repo)
- DaisyUI (already installed as Tailwind plugin)

No `npx shadcn` invocation. No `fetch(`, no `eval`, no `process.env` in component code paths introduced by this phase (standard Svelte 5 / SvelteKit idioms only).

---

## Non-Goals for Phase 62 (explicit)

- No new color tokens — palette is locked at `app.css` level.
- No new spacing tokens — scale is locked.
- No new font sizes or weights.
- No new icon assets.
- No new loading/skeleton UI (existing `Loading` is sufficient).
- No confirmation dialogs (no destructive actions in this phase).
- No animation/motion changes (Tabs underline transition and existing `slide` transitions preserved as-is).
- No mobile-specific layout changes (responsive breakpoints and safe-area paddings already applied in `+layout.svelte`).
- No change to `@openvaa/filters` public API (D-07).
- No change to `EntityList` primitive (D-02).
- No snippet-based slotting in `EntityListWithControls` (D-03).
- No migration of other `EntityList` call sites outside the results surface (Deferred Ideas — follow-up todo).

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS (reused i18n keys; empty/error/partial states covered; no new destructive actions)
- [ ] Dimension 2 Visuals: PASS (component inventory + interaction contract complete; drawer-first paint + URL-driven tabs specified)
- [ ] Dimension 3 Color: PASS (DaisyUI semantic palette; 60/30/10 audit complete; primary reserved-for list explicit; warning pattern inherited)
- [ ] Dimension 4 Typography: PASS (3 sizes declared: md/sm/xl + page-level 2xl; 2 weights: 400/700)
- [ ] Dimension 5 Spacing: PASS (tokens sourced from app.css `@theme`; no ad-hoc values; max-w-xl override caveat noted)
- [ ] Dimension 6 Registry Safety: PASS (N/A — no third-party registry introduced; workspace-internal imports only)

**Approval:** pending
