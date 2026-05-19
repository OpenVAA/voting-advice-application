---
phase: 62-results-page-consolidation
reviewed: 2026-04-24T00:00:00Z
depth: standard
files_reviewed: 19
files_reviewed_list:
  - apps/frontend/src/lib/contexts/filter/filterContext.svelte.ts
  - apps/frontend/src/lib/contexts/filter/filterContext.svelte.test.ts
  - apps/frontend/src/lib/contexts/filter/filterContext.type.ts
  - apps/frontend/src/lib/contexts/filter/index.ts
  - apps/frontend/src/lib/contexts/voter/voterContext.svelte.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.type.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.helpers.ts
  - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.test.ts
  - apps/frontend/src/lib/dynamic-components/entityList/index.ts
  - apps/frontend/src/params/entityTypePlural.ts
  - apps/frontend/src/params/entityTypePlural.test.ts
  - apps/frontend/src/params/entityTypeSingular.ts
  - apps/frontend/src/params/entityTypeSingular.test.ts
  - apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/+layout.ts
  - apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.svelte
  - apps/frontend/src/routes/(voters)/(located)/results/[[entityTypePlural=entityTypePlural]]/[[entityTypeSingular=entityTypeSingular]]/[[id]]/+page.ts
  - apps/frontend/src/lib/utils/route/route.ts
  - apps/frontend/src/lib/dynamic-components/entityCard/EntityCard.svelte
  - tests/tests/specs/voter/voter-results.spec.ts
findings:
  critical: 0
  warning: 1
  info: 3
  total: 4
status: issues_found
---

# Phase 62: Code Review Report

**Reviewed:** 2026-04-24T00:00:00Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Phase 62 introduces the Results Page Consolidation: a URL-driven tab/drawer architecture backed by a new `filterContext`, a `FilterGroup.onChange` → `$state` version-counter reactivity bridge, SvelteKit param matchers, and a canonical redirect. The overall design is sound.

Key areas reviewed explicitly per the focus spec:

- **Svelte 5 runes correctness**: `$derived.by(() => { void version; ... })` + `$effect` onChange bridge is correct. The `$effect` cleanup in `filterContext.svelte.ts` detaches the handler before reattaching to the new `FilterGroup` on scope change — no memory leak, no circular loop. The search-version mirror in `EntityListWithControls.svelte` follows the same pattern.
- **filterContext onChange subscription**: cleanup is correct; the `$effect` return `() => fg.onChange(handler, false)` detaches the handler on scope change or unmount. The test suite (Contract `removes the onChange listener on unmount`) verifies this.
- **URL-driven Tabs race**: no race found. `activeTabIndex` is a pure `$derived` over `page.params.entityTypePlural`; the Tabs component receives it as a non-bound prop (Pitfall 3 per RESEARCH). Tab/drawer state re-derives synchronously on navigation.
- **Canonical redirect loop**: confirmed non-looping. When at `/results/candidates`, `params.entityTypePlural = 'candidates'` (confirmed via generated `$types.d.ts` LayoutParams), so line 24 returns `{}` before reaching the `throw redirect`.
- **Param matcher correctness**: `entityTypePlural` accepts `candidates | organizations` only; `entityTypeSingular` accepts `candidate | organization` only. Legacy `party`/`parties` and British spellings are explicitly rejected. Tests verify all rejection cases.
- **Drawer-first paint**: source order confirmed — `{#if drawerVisible}` block precedes the `<MainContent>` list container in template. `content-visibility: auto` applied to list container.
- **TypeScript**: no unchecked `any` casts introduced in business logic. The structural upcast of `FilterGroup<TEntity>` to `FilterGroup<MaybeWrappedEntityVariant>` in `EntityListWithControls.svelte:71` is safe at runtime because `computeFiltered` only uses the contravariant `apply` shape.
- **WCAG**: Tab keyboard activation (Enter/Space) is wired in the existing `Tabs.svelte` component (pre-existing, not in scope). No new WCAG regressions introduced in the reviewed files.
- **i18n**: all user-facing strings use `t(...)` — no raw string literals in template output.

One warning and three info items found, detailed below.

## Warnings

### WR-01: Canonical Redirect Uses 307 (Temporary) — Browsers Will Not Cache It

**File:** `apps/frontend/src/routes/(voters)/(located)/results/+layout.ts:26`

**Issue:** The redirect from bare `/results` to `/results/candidates` is intended to be a permanent canonical URL consolidation (per D-09, D-13, and RESEARCH A3 "URL shareability"). Using `redirect(307, ...)` (Temporary Redirect) means browsers and CDNs will never cache it, so every `/results` visit incurs a round-trip redirect — including user-shared links. A `308` (Permanent Redirect) would allow clients to cache the canonicalization and navigate directly on subsequent visits.

**Fix:**
```ts
// +layout.ts line 26 — change 307 → 308
throw redirect(308, `/results/candidates${url.search}`);
```

Note: if there is a deliberate intent to keep the redirect non-cached (e.g. to allow future tab-order changes without invalidating cached 308s), document the reason in a comment. Otherwise 308 is the correct status for a canonical URL change.

## Info

### IN-01: `content-visibility: auto` Specified Twice on List Container (Redundant)

**File:** `apps/frontend/src/routes/(voters)/(located)/results/+layout.svelte:341-342`

**Issue:** The list container div specifies `content-visibility: auto` in two places simultaneously: once as a Tailwind arbitrary-value class `[content-visibility:auto]` and again as an inline `style` attribute. Both resolve to the same computed property. One of the two is redundant.

```html
<!-- current — redundant double spec -->
<div
  class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
  style="content-visibility: auto;"
  data-testid="voter-results-list-container">
```

**Fix:** Remove the inline style and rely solely on the Tailwind arbitrary class (or vice-versa). The Tailwind class is self-documenting in the markup alongside other layout utilities:

```html
<div
  class="bg-base-300 flex min-h-[120vh] flex-col items-center [content-visibility:auto]"
  data-testid="voter-results-list-container">
```

### IN-02: Dead-Code Guard in `+layout.ts` Line 25 — Unreachable in Current Route Structure

**File:** `apps/frontend/src/routes/(voters)/(located)/results/+layout.ts:25`

**Issue:** The guard `if (params.entityTypeSingular || params.id) return {};` at line 25 is unreachable in the current optional-segment route structure. SvelteKit fills optional segments left-to-right: `entityTypeSingular` and `id` can only appear in `params` when `entityTypePlural` is also present. If `entityTypePlural` is present, line 24 already returns `{}` first. The guarded branch can never execute with the current route file layout.

The guard is defensive-in-depth against hypothetical future route restructuring, but as written it is dead code.

**Fix:** Add an explanatory comment so future maintainers understand the intent (rather than silently removing defensive code):

```ts
// Line 25 — add comment to document the dead-code defensive intent
// Safety valve: entityTypeSingular/id can only arrive with entityTypePlural present
// in the current [[entityTypePlural]]/[[entityTypeSingular]]/[[id]] shape (left-to-right
// optional-segment fill). Line 24 above would already return {}. This guard is
// retained as defense against future route restructuring that might decouple the segments.
if (params.entityTypeSingular || params.id) return {};
```

### IN-03: `ResultCandidate`, `ResultEntity`, `ResultParty` Are Identical Route Aliases in `route.ts`

**File:** `apps/frontend/src/lib/utils/route/route.ts:31-33`

**Issue:** The `ROUTE` constant exports three keys (`ResultCandidate`, `ResultEntity`, `ResultParty`) that all resolve to the same string value. This creates misleading aliases — a reader scanning `$getRoute({ route: 'ResultCandidate', ... })` might assume the route is structurally different from `ResultParty`.

```ts
ResultCandidate: `${VOTER_LOCATED}/results/[[entityTypePlural=entityTypePlural]]/...`,
ResultEntity:    `${VOTER_LOCATED}/results/[[entityTypePlural=entityTypePlural]]/...`, // same
ResultParty:     `${VOTER_LOCATED}/results/[[entityTypePlural=entityTypePlural]]/...`, // same
```

The actual differentiation is handled entirely via `DEFAULT_PARAMS` (lines 83-84), not via distinct route strings.

**Fix:** Consolidate to a single `ResultEntity` key (the semantically correct name for the consolidated route). Update `DEFAULT_PARAMS` accordingly and update all call sites that use `ResultCandidate` or `ResultParty`. The `EntityCard.svelte` migration in this phase already uses `ResultEntity` correctly (line 109).

---

_Reviewed: 2026-04-24T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
