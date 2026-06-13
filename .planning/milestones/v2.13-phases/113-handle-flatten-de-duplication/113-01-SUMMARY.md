---
phase: 113-handle-flatten-de-duplication
plan: 01
subsystem: frontend-tooling
tags: [svelte5, codemod, refactor-tooling, destructure-trap-audit, flatten]
requires:
  - "spike-009-store-codemod.mjs (structure mirrored)"
provides:
  - "apps/frontend/scripts/flatten-current-codemod.mjs (idempotent inverse .current flatten codemod, 3-handle allowlist, dry-run-by-default)"
  - "spike-009 REACTIVE_ACCESSORS set extended with appSettings/dataRoot/locale (destructure-trap audit in sync with post-flatten contract)"
  - "appContext.spread.svelte.test.ts FLATTEN-01 hand-off markers (keys retained, test still green)"
affects:
  - "FLATTEN-02 apply step (later plan runs this codemod against the real tree)"
  - "FLATTEN-01 producer collapse (spread test EXPECTED_KEYS hand-off)"
tech-stack:
  added: []
  patterns:
    - "Pure-Node node:fs globSync codemod (zero install)"
    - "Negative-lookbehind handle-allowlist rewrite + warn-only destructure-trap audit pass"
key-files:
  created:
    - "apps/frontend/scripts/flatten-current-codemod.mjs"
  modified:
    - ".claude/skills/spike-findings-voting-advice-application-gsd/sources/009-store-codemod-feasibility/spike-009-store-codemod.mjs"
    - "apps/frontend/src/lib/contexts/app/appContext.spread.svelte.test.ts"
decisions:
  - "3-handle hard allowlist (appSettings/dataRoot/locale) — getRoute (~147 sites) and all other .current handles stay { current }"
  - "Codemod self-contained FLATTENED_ACCESSORS set for its own audit, separate from the spike-009 source's REACTIVE_ACCESSORS (kept in sync but independent)"
  - "Test keys NOT removed this plan — producers still export reactive* until FLATTEN-01 lands; comment-only hand-off marker"
metrics:
  duration: "~10 min"
  completed: "2026-06-13"
  tasks: 2
  files_changed: 3
---

# Phase 113 Plan 01: FLATTEN-02 Tooling Summary

Built the idempotent inverse `.current` → bare-field codemod (3-handle allowlist + destructure-trap audit) and pre-staged the spike-009 audit set + spread test — zero production-behavior change, real tree untouched.

## What Was Built

**Task 1 — `apps/frontend/scripts/flatten-current-codemod.mjs` (new, 211 lines):**
An inverse of `spike-009-store-codemod.mjs`. Mirrors its structure (`node:fs` `globSync`, `--apply` flag, `--files` glob override defaulting to `apps/frontend/src/**/*.svelte`, dry-run summary).

- **PASS 1 (rewrite):** `const HANDLE_FLATTENS = ['appSettings', 'dataRoot', 'locale']` hard allowlist. Regex `(?<![\w$.])\b(appSettings|dataRoot|locale)\.current\b` → `$1`. The negative lookbehind on `[\w$.]` rejects member-of-something reads (`foo.appSettings.current`, `reactiveAppSettings.current`, `myAppSettings.current`).
- **PASS 2 (audit, warn-only):** ports spike-009 `detectDestructureTraps` with a local `FLATTENED_ACCESSORS = new Set(['appSettings','dataRoot','locale'])` so the codemod self-reports its own destructure traps.
- Top-of-file docblock documents the 3-handle allowlist + WHY (research Pitfall 1: `getRoute.current` ~147 sites is OUT of scope, broad `\w+\.current` forbidden), dry-run-by-default + `--apply`, and the structural idempotency guarantee.
- `.ts` glob plumbing retained for the later apply step (orchestrator-internal `.ts` reads).

**Task 2 — audit-set extension + spread-test pre-stage + idempotency proof:**
- (a) Idempotency proven on scratch copies (see below).
- (b) `spike-009-store-codemod.mjs` `REACTIVE_ACCESSORS` set gained `'appSettings'`, `'dataRoot'`, `'locale'` in a clearly-commented "flattened in Phase 113" group.
- (c) `appContext.spread.svelte.test.ts` gained two `// Phase 113 FLATTEN-01 will drop reactiveAppSettings/reactiveLocale/reactiveDataRoot from this list` hand-off comments above the `reactive*` keys. Keys NOT removed (producers still export them until FLATTEN-01) — test stays green.

## Dry-Run "By Handle" Breakdown (recorded)

`node apps/frontend/scripts/flatten-current-codemod.mjs --files 'apps/frontend/src/**/*.svelte'`:

```
── Summary ──
  Files scanned:   168
  Files to change: 47
  Total rewrites:  153
    by handle:
      appSettings.current: 110
      dataRoot.current: 36
      locale.current: 7
  Files with destructure traps: 36
  Total traps flagged:          36
```

`--files 'apps/frontend/src/**/*.ts'` (orchestrator-internal): 5 rewrites (`appSettings.current: 4`, `locale.current: 1`), 0 traps.

The "by handle" breakdown lists ONLY `appSettings`/`dataRoot`/`locale` — no `getRoute`, `userData`, `darkMode`, or other handle. (Counts differ slightly from the RESEARCH ~189 in-scope estimate because RESEARCH counts the `reactive*` mirrors separately, which the FLATTEN-02 codemod does not target — those are FLATTEN-01 producer-side reroutes.)

## Idempotency Two-Run Output (recorded)

Two representative scratch files (`appSettings.current`/`dataRoot.current`/`locale.current` plus a control `getRoute.current` and a `foo.appSettings.current` member-read) copied to a temp dir, then `--apply` run twice:

```
=== RUN 1 (apply) ===
  Files to change: 2
  Total rewrites:  4
    by handle:
      appSettings.current: 1
      dataRoot.current: 2
      locale.current: 1

=== RUN 2 (apply, no-op) ===
  Files to change: 0
  Total rewrites:  0
```

Second run reports **`Total rewrites: 0`** — idempotency proven. Post-rewrite the control `getRoute.current` SURVIVED unchanged and `foo.appSettings.current` was NOT rewritten (negative lookbehind verified). The real `apps/frontend/src` tree was NEVER `--apply`-ed (that is FLATTEN-02, a later plan).

## Verification Results

- Codemod dry-run exits 0, writes nothing without `--apply`. ✓
- `getRoute` appears ONLY in comments in the codemod (not in `HANDLE_FLATTENS`). ✓
- `HANDLE_FLATTENS = ['appSettings', 'dataRoot', 'locale']` allowlist present. ✓
- `cd apps/frontend && yarn vitest run appContext.spread` → 3 passed (unchanged). ✓
- spike-009 set now contains all three names, inside `new Set([ ... ])`. ✓
- `getRoute.current` site count unchanged at 147 (codemod NOT applied to real tree). ✓
- `git status apps/frontend/src/` clean except the comment-only spread test. ✓

## Deviations from Plan

None — plan executed exactly as written. (The dry-run rewrite counts 110/36/7 vs the RESEARCH ~189 estimate is expected and reconciled above: the codemod targets only the canonical handles, not the `reactive*` mirrors which are FLATTEN-01 producer-side work.)

## Known Stubs

None. This plan ships a developer tool, an audit-set extension, and a test comment — no production data paths or UI stubs.

## Self-Check: PASSED

- `apps/frontend/scripts/flatten-current-codemod.mjs` — FOUND
- Commit c870aaa28 (feat: codemod) — FOUND
- Commit 7676416b6 (test: audit set + spread pre-stage) — FOUND
