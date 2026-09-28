---
phase: 92-e2e-test-infrastructure-hardening
plan: 02
subsystem: e2e-test-infrastructure
tags: [e2e, test-setup, diagnosis-annotation, freshness-guard, dev-seed]
requires:
  - dev-seed `default` template `externalIdPrefix ?? 'seed_'` (packages/dev-seed/src/ctx.ts:89)
provides:
  - WS4 DIAGNOSIS — imgproxy/pooler "unrelated to answers data model" diagnosis flagged QUESTIONABLE at both recorded markdown sites
  - WS5 FRESHGUARD — both freshness probes exclude the `seed_` baseline prefix (warn-only default + hard-fail opt-in preserved)
affects:
  - tests/tests/setup/setupFromTemplate.ts (probeFreshDatabasePrecondition)
  - tests/tests/setup/data.setup.ts (probeFreshDatabasePrecondition)
tech-stack:
  added: []
  patterns:
    - "PostgREST chained .not().not() → NOT LIKE x AND NOT LIKE y; NULL external_id stays excluded"
    - "// reason: inline-rationale convention (CLAUDE.md) citing the dev-seed prefix source line"
key-files:
  created:
    - .planning/phases/92-e2e-test-infrastructure-hardening-typecheck-all-tests-and-el/92-02-SUMMARY.md
  modified:
    - .planning/quick/260601-q22-step22-logout-bug-data-layer-disproven/260601-q22-SUMMARY.md
    - .planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md
    - tests/tests/setup/setupFromTemplate.ts
    - tests/tests/setup/data.setup.ts
decisions:
  - "D-13: WS4 is pure annotation — the imgproxy/pooler diagnosis is flagged QUESTIONABLE adjacent to (not replacing) the original text; no re-investigation, no behavior change"
  - "diff-playwright-reports.ts:311 inspected and NOT annotated — it encodes the imgproxy DATA_RACE flake pool / Phase 73 D-09 binding (a different, accepted claim), not the questionable edge_runtime/pooler diagnosis"
  - "STATE.md NOT edited — the only reference (line 144) is the Phase 92 roadmap-add narrative which already labels the diagnosis 'logged-not-fixed flakiness, possibly unrelated'; it does not assert the claim as settled"
  - "D-14: warn-only default + E2E_REQUIRE_FRESH_DB hard-fail branch byte-unchanged; only the detection query narrows"
  - "D-15: reuse existing `seed_` prefix; no new global-seed sentinel"
  - "WS5 used DUPLICATED edits (not a shared helper) — lower-risk per the optional-refactor guidance; the two probes remain verbatim near-duplicates with the added clause"
metrics:
  duration: ~2min
  completed: 2026-06-02
  tasks: 2
  files: 4
---

# Phase 92 Plan 02: WS4 Diagnosis Annotation + WS5 Freshness Guard Summary

Flagged the unverified imgproxy/`edge_runtime`+`pooler` "unrelated to the answers data model" diagnosis as QUESTIONABLE (D-13) at both recorded markdown sites, and narrowed both `Database is NOT fresh` probes to exclude the auto-seeded `seed_` baseline prefix (D-15) while preserving warn-only + hard-fail semantics (D-14).

## What Was Built

### Task 1 — WS4 DIAGNOSIS (commit `c32884fd0`)
Inserted a `> ⚠️ QUESTIONABLE (Phase 92 D-13): …` blockquote adjacent to the diagnosis text at:
- `.planning/quick/260601-q22-step22-logout-bug-data-layer-disproven/260601-q22-SUMMARY.md` (above the "Reproduction blocker" §, line ~52)
- `.planning/todos/pending/2026-06-01-candidate-home-savedanswers-empty-logout-modal.md` (above the "Reproduction blocker (separate, environmental)" §, line ~98)

Original diagnosis text preserved in both files — the flag is appended beside it, not a rewrite.

**diff-playwright-reports.ts:311 — inspected, NOT annotated.** On re-read, line 311 reads: "3 tests in the imgproxy flake pool — unchanged from Phase 84 … Phase 73 D-09 binding preserved … May flake when the local imgproxy Docker container 502s." This documents the legitimate imgproxy DATA_RACE flake pool (a DIFFERENT, accepted claim per the Phase 73 D-09 binding) — it does NOT encode the questionable edge_runtime/pooler "unrelated to answers data model" diagnosis. Annotating it would be noise, so it was skipped per the plan's explicit instruction.

**STATE.md — NOT edited.** Grep for `edge_runtime`/`pooler`/`storage-decoupling` matched only line 144 (the 2026-06-02 Phase 92 roadmap-add narrative), which already characterizes the issue as "logged-not-fixed flakiness, possibly unrelated to answers data model" — describing the workstream, not asserting the diagnosis as settled. No questionable note was warranted.

### Task 2 — WS5 FRESHGUARD (commit `3dea7fd2e`)
Added `const BASELINE_SEED_PREFIX = 'seed_';` with a `// reason:` comment citing `packages/dev-seed/src/ctx.ts:89` to BOTH `setupFromTemplate.ts` and `data.setup.ts`. In each file, added a second `.not('external_id', 'like', \`${BASELINE_SEED_PREFIX}%\`)` clause to BOTH the candidates probe AND the organizations probe — the chain is now `NOT LIKE <prefix>% AND NOT LIKE seed_%`.

**Implementation choice: duplicated edits, NOT a shared helper.** The plan permitted an optional shared-probe extraction but flagged the lower-risk option as acceptable. The two probes use different prefix sources (`teardownPrefix` vs module-local `PREFIX = 'test-'`) and have file-specific warning text; a verbatim duplicated edit keeps each file self-contained and avoids a new cross-file dependency. Chosen per the "prefer the lower-risk option" guidance.

## Verification

- `grep "QUESTIONABLE (Phase 92 D-13)"` → both markdown sites match (exit 0).
- `grep -c "BASELINE_SEED_PREFIX"` → 3 in each file (1 definition + 2 query uses).
- `grep "not('external_id', 'like'"` → 4 clauses in each file (2 prefixes × candidates + organizations).
- `yarn typecheck:tests` → exit 0 (clean; no stdout on success).
- **Behavior (read-verified):** a row whose external_id is neither template-prefixed nor `seed_`-prefixed satisfies both `NOT LIKE` clauses → still matches the probe → still triggers the warning. Genuine contamination detection is preserved; only the known `seed_` baseline false-positive is removed.
- **Untouched paths confirmed:** warn-only `console.warn` default and `if (requireFresh) throw` (`E2E_REQUIRE_FRESH_DB === 'true'`) branches changed in neither file — only the detection query narrowed.

## Deviations from Plan

None — plan executed exactly as written. The two conditional decisions (skip diff-script annotation; skip STATE.md edit) were anticipated by the plan and resolved per its explicit instructions, not as deviations.

## Self-Check: PASSED

- FOUND: tests/tests/setup/setupFromTemplate.ts (BASELINE_SEED_PREFIX + 4 not-clauses)
- FOUND: tests/tests/setup/data.setup.ts (BASELINE_SEED_PREFIX + 4 not-clauses)
- FOUND: both markdown annotation sites
- FOUND: commit c32884fd0 (Task 1)
- FOUND: commit 3dea7fd2e (Task 2)
