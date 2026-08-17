---
phase: 85-variant-project-cascade-rca-fix-investigate-and-close-the-47
plan: 01
subsystem: test-infra / playwright project-dependency cascade RCA
tags: [rca, determ-10, variant-cascade, single-source-verdict, path-b-decouple]
requires:
  - .planning/phases/84-imgproxy-decoupling-decouple-non-image-tests-from-imgproxy-i/post-fix/run-{1,2,3}.json (binding anchor at SHA 04ddfdd85cf…)
  - tests/playwright.config.ts:225-391 (variant linear chain)
  - tests/scripts/diff-playwright-reports.ts:253-301 (47-entry CASCADE_TESTS array)
  - 85-RESEARCH.md (H0 verdict source)
provides:
  - .planning/phases/85-…/85-RCA-FINDINGS.md (DETERM-10 close artifact)
  - .planning/phases/85-…/rca-capture/{chain-head-failure,h1-grep,cascade-classification}.txt
  - .planning/phases/85-…/rca-capture/dependency-dag.md
affects:
  - Plan 02 task structure (single fix plan; Path B 1-line decouple)
tech-stack:
  added: []
  patterns:
    - "Cascade-Root Isolation via run-N.json Walk (RESEARCH §Pattern 1)"
    - "Annotations-aware skipped-test partitioning"
key-files:
  created:
    - .planning/phases/85-…/85-RCA-FINDINGS.md
    - .planning/phases/85-…/rca-capture/chain-head-failure.txt
    - .planning/phases/85-…/rca-capture/h1-grep.txt
    - .planning/phases/85-…/rca-capture/cascade-classification.txt
    - .planning/phases/85-…/rca-capture/dependency-dag.md
  modified: []
decisions:
  - Path B (structural decoupling) recommended over Path A (coordinate-with-Phase-86) and Path C (DONE-AS-NOOP) — durable, independent of Phase 86 sequencing, D-08-compliant.
  - Plan 02 = single fix plan per CONTEXT.md D-02 (one shared root cause).
  - 3 PRODUCT-GAP source-skips DEFERRED to Phase 87 milestone-close hygiene (SOURCE_SKIP_TESTS partition).
metrics:
  duration_minutes: ~6
  completed: 2026-05-14
---

# Phase 85 Plan 01: DETERM-10 RCA Closure Summary

**One-liner:** Empirically proves the 47-entry CASCADE pool is **single-source**, rooted in the `voter-app-popups :: should remember dismissal after page reload` deterministic FAIL (3/3 across Phase 84 binding anchor); recommends Path B 1-line `playwright.config.ts:236` decouple for Plan 02.

## Headline Verdict

**H0 (chain-head deterministic FAIL) = CONFIRMED.** The 47-entry CASCADE pool tracked at `tests/scripts/diff-playwright-reports.ts:253-301` decomposes into:
- **3 SOURCE-SKIP** entries (candidate-app-settings PRODUCT-GAP `test.skip()`'s — out of Phase 85 scope per Pitfall 1).
- **44 CASCADE-SKIP** entries (variant linear chain + voter-app-popups dismissal-cascade companions + voter-app browser-back/CLEAN-02 entries — all transitively rooted in the chain-head FAIL via Playwright's strict project-dependency contract).

**H1 (yarn-arg-forwarding LANDMINE-9) = ARCHITECTURALLY DISPROVEN.** All 8 variant setup files import `runPipeline / Writer / runTeardown / fanOutLocales` from `@openvaa/dev-seed` directly via Node — they never invoke the dev-seed CLI. No shell process boundary exists where LANDMINE-9 yarn-arg-forwarding could apply.

**H2 (overlay-ordering races) + H3 (shared bootstrap state) = DEFERRED.** Untestable until the chain head is fixed; the variant setups never executed in the Phase 84 anchor, so internal hypothesis tests are unfounded. Re-instrument if Plan 02 surfaces new deterministic failures post-decouple.

## Artifacts Produced

| File | Size | Provides |
|------|------|----------|
| `85-RCA-FINDINGS.md` | ~6 KB | DETERM-10 verdict, hypothesis disposition, Path A/B/C analysis with Path B recommended, D-04 divergence acknowledgment |
| `rca-capture/chain-head-failure.txt` | ~3 KB | Empirical 3-run FAIL capture (Task 1) |
| `rca-capture/h1-grep.txt` | ~3 KB | H1 architectural disproof grep (Task 2) |
| `rca-capture/cascade-classification.txt` | ~7 KB | 47-entry source-skip vs cascade-skip partition (Task 3 Part A) |
| `rca-capture/dependency-dag.md` | ~5 KB | Variant linear-chain DAG with cascade propagation rule (Task 3 Part B) |

## Plan 02 Shape Decided

Per CONTEXT.md D-02 "If ONE shared root cause → single fix plan":

**Plan 02 (single fix plan, 5 tasks):**
1. Apply Path B 1-line decouple at `playwright.config.ts:236` (`['candidate-app-password', 'voter-app-popups']` → `['candidate-app-password']`) with extended comment block citing Phase 85 DETERM-11.
2. 1-run cold-start smoke (~54 min, background) — surface any post-decouple variant deterministic failures (route any to Phase 86 per D-08).
3. 3-run cold-start gate (~162 min, background) per Phase 79 D-13 canonical chain (D-07).
4. Atomic regen via Phase 79 archived `regen-constants.mjs` + `diff-playwright-reports.ts` jsdoc / CASCADE_TESTS update (D-05 + Phase 79 D-10).
5. SUMMARY.

**Total Phase 85 plan count = 2** (Plan 01 RCA + Plan 02 fix).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CONTEXT.md / RESEARCH.md "9 variant setup files" count was off by one (actually 8)**
- **Found during:** Task 2 (H1 disproof grep — `grep -nE "from ['"]@openvaa/dev-seed['"]" tests/tests/setup/variant-*.setup.ts` returned 8 lines, not 9).
- **Issue:** Plan 01 Task 2's `<verify>` gate hard-coded `≥ 9`. Empirically there are 8 `variant-*.setup.ts` files; the 9th item (`variant-results-sections`) is a spec-only project that re-uses the multi-election seed (per `tests/playwright.config.ts:249-254`, dep is `['variant-multi-election']` not a data-setup-results-sections).
- **Fix:** Adjusted the gate inline to `≥ 8` while still asserting the architectural disproof (zero hits on the negative grep across all 8). Folded the 8-vs-9 architecture note into `rca-capture/h1-grep.txt` + footnote at the bottom of `85-RCA-FINDINGS.md`. The substantive H1 disproof argument is unchanged across either count.
- **Files modified:** `rca-capture/h1-grep.txt`, `85-RCA-FINDINGS.md` (footnote section)
- **Commit:** 433079962

**Rationale for not asking (Rule-4 boundary check):** This is a documentation-count discrepancy, not an architectural change. The fix-plan (Path B decouple at line 236) is unaffected; only the variant-count phrasing in supporting docs is corrected. Rule 1 applies (documentation accuracy bug); Rule 4 (architectural change) does not.

### No Other Deviations

No checkpoints reached; no auth gates; no Rule-4 architectural escalations; no blocked tasks. Plan 01 was the literal artifact-inspection plan its RESEARCH predicted (~6 min wall time vs. the ≤15-min budget).

## Open Questions for Operator

1. **Path B vs Path A vs Path C selection** (Plan 02 territory) — planner may override the Path B recommendation if Phase 86 is imminent. Default per this RCA: Path B.
2. **3 PRODUCT-GAP source-skips fate** — recommend Phase 87 milestone-close hygiene to migrate them to a new `SOURCE_SKIP_TESTS` partition in `diff-playwright-reports.ts`; defer for now.
3. **Post-decouple variant verdicts** — unknown until Plan 02 Task 2's 1-run smoke. Any new deterministic failures route to Phase 86 DETERM-12/13/14 per D-08.

## WARNING 8 D-04 Divergence — Closed

CONTEXT.md D-04 originally specified: "research agent spawned by Plan 01's plan body." In practice, D-04 was satisfied UPSTREAM — the standard plan-phase workflow's research step produced `85-RESEARCH.md` before Plan 01 executed. Plan 01 synthesized the existing RESEARCH artifact into the canonical RCA artifact (`85-RCA-FINDINGS.md`) rather than spawning a fresh research-agent invocation. The substantive RCA scope, hypothesis catalog, verdict, and Plan 02 shape are unchanged; only the agent-invocation timing shifted by one workflow step. Recorded transparently in:
- `85-RCA-FINDINGS.md` §"Provenance + D-04 Divergence Note (WARNING 8)"
- Final commit message of `eb502aeb0`

## Commits

| # | Hash | Subject |
|---|------|---------|
| 1 | `887598131` | docs(85-01): capture chain-head deterministic FAIL — H0 empirical confirmation |
| 2 | `433079962` | docs(85-01): disprove H1 (yarn-arg-forwarding) architecturally via variant-setup grep |
| 3 | `070ceb778` | docs(85-01): partition 47 CASCADE_TESTS + capture variant chain DAG |
| 4 | `eb502aeb0` | docs(85-01): RCA verdict — variant cascade is single-source (chain head voter-app-popups) |

## Self-Check: PASSED

Verified 2026-05-14:
- All 6 artifacts on disk (`85-RCA-FINDINGS.md` + 4 `rca-capture/` files + `85-01-SUMMARY.md`).
- All 4 task commits in `git log --all` (`887598131`, `433079962`, `070ceb778`, `eb502aeb0`).
- Scope clean: zero modifications outside `.planning/phases/85-variant-project-cascade-rca-fix-investigate-and-close-the-47/` across all 4 commits.
- STATE.md / ROADMAP.md / REQUIREMENTS.md not touched (orchestrator owns those per execution-context).
