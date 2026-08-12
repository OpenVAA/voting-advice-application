---
phase: 120-e2e-specs-settings-permutation-matrix
verified: 2026-06-16T00:00:00Z
status: passed
score: 5/5
overrides_applied: 0
re_verification: null
---

# Phase 120: E2E Specs — Settings-Permutation Matrix Verification Report

**Phase Goal:** The settings-driven branches not yet covered by the existing perm specs are exercised and asserted, with already-covered items confirmed and extension-scoped items extended per the NOTEs.
**Verified:** 2026-06-16
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | question-flow path matrix, election/constituency sequencing, minimumAnswers gating, and maintenance/app-access gating are each confirmed covered or extended (EPERM-01/02/08/11) | VERIFIED | EPERM-01: `voter-journey.spec.ts:480-504` (min-answers gate), `perm-1e1cg1co.spec.ts:12-17`. EPERM-02: 7 perm specs covering all sequencing variants (perm-1e1cg1co, perm-2e-shared, perm-2e-asymmetric, perm-startfromcg, perm-disjoint-1co, perm-disable-election-1co, perm-disable-election-2co). EPERM-08: `voter-journey.spec.ts:493-498, 600-620`. EPERM-11: `perm-access-disable.spec.ts` — 3 sub-tests (voterApp=false, candidateApp=false, underMaintenance=true); old per-app specs git-rm'd, consolidation-clean confirmed. |
| 2 | results-display permutations, entityDetails.contents[type][] tab control, and missing-data markers are asserted for candidate/org bulk; alliance-presence sub-assertion explicitly deferred to Phase 130 (EPERM-03/04/05) | VERIFIED | EPERM-03: `voter-journey.spec.ts:683-781` (candidate/org results tabs + card contents). EPERM-04: `voter-journey.spec.ts:893-900` (candidate tabs = [info, opinions], Members tab ABSENT) and `voter-journey.spec.ts:1015-1025` (org tabs = [info, children, opinions], Members tab PRESENT). EPERM-05: `voter-journey.spec.ts:1035-1066` (org election-symbol row ABSENT + org-typed missing-answer markers). Alliance-presence slice deferred to Phase 130 per ROADMAP SC2. |
| 3 | Dedicated question-media video test (voter visibility matrix + candidate hideVideo) and interactiveInfo.enabled exercised in full (popup modal vs static expander) (EPERM-06/07) | VERIFIED | EPERM-06: `perm-question-video.spec.ts` — voter matrix (video on q1/q3/q5; none on q2/q4 or any category intro); candidate hideVideo=false→video shown, hideVideo=true→video suppressed. Project triple wired in playwright.config.ts (A10 node, lines 840-855). EPERM-07: `perm-interactive-info.spec.ts` — popup mode (modal dialog + infoSections + per-type arguments for Likert/Boolean/Categorical); expander mode (inline reveal, no modal). Project triple wired (A11 node, lines 865-880). |
| 4 | survey/feedback popup-coordination extended (not duplicated) to verify placement, timing, no double-pop, dismiss persistence; organizationMatching disclosure text asserted across none/answersOnly/impute (EPERM-09/10) | VERIFIED | EPERM-09: `perm-show-feedback-survey.spec.ts` — renamed from perm-header-show-feedback via `git mv`; extended with 4 new tests: feedback popup coordination (placement, once/no-double-pop, dismiss-persistence), survey popup coordination (FIFO behind feedback), showIn surface audit (frontpage + entityDetails). No dangling `perm-header-show-feedback` references in playwright.config.ts. EPERM-10: `perm-org-matching.spec.ts` — 3-mode exact-score matrix (none=0, answersOnly=0, impute=67) + About disclosure per mode; impute DISTINCT from none/answersOnly (score layer); none DISTINCT from answersOnly/impute (disclosure layer). DEF-120-06-01 properly framed as a downstream behavioural finding, NOT as an unmet requirement. |
| 5 | Every EPERM spec passes 3x deterministically (fresh server, clean DB) | VERIFIED | Each plan's Task 3 ran the 3× determinism gate with full `yarn db:reset` between runs. Plan 03: voter-journey 3/3 GREEN. Plan 04: perm-question-video 3/3 GREEN. Plan 05: perm-interactive-info 3/3 GREEN. Plan 06: perm-org-matching 98 passed × 3. Plan 07: perm-show-feedback-survey 68 passed × 3. Plan 08: perm-access-disable 46 passed × 3. Full default E2E suite (--grep-invert @probe): 112 passed, 0 failed, 0 did-not-run. |

**Score:** 5/5 truths verified

### Deferred Items

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | EPERM-03 alliance-presence sub-assertion (alliance entities in results.sections[]) | Phase 130 | ROADMAP SC2 explicit deferral; REQUIREMENTS.md traceability note; coverage-plan §Deferred-Build Markers. |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/specs/perm/perm-question-video.spec.ts` | EPERM-06 voter visibility matrix + candidate hideVideo | VERIFIED | Exists; 2 test.describe blocks with real assertions; imported + wired in project A10. |
| `tests/tests/specs/perm/perm-interactive-info.spec.ts` | EPERM-07 popup modal + expander modes | VERIFIED | Exists; serial mode; popup+infoSections+arguments; expander re-seed; wired in project A11. |
| `tests/tests/specs/perm/perm-org-matching.spec.ts` | EPERM-10 3-mode org score matrix + About disclosure | VERIFIED | Exists; serial mode; 3 sub-tests (none/answersOnly/impute); EXACT score assertions (.toBe); wired in project A12. |
| `tests/tests/specs/perm/perm-show-feedback-survey.spec.ts` | EPERM-09 feedback+survey popup coordination + showIn audit | VERIFIED | Exists; renamed from perm-header-show-feedback; 5 tests; wired in config A3 position. |
| `tests/tests/specs/perm/perm-access-disable.spec.ts` | EPERM-11 consolidated access-gating (3 modes) | VERIFIED | Exists; serial mode; 3 sub-tests (voterApp/candidateApp/underMaintenance); wired at voter-app chain position. |
| `tests/tests/specs/voter/voter-journey.spec.ts` (extended) | EPERM-04 tab control + EPERM-05 org missing markers | VERIFIED | Extended at lines 893-1066 with EPERM-04/05 assertions; no new project (reuses data-setup-base). |
| `tests/tests/setup/perm/perm-question-video.setup.ts` + teardown | Setup/teardown pair for EPERM-06 | VERIFIED | Both files present in setup/perm/. |
| `tests/tests/setup/perm/perm-interactive-info.setup.ts` + teardown | Setup/teardown pair for EPERM-07 | VERIFIED | Both files present in setup/perm/. |
| `tests/tests/setup/perm/perm-org-matching.setup.ts` + teardown | Setup/teardown pair for EPERM-10 | VERIFIED | Both files present in setup/perm/. |
| `tests/tests/setup/perm/perm-show-feedback-survey.setup.ts` + teardown | Setup/teardown pair for EPERM-09 | VERIFIED | Both files present; renamed from perm-header-show-feedback. |
| `tests/tests/setup/perm/perm-access-disable.setup.ts` + teardown | Setup/teardown pair for EPERM-11 | VERIFIED | Both files present. |
| `tests/tests/specs/perm/perm-header-show-feedback.spec.ts` | Must be ABSENT (EPERM-09 rename) | VERIFIED | File absent; `grep` of tests/ confirms no match. |
| `tests/tests/specs/perm/perm-disable-voter-app.spec.ts` | Must be ABSENT (EPERM-11 consolidation) | VERIFIED | File absent (git rm'd). |
| `tests/tests/specs/perm/perm-disable-candidate-app.spec.ts` | Must be ABSENT (EPERM-11 consolidation) | VERIFIED | File absent (git rm'd). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `perm-question-video.spec.ts` | playwright.config.ts A10 project triple | `testMatch: /perm-question-video\.spec\.ts/` at lines 850-855 | WIRED | `dependencies: ['data-setup-perm-question-video']`; confirmed. |
| `perm-interactive-info.spec.ts` | playwright.config.ts A11 project triple | `testMatch: /perm-interactive-info\.spec\.ts/` at lines 875-880 | WIRED | `dependencies: ['data-setup-perm-interactive-info']`; `dependencies: ['perm-question-video']` on setup. |
| `perm-org-matching.spec.ts` | playwright.config.ts A12 project triple | `testMatch: /perm-org-matching\.spec\.ts/` at lines 902-907 | WIRED | `dependencies: ['data-setup-perm-org-matching']`; `dependencies: ['perm-interactive-info']` on setup. |
| `perm-show-feedback-survey.spec.ts` | playwright.config.ts A3 project triple | `testMatch: /perm-show-feedback-survey\.spec\.ts/` at lines 700-705 | WIRED | Renamed in-place from perm-header-show-feedback; downstream `data-setup-perm-header-show-help` re-pointed to `perm-show-feedback-survey`. |
| `perm-access-disable.spec.ts` | playwright.config.ts consolidated triple | `testMatch: /perm-access-disable\.spec\.ts/` at lines 541-546 | WIRED | Consolidated at voter-app chain position; `data-setup-perm-per-app-notifications` re-pointed to `perm-access-disable`. |
| `voter-journey.spec.ts` EPERM-04/05 assertions | `entityDetails` fixture | `expectTabs`, `expectInfoItem`, `expectQuestionDisplay` | WIRED | Fixture consumed at voter-journey test-describe level; EPERM-04/05 assertions in the existing full-journey test step. |
| `MatchScore.svelte` `match-score` testid | `resultsPage.expectOrgMatchScore` | `testIds.voter.results.matchScore → 'match-score'` in testIds.ts | WIRED | Re-pointed from score-gauge to list-card MatchScore callout in resultsPage.fixture.ts; testIds.ts entry added. |

### Data-Flow Trace (Level 4)

Not applicable — this phase authors E2E test specs and test infrastructure only. No frontend feature code was added (the single frontend touch — `match-score` testid on MatchScore.svelte — is a test-anchor addition only, not a data-rendering artifact). Data-flow tracing applies to feature artifacts that render dynamic data, not to test code.

### Behavioral Spot-Checks

Not re-run per context instructions: full default E2E suite (playwright --grep-invert @probe) ran clean at 112 passed / 0 failed / 0 did-not-run on a fresh clean-DB reset immediately before this verification. That result is the authoritative regression signal. Per-spec determinism gates (3× each) were executed per plan as part of the 3× SC5 requirement.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full default E2E suite (all perm specs included) | `npx playwright test --grep-invert @probe` | 112 passed, 0 failed, 0 did-not-run | PASS (pre-verification evidence) |
| perm-question-video project enumeration | `grep -c perm-question-video tests/playwright.config.ts` | non-zero (project entry present) | PASS |
| perm-interactive-info project enumeration | `grep -c perm-interactive-info tests/playwright.config.ts` | non-zero (project entry present) | PASS |
| perm-org-matching project enumeration | `grep -c perm-org-matching tests/playwright.config.ts` | 9 (per 120-06-SUMMARY verification) | PASS |
| perm-show-feedback-survey project enumeration | File present; old file absent | Confirmed by filesystem check | PASS |
| perm-access-disable (3 sub-tests) | File present; old files absent | Confirmed by filesystem check | PASS |

### Probe Execution

Step 7c not applicable — this phase is a test-authoring phase, not a migration/tooling phase. The `_probes` project was wired in Plan 01 (Part 1 closure gate) and the 4 deferred probes were run in true isolation per CONDITION 1/2. These probe results are the DEF-119-08-01 closure evidence, formally recorded in the Phase 119 UAT closure. The `_probes` project is intentionally excluded from the default suite (`--grep-invert @probe`).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| EPERM-01 | 120-03 (re-confirm) | question-flow path matrix | SATISFIED | voter-journey.spec.ts lines 480-504, 526, 666, 668; perm-1e1cg1co:12-17 |
| EPERM-02 | 120-03 (re-confirm) | election/constituency sequencing | SATISFIED | 7 perm specs covering full matrix (per 120-03-SUMMARY citations) |
| EPERM-03 | 120-03 (re-confirm, partial) | results-display (candidate/org bulk) | SATISFIED | voter-journey.spec.ts:683-781; alliance slice deferred to Phase 130 per ROADMAP |
| EPERM-04 | 120-03 | entityDetails.contents[type][] tab control | SATISFIED | voter-journey.spec.ts:893-900 (candidate), 1015-1025 (org) |
| EPERM-05 | 120-03 | missing-data markers per entity type | SATISFIED | voter-journey.spec.ts:1035-1066 (org election-symbol absent + org missing-answer markers) |
| EPERM-06 | 120-04 | candidateApp.questions.hideVideo + voter video visibility | SATISFIED | perm-question-video.spec.ts voter matrix (q1/q3/q5) + candidate hideVideo=false/true |
| EPERM-07 | 120-05 | interactiveInfo.enabled (popup vs expander) + infoSections + arguments | SATISFIED | perm-interactive-info.spec.ts popup mode (modal + infoSections + per-type args) + expander mode |
| EPERM-08 | 120-03 (re-confirm) | matching.minimumAnswers gating | SATISFIED | voter-journey.spec.ts:493-498, 600-620 |
| EPERM-09 | 120-07 | survey/feedback popup coordination + showIn audit | SATISFIED | perm-show-feedback-survey.spec.ts: 5 tests (header-feedback + feedback popup + survey popup + showIn frontpage/entityDetails) |
| EPERM-10 | 120-06 | organizationMatching (none/answersOnly/impute) scores + About disclosure | SATISFIED | perm-org-matching.spec.ts: 3 tests with exact scores (0/0/67) + disclosure per mode |
| EPERM-11 | 120-08 | access.underMaintenance + voterApp + candidateApp gating | SATISFIED | perm-access-disable.spec.ts: 3 sub-tests; old per-app specs removed |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tests/tests/utils/testIds.ts` | 330 | Comment still references `perm-header-show-feedback` (stale comment, not a functional reference) | Info | None — comment documents which spec consumes the `header.feedback` testid; the renamed spec still uses this testid. No functional breakage. Not a stub or debt marker. |
| `tests/README.md` | multiple | References to `perm-disable-voter-app` / `perm-disable-candidate-app` in documentation (historical) | Info | None — README documents the pre-consolidation architecture. No functional references. |

No TBD, FIXME, or XXX markers found in any file modified by this phase.

### Human Verification Required

None. All success criteria are programmatically verifiable via the spec file contents, playwright.config.ts project wiring, and the pre-verification full suite pass (112/0/0). The 3× per-spec determinism gates were executed by the executor during each plan's Task 3 with documented pass counts.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are verified against the codebase:

1. EPERM-01/02/08/11 confirmed covered or extended — VERIFIED in spec files and config.
2. EPERM-03/04/05 candidate/org bulk asserted; alliance slice properly deferred to Phase 130 — VERIFIED.
3. EPERM-06 (perm-question-video) and EPERM-07 (perm-interactive-info) new perm nodes authored and wired — VERIFIED.
4. EPERM-09 (perm-show-feedback-survey rename+extend) and EPERM-10 (perm-org-matching) built and wired — VERIFIED.
5. 3× determinism gate passed per spec, and full suite 112/0/0 — VERIFIED.

DEF-120-06-01 (org answersOnly score equals none): correctly classified as a downstream behavioural finding, not an unmet requirement. The EPERM-10 distinguishability contract is preserved — `impute` (67%) is distinct from `none`/`answersOnly` (0%) at the score layer, and `none` is distinct from `answersOnly`/`impute` at the About-page disclosure layer. The spec asserts real, deterministic values rather than forcing incorrect predictions.

DEF-120-03-01 (feedback rate-limit not cleared by data-teardown-base): correctly classified as a test-isolation gap requiring a schema/teardown fix in a future phase. The 3× SC5 gate is satisfied by running with full `yarn db:reset` between runs per plan specification.

---

_Verified: 2026-06-16T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
