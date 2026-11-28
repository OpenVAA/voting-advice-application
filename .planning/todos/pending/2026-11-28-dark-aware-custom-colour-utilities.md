---
created: 2026-11-28
title: Add reusable dark-aware custom colour utilities
area: frontend
tags: [frontend, ui, improvement]
keywords: [custom-color, dark-mode, tailwind-utility, css-vars, entity-color]
source: "GitHub issue #754"
github_issues: [754]
files:
  - apps/frontend/src/app.css
  - apps/frontend/src/lib/components/icon/Icon.svelte
  - apps/frontend/src/lib/components/entityTag/EntityTag.svelte
  - apps/frontend/src/lib/components/electionTag/ElectionTag.svelte
---

# Add reusable dark-aware custom colour utilities

## Origin

Converted from GitHub issue [#754 refactor: create a reusable class for custom colors which handles dark and light mode](https://github.com/openvaa/voting-advice-application/issues/754) on 2026-11-28.

## Problem

Entity colours (parties etc.) come as a light and a dark variant. Each component that uses them (`Icon` with `customColor`/`customColorDark`, `EntityTag`, election tags, ...) sets its own CSS variables and dark-mode class logic, so the handling is duplicated.

## Solution

Define Tailwind 4 utilities in `app.css`, e.g. `@utility text-custom { color: var(--customColor); }` with a `dark:` variant reading `--customColorDark` (falling back to `--customColor`, or an inverted colour), plus `bg-custom` and `fill-custom`; components then only set the two variables. Keep colours passing `ensureColors`.
