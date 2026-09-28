---
phase: 93-clean-up-and-reorganise-e2e-tests-fixtures-setup-and-seed-te
verified: 2026-06-03T17:00:00Z
status: passed
score: 8/8 must-haves verified
overrides_applied: 0
---

# Phase 93: Clean Up and Reorganise E2E Tests — Verification Report

**Phase Goal:** Reorganise the E2E test suite and seed templates into a clear, role-based structure (voter / candidate / shared / perm) and rename the 'mega' journey tests, so the test layout is self-documenting and seed templates are consolidated under a single e2e/ family.
**Verified:** 2026-06-03T17:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Role-based fixture taxonomy exists: fixtures/{voter,shared,candidate}/ populated; minimalVoterResultsPage in voter/ | ✓ VERIFIED | voter/ holds 10 files incl. minimalVoterResultsPage.fixture.ts; shared/ holds 4 files (emailBucket, langSelector, multilingualText, feedbackDialog); candidate/ holds 10 files |
| 2 | Role-based setup taxonomy exists: setup/{shared,voter,candidate,perm}/ populated; base.setup/teardown present; old data.setup/baseV1.setup deleted | ✓ VERIFIED | shared/ has auth/base.setup/base.teardown/setupFromTemplate; candidate/ has candidate-journey.setup/teardown; perm/ has 44 files (22 pairs); voter/ exists with .gitkeep; all 4 old files confirmed absent |
| 3 | Journey specs renamed: voter-journey.spec.ts + candidate-journey.spec.ts exist; no *-mega-*.spec.ts remain | ✓ VERIFIED | voter-journey.spec.ts (1153 lines) + candidate-journey.spec.ts (687 lines) exist; voter-mega-journey.spec.ts and candidate-mega-journey.spec.ts confirmed absent |
| 4 | Zero mega/baseV1 tokens: grep -rnE "mega|baseV1" tests/ packages/dev-seed/src/ returns empty | ✓ VERIFIED | grep returned empty; e2e-perm- namespace correctly excluded by construction (does not match the literal tokens) |
| 5 | Seed templates consolidated: e2e/base.ts exists; old e2e.ts deleted; perms under e2e/perm/* (23 files); bare e2e template name retired in index barrel | ✓ VERIFIED | e2e/base.ts present; packages/dev-seed/src/templates/e2e.ts absent; e2e/perm/ holds 23 files; index.ts has 'e2e/base': baseTemplate key; no bare 'e2e': entry |
| 6 | Base prefix unified: e2e/base.ts external_ids use test-e2e-base-; base teardown PREFIX = 'test-e2e-base-' | ✓ VERIFIED | base.teardown.ts PREFIX='test-e2e-base-' (line 26); base.ts docstring and literals confirmed test-e2e-base- pattern; UNREGISTERED_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-unregistered' |
| 7 | A11y spec uses base chain (not deleted e2e data) | ✓ VERIFIED | a11y-smoke.spec.ts imports voterJourneyTest from fixtures/voter/voter-journey.fixture; playwright.config.ts a11y-smoke project has dependencies: ['data-setup-base'] |
| 8 | Gap-closure fixes present: perm-1e1cg1co depends on journeys; UNREGISTERED_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-unregistered' | ✓ VERIFIED | playwright.config.ts line 275: dependencies: ['voter-journey', 'candidate-journey']; candidateJourneyConstants.ts line 56: UNREGISTERED_CANDIDATE_EXTERNAL_ID = 'test-e2e-base-ca-aa-unregistered'; all 3 gap-closure commits (1e7d8842f, efd7cbe11, 616701f7d) present in git history |

**Score:** 8/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/fixtures/voter/` | Voter-app fixtures directory | ✓ VERIFIED | 10 files including voter-journey.fixture.ts, minimalVoterResultsPage.fixture.ts, entityDetails/entityFilters/resultsPage/views/voterNavFixture |
| `tests/tests/fixtures/shared/` | Cross-app fixture directory | ✓ VERIFIED | emailBucket, feedbackDialog, langSelectorFixture, multilingualTextFieldFixture |
| `tests/tests/fixtures/voter/minimalVoterResultsPage.fixture.ts` | Extracted narrow perm fixture | ✓ VERIFIED | 64 lines; substantive implementation with navigateToFirstQuestion + answerAndAdvanceToResults |
| `tests/tests/setup/shared/base.setup.ts` | Base seeding entry point | ✓ VERIFIED | calls setupFromTemplate('e2e/base', ...) with extraTeardownPrefix: 'e2e-perm-' |
| `tests/tests/setup/shared/base.teardown.ts` | Base teardown scoped to prefix | ✓ VERIFIED | PREFIX='test-e2e-base-' (line 26) |
| `tests/tests/setup/perm/` (22 pairs) | Perm setup files under role dir | ✓ VERIFIED | 44 files confirmed present |
| `tests/tests/setup/voter/.gitkeep` | Voter setup dir placeholder | ✓ VERIFIED | Present; dir maintained per D-07/FLAG-8 |
| `tests/tests/specs/voter/voter-journey.spec.ts` | Renamed voter journey spec | ✓ VERIFIED | 1153 lines; substantive |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` | Renamed candidate journey spec | ✓ VERIFIED | 687 lines; substantive |
| `packages/dev-seed/src/templates/e2e/base.ts` | Canonical base seed template | ✓ VERIFIED | Present; all external_ids use test-e2e-base- prefix |
| `packages/dev-seed/src/templates/e2e/perm/` | Perm seed family | ✓ VERIFIED | 23 files (22 perm-* + shared.ts) |
| `tests/playwright.config.ts` | Rewritten project graph | ✓ VERIFIED | Project keys: data-setup-base, voter-journey, data-setup-candidate-journey, candidate-journey; perm-1e1cg1co deps=['voter-journey','candidate-journey'] |

**Absent artifacts (confirmed deleted as required):**

| Artifact | Expected State | Status |
|----------|----------------|--------|
| `packages/dev-seed/src/templates/e2e.ts` | Deleted | ✓ ABSENT |
| `tests/tests/setup/data.setup.ts` | Deleted | ✓ ABSENT |
| `tests/tests/setup/data.teardown.ts` | Deleted | ✓ ABSENT |
| `tests/tests/setup/baseV1.setup.ts` | Deleted | ✓ ABSENT |
| `tests/tests/setup/baseV1.teardown.ts` | Deleted | ✓ ABSENT |
| `tests/tests/specs/voter/voter-mega-journey.spec.ts` | Deleted | ✓ ABSENT |
| `tests/tests/specs/candidate/candidate-mega-journey.spec.ts` | Deleted | ✓ ABSENT |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| a11y-smoke.spec.ts | voter-journey.fixture.ts | import voterJourneyTest | ✓ WIRED | Line 40: imports from fixtures/voter/voter-journey.fixture |
| playwright.config a11y-smoke | data-setup-base | dependencies | ✓ WIRED | dependencies: ['data-setup-base'] confirmed |
| playwright.config perm-1e1cg1co | voter-journey + candidate-journey | dependencies | ✓ WIRED | Line 275: dependencies: ['voter-journey', 'candidate-journey'] |
| base.setup.ts | e2e/base template | setupFromTemplate('e2e/base') | ✓ WIRED | Line 29: setupFromTemplate('e2e/base', ...) |
| index.ts barrel | e2e/base template | 'e2e/base': baseTemplate | ✓ WIRED | Line 56 confirmed; no bare 'e2e' key |
| candidateJourneyConstants.ts | test-e2e-base- prefix | UNREGISTERED_CANDIDATE_EXTERNAL_ID literal | ✓ WIRED | 'test-e2e-base-ca-aa-unregistered' (line 56) |
| voterNavigation.ts | test-e2e-base- prefix | election/constituency external_id refs | ✓ WIRED | Lines 36-43: all 4 refs use test-e2e-base- |

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires running Playwright against a live Supabase stack; not feasible in a static verification pass. The operator-run full `yarn test:e2e` GREEN gate (confirmed in 93-06-SUMMARY.md) serves as the behavioral verification for all 8 must-haves.

### Probe Execution

Step 7c: No probe scripts declared in any plan for this phase. Skipped.

### Requirements Coverage

Phase 93 uses plan-internal workstream tags (WS1–WS5, D-*, FLAG-*) rather than REQUIREMENTS.md IDs. The ROADMAP.md scope items map to plans as follows:

| ROADMAP Scope Item | Plan(s) | Status |
|--------------------|---------|--------|
| Fixtures: move cross-app to shared/, voterNav to voter/, root fixtures into voter/ | 03 (WS1) | ✓ SATISFIED |
| Fixtures: consolidate views with voter journey; extract minimalVoterResultsPage | 03 (D-16) | ✓ SATISFIED |
| Setup: reorganise into voter/ candidate/ shared/ perm/ | 04 (WS2) | ✓ SATISFIED |
| Test renames: remove all mega mentions; rename to voter-journey/candidate-journey | 03 + 05 (WS3/WS4) | ✓ SATISFIED |
| A11y spec: rewrite to use base (baseV1→e2e/base) seed | 04 + 05 (D-04) | ✓ SATISFIED |
| Seed templates: e2e/perm/* + e2e/base.ts; remove old e2e.ts; baseV1→e2e/base | 02 (WS5) | ✓ SATISFIED |
| Base prefix unified: test-e2e-base- across all literals, teardown, freshness guard | 06 (D-05) | ✓ SATISFIED |

### Anti-Patterns Found

No TBD, FIXME, or XXX markers found in Phase 93 modified files. No stub patterns found in the reviewed files. The voter setup dir contains only .gitkeep by design (FLAG-8 — no voter-specific setup asset needed; dir maintained per D-07 for future use).

One intentional residual documented in 93-06-SUMMARY: the opt-in visual-regression/auth chain stays broken because the base dataset does not seed a registered candidate with email (Plan 04 architectural deferral). This is env-gated, excluded from default `yarn test:e2e`, and documented inline in testCredentials.ts and playwright.config.ts with a follow-up plan note. This is NOT a blocker for the phase goal.

### Human Verification Required

None. All must-haves are verifiable through static codebase inspection and git history. The full `yarn test:e2e` gate was operator-run (confirmed GREEN in 93-06-SUMMARY.md) — no further human verification is needed for this phase.

### Gaps Summary

No gaps. All 8 must-haves are fully verified against the actual codebase:

1. Role-based fixture taxonomy is in place with all expected files in voter/, shared/, and candidate/ directories.
2. Role-based setup taxonomy is in place with all expected files in shared/, candidate/, perm/ directories and voter/ placeholder.
3. Journey specs are renamed; old mega-named specs are absent.
4. Zero mega/baseV1 tokens confirmed by grep across tests/ and packages/dev-seed/src/.
5. Seed templates are consolidated under e2e/base.ts + e2e/perm/*; old e2e.ts is deleted; index barrel uses 'e2e/base' key.
6. Base prefix is unified to test-e2e-base- in all expected locations.
7. A11y spec is wired to the base voter-journey fixture and data-setup-base project.
8. Both gap-closure fixes from the E2E gate are present in the codebase and git history.

---

_Verified: 2026-06-03T17:00:00Z_
_Verifier: Claude (gsd-verifier)_
