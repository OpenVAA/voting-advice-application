---
created: 2026-11-28
title: Show Button loading state while async onclick runs
area: frontend
tags: [frontend, ui, improvement]
keywords: [button, loading-state, promise, async-onclick, disabled]
source: "GitHub issue #761"
github_issues: [761]
files:
  - apps/frontend/src/lib/components/button/Button.svelte
  - apps/frontend/src/lib/components/button/Button.type.ts
---

# Show Button loading state while async onclick runs

## Origin

Converted from GitHub issue [#761 feat: automatically show a loading indicator in `Button` when `onClick` returns a `Promise`](https://github.com/openvaa/voting-advice-application/issues/761) on 2026-11-28.

## Problem

Callers of the shared `Button` component that run async work on click must keep their own `loading` state and pass it in; many don't, so buttons can be double-clicked while a save or request is pending.

## Solution

Wrap `onclick` in Button: if the handler returns a thenable, set an internal pending state that shows the spinner (`loading` UI and `loadingText`) and disables the button until it settles; combine with the explicit `loading` prop. Add tests in Button.svelte.test.ts; keep a11y (aria-busy) in mind.
