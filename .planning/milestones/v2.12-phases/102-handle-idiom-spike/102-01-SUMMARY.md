---
phase: 102-handle-idiom-spike
plan: 01
subsystem: frontend-contexts
tags: [svelte5, runes, context-handles, decision-record, codemod-scope, spike]
requires: []
provides:
  - "102-DECISION-RECORD.md (Phase-103 codemod scope — named-handle allowlist)"
affects:
  - "Phase 103 (.current handle codemod — consumes this scope)"
tech-stack:
  added: []
  patterns:
    - "Classify handles by type-declaration shape (audit, not re-derivation)"
    - "Named-handle allowlist as codemod scope (NOT a .current regex)"
    - "Move-the-getter-up-one-level reactivity mechanic (ctx.x.current -> ctx.x)"
key-files:
  created:
    - ".planning/phases/102-handle-idiom-spike/102-DECISION-RECORD.md"
  modified: []
key-decisions:
  - "18 named handles are codemod targets (12 read-only fold to plain getter; 6 read-write to get/set accessor pair); 4 handles retained as exceptions (E1 popupQueue, E2 candidateUserData, E3 reactiveDataRoot.instance, E4 topBarSettings)."
  - "getRoute folds to a plain getter per D-04 (exposure is independent of the $derived.by init-context requirement) — not a forced exception."
  - "Binding count is the de-noised named-handle allowlist (18 targets + 4 retained), NOT the brief's raw 40/~524 greps; Tween/password/event/this/row/updated .current are excluded false positives."
  - "E4 topBarSettings (SettingsOverlayApi) promoted to a retained exception during verification (not in the RESEARCH draft's table C) — confirmed by the user at the DX-5 gate."
requirements-completed: [HANDLE-01]
duration: 31 min
completed: 2026-06-09
---

# Phase 102 Plan 01: Handle-Idiom Classification Decision Record Summary

Produced `102-DECISION-RECORD.md` — the authoritative, type-declaration-audited per-handle
classification of every `{ readonly current }` context handle in
`apps/frontend/src/lib/contexts/**`, with the exact Phase-103 target shape per handle, the
retained-exception rationale blocks, the false-positive exclusion list, and the count
reconciliation. This document IS the finalized Phase-103 codemod scope (a named-handle
allowlist), and it passed the DX-5 human-review gate.

- **Tasks:** 3 (2 auto doc-authoring + 1 blocking human-verify gate)
- **Files created:** 1 (`102-DECISION-RECORD.md`)
- **Duration:** ~31 min (first task commit 2026-06-09T09:40 → DX-5 approval 2026-06-09T10:10)

## What was built

`102-DECISION-RECORD.md` containing:

- **§A — 12 read-only handles** (`locale`, `locales`, `darkMode`, `reactiveAppSettings`,
  `reactiveLocale`, `getRoute`, `surveyLink`, `sessionId`, `shouldTrack`, `dataRoot`,
  `reactiveDataRoot.current`, `routeTitle`) each with a `file:line` citation, value type, and
  the plain-getter target shape (`ctx.x`).
- **§B — 6 read-write handles** (`appSettings`, `appCustomization`, `appType`,
  `userPreferences`, `sendTrackingEvent`, `openFeedbackModal`) mapped to the context-property
  `get x()/set x(v)` accessor pair (D-01), with the appSettings/appCustomization SSR-init
  invariant (Spike 008) called out as a must-survive constraint.
- **§C — 4 retained exceptions** with concrete per-handle Svelte-5-mechanic reasons:
  - E1 `popupQueue` — write surface is domain queue methods (`push`/`shift`); no coherent `set(v)`.
  - E2 `candidateUserData` — `.current` is a composite `$derived` (saved ∪ unsaved) over a multi-method semantic write surface; no single `set(v)`.
  - E3 `reactiveDataRoot.instance` — the non-reactive write path of the Spike-002 anti-loop split; one accessor pair cannot encode two reactivity modes (`effect_update_depth_exceeded` regression risk).
  - E4 `topBarSettings` (`SettingsOverlayApi`) — same class as E1: `.current` is a `$derived` overlay-registry merge; write surface is `$effect`-scoped `use()`/`push()` registrars.
- **getRoute (D-04) verdict:** fold to a plain getter — exposure is independent of the
  `$derived.by` init-context requirement; producer `createGetRoute()` untouched.
- **Codemod scope = named-handle allowlist**, with the false-positive `.current` exclusions
  (`Tween<number>`, i18n `password` key, `event`, `this.current*`, `row`, `updated`).
- **Count reconciliation:** binding figure is 18 codemod targets + 4 retained exceptions
  (de-noised), not the brief's raw "40 / ~524" (524 verified as the raw `.current` grep
  including non-handle noise; ~423 are real handle reads, with `getRoute`+`appSettings` ≈ 62%).

## Acceptance criteria verification

Re-ran the plan's automated acceptance greps against the committed decision record:

- Task 1: `grep -qi "read-only" && "read-write" && "retained"` → **PASS**
- Task 2: `grep -qi "reactiveDataRoot" && "popupQueue" && "candidateUserData" && "Tween" && "reconcil"` → **PASS**
- DX-5 gate note present (`grep -ci "DX-5"` = 3) → **PASS**
- Every handle row carries a `file:line` citation audited against the live tree
  (`grep -rn "readonly current" apps/frontend/src/lib/contexts/` + direct `.type.ts` reads, 2026-06-09).

## Deviations from Plan

**[Verification delta] E4 `topBarSettings` promoted to a retained exception.** During the
type-declaration audit, `SettingsOverlayApi.current` (which the RESEARCH draft placed only in
table D as "classify during conform step") was found to be the same class as E1 — a `$derived`
overlay-registry merge whose write surface is `$effect`-scoped registrars (`use()`/`push()`),
with no coherent value `set(v)`. It was documented as a 4th retained exception (E4) rather than
forced into the codemod scope. This is a more conservative/correct scope than the draft and was
explicitly confirmed by the user at the DX-5 gate.

**Total deviations:** 1 (a scope-correctness refinement found during the mandated
type-declaration audit; not a behavioral change). **Impact:** the Phase-103 codemod scope is
the 18-target allowlist with 4 documented retained exceptions — more precise than the RESEARCH
draft's 3 exceptions, preventing an over-broad codemod of the `SettingsOverlay` registry.

## Authentication Gates

None.

## Issues Encountered

**Close-out note (atomic-close-out invariant):** This SUMMARY.md was authored during a resumed
`/gsd-execute-phase 102` run. The decision record and the DX-5 human-review approval had already
landed in a prior session (commits `2233faa15` "author handle-idiom classification decision
record" and `63497e9b8` "approve DX-5 gate — lock Phase-103 codemod scope (E4 retained)") but
the plan's SUMMARY.md had not been written, leaving 102-01 in an illegal partial-plan state. The
resumed run verified the committed decision record is intact (clean vs HEAD, passes all
acceptance greps) and the DX-5 gate is approved, then closed the plan out by writing this
SUMMARY. No re-execution of the doc-authoring or the human gate was needed.

## Self-Check: PASSED

- `102-DECISION-RECORD.md` exists on disk and is committed (clean vs HEAD).
- `git log --grep="102-01"` returns ≥1 commit (`2233faa15`).
- All Task 1 + Task 2 acceptance greps PASS; DX-5 gate note present.
- DX-5 human-verify checkpoint satisfied (approval committed in `63497e9b8`; decision-record
  header records "✅ APPROVED at the DX-5 gate (2026-06-09)").

## Next

Ready for Plan 102-02 (Wave 2): prove the locked idioms on a representative appContext slice
(`darkMode` read-only fold, `appType` get/set accessor pair, `getRoute` plain-getter fold) with
a targeted unit test, building green via the Phase-97 atomic-landing technique.
