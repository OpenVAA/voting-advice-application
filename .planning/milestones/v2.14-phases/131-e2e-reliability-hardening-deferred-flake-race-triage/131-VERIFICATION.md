---
phase: 131-e2e-reliability-hardening-deferred-flake-race-triage
verified: 2026-07-22T11:54:17Z
status: passed
score: 5/5 must-haves verified
behavior_unverified: 0
overrides_applied: 0
---

# Phase 131: E2E Reliability Hardening — Deferred Flake/Race Triage Verification Report

**Phase Goal:** The ~6 deferred "v2.11+ hardening" flake/race todos are each triaged against the current suite and either fixed (passing 3×) or closed-as-stale with documented rationale. (CONTEXT.md D-05 locks actual scope at ALL 7 `resolves_phase: 131` todos.)
**Verified:** 2026-07-22T11:54:17Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 7 `resolves_phase: 131` todos carry a terminal disposition (FIXED or CLOSED-AS-STALE) | ✓ VERIFIED | `grep -rl 'resolves_phase: 131' .planning/todos/pending/` → 0 files; `.planning/todos/completed/` → 7 files, each with a `## Disposition: FIXED` or `## Disposition: CLOSED-AS-STALE` stamp (grep confirmed for all 7: perm-hide-election-tags=FIXED, feedback-persistence=FIXED, party-drawer=CLOSED-AS-STALE, qspec-cold-start=CLOSED-AS-STALE, popup-hydration=CLOSED-AS-STALE, not-located=CLOSED-AS-STALE, notifications=CLOSED-AS-STALE) |
| 2 | Each disposition is backed by this-phase-dated 3× cold-start evidence (or documented as the terminal FIXED helper-harden case), never a Phase-130 aggregate-gate citation | ✓ VERIFIED | 9 `post-fix/*.txt` artifacts inspected directly (not just cited): `131-not-located-3x.txt` (38 passed×3), `131-notifications-3x.txt` (47 passed×3), `131-perm-hide-election-tags-3x.txt` (81 passed×3), `131-helper-consumer-regression.txt` (89 passed, 0 failed), `131-cold-entry-dataroot-3x.txt` (4 passed×3, one contaminated run transparently annotated + redone clean — not a retry-until-green over a real failure), `131-voter-journey-3x.txt` (4 passed×3), `131-party-drawer-3x.txt` (4 passed×3), `131-feedback-survey-3x.txt` (6 passed×3), `131-popup-probe.txt` (2 passed). `grep -rn "phases/130-" .planning/todos/completed/*.md` (the 7 todo files) → 0 hits. |
| 3 | No deferred-flake todo is left in an undocumented "deferred" state (ROADMAP SC #3) | ✓ VERIFIED | Same 0-pending / 7-completed count as truth #1; `131-DISCUSSION-POINTS.md` §6 ledger has all 7 rows filled with disposition + evidence citation, 0 `____` placeholders, 0 unticked execution checkboxes (independently re-grepped, matches `post-fix/131-no-skip-grep.txt`'s own count). |
| 4 | The one genuine coverage-parity gap (todo #4 feedback text-persistence) was resolved without silently dropping the contract, not merely asserted | ✓ VERIFIED | Read `perm-show-feedback-survey.spec.ts:71-101` directly: new HARD test "feedback text persists across cancel then reopen" fills `feedback-description`, cancels, asserts hidden, reopens, asserts `toHaveValue` — no `expect.soft`/`try`/`catch`. Confirmed the underlying testids (`feedback-form`, `feedback-description`, `feedback-cancel`) exist in `apps/frontend/src/lib/dynamic-components/feedback/Feedback.svelte:161,200,251` — not a stub locator. `post-fix/131-feedback-survey-3x.txt` shows 6 passed × 3 runs (includes the new test). |
| 5 | The one genuine live flake (todo #7 perm-hide-election-tags) was fixed at the shared helper level, not a spec-local band-aid, and the harden was regression-checked across all 5 consumers | ✓ VERIFIED | Read `tests/tests/utils/voterNavigation.ts:282-304` directly: `navigateToFirstQuestion` now appends `answerOption.waitFor({ state: 'visible', timeout: TIMEOUTS.element })` after the existing `waitForURL`, with a `// reason:` annotation. `grep -rl "navigateToFirstQuestion" tests/tests/` confirms all 5 claimed consumers (`perm-hide-election-tags`, `perm-hide-if-missing-answers`, `perm-hide-category-tags`, `perm-disable-allow-open` specs + `minimalVoterResultsPage.fixture.ts`) reference the hardened helper. `post-fix/131-helper-consumer-regression.txt`: 89 passed, 0 failed, 0 did-not-run. |

**Score:** 5/5 truths verified (0 present, behavior-unverified)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/utils/voterNavigation.ts` | Hardened terminal settle in `navigateToFirstQuestion` | ✓ VERIFIED | Terminal `answerOption.waitFor` present with `// reason:` annotation; commit `a6ba83c5a` in git log |
| `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` | New HARD parity assertion (text-persists-across-cancel-then-reopen) | ✓ VERIFIED | Test present at lines 71-101; commit `b4c860153` in git log |
| 7× `.planning/todos/completed/*.md` (resolves_phase:131) | Terminal disposition stamps | ✓ VERIFIED | All 7 present, 0 in pending/, each with a Disposition stamp |
| `post-fix/*.txt` (11 files) | This-phase-dated 3× cold-start evidence | ✓ VERIFIED | All 11 files present, content inspected directly, pass counts match SUMMARY claims |
| `131-DISCUSSION-POINTS.md` | Checkbox ledger, all §6 rows filled | ✓ VERIFIED | 0 `____` placeholders, 0 unticked `- [ ]` boxes |
| `131-REVIEW.md` | Code review of the 2 changed files | ✓ VERIFIED | 0 critical / 2 warnings / 1 info, both warnings are advisory quality notes (timeout-bucket semantics, raw-testid-string registry gap), neither blocks the phase goal |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `navigateToFirstQuestion` terminal settle | 5 consumer specs/fixture | shared helper import | ✓ WIRED | `grep -rl "navigateToFirstQuestion" tests/tests/` returns exactly the 5 claimed files |
| todo disposition stamps | `post-fix/` evidence artifacts | `Source:` back-links + inline citations | ✓ WIRED | Spot-checked citations in all 7 completed todos; artifact filenames exist on disk and content matches |
| `cold-entry-dataroot.spec.ts` (Phase-117 gate) | todos #1/#2/#3 cluster resolver | D-01 shared-evidence dedup | ✓ WIRED | Cited once, run once (3×), referenced from 3 separate todo dispositions — dedup honored, not fabricated |
| parity line-number citations (voter-journey.spec.ts:807/845/883/1337, voter-alliance.spec.ts:127) | actual spec file content | direct grep | ✓ WIRED | All cited line numbers confirmed to contain the claimed assertions |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| HARDN-01 | 131-01,02,03,04,05 | All 7 deferred flake/race todos triaged to terminal disposition (2 FIXED, 5 CLOSED-AS-STALE) | ✓ SATISFIED | See Observable Truths #1-#5 above |

**Note (documentation hygiene, non-blocking):** `.planning/REQUIREMENTS.md` line 85's inline annotation and its status table (line 190: `HARDN-01 | Phase 131 | In Progress (2/7 todos closed — Plan 01)`) were not updated after Plans 02-05 landed — they still reflect the Plan-01-only state even though the checkbox itself is `[x]`. This is a stale-bookkeeping inconsistency in REQUIREMENTS.md, not a gap in the actual phase deliverable (which is fully evidenced in the codebase per above). Recommend a follow-up edit to REQUIREMENTS.md before/at Phase 132 close so the status table matches the `[x]` checkbox and the ROADMAP.md phase entry (which correctly shows all 5 plans `[x]`).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/REQUIREMENTS.md` | 85, 190 | Stale progress annotation / status table not updated post-completion | Info | Documentation-only; does not affect codebase truth. Already scheduled as a recommendation above. |
| `tests/tests/utils/voterNavigation.ts` | 295-304 | `TIMEOUTS.element` (2s) used for what is semantically a route-transition/re-mount wait (per `helpers/timeouts.ts` bucket definitions) | Warning (already surfaced in 131-REVIEW.md WR-01) | Advisory — the plan's must_have text explicitly specified `TIMEOUTS.element`, so this matches the plan's own scope; REVIEW.md correctly flags it as a potential future cold-start risk, not a phase-blocking defect. 3× cold-start evidence + the 5-consumer regression both pass with this budget. |
| `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` | 85,89,95,96,100 | Raw testid string literals (`'feedback-description'`, `'feedback-cancel'`, `'feedback-form'`) bypass the `testIds` registry, per the file's own rigidity-contract docstring | Warning (already surfaced in 131-REVIEW.md WR-02) | Advisory quality issue — testids are real and verified to exist in the component; not a stub. Test 1 already established the `'feedback-form'` raw-literal precedent before this phase. |

No debt markers (TBD/FIXME/XXX) or TODO/HACK/PLACEHOLDER found in the two files this phase modified.

### Human Verification Required

None. All must-haves resolved to VERIFIED via direct codebase inspection (git commits, file content, evidence-artifact content, grep cross-checks) — no visual, UX-feel, or external-service-dependent claims in this phase's scope.

### Gaps Summary

No gaps. All 7 `resolves_phase: 131` todos are terminally disposed (2 FIXED: #4 feedback-persistence, #7 perm-hide-election-tags; 5 CLOSED-AS-STALE: #1 party-drawer, #2 qspec-cold-start, #3 popup-hydration, #5 not-located, #6 notifications) and moved to `.planning/todos/completed/`, each backed by this-phase-dated 3× cold-start evidence and a confirmed coverage-parity check (spot-checked against actual spec line numbers, not merely SUMMARY claims). The one genuine live flake (#7) was fixed at the shared helper class level and regression-checked across all 5 consumers (89/89 passing). The one genuine coverage-parity gap (#4) was closed by adding a real, testid-backed HARD assertion rather than a silent stale-closure. Zero new `test.skip` directives were introduced (grep confirms 0, matching the pre-phase baseline). A new load-contention flake (`candidate-journey.spec.ts:661`) surfaced by the phase-gate run was correctly attributed as out-of-scope (untouched by this phase's changes), reproduced-in-isolation (2/2 green) rather than accepted at face value, filed as a new `resolves_phase: 132` todo, and escalated — not skipped, not silently absorbed. All git commits referenced in the SUMMARYs exist in the log. The only finding is a non-blocking documentation-staleness item in REQUIREMENTS.md's status table (recommend fixing at Phase 132 close) plus two advisory code-review warnings already surfaced and accepted in 131-REVIEW.md.

---

_Verified: 2026-07-22T11:54:17Z_
_Verifier: Claude (gsd-verifier)_
