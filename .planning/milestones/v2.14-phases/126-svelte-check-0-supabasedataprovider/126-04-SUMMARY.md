---
phase: 126-svelte-check-0-supabasedataprovider
plan: 04
subsystem: frontend
tags: [type-hygiene, svelte-check, cleanup]
status: complete
requires:
  - "Phase 125 TYPE-01: @types/qs devDependency installed"
provides:
  - "global.d.ts free of the inert qs ambient shim (TYPE-04)"
affects:
  - apps/frontend/src/lib/types/global.d.ts
tech-stack:
  added: []
  patterns:
    - "Delta-0 svelte-check as the safety proof for inert type-declaration deletion"
key-files:
  created: []
  modified:
    - apps/frontend/src/lib/types/global.d.ts
decisions:
  - "Removed the qs shim + its stale explanatory comment (lines 7-13); @types/qs governs, proven by unchanged svelte-check output."
metrics:
  duration: 2min
  completed: "2026-07-16"
requirements: [TYPE-04]
---

# Phase 126 Plan 04: Remove inert qs declare-module shim Summary

Deleted the inert `declare module 'qs';` ambient shim and its stale explanatory
comment from `apps/frontend/src/lib/types/global.d.ts`; the installed `@types/qs`
(from Phase 125) provably governs, confirmed by a byte-identical svelte-check
error set (D-07 acceptance).

## What Was Built

- Removed `global.d.ts` lines 7-13: the 6-line explanatory comment describing the
  now-obsolete missing-declaration workaround, plus the `declare module 'qs';` line.
- Retained `export {};` (line 5) and the entire `declare global { … }` block.
- Moved the folded todo `2026-07-15-remove-inert-qs-declare-module-shim.md` from
  `pending/` to `done/`.

## Verification

| Check | Result |
|-------|--------|
| Pre-deletion svelte-check | 50 ERRORS, 1 WARNING, 17 files with problems |
| Post-deletion svelte-check | 50 ERRORS, 1 WARNING, 17 files with problems (delta 0) |
| `grep -c "module 'qs'" global.d.ts` | 0 |
| `export {};` present | yes |
| `declare global` block present | yes |

The delta-0 result proves the shim was inert on this machine — the real `@types/qs`
types govern the `qs` imports in `parseParams.ts`, `buildRoute.ts`,
`universalAdapter.ts`, and `results/+layout.svelte`. No revert needed.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/types/global.d.ts (modified, qs shim absent)
- FOUND commit: b2355af36
