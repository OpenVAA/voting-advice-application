---
phase: 98-domain-a-wave-4-cleanup
plan: 04
subsystem: frontend-build-tooling
tags: [eslint, flat-config, guard, clean-02, svelte5-runes, lint-debt]
requires:
  - "98-03: svelte/store acceptance grep driven to zero (green-tree invariant)"
provides:
  - "CLEAN-02 ESLint guard: scoped no-restricted-imports override banning svelte/store in lib/contexts/** + routes/**"
  - "yarn lint:check exits 0 on the fully-cleaned tree"
affects:
  - "apps/frontend/eslint.config.mjs (new scoped override block)"
  - "Any future svelte/store reintroduction into contexts/routes now fails the lint gate"
tech-stack:
  added: []
  patterns:
    - "Scoped flat-config override (files-glob) with verbatim re-inclusion of an inherited array-valued rule to survive flat-config replacement (no deep-merge)"
key-files:
  created: []
  modified:
    - apps/frontend/eslint.config.mjs
    - apps/frontend/src/lib/contexts/app/survey.svelte.test.ts
    - apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts
    - apps/frontend/src/routes/candidate/+layout.svelte
decisions:
  - "Used the built-in no-restricted-imports core rule (D-01 Claude's Discretion) — no custom plugin, zero new dependency (RESEARCH 'Don't Hand-Roll')"
  - "Scope kept strictly to D-02 globs (lib/contexts/** + routes/**); widening to lib/components/** + lib/utils/** is the D-03 backlog todo, intentionally NOT done here"
  - "Re-included the inherited deep-relative-lib patterns ban verbatim inside the override (flat-config REPLACES array-valued rules — RESEARCH Pitfall 3 / T-98-06)"
metrics:
  duration_min: 2
  completed: 2026-06-05
  tasks: 2
  files: 4
requirements-completed: [CLEAN-02]
---

# Phase 98 Plan 04: CLEAN-02 ESLint Guard (svelte/store ban) Summary

Added the CLEAN-02 build-time guard: a scoped `no-restricted-imports` flat-config override in `apps/frontend/eslint.config.mjs` that bans `svelte/store` imports in `lib/contexts/**` + `routes/**`, closing the v2.11 K1 store-seam removal so any future reintroduction fails `yarn lint:check`. The override re-includes the inherited deep-relative-`lib` `patterns` ban verbatim so flat-config replacement does not silently drop it.

## What Was Built

**Task 1 — Scoped no-restricted-imports override (`apps/frontend/eslint.config.mjs`):**
- Appended a new flat-config object at the END of the `export default [ ... ]` array (after `...sharedConfig`, after the `**/*.svelte` block), so its later position lets it replace the inherited `no-restricted-imports` for in-scope files.
- `files: ['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}']` (D-02 scope only).
- `paths: [{ name: 'svelte/store', message: 'svelte/store is banned in migrated contexts/routes (v2.11 K1). Use $state/$derived rune handles exposing `current`. See .planning/v2.11-DECISIONS.md K1.' }]`.
- `patterns: [{ regex: '^(\\.\\./){2,}lib(/|$)', message: 'Use the $lib alias instead of deep relative imports...' }]` — copied VERBATIM from `shared-config/eslint.config.mjs:147-152` (Pitfall 3 / threat T-98-06).

**Task 2 — Negative test (scripted, fully reverted, no persisted test file):**
- Assertion 1: a transient `import { writable } from 'svelte/store';` at the top of `apps/frontend/src/lib/contexts/app/appContext.svelte.ts` made `yarn workspace @openvaa/frontend lint` exit non-zero with the exact `no-restricted-imports` / `svelte/store` ban message. Reverted via `git checkout --`.
- Assertion 2: a transient `import { foo } from '../../lib/foo';` deep-relative import in the same file ALSO made lint exit non-zero with the `$lib alias` message — proving the re-included `patterns` ban survived the flat-config replacement (Pitfall 3 / T-98-06 verified). Reverted.
- After both reverts: `yarn lint:check` exits 0 and `git diff --quiet appContext.svelte.ts` confirms zero residual edits.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed 2 pre-existing `@typescript-eslint/naming-convention` errors (Phase 96 debt)**
- **Found during:** Baseline lint:check before Task 1 (the phase success criterion is "`yarn lint:check` exits 0 on the cleaned tree", and these 2 errors were the only exit-1 blockers — the guard could not be accepted while lint failed).
- **Issue:** `function handle<T>(value: T): { current: T }` in two test files violated rule `/^T[A-Z]/` (a generic param named bare `T` is rejected; it must start `T<UppercaseLetter>`).
- **Fix:** Renamed the local generic param `T` → `TValue` (all 3 occurrences per line). Pure local rename, zero behavior impact.
- **Files modified:** `apps/frontend/src/lib/contexts/app/survey.svelte.test.ts:9`, `apps/frontend/src/lib/contexts/app/tracking/trackingService.svelte.test.ts:9`
- **Commit:** a2b071b74

**2. [Rule 1 - Cleanup] Removed unused `popupQueue` destructure (Plan 02 migration collateral)**
- **Found during:** Baseline lint:check (a non-blocking `unused-imports/no-unused-vars` warning).
- **Issue:** `apps/frontend/src/routes/candidate/+layout.svelte:31` destructured `popupQueue` from `getAppContext()` but its only consumer (line ~50) is commented out.
- **Fix:** Removed `popupQueue` from the destructure. Confirmed no other reference exists in the file (line 50 usage is inside a commented `$effect` block).
- **Files modified:** `apps/frontend/src/routes/candidate/+layout.svelte:31`
- **Commit:** a2b071b74

### Out-of-scope (NOT fixed)
- Pre-existing `@openvaa/dev-seed` `unused-imports/no-unused-vars` warnings (15 warnings, 0 errors) are unrelated to this plan and do not affect the exit code. Left untouched (scope boundary).

## Negative-Test Outcomes (CLEAN-02 acceptance)

| Assertion | Transient edit | Expected | Result |
|-----------|---------------|----------|--------|
| Guard fires on reintroduction (T-98-07) | `import { writable } from 'svelte/store'` in appContext.svelte.ts | lint exit ≠ 0 | PASS — fired with K1 ban message, reverted clean |
| Inherited ban survives (T-98-06 / Pitfall 3) | `import { foo } from '../../lib/foo'` in appContext.svelte.ts | lint exit ≠ 0 | PASS — fired with `$lib alias` message, reverted clean |
| Clean tree lints green | (no edit) | `yarn lint:check` exit 0 | PASS — 11/11 tasks successful |
| No residual edits | — | `git diff --quiet appContext.svelte.ts` | PASS — byte-identical |

## Verification Results

- `yarn lint:check` → exit 0 (11 successful, 11 total) on the cleaned tree WITH the guard active.
- Acceptance greps on `eslint.config.mjs`: `'svelte/store'` present, `no-restricted-imports` present, `lib(/|$)` inherited patterns present (verified via fixed-string grep), `src/lib/contexts/**` scoping present.
- `git diff --quiet apps/frontend/src/lib/contexts/app/appContext.svelte.ts` → clean (no residual negative-test edits).
- In-scope `svelte/store` import count = 0 (green-tree invariant from Plans 01-03 holds).

## Known Stubs

None.

## Threat Flags

None — no new security-relevant surface. The guard is a build-time policy boundary only (no runtime trust boundary). Threats T-98-06 and T-98-07 from the plan's threat register were both mitigated and verified by Task 2's two negative assertions.

## Authentication Gates

None.

## Notes for Next Plan

This is the FINAL plan of Phase 98 (Wave 4). Phase-gate status: `yarn lint:check` green with the guard active. The D-03 backlog todo (widen the `svelte/store` ban scope to `lib/components/**` + `lib/utils/**`) remains intentionally deferred and is tracked outside this plan.

## Self-Check: PASSED
- FOUND: `.planning/phases/98-domain-a-wave-4-cleanup/98-04-SUMMARY.md`
- FOUND: `apps/frontend/eslint.config.mjs`
- FOUND: commit a2b071b74
