---
created: 2026-11-28
title: Add a lightbox for full-size portraits
area: frontend
tags: [voter, contestant, frontend, ui, feat]
keywords: [lightbox, avatar, image-zoom, modal, portrait]
source: "GitHub issue #435"
github_issues: [435]
files:
  - apps/frontend/src/lib/components/avatar/Avatar.svelte
  - apps/frontend/src/lib/components/modal/Modal.svelte
  - apps/frontend/src/lib/components/image/Image.svelte
---

# Add a lightbox for full-size portraits

## Origin

Converted from GitHub issue [#435 Feat: Lightbox component for zooming in on photos](https://github.com/openvaa/voting-advice-application/issues/435) on 2026-11-28.

## Problem

`Avatar` (`apps/frontend/src/lib/components/avatar/Avatar.svelte`) with `linkFullImage` opens the full-size portrait as a link in a new tab. A lightbox inside the app would be nicer and keeps the user in context.

## Solution

Build a `Lightbox` on top of the existing `Modal`/dialog platform (`components/modal`), with keyboard close, focus return, alt text and reduced-motion handling (axe-clean). Use it from `Avatar` when `linkFullImage` is set; keep the link as no-JS fallback.
