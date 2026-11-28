# Lens: Routes · ID prefix `RTE`

**Applies when** the PR adds, moves or restructures a SvelteKit route under `apps/frontend/src/routes/` (a `+page`, `+layout`, `load` function, route group or dynamic segment), changes a layout's responsibilities, adds or changes a View Transition or drawer host, or edits `apps/frontend/src/lib/routes/`.

## List

New and moved routes as a tree (URL → folder), each with its `+layout` and `+page` responsibilities in one line, the `load` it runs (universal or server), and the `$layouts` component it renders.

## Evaluate (criterion slugs)

- `rte-placement`: the route sits in the right app and group — voter pages under `(voters)`, pages needing a location under `apps/frontend/src/routes/(voters)/(located)`, contestant pages under `apps/frontend/src/routes/contestant/(protected)` when they need sign-in, admin pages under `apps/frontend/src/routes/admin/(protected)`. Folder names are kebab-case nouns at the same nesting depth as siblings of the same kind.
- `rte-route-constants`: every path comes from `$lib/routes` (`ROUTE` constants and `getRoute`), never a string literal. No route carries a locale segment: Paraglide's `url` strategy resolves the locale. Grep the diff for `href="/` and `goto('/`.
- `rte-gates`: protected routes go through the app gates in `$lib/routes` and `apps/frontend/src/lib/admin/gates/`; a page does not repeat a gate its layout or `hooks.server.ts` already applies.
- `rte-layout-page-split`: a layout owns what its subtree shares (contexts, providers, the `$layouts` shell); a page owns its own concerns. An effect repeated across sibling pages belongs in their layout; an effect in a layout only one child needs belongs in that child.
- `rte-load-tracking`: **invariant** (CLAUDE.md § Results Navigation Invariants): the `(located)` load must not read the URL tracked. More generally, a universal `load` reading a tracked `url` property it does not need reruns on every navigation that changes it. Any tracked read of `url.pathname` / `url.search` in that load is `critical`; reads feeding only a redirect target belong inside `untrack`. `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts` is the guard.
- `rte-view-transition`: **invariant** (same section): a document View Transition must never run with names while a modal is open, overlay open/close navigations get no document transition, and there is one drawer host per app mounted below that app's contexts. A new `view-transition-name`, a new overlay route, or a second drawer host is checked against `apps/frontend/src/lib/utils/viewTransition.ts`. A breach is `critical`.
- `rte-focus-announce`: navigation keeps focus management (`afterNavigate` focusing the new content without scrolling) and the route announcer; a new layout that replaces the content root must keep both.

## Where to look

`apps/frontend/src/routes/README.md`, `apps/frontend/src/lib/routes/`, `apps/frontend/src/lib/layouts/`, `apps/frontend/src/lib/utils/viewTransition.ts`, `apps/frontend/src/lib/components/modal/drawerHost/`.

## Promote to

CLAUDE.md § Results Navigation Invariants; `.claude/skills/spike-findings-voting-advice-application-gsd/SKILL.md`; `.agents/code-review-checklist.md`.
