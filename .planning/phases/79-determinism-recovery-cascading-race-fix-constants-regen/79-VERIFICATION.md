---
phase: 79-determinism-recovery-cascading-race-fix-constants-regen
verified: 2026-05-13T00:00:00Z
status: human_needed
score: 3/4 must-haves verified (SC #1 partial — see human_verification)
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Re-read SC #1 against the literal cold-start cascade-skip count (5 in run-0-summary.txt) and confirm the 'either fix OR restructure' clause is satisfied by the registration-cascade resolution alone, given that the remaining 5 cascade-skips originate from a separate root cause (image-upload CAND-03) filed as v2.11+ follow-up todo `2026-05-13-candidate-profile-image-upload-cascade.md`."
    expected: "Accept the deviation: SC #1's intent is to resolve the DETERM-04 registration race; that intent is met (the registration test passes deterministically in cold-start). The 5 residual cascade-skips are downstream of a pre-existing, structurally unrelated image-upload failure that was masked by the original registration cascade. The 79-02 SUMMARY documents this with detailed rationale; the 79-02F XOR-fallback restructure was correctly NOT triggered because it would not have helped (image-upload is the SECOND test in the serial block; extracting only registration leaves the 5-test downstream cascade-skip intact)."
    why_human: "The SC literally says cascade-skipping is resolved. The cascade-skipping IS partially resolved (registration-rooted; not image-upload-rooted). Whether the partial resolution is acceptable given the separate root cause + filed follow-up is a strategic / product-acceptance call that the verifier cannot make alone. If accepted, an override entry should be added to this VERIFICATION.md frontmatter."
  - test: "Confirm Phases 80-82 verification can proceed against the v2.10 anchor (SHA ff0334f856...) despite the cold-start suite containing ~10 deterministically-failing tests (image-upload + 2 voter-app flakes filed at `2026-05-13-voter-matching-detail-flakes.md`)."
    expected: "Confirm the parity-gate's PASS_LOCKED contract is the binding measure (no PASS_LOCKED regressions across the trio runs 4/5/6) rather than absolute pass-rate. Phases 80-82 each run `tsx diff-playwright-reports.ts post-fix/run-6.json post-X.json`; their gates are well-defined under the 80/15/57 contract."
    why_human: "Strategic decision: is the v2.10 anchor at the right shape? PASS_LOCKED grew from 47 to 80 (over-delivered vs the planned ~63); CASCADE grew from 33 to 57 (image-upload cascade now visible). The verifier confirms the structure; whether the shape is satisfactory for v2.10 is a planning decision."
---

# Phase 79: Determinism Recovery (Cascading-Race Fix + Constants Regen) Verification Report

**Phase Goal:** The candidate-profile test surface stops cascade-skipping downstream tests, and the parity-script constants (47/15/33 anchor preserved through v2.9 Phases 75 → 76 → 77 → 78) are regenerated from a clean 3-run cold-start baseline that reflects the post-fix suite. After Phase 79, the v2.10 verification anchor (~63 PASS_LOCKED — 47 v2.9 anchor + ~16 cascade-unblocked tests) is committed and becomes the binding parity gate for all future phases.

**Verified:** 2026-05-13
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `tests/tests/specs/candidate/candidate-profile.spec.ts` runs to completion in cold-start mode without "did not run" cascade-skipping downstream tests in the same `serial` describe block — either frontend race fixed OR test restructured | PARTIAL / NEEDS HUMAN | DETERM-04 root cause (URL-predicate bug) FIXED at `candidate-profile.spec.ts:60-68` (verified by grep). Registration test PASSES deterministically in cold-start across all 6 captured runs (run-0/1/2/3/4/5/6). HOWEVER, `post-fix/run-0-summary.txt:5` shows `candidate-profile.spec.ts cascade-skip (DETERM-04 critical metric): 5` — the 5 cascaded tests are downstream of the image-upload test failure (CAND-03), NOT downstream of registration. The image-upload failure is a SEPARATE root cause (pre-existing, structurally unrelated, surfaced by the DETERM-04 fix) filed as v2.11+ follow-up at `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md`. The literal SC wording is not met (cascade-skipping not zero); the deeper intent (DETERM-04 registration cascade resolved) IS met. Human acceptance required. |
| 2 | Three consecutive `yarn test:e2e` cold-start runs show identical pass/fail sets across the `auth-setup → candidate-app → candidate-app-mutation → re-auth-setup → candidate-app-settings → candidate-app-password` dependency chain | VERIFIED | `post-fix/sha256.txt:28-30` — runs 4, 5, 6 all SHA-identical at `ff0334f856650611e2a5d1b1f990e6bbd3ad7c228ff585d5f1b5abf6bc3a09c5` (163 entries each). Initial trio (1/2/3) failed D-08 strict identity due to pre-existing voter-app flakes (NOT regressions); D-09 instability protocol triggered and resolved by 3 fresh consecutive cold-start runs. `parity-gate-output.txt` confirms PARITY GATE PASS on all 3 pair comparisons (4v5, 5v6, 4v6) plus self-identity smoke. The flakes are filed at `.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md`. |
| 3 | The parity-script constants reflect the post-DETERM-04 baseline (expected ~63 PASS_LOCKED); regenerated constants committed | VERIFIED | `tests/scripts/diff-playwright-reports.ts:111-211` updated. Counts (programmatic verification): PASS_LOCKED=80 entries (+33 vs Phase 75's 47 — over-delivered vs the ~63 expectation), DATA_RACE=15 entries (unchanged — Phase 73 D-09 binding preserved), CASCADE=57 entries (+24 vs Phase 75's 33 — image-upload downstream + variant-project chain). Regen header comment block at lines 42-108 documents the source (run-6.json), the D-09 narrative, and the v2.10 anchor role. Atomic commit landed at `b49e14e5e`. |
| 4 | The regenerated baseline is wired as the v2.10 verification anchor for downstream Phases 80-82 | VERIFIED | `tests/scripts/diff-playwright-reports.ts:42-108` regen-header comment explicitly names this as "the binding parity-gate baseline for Phases 80, 81, 82" (lines 60-62 narrate the role; the constants themselves at lines 111-211 ARE the anchor). Phase 79 commit `b49e14e5e` lands the constants update; subsequent Phase 80-82 verification gates compare post-state JSON reports against this baseline via `tsx diff-playwright-reports.ts`. ROADMAP.md:127, 140, 153 each name Phase 79 as the dependency for Phases 80/81/82. |

**Score:** 3/4 truths VERIFIED; 1 PARTIAL pending human acceptance.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `tests/tests/specs/candidate/candidate-profile.spec.ts` (URL-predicate fix) | Multi-line predicate at lines 60-68 excluding `/candidate/{register,auth,login}` intermediate paths | VERIFIED | grep confirms the predicate at lines 60-68 with the exclusion regex `/\/candidate\/(?!register\|auth\|login)/`. Comment at lines 52-59 references Plan 01 RCA-FINDINGS.md. Net diff vs pre-fix: +20/-5 lines. |
| `tests/scripts/diff-playwright-reports.ts` (constants regen) | 80 PASS_LOCKED + 15 DATA_RACE + 57 CASCADE arrays; PHASE 79 REGEN header | VERIFIED | All 3 array entry counts confirmed via awk. Header substring `PHASE 79 REGEN` present at line 43. File total 570 lines. |
| `post-fix/run-1.json` … `run-6.json` | 6 cold-start full-suite captures (3 initial + 3 D-09 fresh) | VERIFIED | All 6 files present (295k-300k bytes). Plus `run-0.json` (Plan 02 D-12 1-run smoke, 298k). |
| `post-fix/sha256.txt` | 6-run audit + D-09 resolution narrative | VERIFIED | File exists with hashes for all 6 runs + D-09 narrative explaining flake hypothesis + final regen-source decision (run-6). |
| `post-fix/parity-gate-output.txt` | Self-identity + 3-pair parity-gate PASS verdicts | VERIFIED | 4 sections (self-identity + 3 pairs) all PARITY GATE: PASS. |
| `post-fix/imgproxy-audit.txt` | IMGPROXY_TIED_TITLES audit PASS | VERIFIED | "14 titles, 15 total matches. PASS — zero zero-match titles". |
| `post-fix/rca-traces/RCA-FINDINGS.md` (Plan 01) | Empirical RCA verdict + recommended fix | VERIFIED | Referenced by `79-01-SUMMARY.md` and the spec-fix comment at `candidate-profile.spec.ts:52`. |
| `STATUS.md` | Phase verdict GREEN; operator return surface | VERIFIED | `Phase verdict so far: DETERM-04 GREEN + DETERM-05 GREEN — Phase 79 COMPLETE`. |
| 4 SUMMARY.md files (79-01, 79-02, 79-02F, 79-03) | Per-plan summaries | VERIFIED | All 4 present with completed verdicts. 79-02F is DONE-AS-NOOP per XOR contract (Plan 02 PASS path landed). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| candidate-profile.spec.ts:60-68 predicate | Plan 01 RCA verdict | Comment at lines 52-59 + RCA-FINDINGS.md `## Recommended Fix for Plan 02` | WIRED | Single-line URL-predicate tightening applied verbatim per RCA recommendation. |
| post-fix/run-6.json | tests/scripts/diff-playwright-reports.ts constants | post-fix/regen-constants.mjs (with reportPath = run-6.json) | WIRED | Header comment lines 43-48 explicitly cite run-6.json as regen source; constants ARE the regen output. |
| Phase 79 constants update | Phases 80-82 verification gates | `tsx diff-playwright-reports.ts post-fix/run-6.json post-X.json` invocation pattern | WIRED | Header comment lines 60-62 names this role. ROADMAP.md Phase 80/81/82 entries name Phase 79 as the dependency. |
| Pre-existing voter-app flakes (D-09 finding) | v2.11+ follow-up | `.planning/todos/pending/2026-05-13-voter-matching-detail-flakes.md` | WIRED | Todo file exists; sha256.txt:42-43 references it. |
| Image-upload cascade (Plan 02 finding) | v2.11+ follow-up | `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md` | WIRED | Todo file exists; 79-02-SUMMARY.md key-decisions reference it. |

### Data-Flow Trace (Level 4)

N/A — Phase 79 produces test-infrastructure + parity-script constants, not user-facing rendered components. The "data flow" is from the run-N.json captures through regen-constants.mjs into the diff-playwright-reports.ts arrays; all three traces verified above as WIRED.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Constants array sizes | `awk '/const PASS_LOCKED_TESTS/,/^\];/' diff-playwright-reports.ts \| grep -c '::'` | 80 | PASS |
| DATA_RACE pool unchanged | `awk '/const DATA_RACE_TESTS/,/^\];/' diff-playwright-reports.ts \| grep -c '::'` | 15 | PASS |
| CASCADE updated | `awk '/const CASCADE_TESTS/,/^\];/' diff-playwright-reports.ts \| grep -c '::'` | 57 | PASS |
| URL-predicate fix present | `grep -E 'candidate/(?!register\|auth\|login)' candidate-profile.spec.ts` | matches at line 64 | PASS |
| PHASE 79 REGEN header | `grep -c "PHASE 79 REGEN" diff-playwright-reports.ts` | 1 | PASS |
| Phase 79 GREEN commit | `git log --oneline -5` | `b49e14e5e feat(79-03): DETERM-05 constants regen + 3-pair parity gate (v2.10 anchor)` | PASS |
| All 6 run JSONs present | `ls post-fix/run-{1..6}.json` | 6 files, 295k-300k each | PASS |
| Run-0 cold-start D-12 smoke | `ls post-fix/run-0.json + run-0-summary.txt` | both present | PASS |
| Suite executes (not running) | N/A — no live test suite re-run; trusting committed run-6.json | SKIPPED | SKIP (would take ~22 min to re-run) |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| DETERM-04 | 79-01, 79-02, 79-02F | Resolve candidate-profile cascading race; 3 cold-start runs show identical pass/fail sets | SATISFIED (with caveat for cascade-skip count) | RCA-FINDINGS.md + spec-fix at line 60-68 + run-0-summary.txt registration PASS in cold-start. The registration cascade root cause IS resolved. The 5 residual cascade-skips are from a separate, pre-existing root cause (image-upload) — filed as v2.11+ follow-up. Re-read SC #1 in human_verification section. |
| DETERM-05 | 79-03 | Regenerate parity-script constants from clean 3-run cold-start baseline; commit as v2.10 anchor | SATISFIED | Constants updated (80/15/57); D-09 protocol resolved initial-trio failure with 3 fresh SHA-identical runs; atomic commit `b49e14e5e`. Both REQ artifacts (regenerated constants + v2.10 anchor wiring) present. |

**Coverage audit:** Both DETERM-04 and DETERM-05 are declared in plan frontmatter `requirements` fields. No orphaned requirements detected (REQUIREMENTS.md Phase-79 mapping lists exactly these two).

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (none in scope) | — | — | Info | The candidate-profile.spec.ts predicate fix is a real, working change with a multi-line rationale comment referencing the RCA. The constants update is a regenerated artifact (not hand-edited). No TODO/FIXME/placeholder markers in modified files. No empty implementations. No console.log debugging cruft. The RCA Phase 79 instrumentation in `(protected)/+layout.svelte` + `register/password/+page.svelte` was added in 79-01 Task 1 and REVERTED in 79-01 Task 4 (grep-clean verified in 79-01-SUMMARY.md self-check). |

### Human Verification Required

#### 1. SC #1 acceptance: partial resolution of cold-start cascade-skipping

**Test:** Read `.planning/phases/79-determinism-recovery-cascading-race-fix-constants-regen/post-fix/run-0-summary.txt` together with `79-02-SUMMARY.md` Deviation #3 ("Closing PASS-WITH-DEFERRAL rather than triggering 79-02F") and the 79-02F-SUMMARY.md DONE-AS-NOOP rationale. Decide whether the partial resolution is acceptable given:
- The registration cascade (the named DETERM-04 root cause) IS resolved deterministically.
- The 5 residual cascade-skips originate from the image-upload test (CAND-03), a SEPARATE pre-existing root cause that was masked by the registration cascade.
- The 79-02F XOR-fallback restructure was explicitly determined NOT to help: image-upload is the SECOND test in the serial block; extracting only registration leaves the 5-test downstream cascade intact.
- The image-upload cascade is filed as a v2.11+ follow-up at `.planning/todos/pending/2026-05-13-candidate-profile-image-upload-cascade.md` with concrete investigation notes (suspect: `[storage.image_transformation]` disabled in `config.toml:130-131` OR auth-state propagation between serial tests).

**Expected:** Accept (recommended) — the deeper intent of SC #1 is the DETERM-04 cascade resolution, which is met; the residual is a structurally unrelated cascade that requires its own phase. If accepted, add an `overrides:` entry to this VERIFICATION.md frontmatter so future re-verifications honor the decision.

**Why human:** The SC has dual phrasing ("either fix OR restructure"). The literal cascade-skip count is non-zero; whether the partial resolution + filed-follow-up shape is acceptable for v2.10 close is a planning judgment, not a programmatic check.

#### 2. v2.10 verification anchor shape acceptance for Phases 80-82

**Test:** Confirm the new 80/15/57 anchor (vs the originally-expected ~63/15/~17) is the right shape for Phases 80-82 to verify against. Note that Phase 80/81/82 each extend candidate-profile-validation.spec.ts and depend on Phase 79 DETERM-04 GREEN; their verification gates run `tsx diff-playwright-reports.ts post-fix/run-6.json <post>.json` against this baseline.

**Expected:** Accept — the contract is well-defined under the PASS_LOCKED non-regression rule. The over-delivery (+33 instead of +16) is net-positive (more tests now have determinism guarantees), not a problem.

**Why human:** Strategic/planning question about whether the anchor's shape works for downstream phases; verifier cannot make this call alone.

### Gaps Summary

There are no programmatically-detectable gaps. The phase delivered:
- DETERM-04 fix at the file:line predicted by Plan 01 RCA.
- 3 consecutive SHA-identical cold-start runs (via D-09 protocol after the initial trio failed due to pre-existing flakes).
- Regenerated parity-script constants at expected shape (+33 PASS_LOCKED — over-delivered vs the planned ~+16).
- Atomic commit landed (`b49e14e5e`).
- Two v2.11+ follow-ups filed for surfaced-not-introduced issues (image-upload cascade + voter-app flakes).
- ROADMAP marked Phase 79 complete.

The single open item is human acceptance of SC #1's partial resolution — the literal cascade-skip metric is 5 (not 0), but the residual cascade originates from a structurally unrelated root cause that the phase's scope explicitly does not cover, and the deferred-by-design 79-02F XOR-fallback is documented as not-applicable.

---

_Verified: 2026-05-13_
_Verifier: Claude (gsd-verifier)_
