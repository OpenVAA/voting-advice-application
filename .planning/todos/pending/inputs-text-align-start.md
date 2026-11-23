---
created: 2026-11-23
title: Align the text of every Input to the start, email inputs included
area: frontend
severity: minor
source: phase 189.1 UAT, test 2 (operator, bank sign-in on staging)
owner: a later frontend phase
files:
  - apps/frontend/src/lib/components/input/shared.ts
  - apps/frontend/src/lib/components/input/Input.svelte
---

## Problem

Requested by the operator on 2026-11-23: the text of the `Input` component, email inputs included, should align to the start. `shared.ts` gives the text input and the select `text-end` (and the input `justify-end`), so typed values sit at the end of the field; `Input.svelte` has a `text-center` element too.

## Done when

- Every `Input` variant aligns its value and placeholder with `text-start` (a logical value, so RTL locales follow), the email input included.
- The `text-center` in `Input.svelte` is either changed with them or kept for a stated reason.
- The component tests and the axe scans of the forms that use `Input` still pass, and no layout depending on the end alignment breaks.
