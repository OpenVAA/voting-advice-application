---
phase: 85-variant-project-cascade-rca-fix-investigate-and-close-the-47
verified: 2026-05-14T00:00:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 1
overrides:
  - must_have: "SC #3 strict — CASCADE_TESTS array shrinks from 47 to ≤5"
    reason: "WARNING 9 contingency was invoked AT PLANNING TIME (per Plan 02 acceptance §'WARNING 9 relaxation' + CONTEXT.md D-08 + RESEARCH §'Open Question 3'). The relaxed contract — `(CASCADE + new variant-FAIL count) ≤ 47` (un-passed pool MUST NOT GROW) — is satisfied: 42 CASCADE + 2 new variant-multi-election deterministic FAILs = 44 ≤ 47, pool SHRUNK by 3. ROADMAP SC #4 explicitly routes new variant deterministic fails to Phase 86 (DETERM-12/13)."
    accepted_by: "plan-blessed-at-planning-time (Plan 02 PLAN.md WARNING 9 contingency clause)"
    accepted_at: "2026-05-14T00:00:00Z"
deferred:
  - truth: "2 new variant-multi-election deterministic FAILs (variant-multi-election.spec.ts:139 getByTestId('question-choice').nth(2) timeouts)"
    addressed_in: "Phase 86"
    evidence: "ROADMAP SC #4 (Phase 85): 'Variant spec runs surface their own deterministic verdicts; new deterministic failures (if any) join the DETERM-12/13/14 FAILURE-CLASS cohort for Phase 86 attention.' Plus CONTEXT.md D-08 + 85-02-SUMMARY §'Phase 86 Routing Recommendation A.'"
  - truth: "32 cascade-victims of the 2 new variant-FAILs (downstream variant projects that cascade-skip)"
    addressed_in: "Phase 86"
    evidence: "85-02-SUMMARY §'Phase 86 Routing Recommendation B': 'These move into PASS_LOCKED automatically when the 2 root-cause FAILs resolve. No independent action required.'"
  - truth: "voter-detail party-drawer run-3 boundary flake (1 cell flipped between runs 1+2 and run 3)"
    addressed_in: "Phase 86"
    evidence: "85-02-SUMMARY §'Phase 86 Routing Recommendation C': inherits Phase 84 routing (DETERM-12 voter-app FAILURE-CLASS cleanup). Phase 83 DETERM-07b hydration-guard boundary graduate; symmetric flake direction confirmed."
  - truth: "3 PRODUCT-GAP source-skips (SETTINGS-01 wave A — header.showFeedback / header.showHelp / notifications.voterApp) still in CASCADE pool"
    addressed_in: "Phase 87"
    evidence: "85-RCA-FINDINGS §'Open Questions Q2': RESEARCH suggests migrating to a separate SOURCE_SKIP_TESTS partition; deferred to Phase 87 milestone-close per RESEARCH §'Open Questions Q2'."
---

# Phase 85: Variant-Project Cascade RCA & Fix — Verification Report

**Phase Goal:** Diagnose + close the 47 CASCADE entries spread across 9 `data-setup-*` projects and their 9 paired `variant-*` spec projects. After Phase 85, all variant data-setup chains run to completion in cold-start; CASCADE pool shrinks from 47 → 0 (or near 0, with explicit deferrals).

**Verified:** 2026-05-14
**Status:** PASSED (with planning-time override on SC #3 strict-numeric form, plus 4 explicit deferrals to Phases 86 + 87 per ROADMAP scope)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria + plan must-haves)

| #   | Truth (Success Criterion)                                                                     | Status            | Evidence                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | DETERM-10 — RCA committed with diagnostic evidence                                            | VERIFIED          | `85-RCA-FINDINGS.md` exists, identifies H0 (chain-head deterministic FAIL on `voter-app-popups :: should remember dismissal after page reload`); H1 architecturally disproven; H2/H3 deferred. 4 evidence files in `rca-capture/`. Recommends Path B. |
| 2   | DETERM-11 — targeted fix implemented; all 9 `data-setup-*` projects run to completion         | VERIFIED          | `tests/playwright.config.ts:252` confirms `dependencies: ['candidate-app-password']` (voter-app-popups removed). 9-line Phase 85 DETERM-11 comment block present (lines 233-247). All 9 data-setup projects pass or surface their own deterministic verdicts per run-{1,2,3}.json.                  |
| 3   | CASCADE pool: 47 → ≤5 (strict) OR relaxed (un-passed pool ≤ 47)                               | VERIFIED (override) | Strict 47 → ≤5 NOT met (CASCADE = 42). WARNING 9 contingency invoked at planning time: relaxed criterion `(CASCADE 42) + (new variant-FAILs 2) = 44 ≤ 47` IS met. Un-passed pool SHRUNK by 3 vs Phase 84. Override applied per Plan 02 PLAN.md WARNING 9 + ROADMAP SC #4 routing-to-Phase-86 clause. |
| 4   | Variant spec verdict surfacing — new deterministic fails route to Phase 86 FAILURE-CLASS      | VERIFIED          | 2 new variant-multi-election timeouts at spec.ts:139 documented in `post-fix/sha256.txt` lines 90-103, `85-02-SUMMARY.md` §"Phase 86 Routing Recommendation A", and `diff-playwright-reports.ts:72-91` (PHASE 85 REGEN jsdoc). Routed to Phase 86 per CONTEXT.md D-08.                              |
| 5   | Fresh 3-run cold-start gate; new anchor reflects CASCADE shrinkage                            | VERIFIED          | `post-fix/sha256.txt` records 3 SHAs: run-1.sha256 ≡ run-2.sha256 = `6815977e27…`; run-3.sha256 = `411e09f5ff…` (new Phase 85 anchor). Phase 84 anchor `04ddfdd85cf…` ABSORBED per `diff-playwright-reports.ts:114-115`.                                                                              |

**Score:** 5/5 truths verified (1 via planning-time override, 4 verified directly).

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases (Phases 86 + 87).

| # | Item                                                                                                              | Addressed In | Evidence                                                                                              |
| - | ----------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| 1 | 2 new variant-multi-election deterministic FAILs (variant-multi-election.spec.ts:139 question-choice.nth(2) timeouts) | Phase 86     | ROADMAP SC #4 ("new deterministic failures join the DETERM-12/13/14 FAILURE-CLASS cohort for Phase 86 attention") + 85-02-SUMMARY §"Phase 86 Routing Recommendation A" |
| 2 | 32 cascade-victims of the 2 new variant-FAILs (downstream variant projects)                                       | Phase 86     | 85-02-SUMMARY §"Phase 86 Routing Recommendation B" — auto-resolved when root-cause FAILs are fixed     |
| 3 | voter-detail party-drawer run-3 boundary flake                                                                    | Phase 86     | 85-02-SUMMARY §"Phase 86 Routing Recommendation C" — inherits Phase 84 routing; Phase 83 DETERM-07b hydration-guard boundary graduate |
| 4 | 3 PRODUCT-GAP source-skips (SETTINGS-01 wave A header.showFeedback / header.showHelp / notifications.voterApp)    | Phase 87     | 85-RCA-FINDINGS §"Open Questions Q2" — migrate to separate SOURCE_SKIP_TESTS partition at Phase 87 milestone-close hygiene |

### Required Artifacts

| Artifact                                                                                                                                            | Expected                                          | Status      | Details                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `.planning/phases/85-…/85-RCA-FINDINGS.md`                                                                                                          | Plan 01 RCA verdict + Path B recommendation       | VERIFIED    | 8715 bytes; contains H0 confirmed, H1 disproven, Path B recommended, D-04 divergence note. Atomic commit `eb502aeb0`.                                                                |
| `.planning/phases/85-…/rca-capture/chain-head-failure.txt`                                                                                          | 3-run empirical FAIL capture                       | VERIFIED    | Contains 3× `=== RUN N ===` headers AND 3 matching `voter-app-popups.*failed.*should remember dismissal after page reload` rows. Commit `887598131`.                                |
| `.planning/phases/85-…/rca-capture/h1-grep.txt`                                                                                                     | H1 architectural disproof                          | VERIFIED    | 3259 bytes; contains 8 `from '@openvaa/dev-seed'` positive imports (Rule 1 footnote: 8 actual variant setup files, NOT 9 — variant-results-sections is spec-only). Commit `433079962`. |
| `.planning/phases/85-…/rca-capture/cascade-classification.txt`                                                                                      | 47-entry partition                                 | VERIFIED    | Exactly 3 `SOURCE-SKIP` lines + 44 `CASCADE-SKIP` lines (sum = 47). Commit `070ceb778`.                                                                                              |
| `.planning/phases/85-…/rca-capture/dependency-dag.md`                                                                                               | Variant linear-chain DAG                           | VERIFIED    | Cites `data-setup-multi-election` + `voter-app-popups` (15 occurrences). Commit `070ceb778`.                                                                                          |
| `tests/playwright.config.ts` (Path B decouple)                                                                                                       | `dependencies: ['candidate-app-password']` only    | VERIFIED    | Line 252 confirms decouple. Phase 85 DETERM-11 comment block at lines 233-247 (Phase 84 DETERM-08-style; cites commit 93050e4fb). Commit `d1f8adec0`.                                |
| `.planning/phases/85-…/post-fix/run-{1,2,3}.json` + `*.sha256` + `sha256.txt`                                                                       | 3-run cold-start gate captures                     | VERIFIED    | Run-1 ≡ Run-2 SHA `6815977e27…`; Run-3 SHA `411e09f5ff…` (new anchor). Commit `82450d9db`.                                                                                            |
| `.planning/phases/85-…/post-fix/smoke.json` + `smoke-output.txt` + `smoke-commands.txt`                                                              | 1-run smoke + BLOCKER 1 audit trail                | VERIFIED    | smoke-commands.txt contains `db:seed --template e2e --likert-only` canonical chain (BLOCKER 1 audit trail). Commit `c2c94d71a`.                                                       |
| `.planning/phases/85-…/post-fix/regen-output.txt`                                                                                                   | Regen script output (PASS_LOCKED+DATA_RACE+CASCADE) | VERIFIED   | Header asserts `IMGPROXY_TIED_TITLES match-count assertion: 3 titles, 3 total matches.` Body: `PASS_LOCKED_TESTS (109)`, `DATA_RACE_TESTS (3)`, `CASCADE_TESTS (42)`. Commit `086e6361d`. |
| `tests/scripts/diff-playwright-reports.ts` (PHASE 85 REGEN jsdoc + 3 arrays)                                                                          | Phase 85 anchor jsdoc + 3 updated arrays           | VERIFIED    | PHASE 85 REGEN block at lines 43-142; PASS_LOCKED=109 entries, DATA_RACE=3 entries, CASCADE=42 entries. Phase 84 anchor `04ddfdd85cf…` documented as ABSORBED. Commit `086e6361d`.   |
| `.planning/phases/79-…/post-fix/regen-constants.mjs` (reportPath repoint)                                                                            | reportPath points at Phase 85 run-3.json           | VERIFIED    | Line 34: `'85-variant-project-cascade-rca-fix-investigate-and-close-the-47', 'post-fix', 'run-3.json'`. IMGPROXY_TIED_TITLES (lines 91-95) preserved at 3 entries.                   |

### Key Link Verification

| From                                                          | To                                                              | Via                                                          | Status     | Details                                                                                                                       |
| ------------------------------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tests/playwright.config.ts:252`                              | `data-setup-multi-election` dependency resolution               | Playwright project-dependency graph (test discovery)         | WIRED      | `dependencies: ['candidate-app-password']` (voter-app-popups removed) — sha256.txt confirms data-setup-multi-election runs 3/3 PASSED post-decouple |
| `regen-constants.mjs:34` reportPath                            | Phase 85 `post-fix/run-3.json`                                  | in-place path-string edit (per CONTEXT.md D-05)              | WIRED      | Path resolves correctly (verified during Task 4 path-resolve gate per 85-02-SUMMARY §"Pre-Execution Path-Resolve Gate")        |
| `diff-playwright-reports.ts` CASCADE_TESTS array               | `post-fix/regen-output.txt` `=== CASCADE_TESTS (42) ===` block  | atomic Task 4 paste (Phase 79 D-10 + Phase 84 D-06 precedent) | WIRED      | PHASE 85 REGEN marker (line 43) + 42-entry array (lines 265-310); regen-output.txt body content matches verbatim               |
| `85-RCA-FINDINGS.md` H0 verdict                                | Phase 84 `post-fix/run-{1,2,3}.json`                            | rca-capture/chain-head-failure.txt empirical capture          | WIRED      | 3 matching `voter-app-popups.*failed.*should remember dismissal` rows; one per Phase 84 run                                    |
| `85-RCA-FINDINGS.md` H1 disproof                              | `tests/tests/setup/variant-*.setup.ts` (8 files)                | rca-capture/h1-grep.txt                                       | WIRED      | 8 positive `from '@openvaa/dev-seed'` matches (8 variant setup files; Rule 1 footnote acknowledged in RCA-FINDINGS line 78-82) |

### Requirements Coverage

| Requirement | Source Plan | Description                                                                                                    | Status      | Evidence                                                                                                                          |
| ----------- | ----------- | -------------------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------- |
| DETERM-10   | 85-01-PLAN  | RCA plan identifies the shared root cause + RCA-FINDINGS.md committed with per-project run logs                | SATISFIED   | `85-RCA-FINDINGS.md` + 4 rca-capture/ evidence files; H0 chain-head FAIL identified as single source; H1 architecturally disproven |
| DETERM-11   | 85-02-PLAN  | Targeted fix implemented; all 9 `data-setup-*` projects run to completion; CASCADE pool 47 → ≤5 (or relaxed)   | SATISFIED   | Path B 1-line decouple at playwright.config.ts:252; post-fix 3-run gate shows data-setup-multi-election (chain head) 3/3 PASSED; relaxed criterion `(CASCADE 42 + new variant-FAILs 2) = 44 ≤ 47` met per WARNING 9 contingency |

### Anti-Patterns Found

None in modified code surfaces. The Phase 85 DETERM-11 comment block at `tests/playwright.config.ts:232-247` is intentional rationale documentation (Phase 84 DETERM-08 precedent), not debt. The "WARNING 9" references in diff-playwright-reports.ts jsdoc are transparent acknowledgments of the planning-time relaxation, not unresolved debt markers. No `TODO`, `FIXME`, `TBD`, `XXX`, or `HACK` markers introduced in any Phase 85 commit on the modified code paths.

### Out-of-Scope Modification Audit

| Forbidden file/path                                  | Modified in Phase 85? | Evidence                                                                                                                      |
| ---------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `tests/tests/specs/voter/voter-popups.spec.ts`       | NO                    | `git log a4d050db5..HEAD --name-only \| grep -c 'voter-popups.spec.ts'` = 0. BLOCKER 2 invariant honored.                      |
| `.planning/ROADMAP.md`                               | NO                    | No occurrences in execution commits 887598131..HEAD.                                                                          |
| `apps/supabase/supabase/config.toml`                  | NO                    | No occurrences in any Phase 85 commit.                                                                                        |
| `.planning/STATE.md`                                 | YES (planning commit `32f7cb00f`)  | "record phase 85 planned (2 plans, ready to execute)" — orchestrator-owned planning commit; NOT part of Plan 01/02 execution. Acceptable. |

### CONTEXT.md D-01..D-09 Compliance

| Decision | Description                                                                  | Honored | Evidence                                                                                                                                             |
| -------- | ---------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01     | Plan 01 = RCA with `85-RCA-FINDINGS.md` deliverable                          | YES     | Plan 01 produced exactly this artifact via commit `eb502aeb0`                                                                                        |
| D-02     | Plans 02..N = targeted fix per cluster (single fix if one shared root cause)  | YES     | Plan 02 = single fix plan per RCA verdict of one shared root cause                                                                                   |
| D-03     | Hypothesis instrumentation priority H1 → H2 → H3                              | YES (with H0 override) | RCA-FINDINGS confirms H0 chain-head FAIL took precedence; H1 still architecturally disproven; H2/H3 deferred                                       |
| D-04     | RCA agent invocation (research agent spawned by Plan 01)                      | DEVIATION (acknowledged) | WARNING 8 D-04 divergence transparently recorded in RCA-FINDINGS §"Provenance + D-04 Divergence Note" — RESEARCH ran one step upstream; benign     |
| D-05     | Fresh 3-run cold-start gate via Phase-84-updated archived `regen-constants.mjs` | YES   | regen-constants.mjs reportPath repointed; IMGPROXY_TIED_TITLES match-count assertion gate intact (3 titles, 3 total matches)                       |
| D-06     | Anchor expectation: ~150 PASS_LOCKED + 3 DATA_RACE + ≤5 CASCADE              | RELAXED (per WARNING 9) | Actual: 109 PASS_LOCKED + 3 DATA_RACE + 42 CASCADE + 2 new variant-FAILs. WARNING 9 contingency invoked; relaxed criterion met (44 ≤ 47)            |
| D-07     | Gate execution: agent-inline via Bash run_in_background                       | YES     | 3 background runs captured per Phase 79 D-11 + Phase 83/84 precedent                                                                                |
| D-08     | DETERM-10 must not pre-resolve voter-FAILURE-CLASS items                      | YES     | voter-popups.spec.ts NOT modified; 2 new variant-multi-election FAILs + party-drawer flake routed to Phase 86                                       |
| D-09     | DATA_RACE pool MUST NOT grow (preserved at 3 imgproxy-intrinsic titles)       | YES     | DATA_RACE_TESTS = exactly 3 (same 3 image-intrinsic CAND-03/CAND-12 tests); IMGPROXY_TIED_TITLES preserved at 3 in regen-constants.mjs              |

### Rule 1 Acknowledgments

Plan 01 surfaced an "8 variant setups" correction (CONTEXT.md D-03 + RESEARCH.md describe 9; `variant-results-sections` is spec-only per `tests/playwright.config.ts:264-271`). RCA-FINDINGS §"Footnote — Architecture Correction (Rule-1 Deviation)" (lines 78-82) acknowledges this. The substantive H1 architectural-disproof argument is unchanged across 8 vs. 9.

---

## Gaps Summary

**No blocker gaps.** All 5 SCs are achieved (1 via planning-time WARNING 9 override that is plan-blessed for this exact case).

The CASCADE strict-numeric criterion (47 → ≤5) was anticipated to slip at planning time per the WARNING 9 contingency clause in Plan 02 PLAN.md. The relaxed binding contract — "un-passed pool MUST NOT GROW" — is met with margin: `(CASCADE 42) + (new variant-FAILs 2) = 44 ≤ 47`, a NET SHRINK of 3.

The 4 deferred items (2 variant-multi-election deterministic FAILs + 32 cascade-victims + party-drawer flake → Phase 86; 3 PRODUCT-GAP source-skips → Phase 87) are explicitly addressed in later milestone phases per ROADMAP SC #4 routing clauses and 85-02-SUMMARY routing recommendations.

All structural invariants are intact:
- DATA_RACE_TESTS = exactly 3 (D-09 binding preserved)
- voter-popups.spec.ts untouched (BLOCKER 2 + D-08 honored)
- IMGPROXY_TIED_TITLES match-count assertion = 3 titles / 3 matches
- New Phase 85 anchor `411e09f5ff…` captured; Phase 84 anchor `04ddfdd85cf…` documented as ABSORBED
- Phase 86 + Phase 87 routing recommendations explicit in summaries

---

_Verified: 2026-05-14_
_Verifier: Claude (gsd-verifier, goal-backward)_
