---
created: "2026-09-01T00:00:00.000Z"
title: Banner should be a static component and let layouts insert arbitrary header content
area: apps/frontend/src/routes
severity: minor
source: PR #870 review comment (kaljarv) at apps/frontend/src/lib/layouts/main/Banner.svelte:9 — filed per Phase 158 decision D-G5 step 1
files:
  - apps/frontend/src/lib/layouts/main/Banner.svelte
  - apps/frontend/src/lib/layouts/main/Header.svelte
  - apps/frontend/src/lib/contexts/layout
related_phase: 158
---

# Banner: static component + arbitrary layout-supplied header content

**Filed:** 2026-09-01, during Phase 158. The filename carries `2026-08-28`, the date the review
comments were bucketed in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`; `created` carries the filing date.

**Classification: NON-BLOCKING.** The reviewer wrote *"Add this is as a follow up task."* with no
blocking marker. Nothing is broken; this is a component-shape improvement.

## The comment

> Add this is as a follow up task.

The comment is anchored at the file's own pre-existing `### TODO` block, whose text is the actual
ask.

## Anchor, verified at HEAD `3c958cccc`

`apps/frontend/src/lib/layouts/main/Banner.svelte:9`:

```
Allow layouts to insert arbitrary content in the header and make this a static component [Svelte 5].
```

The anchor resolves **exactly** — line 9 is the TODO's text line, under the `### TODO` heading at
`:7`. This is one of only two anchors in this phase's six that has not drifted.

## What the ask is

Two coupled changes:

1. **Make `Banner` a static component.** Today it is a *dynamic* component — its own docblock
   (`Banner.svelte:11-13`) records that it reaches into `AppContext` and optionally `VoterContext`,
   and it imports `getAppContext`, `getLayoutContext` and `getVoterContext` plus both app-specific
   logout buttons. A static component would take what it renders as props.
2. **Let layouts insert arbitrary content into the header.** Today the banner's contents are a fixed
   set of secondary action buttons selected by branching on context. A layout that wants something
   else in the header has no way to supply it.

The `[Svelte 5]` marker in the TODO indicates this was expected to become tractable once the app was
on Svelte 5 — snippets are the mechanism that makes "arbitrary layout-supplied content" expressible
without a slot proliferation. The app is on Svelte 5 now, so the blocker the marker names is gone.

## Why it is not being done in Phase 158

Phase 158 is the routing and auth surface. This is a component-architecture change in the app shell,
and it touches the header/banner/layout-context triangle rather than any route or auth path.
`REVIEW-CMP-*` (Phase 159) is the component-consolidation bucket; this is adjacent to it but is not
named by any of its six criteria.

## Cross-reference

Overlaps `2026-08-28-header-style-settings-refactor.md` — the same header surface, and both would
want to touch `getLayoutContext()`'s shape. Whoever picks up either should read both first; doing
them together is probably cheaper than doing them apart.
