---
created: "2026-09-01T00:00:00.000Z"
title: Refactor the header style settings derivation
area: apps/frontend/src/routes
severity: minor
source: PR #870 review comment (kaljarv) at apps/frontend/src/lib/layouts/main/Header.svelte:44 — filed per Phase 158 decision D-G5 step 1
files:
  - apps/frontend/src/lib/layouts/main/Header.svelte
  - apps/frontend/src/lib/layouts/main/Banner.svelte
  - packages/app-shared/src/settings/staticSettings.ts
related_phase: 159
---

# Header style settings: refactor the derivation

**Filed:** 2026-09-01, during Phase 158. The filename carries `2026-08-28`, the date the review
comments were bucketed in `.planning/PRE-SHIP-REVIEW-TRIAGE.md`; `created` carries the filing date.

**Classification: NON-BLOCKING.** The reviewer wrote *"Add as a follow up task, refactoring the
header style settings."* — explicitly a follow-up, with no blocking marker.

## The comment

> Add as a follow up task, refactoring the header style settings.

## Anchor, verified at HEAD `3c958cccc`

`apps/frontend/src/lib/layouts/main/Header.svelte:44`:

```ts
const mode = darkMode.current ? appSettings.headerStyle.dark : appSettings.headerStyle.light;
```

The anchor resolves **exactly** — line 44 is the header-style derivation the comment names, inside
the `bgColor` `$derived.by` opened at `:43` and closed at `:46`. This is the second of only two
anchors in this phase's six that has not drifted.

## What the shape looks like today

```ts
const bgColor = $derived.by(() => {
  const mode = darkMode.current ? appSettings.headerStyle.dark : appSettings.headerStyle.light;
  return topBarSettings.current.imageSrc ? mode.overImgBgColor : mode.bgColor;
});
```

Two nested conditionals over settings — a dark/light branch selecting a `mode` object, then an
image-present branch selecting one of two colour fields off it — producing a single string. The
`headerStyle` settings shape forces the caller to know both the mode split and the
`bgColor`/`overImgBgColor` field split; every consumer that wants a header colour has to re-derive
the same two branches.

## Cross-reference — read this before starting

**`REVIEW-CMP-01` (Phase 159) mandates a census of every `$effect` in the frontend**, with a recorded
disposition per site, and the same *"derive where it can be derived"* test the reviewer applied here.
Measured, that census is 92 `$effect(` sites across 54 files. This derivation is already a `$derived`
rather than an `$effect`, so it is not itself a census row — but the census pass will read this file
and this exact block, and doing both at once avoids two rewrites of one component.

Also overlaps `2026-08-28-banner-static-component-arbitrary-header-content.md`: the banner sits
inside this header, both want to change what the header takes from context, and both would touch
`getLayoutContext()`.

## Why it is not being done in Phase 158

Phase 158 is the routing and auth surface. This is a settings-shape and component-derivation change
in the app shell, named by no `REVIEW-RT-*` criterion.
