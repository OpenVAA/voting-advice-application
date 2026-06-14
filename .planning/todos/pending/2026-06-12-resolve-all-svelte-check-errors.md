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
