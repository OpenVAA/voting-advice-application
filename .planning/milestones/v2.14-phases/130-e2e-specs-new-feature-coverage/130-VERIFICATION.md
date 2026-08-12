---
phase: 130-e2e-specs-new-feature-coverage
verified: 2026-07-19T04:12:00Z
status: passed
score: 5/5 roadmap success criteria verified; 4/4 requirement IDs closed
behavior_unverified: 0
overrides_applied: 0
---

# Phase 130: E2E Specs — New-Feature Coverage Verification Report

**Phase Goal:** The new features built in Phase 129 are covered by E2E — the previously-blocked question-type variants and the alliance flow — plus the nominations-route assertion and the EPERM-03 alliance-presence extension. Fixtures-first within the phase: any new-feature-specific fixtures are built and proven before the specs consume them.
**Verified:** 2026-07-19T04:12:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Method

This is not a documentation review. Every artifact claim below was checked directly against the working tree, and the phase's central behavioral claim (the D-05 3× determinism gate) was independently re-executed rather than trusted from SUMMARY.md:

- Read all 6 PLAN.md + 6 SUMMARY.md + deferred-items.md + REQUIREMENTS.md + ROADMAP.md Phase 130 section.
- Ran `yarn typecheck:tests` — exit 0.
- Listed the `voter-alliance`, `voter-nominations`, and `_probes` (numberScale) Playwright projects with `--list` to confirm they are wired into `tests/playwright.config.ts` (not silently orphaned — RESEARCH Pitfall 2).
- Read the actual spec/fixture source for every claimed artifact (`voter-alliance.spec.ts`, `voter-nominations.spec.ts`, `numberScale.probe.spec.ts`, the EQTYP-02 boundary describe in `voter-journey.spec.ts`, `expectQuestionDisplay`/`expectNumberQuestionDisplay` in `entityDetails.fixture.ts`, `fillMultipleTextQuestion` in `candidateProfilePage.fixture.ts`, steps 18.5/18.6 in `candidate-journey.spec.ts`) — confirmed the code matches the claims, not stubs.
- Audited `git log --name-only` across every Phase 130 commit for product/seed file touches — confirmed zero (`apps/frontend/src`, `packages/dev-seed/src`, `apps/supabase` all clean), verifying the "specs-only" prohibition.
- **Independently re-ran the full E2E suite from a cold state** (`yarn db:reset` → fresh `yarn dev` on :5173 → `yarn test:e2e`) rather than trusting the 130-06-SUMMARY.md evidence table. Result: **128 passed, 0 failed, 0 did-not-run, exit 0, 10.9m wall** — an exact match to the SUMMARY's claimed shape, reproduced as a 4th independent green run beyond the 3 documented in the SUMMARY. `voter-alliance`, `voter-nominations`, and the `EQTYP-02: number-scale boundary matching` test were confirmed executing (not skipped) in this live run's reporter output.

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| # | Truth (ROADMAP SC) | Status | Evidence |
|---|------|--------|----------|
| 1 | Multi-choice categorical covered for voter/candidate/matching; categorical+boolean confirmed for candidates; number-scale covered for answering + matching boundary; text/MultipleText covered for voter/candidate round-trip (EQTYP-01/02/03) | ✓ VERIFIED | Candidate: `candidate-journey.spec.ts` steps 18.5 (4 checkboxes, D-07 save gating 1→2→3→4-overmax→3, helper visibility) + 18.6 (categorical 3 radios, boolean 2 radios) — read directly, matches SUMMARY. Voter: `voter-journey.spec.ts` 100%-first-card matching-incorporation assertion + CA-AA-Special drawer displays (multi-choice + number dual-marker) + dedicated `EQTYP-02: number-scale boundary matching` describe (min ordering + mid monotonic shift) — all read directly and confirmed executing/passing in the live 128/0/0 run. MultipleText: `fillMultipleTextQuestion` + step 13 fill + step 21 verbatim `[MULTITEXT-1]`/`[MULTITEXT-2]` round-trip — read directly. |
| 2 | Alliance card + member-orgs drawer render/assert (EFLOW-02); EPERM-03 alliance-presence sub-assertion lands as a criterion here | ✓ VERIFIED | `voter-alliance.spec.ts` (140 lines, read in full): presence rider (tab set + section), card + gauge + both member subcards by name, drawer-identity click-through proof, EPERM-04 tab-control rider (`['info','children']`, zero-count opinions-tab assertion), member-orgs drawer (2 members, both named). Project wired (`--list` confirmed) and green in the live full-suite run. |
| 3 | `/nominations` route renders all-nominations entities correctly (UNBLK-04 rider) | ✓ VERIFIED | `voter-nominations.spec.ts` (read in full): raw `goto('/en/nominations')`, HARD assertions on list visibility + ≥1 card. Project wired and green in the live run. |
| 4 | Fixtures-first: new-feature fixtures built, typecheck-clean, proven by smoke/probe before specs consume them | ✓ VERIFIED | `numberScale.probe.spec.ts` proves `answerNumberScale` + `expectQuestionDisplay`/`expectNumberQuestionDisplay` against a live drawer BEFORE plan 130-03 consumes them (wave 1 → wave 2 dependency, `depends_on: [130-01]` in 130-03's frontmatter). `fillMultipleTextQuestion` (130-02) is proven by a full green candidate-journey run in Task 1 before the round-trip assertion is added in Task 2 — an explicit, reasoned deviation from a standalone probe (documented in the plan: "this run IS the fixtures-first smoke for the candidate side"), not a silent skip. `yarn typecheck:tests` exits 0. |
| 5 | All new-feature-coverage specs pass 3× deterministically (fresh server, clean DB) | ✓ VERIFIED | 130-06-SUMMARY.md documents 3 consecutive fresh-server/clean-DB runs, each 128 passed/0 failed/0 did-not-run, with a root-caused fixture fix (`8725d86ef`) and a documented restart-from-run-1 after the fix (correct E2E cardinal-rule discipline — no flaky exemption). **Independently reproduced**: I ran a 4th full-suite gate cycle from a clean DB + fresh :5173 server myself and got the identical 128 passed / 0 failed / 0 did-not-run / exit 0 shape. |

**Score:** 5/5 roadmap success criteria verified (0 present-but-behavior-unverified).

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|---|---|---|---|---|
| EQTYP-01 | 130-01, 130-03, 130-05 | Multi-choice categorical — voter/candidate/matching | ✓ SATISFIED | REQUIREMENTS.md marks `[x]` Complete, mapped to Phase 130. Voter matching-incorporation + drawer display (130-03) + candidate type-specific checkbox/categorical/boolean contracts (130-05) — all read directly, confirmed live-green. |
| EQTYP-02 | 130-01, 130-03 | Number-scale — answering + matching boundary | ✓ SATISFIED | `answerNumberScale` exact-value + clamp proof (probe) + EQTYP-02 boundary describe (min ordering + mid monotonic shift, precision backstop) — read directly, confirmed live-green. |
| EQTYP-03 | 130-02 | Text/MultipleText — voter/candidate round-trip | ✓ SATISFIED | Candidate leg (`fillMultipleTextQuestion` + verbatim marker-token round-trip) closes the one leg RESEARCH flagged as unbuilt (voter leg landed in 129-08). Confirmed live-green. |
| EFLOW-02 | 130-04 | Alliance card + member-orgs drawer | ✓ SATISFIED | `voter-alliance.spec.ts` — read in full, confirmed live-green. |

No orphaned requirements: REQUIREMENTS.md's Phase 130 mapping (EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02) exactly matches the union of `requirements:` fields declared across all 6 plans, and all 4 are marked `[x]` Complete with no other IDs mapped to Phase 130.

### Required Artifacts

| Artifact | Expected | Status | Details |
|---|---|---|---|
| `tests/tests/fixtures/voter/voter-journey.fixture.ts` — `answerNumberScale` | Value-parametrized slider driver | ✓ VERIFIED | Exported (line 527), implementation at line 498 matches the Home+N×ArrowRight contract described in the plan. |
| `tests/tests/fixtures/voter/entityDetails.fixture.ts` — extended `expectQuestionDisplay` + `expectNumberQuestionDisplay` | Checkbox multi-choice counting + number dual-marker display | ✓ VERIFIED | Read lines 120-248 — real implementation (marker-position math via `left:%` offset regex), not a stub. Code review (130-REVIEW.md WR-03/WR-05) flags minor robustness gaps in this code but confirms it is functional, not broken. |
| `tests/tests/specs/_probes/numberScale.probe.spec.ts` | @probe smoke, 2 tests | ✓ VERIFIED | 145 lines read in full; `--list` confirms both tests registered under `_probes` project; excluded from default suite via `--grep-invert @probe` (confirmed in `package.json`). |
| `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` — `fillMultipleTextQuestion` | Row-list fill helper | ✓ VERIFIED | Read lines 214-229 — real implementation using testId constants only. |
| `tests/tests/utils/candidateJourneyConstants.ts` — `MULTIPLE_TEXT_ANSWERS` | 2 distinct ASCII marker values | ✓ VERIFIED | `['[MULTITEXT-1] First list value.', '[MULTITEXT-2] Second list value.']` confirmed at lines 101-104. |
| `tests/tests/specs/candidate/candidate-journey.spec.ts` — steps 13/21 (multipleText) + 18.5/18.6 (type-specific opinions) | Fill + round-trip + type-specific contracts | ✓ VERIFIED | All 4 additions read directly and confirmed. |
| `tests/tests/specs/voter/voter-journey.spec.ts` — 100%-first-card + drawer displays + EQTYP-02 describe | Matching-incorporation + drawer depth + boundary test | ✓ VERIFIED | All read directly; EQTYP-02 describe confirmed executing in the live run. |
| `tests/tests/specs/voter/voter-alliance.spec.ts` | New leaf spec, 5 semantic steps | ✓ VERIFIED | 140 lines read in full; project wired and green live. |
| `tests/tests/specs/voter/voter-nominations.spec.ts` | New leaf spec | ✓ VERIFIED | 50 lines read in full; project wired and green live. |
| `tests/playwright.config.ts` — `voter-alliance`/`voter-nominations`/`_probes` numberScale wiring | Project entries | ✓ VERIFIED | Confirmed via `--list` for all three. |

### Key Link Verification

| From | To | Via | Status | Details |
|---|---|---|---|---|
| `voter-journey.spec.ts` (EQTYP-02 boundary) | `voter-journey.fixture.ts` | imports `answerNumberScale`, `walkUntilQuestionsIntro`, `answerAndAdvanceToResults` | ✓ WIRED | Confirmed via grep + live execution. |
| `voter-journey.spec.ts` (drawer displays) | `entityDetails.fixture.ts` | `expectQuestionDisplay` / `expectNumberQuestionDisplay` | ✓ WIRED | Confirmed via grep + live execution. |
| `candidate-journey.spec.ts` | `candidateProfilePage.fixture.ts` | `fillMultipleTextQuestion` | ✓ WIRED | Confirmed via grep + live execution. |
| `tests/playwright.config.ts` | `voter-alliance.spec.ts` / `voter-nominations.spec.ts` / `numberScale.probe.spec.ts` | exact/regex `testMatch` | ✓ WIRED | Confirmed via `--list`. |
| `yarn test:e2e` (root script) | `tests/playwright.config.ts` | `--grep-invert @probe` | ✓ WIRED | Confirmed in `package.json`; probe excluded from default suite, confirmed absent from the 128-test live run inventory. |

### Behavioral Spot-Checks (live, independently executed)

| Behavior | Command | Result | Status |
|---|---|---|---|
| Full E2E suite, fresh server + clean DB | `yarn db:reset && yarn dev (fresh) && yarn test:e2e` | 128 passed, 0 failed, 0 did-not-run, exit 0, 10.9m | ✓ PASS |
| `voter-alliance` project executes (not silently skipped) | live run reporter output | `[20/128] [voter-alliance] › ...` executed | ✓ PASS |
| `voter-nominations` project executes | live run reporter output | `[21/128] [voter-nominations] › ...` executed | ✓ PASS |
| `EQTYP-02: number-scale boundary matching` executes | live run reporter output | `[22/128] [voter-journey] › ... EQTYP-02: number-scale boundary matching ...` executed | ✓ PASS |
| `candidate-journey` (incl. steps 18.5/18.6, multipleText round-trip) executes | live run reporter output | `[23/128] [candidate-journey] › full candidate journey end-to-end @candidate` executed | ✓ PASS |
| `yarn typecheck:tests` | `yarn typecheck:tests` | exit 0 | ✓ PASS |
| `_probes` project lists both numberScale tests | `npx playwright test --project=_probes --list` | 2 tests listed | ✓ PASS |

### Backstop Truths (PLAN frontmatter `verification: backstop`)

Three truths in 130-02/130-03 were marked `verification: backstop`. Per the honest-verifier rule these abstain unless confirmed by explicit evidence; all three have direct, executed evidence (not just presence) and are marked VERIFIED, not routed to human_needed:

| Truth | Evidence |
|---|---|
| Unfilled multipleText (required:false) does not block profile submission | `candidate-journey.spec.ts` steps 13/14 gate choreography, confirmed unchanged and green in the live 128/0/0 run (candidate-journey test passed). |
| MultipleText round-trip introduces no value transformation | Verbatim `[MULTITEXT-1]`/`[MULTITEXT-2]` marker-token regex assertions in step 21 — read directly, confirmed passing live. |
| Number-scale mid-value matching produces scores strictly between the extremes (no precision/rounding flip) | `EQTYP-02: number-scale boundary matching` explicitly asserts `minScoreAfter < minScoreBefore`, `maxScoreAfter > maxScoreBefore`, `minScoreAfter > maxScoreAfter` — read directly, confirmed passing live. |

### Prohibitions (PLAN frontmatter `must_haves.prohibitions`, descriptor-less / no `verification` tier set)

Every plan carries the same 3-item prohibition set (no missing testMatch, no weakened green signal, no product/seed edits). All checked against the actual repository state, not assumed:

| Prohibition | Disposition | Evidence |
|---|---|---|
| MUST NOT add a spec/probe without matching Playwright project testMatch | ✓ Not violated | `--list` confirms voter-alliance, voter-nominations, and numberScale probe all registered; live run confirms execution (no did-not-run). |
| MUST NOT weaken the green signal (soft assertions, skip/flaky, retries-until-green, re-baselining) | ✓ Not violated | `grep -c "expect\.soft"` on new spec files returns only doc-comment mentions, zero actual soft assertions; no `.skip(`/`.only(`/`test.fixme` found; 130-06's run-1 red was root-caused and fixed, then the 3-run count was explicitly restarted (correct discipline, not a retry-until-green). |
| MUST NOT modify product code or seed data | ✓ Not violated | `git log --name-only` across every Phase 130 commit (`bb6992b15^..8c71f8a38`) shows zero touches to `apps/frontend/src`, `packages/dev-seed/src`, or `apps/supabase`. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|---|---|---|---|---|
| `tests/playwright.config.ts` (`data-setup-perm-1e1cg1co` dependencies) | ~416 | Two new base-only leaf projects (`voter-alliance`, `voter-nominations`) are not added to the perm-preclear's dependency gate, so the destructive `test-` prefix teardown that runs after `voter-journey`/`candidate-journey` has no declared serialization edge against the new leaves — a latent race (flagged by 130-REVIEW.md as WR-01, "empirically masked by scheduling/timing"). | ⚠️ WARNING (non-blocking) | Not a proven failure — the phase's own 3× gate (130-06) plus my independent 4th live run all passed 128/0/0 with no evidence of this race manifesting. But it is a real, unaddressed structural risk to future determinism that was surfaced by the phase's own code review and left unfixed. No debt-marker comment (TBD/FIXME/XXX) references it, so it does not trip the debt-marker gate, but it should not be silently dropped. |
| — | — | TBD/FIXME/XXX debt markers | none found | `grep -n "TBD\|FIXME\|XXX"` across all Phase 130 spec/fixture files returns zero hits. |
| — | — | Soft assertions / skip / flaky annotations in new spec files | none found | Confirmed via grep (see Prohibitions table above). |

**Recommendation:** Route WR-01 to Phase 131 (HARDN-01 flake/race triage — the phase explicitly scoped to triage exactly this class of risk) rather than reopening Phase 130. This does not block Phase 130 completion: the goal ("new features covered by E2E, fixtures-first, 3× deterministic") is achieved and independently re-verified; WR-01 is a robustness recommendation for a downstream phase, not a failed must-have.

### Deferred Items (documented, not phase gaps)

Per the verification context, these two pre-existing product bugs were discovered during Phase 130 execution and are explicitly out of scope for this specs-only phase. Verified here only that they are **documented**, not that they are fixed:

| Item | Documented in | Disposition |
|---|---|---|
| BLOCKER-130-05: multi-choice helper text renders raw i18n key `questions.multiChoice.selectRange` at runtime (Paraglide `messages/` catalog missing the key added to type-gen `translations/` in 129-06) | `deferred-items.md` D1, `STATE.md:548`, inline comment at `candidate-journey.spec.ts:780-791` | ✓ Documented — test asserts helper VISIBILITY only, deliberately withholds the `/2.*3/` content assertion rather than locking in the bug. |
| Boolean falsy-guard: `getSavedAnswer` (`candidate/(protected)/questions/+page.svelte:58`) discards a saved boolean `false` as unanswered | `deferred-items.md` D2, `STATE.md:548` | ✓ Documented — test selects the truthy "yes" choice to make the round-trip observable without depending on or patching the bug. |

### Human Verification Required

None. All must-haves resolved to VERIFIED via direct code inspection plus an independently-executed live full-suite run (not SUMMARY-trusted). No PRESENT_BEHAVIOR_UNVERIFIED truths — every behavior-dependent claim (matching-incorporation, boundary monotonicity, round-trip verbatim persistence, drawer click-through identity) was confirmed by a passing test I personally observed execute in a fresh, from-scratch run.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria and all 4 requirement IDs (EQTYP-01, EQTYP-02, EQTYP-03, EFLOW-02) are verified against the actual codebase and confirmed live via an independently-executed full E2E suite run (128 passed / 0 failed / 0 did-not-run), reproducing the shape documented in 130-06-SUMMARY.md's 3-run evidence table as a 4th independent green run. One non-blocking WARNING (WR-01, a latent data-setup race between the two new base-only leaf projects and the perm-family preclear) was surfaced by the phase's own code review and remains unaddressed; it has not manifested as a failure across 4 consecutive full-suite runs but is recommended for Phase 131's flake/race triage rather than reopening this phase.

---

_Verified: 2026-07-19T04:12:00Z_
_Verifier: Claude (gsd-verifier)_
