---
quick_id: 260607-j0y
title: Remove phase/change-history pointer comments from e2e test files
status: complete
date: 2026-06-07
commit: 6aab0146f
---

## Outcome

Stripped phase/milestone/planning-doc traceability + test-change-narration from
the e2e test comments across **5 files**, keeping all current-behavior rationale.
Comment-only change (plus one unreferenced `test.step` title). Committed `6aab0146f`.

## Rule applied

- **Removed:** phase numbers (`Phase 95/99/100`, `Wave 0`, `D-03`, `QLAYOUT-02`),
  version/milestone tags (`v2.8`/`v2.11`/`P70`/`Cat A`), planning-doc citations
  (`73-04-PLAN.md`, `86.2-RESEARCH.md`, `Plan 02`), and explicit change-narration
  ("This replaces the v2.11 … approach", "the original guard … replaced with …",
  "rune migration").
- **Kept (de-versioned):** all technical rationale — post-hydration `$dataRoot`/
  `$state` timing, page-reuse DOM lag on param-only Q→Q nav, pointer interception,
  and the `SETTLE-BEFORE-COUNT` named concept.
- **Never touched:** `eslint-disable` directives (3+1+1 intact), test assertion
  messages, present-tense "used to" (= purpose) comments.

## Files

| File | Change |
|------|--------|
| `helpers/index.ts` | dropped `(per 86.2-RESEARCH.md …)` |
| `specs/candidate/candidate-bank-auth.spec.ts` | stripped plan/phase refs in probe docstring; dropped "original guard … replaced" line |
| `specs/a11y/a11y-smoke.spec.ts` | dropped `v2.11` |
| `specs/voter/voter-journey.spec.ts` | removed "This replaces the v2.11 …" block; stripped `D-03/QLAYOUT-02/Wave 0/Phase 100/Plan 02` from reason + step title |
| `fixtures/voter/voter-journey.fixture.ts` | de-versioned ~8 comments |

## Verification

- `eslint --flag v10_config_lookup_from_file` (5 files) → 0
- `tsc -p tests/tsconfig.json --noEmit` → 0
- `playwright test --list` → 93 tests / 74 files (unchanged — no spec dropped)
- `eslint-disable` directive count unchanged (bank-auth 3, voter-journey.spec 1, fixture 1)

## Note — user WIP preserved

`voter-journey.spec.ts` carried pre-existing uncommitted user WIP (`optionIndex:
(n) => n - 1` additions). My comment edits were split out via `git apply --cached`
(my hunks precede the WIP hunks) and committed alone; the user's `optionIndex` WIP
remains uncommitted in the working tree, untouched.
