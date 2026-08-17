---
status: passed
phase: 102-handle-idiom-spike
verified: 2026-06-09
requirements: [HANDLE-01]
must_haves_verified: 4
must_haves_total: 4
human_verification: []
---

# Phase 102 Verification: Handle-Idiom Spike

**Goal:** Lock a decision for how the `{ readonly current }` context handles become idiomatic
Svelte 5 runes — classified read-only vs read-write, one canonical idiom per class, proven on a
representative slice — so Phase 103's codemod runs with a finalized, evidence-backed scope.

**Verdict: PASSED** — all 4 success criteria verified against the codebase. HANDLE-01 complete.

## Success criteria

### 1. All handles enumerated + classified, captured in a decision record — PASS
`102-DECISION-RECORD.md` (committed `2233faa15`) enumerates every `{ readonly current }` context
handle audited from `grep -rn "readonly current" apps/frontend/src/lib/contexts/` + direct
`.type.ts` reads: 12 read-only (§A), 6 read-write (§B), 4 retained exceptions (§C), each with a
`file:line` citation, value type, and class. Acceptance greps pass (`read-only` / `read-write` /
`retained` / `reactiveDataRoot` / `popupQueue` / `candidateUserData` / `Tween` / `reconcil` all
present). The brief's "40" is reconciled to the de-noised 18 migratable + 4 retained.

### 2. Single canonical idiom per class; retained handles documented not forced — PASS
Read-only → plain getter (`ctx.x`); read-write → `get x()/set x(v)` accessor pair at the
context-property level (D-01); `getRoute` folded to a plain getter (D-04). The 4 retained
exceptions (E1 `popupQueue`, E2 `candidateUserData`, E3 `reactiveDataRoot.instance`, E4
`topBarSettings`) each carry a concrete per-handle Svelte-5-mechanic reason (queue-method write
surface; composite-derived multi-method writes; non-reactive anti-loop `instance` split per
Spike 002; overlay-registry `$effect`-scoped registrars). Documented, not forced.

### 3. Idiom proven on a representative slice, green build, destructure-trap preserved — PASS
PoC on `appContext`: read-only fold (`_pocDarkMode`), read-write get/set pair (`_pocAppType`),
derived fold (`_pocGetRoute`). `appContext.poc.svelte.test.ts` → 3/3 green (round-trip,
reactive read, callable fold), proven RED-capable via a negative check. `yarn build
--filter=@openvaa/frontend` → exit 0 (atomic-landing green boundary). Destructure-trap audit:
zero destructures of the `_poc*` accessors; test reads via `ctx.x`. Full frontend unit suite:
46 files / 712 tests green. Producer `createGetRoute()` `$derived.by` and the appSettings SSR-init
merge untouched.

### 4. Decision record finalizes the exact Phase-103 scope — PASS
§"Codemod scope = named-handle allowlist (NOT a `.current` regex)" specifies the 18-target
allowlist (12 read-only + 6 read-write) + 4 retained exceptions, with the false-positive `.current`
exclusions (`Tween`/`password`/`event`/`this`/`row`/`updated`). This is the finalized Phase-103
codemod scope. The DX-5 human-review gate was approved (commit `63497e9b8`).

## Requirement traceability

- **HANDLE-01** → satisfied by both plans (decision record + working PoC). Marked complete in REQUIREMENTS.md.

## Quality gates

- Code review: clean (0 critical, 0 warning, 2 info — both transitional/non-defect). `102-REVIEW.md`.
- Schema-drift gate: no drift (frontend-only; 3 source files changed).
- Regression: full frontend unit suite green (712 tests); no cross-phase regressions.

## Human verification

None required — the DX-5 human-review gate (Plan 01 Task 3) was already satisfied during execution
(approval committed in `63497e9b8`; decision-record header records the approval). All other criteria
are verified by automated build/test/audit gates.

## Notable findings carried to Phase 103

The PoC empirically confirmed that all three canonical handles (`darkMode`/`appType`/`getRoute`)
are DESTRUCTURED by consumers, so the Phase-103 codemod must migrate destructuring consumers to
`ctx.x` / `$derived(ctx.x)` reads (not merely rewrite `.current` reads), and remove both the
transitional `_poc*` surfaces and the old handles.
