---
created: "2026-06-12T00:00:00.000Z"
title: Resolve all svelte-check errors (clear the 151 baseline)
area: frontend
priority: medium
files: []
source: v2.13 discussion points C4 (.planning/v2.13-DISCUSSION-POINTS.md)
resolves_phase: 132
---

## Problem

`yarn svelte-check` carries a **151-error baseline** in `apps/frontend` (confirmed during the v2.13
context-as-class proof — `qs` ambient declarations, supabase `Json` typing, DataWriter `Promise` typing, and
others). The v2.13 migration gate (discussion point A13) deliberately holds this baseline constant — "zero NEW
errors, not zero absolute" — to keep the refactor scoped. The 151 pre-existing errors remain unaddressed.

## Solution

Triage and clear the 151 `svelte-check` errors to reach a clean (0-error) baseline, then tighten the gate from
"no net-new" to "zero." Likely clusters:

1. `qs` ambient/type declarations.
2. Supabase generated `Json` typing mismatches.
3. `DataWriter` `Promise<...>` return typing.
4. Long-tail one-offs.

Best done as its own focused typing-hygiene phase/milestone after v2.13 lands (the context-as-class migration
should not change this count; verify it still reads 151 at v2.13 close, then drive to 0 here).

## Disposition: COMPLETE

Source: Phase 132 Plan 02 (132-02-PLAN.md / 132-02-SUMMARY.md)

The "151-error baseline" substance was already delivered across **Phases 125-128** — the
`apps/frontend` svelte-check count was driven all the way to **0 errors / 0 warnings** (the
typing-hygiene clusters named above — `qs` ambient declarations, Supabase `Json` typing,
`DataWriter` `Promise` typing, and the long tail — were cleared in that arc).

The one remaining open clause of this todo — tightening the gate from "≤ 151 baseline" (which,
per the Phase 132 scout finding, never actually existed as an encoded CI check) to **"0 absolute"**
— landed in **this plan's Task 1**:

- `apps/frontend/package.json` `check` script now ends with `--fail-on-warnings`, so local
  `yarn check` and CI enforce the identical 0-errors / 0-warnings gate (D-08/D-09 single source
  of truth).
- `.github/workflows/main.yaml` gained a blocking `"Type-check frontend (svelte-check, 0 errors /
  0 warnings)"` step running `yarn workspace @openvaa/frontend check`, positioned after the
  shared-module `yarn build` and after the `cp .env.example apps/frontend/.env` step so
  `@openvaa/*` imports resolve and `svelte-kit sync` `$env` type-gen works.
- **Live re-verify:** `yarn workspace @openvaa/frontend check` exits 0, reporting 0 errors /
  0 warnings (D-10).
- **Negative-control proof:** introducing a single svelte-check warning (an unused CSS selector)
  made the gate exit non-zero (1 warning → EXIT=1); reverting restored EXIT=0 — proving the gate
  fails on exactly 1 warning, not only on errors.

The milestone-close ceremony (`/gsd-complete-milestone`) is a separate deferred step and was NOT
invoked here.
