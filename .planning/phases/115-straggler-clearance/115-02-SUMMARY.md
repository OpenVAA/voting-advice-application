---
phase: 115-straggler-clearance
plan: 02
subsystem: tooling
tags: [eslint, flat-config, no-restricted-imports, svelte-store, rune-migration, sweep-03]

# Dependency graph
requires:
  - phase: 115-01
    provides: "Zero real svelte/store imports in apps/frontend/src/** (last writable converted to a $state rune handle)"
provides:
  - "svelte/store ESLint import guard files glob widened from lib/contexts/** + routes/** to the whole src/**/*.{ts,svelte} tree"
  - "Tree-wide enforcement: reintroducing a svelte/store import anywhere under apps/frontend/src/** fails yarn lint:check"
  - "Both ban blocks preserved (svelte/store paths ban + deep-relative-lib patterns ban) under flat-config replace-not-merge semantics"
affects: [116-milestone-close-gate]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ESLint flat-config no-restricted-imports override REPLACES (does not merge) the inherited rule array — both ban blocks must be re-included verbatim when widening the files glob"

key-files:
  created: []
  modified:
    - apps/frontend/eslint.config.mjs

key-decisions:
  - "Widened the guard glob to a strict superset (src/**/*.{ts,svelte}); both the svelte/store paths ban and the deep-relative-lib patterns ban re-included verbatim per flat-config replace-not-merge (RESEARCH Pitfall 3)"
  - "16 pre-existing yarn lint:check failures in lib/contexts/** (Phase 112/114 context-as-class rules: no-this-alias, simple-import-sort, func-style, no-unused-private-class-members) logged to deferred-items.md as OUT OF SCOPE — they predate this phase and are unrelated to the svelte/store guard (zero no-restricted-imports violations)"

requirements-completed: [SWEEP-03]

# Metrics
duration: 12min
completed: 2026-06-13
---

# Phase 115 Plan 02: ESLint Guard Widening Summary

**Widened the `svelte/store` ESLint import guard's `files` glob from `lib/contexts/** + routes/**` to the whole `apps/frontend/src/**/*.{ts,svelte}` tree, preserving both ban blocks verbatim under flat-config replace-not-merge semantics, and proved the widened guard fires on a `svelte/store` probe under a newly-covered path while the `no-restricted-imports` rule stays clean tree-wide — closing SWEEP-03.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-13
- **Completed:** 2026-06-13
- **Tasks:** 2 (1 edit + 1 verification-only)
- **Files modified:** 1 (`apps/frontend/eslint.config.mjs`)

## Accomplishments
- `eslint.config.mjs` guard `files` glob widened from `['src/lib/contexts/**/*.{ts,svelte}', 'src/routes/**/*.{ts,svelte}']` to `['src/**/*.{ts,svelte}']` — the rune-only invariant is now enforceable frontend-wide.
- BOTH ban blocks preserved verbatim inside the same override: the `svelte/store` `paths` ban AND the deep-relative-`lib` `patterns` ban (`^(\\.\\./){2,}lib(/|$)`). Flat config replaces (does not deep-merge) the `no-restricted-imports` option array, so dropping the `patterns` block would have silently un-banned deep-relative `../../lib/...` imports across the whole src tree (RESEARCH Pitfall 3).
- Leading comment updated: removed the "D-03 backlogs widening to lib/components/** + lib/utils/**" claim; now records the SWEEP-03 widening to the whole `src/**` tree as DONE, and that the `patterns` block is re-included verbatim because flat config replaces rather than merges.
- Guard-fires proof demonstrated: a throwaway `apps/frontend/src/lib/components/__guardprobe.ts` importing `{ writable } from 'svelte/store'` produced a `no-restricted-imports` error — under a path (`lib/components/**`) that the OLD narrow glob did NOT cover, proving the widening took effect. Probe deleted; no residue in git status.
- `no-restricted-imports` is clean tree-wide (0 violations on the clean tree); zero real `svelte/store` imports and zero `$:` reactive statements remain frontend-wide.
- `yarn build` (14 workspaces) green; `yarn vitest run` (766 tests / 59 files, matches baseline) green.

## Task Commits

Each task committed atomically:

1. **Task 1: Widen the svelte/store guard files glob to src/**/*.{ts,svelte} (SWEEP-03)** - `7c47b35b7` (refactor)
2. **Task 2: Prove the widened guard fires and the clean tree passes (SWEEP-03 gate)** - verification-only (no source edit; probe created + deleted, never committed). The `deferred-items.md` log + this SUMMARY land in the final docs commit.

## Files Created/Modified
- `apps/frontend/eslint.config.mjs` - MODIFIED; `svelte/store` guard `files` glob widened to `['src/**/*.{ts,svelte}']`; both ban blocks preserved verbatim; leading comment updated to record SWEEP-03 widening as done.
- `.planning/phases/115-straggler-clearance/deferred-items.md` - CREATED; logs the 16 pre-existing out-of-scope `lib/contexts/**` lint failures.

## Decisions Made
- **Glob widened to a strict superset** (`src/**/*.{ts,svelte}`) so every previously-covered path stays covered plus all of `src/**`. Both ban blocks re-included verbatim because flat-config `no-restricted-imports` replaces, not merges (RESEARCH Pitfall 3 / project flat-config pitfall).
- **Pre-existing lint failures left unfixed and logged** — see Deviations / Deferred Issues below.

## Deviations from Plan

### Auto-fixed Issues
None — the guard widening was a single-glob change exactly as planned; no Rule 1-3 fixes were required to the config itself.

### Deferred Issues (out of scope — SCOPE BOUNDARY)

**1. 16 pre-existing `yarn lint:check` failures in `apps/frontend/src/lib/contexts/**`**
- **Found during:** Task 2 Part A (clean-tree lint gate).
- **Why out of scope:** ALL 16 failing files are in `lib/contexts/**`, which the guard's OLD glob ALREADY covered identically — the widening is a strict superset and did not change `lib/contexts/**` coverage. NONE of the 16 errors are `no-restricted-imports` / `svelte/store` violations (that rule passes clean: 0 violations on the clean tree; the widened guard provably fires on a `svelte/store` probe under newly-covered `lib/components/**`). The failing rules (`@typescript-eslint/no-this-alias`, `simple-import-sort/imports`, `func-style`, `no-unused-private-class-members`) are inherited base-config rules introduced by the Phase 112 / 114 context-as-class migration (`appContext.svelte.ts` last touched by `18691ff4d`, Phase 114). The lint tree was already red at the 115-02 baseline commit `029c493c2` before any 115-02 change.
- **Action:** Logged to `.planning/phases/115-straggler-clearance/deferred-items.md` (full file/line/rule table); NOT fixed, per the executor SCOPE BOUNDARY rule. Recommended for Phase 116 milestone-close gate (GATE-01) or a dedicated context-as-class lint-cleanup follow-up.

---

**Total deviations:** 0 auto-fixed; 1 out-of-scope discovery deferred + logged.
**Impact on plan:** None on SWEEP-03 — the guard is widened, both bans preserved, the guard provably fires, and the `no-restricted-imports` rule is clean tree-wide. The pre-existing `lib/contexts/**` errors are orthogonal Phase 112/114 debt.

## Verification Evidence
- Task 1 gates: `files: ['src/**/*.{ts,svelte}']` present (1); old `src/lib/contexts/**` glob gone (0); `backlogs widening` comment gone (0); `name: 'svelte/store'` paths ban present (1); deep-relative `lib(/|$)` patterns ban present (1, fixed-string grep).
- Task 2 Part B (guard fires): `apps/frontend/src/lib/components/__guardprobe.ts` importing `svelte/store` → `no-restricted-imports` error reported by `yarn workspace @openvaa/frontend lint:check`. Probe deleted; `test ! -e apps/frontend/src/lib/components/__guardprobe.ts` passes; `git status` clean for that path.
- `no-restricted-imports` violations on clean tree: **0**.
- Zero real `svelte/store` imports frontend-wide; zero `$:` reactive statements frontend-wide.
- `yarn build`: GREEN (14 workspaces). `yarn vitest run` (from `apps/frontend`): GREEN (766 passed / 59 files — baseline match).
- Known orthogonal red: `yarn lint:check` reports 16 pre-existing `lib/contexts/**` errors (see Deferred Issues) — out of scope, logged.

## No Modifications to STATE.md / ROADMAP.md
Per the sequential-executor contract, STATE.md and ROADMAP.md were NOT touched — the orchestrator owns those writes after the wave completes.

## Self-Check: PASSED

- FOUND: apps/frontend/eslint.config.mjs (glob widened, both bans intact)
- FOUND: .planning/phases/115-straggler-clearance/deferred-items.md
- FOUND: .planning/phases/115-straggler-clearance/115-02-SUMMARY.md
- FOUND commit: 7c47b35b7 (Task 1)
- CONFIRMED: STATE.md and ROADMAP.md unmodified by this plan

---
*Phase: 115-straggler-clearance*
*Completed: 2026-06-13*
