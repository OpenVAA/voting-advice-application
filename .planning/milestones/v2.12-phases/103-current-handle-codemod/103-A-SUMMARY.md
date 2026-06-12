---
phase: 103-current-handle-codemod
plan: A
subsystem: frontend-tooling
tags: [codemod, svelte5, runes, refactor-tooling]
requires: []
provides:
  - ".planning/archive/phase-103-current-handle-codemod.mjs (idempotent named-handle codemod)"
  - "apps/frontend/src/lib/contexts/app/appContext.poc.svelte.test.ts (canonical-name PoC round-trip test)"
affects:
  - "Plan 103-B (consumes the codemod for the atomic --apply commit)"
tech-stack:
  added: []
  patterns:
    - "Pure-Node dependency-free regex codemod (extend spike-009 precedent)"
    - "Named-handle allowlist (NOT a blanket .current regex)"
    - "Context-call-keyed destructure rewrite for LM-2 disambiguation"
key-files:
  created:
    - ".planning/archive/phase-103-current-handle-codemod.mjs"
  modified: []
key-decisions:
  - "PoC test required ZERO edits — Phase 102 authored its local slice with canonical names already; the _poc* scaffolding only ever lived on the real factory, never in this test. Task 1 is verification-only (3/3 green, zero _poc* refs)."
  - "Codemod archived at .planning/archive/phase-103-current-handle-codemod.mjs (D-03 path, Claude's-discretion per CONTEXT.md)."
  - "appType.set() dry-run count is 4 (3 real layout writes + 1 inside a comment in admin/+layout.svelte:24); the comment rewrite is benign (stays valid comment text). Real write surface = 5 sites (appType×3, sendTrackingEvent×1, openFeedbackModal×1)."
requirements-completed: [HANDLE-02, HANDLE-03]
duration: 2 min
completed: 2026-06-09
---

# Phase 103 Plan A: Codemod Script + PoC-Test Retarget Summary

Authored the two Wave-0 prerequisites that Plan B's atomic mechanical commit consumes: a dependency-free, idempotent four-pass named-handle codemod (extending the proven `spike-009-store-codemod.mjs`), and confirmed the PoC round-trip unit test already asserts the canonical folded idiom. No production handle declaration changed — the tree's runtime behavior is unchanged after Plan A.

- **Duration:** 2 min (start 2026-06-09T08:31:20Z, end 2026-06-09T08:33:44Z)
- **Tasks:** 2 (Task 1 verification-only; Task 2 authoring + dry-run)
- **Files:** 1 created (codemod script); 0 production files modified

## Task 1 — Retarget PoC test off `_poc*` onto canonical names

**Outcome: verification-only (no edit required).** The existing `appContext.poc.svelte.test.ts` was authored in Phase 102 with its LOCAL slice object already using canonical shapes (`get darkMode()`, `get appType()`/`set appType(v)`, `get getRoute()`). The `_poc*` scaffolding lived only on the real `appContext` factory, never in this test. All Task-1 acceptance criteria pass against the file as-is:

- `yarn workspace @openvaa/frontend test:unit --run appContext.poc` → **3 passed**.
- `grep -c "_poc" appContext.poc.svelte.test.ts` → **0**.
- The three assertions (appType read-write round-trip, darkMode plain-getter read, getRoute callable fold) all reference canonical `ctx.x` names; every reactive accessor is read via `ctx.x`, never destructured (CLAUDE.md contract).

The test will survive Plan B's declaration fold without further edits (its local slice already models the post-fold shape). Per D-02 this would have been a manual-fix commit, but with zero diff there is nothing to commit — recorded here as the verification outcome.

## Task 2 — Author the idempotent named-handle codemod (extend spike-009)

Copied + extended `spike-009-store-codemod.mjs` into `.planning/archive/phase-103-current-handle-codemod.mjs` (D-03 archive path). Four passes against the Phase-102 named-handle allowlist:

- **PASS 1 (read rewrite):** `<H>.current` → `<H>` for all 11 read-only + 6 read-write handles. `\.current\b` suffix guard self-excludes `reactiveDataRoot.instance` (E3 split preserved).
- **PASS 1b (getRoute call form):** `getRoute.current(` → `getRoute(` via open-paren lookahead (A6).
- **PASS 2 (write rewrite):** `<H>.set(v)` → `<H> = v` for `appType`/`sendTrackingEvent`/`openFeedbackModal` only; `appContext.svelte.ts` excluded (LM-7 producer-internal `userPreferences.update`).
- **PASS 3 (destructure rewrite — NEW):** `const { x } = getXxxContext()` → `const ctx = getXxxContext(); const x = $derived(ctx.x); const { ...stable } = ctx;`. Keyed on the context-call name; only `getAppContext`/`getVoterContext`/`getCandidateContext`/`getAdminContext` are rewritten. `getComponentContext` is excluded (LM-2). `getRoute`/`t`/stable stores stay destructured.
- **PASS 4 (destructure-trap audit, warn-only):** extended `REACTIVE_ACCESSORS` with the 15 newly-folded handles (`getRoute`/`t` deliberately absent).

`FILES_GLOB` includes both `apps/frontend/src/**/*.svelte` AND `apps/frontend/src/lib/contexts/**/*.svelte.ts` (LM-1), excluding `*.test.ts` and `*.poc.*`.

**Dry-run results** (`node .planning/archive/phase-103-current-handle-codemod.mjs`, exit 0):
- 194 files scanned, 86 to change.
- Read rewrites: 244 (incl. appSettings 112, dataRoot 36, reactiveDataRoot 21) + getRoute call form 151.
- Write rewrites: 6 (appType 4 [3 real + 1 comment], sendTrackingEvent 1, openFeedbackModal 1).
- Destructures rewritten: 33. Traps flagged (audit): 48.

All Task-2 acceptance criteria verified: allowlist matches the decision record (11 RO + 6 RW); no E1–E4 name appears; `getComponentContext` and `appContext.svelte.ts` exclusions confirmed in dry-run; zero `*.test.ts`/`*.poc.*` in the change set; cross-context `lib/contexts/**/*.svelte.ts` files present in the change set (LM-1); `REACTIVE_ACCESSORS` has all 15 folded handles with `getRoute`/`t` absent.

**Commit:** `cbc5d6541` — `feat(103-A): author idempotent named-handle codemod (extend spike-009)`.

## Verification

- `yarn workspace @openvaa/frontend test:unit --run appContext.poc` → 3 passed, 0 `_poc*` refs. ✓
- `node .planning/archive/phase-103-current-handle-codemod.mjs` (dry-run) → exit 0, per-handle summary, LM-1 cross-context files present, tests/poc excluded. ✓
- `yarn build --filter=@openvaa/frontend` → exit 0 (FULL TURBO cache — no production change). ✓ [LM-4: build is the binding gate, not `check` exit 0.]
- `git status apps/frontend/` → clean; no production handle declaration changed. ✓

## Deviations from Plan

**[Plan expected two commits, delivered one]** Task 1 specified a separate manual-fix commit for the PoC-test retarget (D-02 shape). The test was already in the canonical target state from Phase 102, so there was no diff to commit. Delivered a single commit (the codemod script). Verified the test passes 3/3 with zero `_poc*` references — the Task-1 `<done>` criteria are met without an edit. No functional impact: Plan B's prerequisites (a passing canonical-name test + the codemod script) are both satisfied.

**Total deviations:** 1 (commit-count, no functional impact).
**Impact:** None — both Wave-0 prerequisites exist and pass their automated checks; production tree behavior unchanged.

## Issues Encountered

None.

## Next Phase Readiness

Ready for Plan 103-B. The codemod script is authored and dry-runs green over the LM-1 glob; the canonical-name PoC test passes. Plan B flips the handle declarations and runs the codemod `--apply` in one atomic commit (Sequence 1), then validates idempotency + zero-residual + the K3 E2E pass.

## Self-Check: PASSED
- `.planning/archive/phase-103-current-handle-codemod.mjs` exists on disk: yes.
- `git log --grep="103-A"` returns ≥1 commit: yes (`cbc5d6541`).
- All Task acceptance criteria re-run green; plan `<verification>` commands logged above.
