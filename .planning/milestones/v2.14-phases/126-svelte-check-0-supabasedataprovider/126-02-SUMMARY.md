---
phase: 126-svelte-check-0-supabasedataprovider
plan: 02
subsystem: frontend
tags: [supabase, typescript, generics, toDataObject, svelte-check, backward-compat]
status: complete

# Dependency graph
requires:
  - phase: 126-01
    provides: Typed get_nominations Args/Returns + regen taking svelte-check 133 -> 50
provides:
  - Backward-compatible generic toDataObject<TRow extends Record<string, unknown> = Record<string, unknown>>
  - Typed rows flow through the localizeRow -> mapRow pipeline without an input cast (unblocks 126-03 D-04 cleanup)
  - Typed-row unit-test locking the D-05 generic against future signature narrowing
affects: [126-03, 126-05, phase-127-writer-cluster]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Public seams are widened backward-compatibly via a defaulted generic (= Record<string, unknown>) rather than a breaking narrow — keeps decoupled Phase-127 writer sites compiling untouched (D-05)."

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts
    - apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts

key-decisions:
  - "Generified toDataObject over TRow with a Record<string, unknown> default; body and return type unchanged so runtime behavior is provably neutral (type-signature-only change)."
  - "Did NOT type the return — output-side narrowing for the 374/549 casts is plan 126-03's D-04 concern; typing the return would break the D-05 backward-compat constraint."
  - "supabaseDataWriter.ts (Phase-127 scope) left untouched; the defaulted generic keeps all writer + provider call sites compiling unchanged (yarn check delta 0)."

patterns-established:
  - "Pattern: defaulted-generic widening — mirror an already-generic internal (mapRow<TRow>) up to the public seam so typed inputs flow without casts while untyped call sites stay valid."

requirements-completed: [TYPE-04]

coverage:
  - id: D-05
    description: "toDataObject is generic over TRow extends Record<string, unknown> with a Record<string, unknown> default; typed rows flow without an input cast; all existing call sites compile unchanged."
    requirement: "TYPE-04"
    verification:
      - kind: automated
        ref: "cd apps/frontend && yarn check — 50 ERRORS both pre- and post-task (delta 0)"
        status: pass
      - kind: automated
        ref: "cd apps/frontend && yarn test:unit — 759/759 passing incl. toDataObject typed-row lock"
        status: pass
      - kind: automated
        ref: "git diff --name-only — supabaseDataWriter.ts and other Phase-127 files unmodified"
        status: pass

metrics:
  duration: ~10m
  completed: 2026-07-16
  tasks: 2
  files: 2
---

# Phase 126 Plan 02: Generify toDataObject over the row type (D-05) Summary

Widened `toDataObject`'s public seam to a defaulted generic `toDataObject<TRow extends Record<string, unknown> = Record<string, unknown>>(row: TRow, …)`, backward-compatibly, so typed rows (the `get_nominations` Returns element and `.from()` Row types the plan 126-01 regen exposed) flow through the `localizeRow → mapRow` pipeline without an input cast — while every existing provider and Phase-127 writer call site keeps compiling UNCHANGED. Body and return type are untouched, so the change is provably runtime-neutral.

## What was built

- **Task 1 (`feat`, `b08c25bf0`):** Changed the `toDataObject.ts:24` signature to a defaulted generic row parameter. The internal `localizeRow` (which takes `Record<string, unknown>`) and `mapRow<TRow>` pipeline is unchanged — `TRow` is assignable to `Record<string, unknown>`, so the body compiles as-is. Return type stays `Record<string, unknown>`.
- **Task 2 (`test`, `9a39b7206`):** Added one unit-test case that passes a concrete `NominationRow`-typed literal (NOT `Record<string, unknown>`) with no input cast and asserts output parity with an equivalent untyped call. This locks the D-05 generic: a future narrowing back to `Record<string, unknown>` would fail the typed literal at compile time.

## Verification results

| Check | Pre-task | Post-task | Result |
|-------|----------|-----------|--------|
| `cd apps/frontend && yarn check` errors | 50 | 50 | delta 0 ✓ |
| `cd apps/frontend && yarn check` warnings | 1 | 1 | unchanged ✓ |
| `cd apps/frontend && yarn test:unit` | — | 759/759 passing (57 files) | green ✓ |
| `supabaseDataWriter.ts` / Phase-127 files | — | unmodified | ✓ |

The `must_haves` prohibition ("MUST NOT change toDataObject's runtime behavior; type-signature-only") is satisfied: return type stays `Record<string, unknown>`, body unchanged, and the existing behavior assertions in `toDataObject.test.ts` pass unaltered alongside the new typed-row parity assertion.

## Deviations from Plan

None — plan executed exactly as written. Both tasks completed with delta-0 svelte-check and green unit tests. The optional typed-row lock test (Task 2) was added as suggested.

## Known Stubs

None.

## Self-Check: PASSED

- `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.ts` — FOUND (generic signature)
- `apps/frontend/src/lib/api/adapters/supabase/utils/toDataObject.test.ts` — FOUND (typed-row lock added)
- Commit `b08c25bf0` — FOUND
- Commit `9a39b7206` — FOUND
