---
created: 2026-11-28
title: Open Drawer on mount only when isOpen
area: frontend
tags: [voter, frontend, ui, bug]
keywords: [drawer, modal, on-mount, is-open, modal-container]
source: "GitHub issue #855"
github_issues: [855]
files:
  - apps/frontend/src/lib/components/modal/drawer/Drawer.svelte
  - apps/frontend/src/lib/components/modal/ModalContainer.svelte
  - apps/frontend/src/lib/components/modal/drawerHost/
---

# Open Drawer on mount only when isOpen

## Origin

Converted from GitHub issue [#855 fix: `Drawer` onMount open](https://github.com/openvaa/voting-advice-application/issues/855) on 2026-11-28.

## Problem

`apps/frontend/src/lib/components/modal/drawer/Drawer.svelte` calls `containerRef?.openModal()` in `onMount` unconditionally, so a Drawer always opens when mounted even if the bindable `isOpen` is `false`. Consumers (e.g. the per-app `drawerHost`) currently rely on mount-means-open.

## Solution

Open on mount only if `isOpen` is true (default `isOpen` may need to become `true` for the existing usage, or consumers pass it). Consider moving the open-on-mount logic into `ModalContainer` so Modal and Drawer behave the same. Check all consumers (`components/modal/drawerHost`, results entity drawer) and the View Transition/modal invariants in CLAUDE.md.
