---
created: "2026-09-01T21:00:00.000Z"
title: Admin factor-analysis and job-detail ROUTE entries name pages that do not exist
area: apps/frontend/src/routes/admin
severity: normal
source: Measured by the C2 check of apps/frontend/src/lib/routes/routeConsistency.test.ts while Phase 158 plan 02 was building that guard; both entries are carried in the spec's KNOWN_UNBUILT_PROTECTED_ROUTES register with their reasons
files:
  - apps/frontend/src/lib/routes/route.ts
  - apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
  - apps/frontend/src/routes/admin/(protected)/+page.svelte
  - apps/frontend/src/lib/routes/routeConsistency.test.ts
related_phase: 158
---

# Two admin ROUTE entries have no route behind them

**Filed:** 2026-09-01, during Phase 158, by the plan that wrote the route-consistency guard. The
guard's C2 check is what surfaced these; they are carried in an explicit register inside the spec so
they stay counted rather than becoming invisible, and this todo is the other half of that carry.

## What was measured

The `ROUTE` map in `apps/frontend/src/lib/routes/route.ts` has two entries whose value carries the
`(protected)` group segment and for which no directory exists under `apps/frontend/src/routes/`:

| Key | Value | Directory on disk | In-repo callers |
| --- | --- | --- | --- |
| `AdminAppJob` | `/admin/(protected)/jobs/[jobId]` | absent | **none** |
| `AdminAppFactorAnalysis` | `/admin/(protected)/factor-analysis` | absent | **two** |

Measured with a whole-word grep across `apps`, `packages` and `tests`, excluding `node_modules` and
`.svelte-kit`.

## Why they are not the same problem

**`AdminAppJob` is a dead entry.** Nothing asks `getRoute` for the key, so nothing links to the
missing page. The likely disposition is deletion, but deleting a key from the `ROUTE` map narrows
the `Route` union type, so it belongs in a plan that owns `route.ts` rather than in a test-only one.

**`AdminAppFactorAnalysis` is a live broken link.** Two components build an `href` from it:

- `apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte` — a nav item.
- `apps/frontend/src/routes/admin/(protected)/+page.svelte` — a card on the admin dashboard.

Both therefore resolve to a page that does not exist. The feature is not merely unrouted: the
Paraglide message catalogue carries a full set of `adminapp_factoranalysis_*` strings (title,
compute button, loading state, no-elections and party-selection copy), so a factor-analysis page
was authored for at some point and the route it was meant to live at was never built, or was built
and removed without the links following.

## What a fix looks like

One of three, and the choice is a product call rather than a mechanical one:

1. Build `apps/frontend/src/routes/admin/(protected)/factor-analysis/`, which is what the message
   catalogue implies was intended.
2. Delete the `AdminAppFactorAnalysis` key and both links, and decide separately what happens to the
   orphaned message catalogue entries.
3. Hide the two links behind the admin feature registry at
   `apps/frontend/src/lib/admin/features.ts`, which is where the other two admin features are
   already declared, and leave the route unbuilt until it is built.

Whichever is chosen, the matching row must be removed from `KNOWN_UNBUILT_PROTECTED_ROUTES` in
`apps/frontend/src/lib/routes/routeConsistency.test.ts`. The spec asserts its own register in both
directions, so a closed gap left registered fails the unit suite and names the row to delete; the
register cannot silently outlive the problem it records.
