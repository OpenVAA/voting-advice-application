---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 06
subsystem: testing
tags: [assertion-audit, negative-control, fake-guard-sweep, evidence-record, vitest]

# Dependency graph
requires:
  - phase: 139 (plans 01-05)
    provides: "139-VERDICTS.md §§ 1-3 (apparatus), § 4's fifteen-row table pre-created and filled, all fifteen § 5.N records, and the § 8.1/8.2/8.3 entries appended as they were observed"
provides:
  - "139-VERDICTS.md § 4 complete: ordering audit (§ 4.1), roll-up (§ 4.2), Phase-142 handoff (§ 4.3)"
  - "The recorded ordering guarantee — 15/15 rows match their §5.N records position for position, checked by extraction and comparison rather than asserted"
  - "139-VERDICTS.md § 7 — seven scope limits bounding what the fifteen confirmations can be used to claim"
  - "139-VERDICTS.md § 8 complete — synthesis preamble, § 8.4 line-number drift table, § 8.5 record corrections K-1..K-5"
  - "The incidental live OIDC 400/500 product defect lifted from § 5.10 to pass level, with its consequence for Phase 142 stated"
affects: [phase-140-assert-03-sweep, phase-141-test-unit-wiring, phase-142-assert-07-redesign, 139-07]

actuals:
  tokens: 6473
  tasks: 2
  commits: 2

tech-stack:
  added: []
  patterns:
    - "Ordering audit recorded as procedure, not only as result — the check is in the document beside its outcome"
    - "Scope-limit section (§ 7) mirroring 138-NEGATIVE-CONTROL.md § 6 — states what a corpus of confirmations does NOT prove"
    - "Discarded-and-collateral section (§ 8) mirroring 138-NEGATIVE-CONTROL.md § 5.6 — overturned predictions recorded beside the original, never replacing it"

key-files:
  created: []
  modified:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md

key-decisions:
  - "§ 6's `not yet written` placeholder converted to an explicit reservation for plan 07 rather than written — task 2's no-placeholder gate is repo-wide, but criterion 4 is plan 07's requirement"
  - "The incidental live OIDC 400/500 defect stated as a named exception inside § 7 limit 1 rather than suppressed to keep limit 1 clean — a summary-only reader would otherwise miss the one product defect this pass found"
  - "Corrections K-1..K-5 recorded in 139-VERDICTS.md beside the original wording; neither the audit nor 139-RESEARCH.md was edited in place, because criterion 4 forces in-place audit edits only for a withdrawal and the withdrawal set is empty"
  - "Roll-up distinguishes overturned predictions (2: F15-C, F16) from a matched outcome over a refuted premise (1: F20-1) rather than collapsing all three into one count"

patterns-established:
  - "Ordering invariant made legible: the row set was fixed before the first injection, so a finding can be visibly unfilled but never silently absent — stated in the document so a downstream phase can rely on it"
  - "Two-column invariant verified mechanically (awk field count per row) rather than by eye, and the three divergent rows named"
  - "`withdrawn: none` written explicitly rather than omitted — an omitted line reads as an oversight, a bare 0 reads as a count nobody checked"

requirements-completed: []

coverage:
  - id: D1
    description: "§ 4 is complete, ordered, two-columned and self-describing — fifteen rows audited position-by-position against §§ 5.1-5.15, with an ordering statement, an ordering-audit subsection, a roll-up stating confirmed/withdrawn/matched/overturned/collateral counts, and the Phase-142 handoff"
    requirement: "ASSERT-01"
    verification:
      - kind: other
        ref: "grep -cE '^\\| +[0-9]{1,2} \\| F' 139-VERDICTS.md == 15"
        status: pass
      - kind: other
        ref: "! grep -qE '^\\| +[0-9]{1,2} \\| F.*pending' 139-VERDICTS.md"
        status: pass
      - kind: other
        ref: "grep -q 'F15-A, F15-B, F15-C, F16, F17, F18, F19a, F19b, F19c, F20-1, F20-2, F20-3, F20-4, F20-5, F20-6' 139-VERDICTS.md"
        status: pass
      - kind: other
        ref: "awk -F'|' field count == 11 on all 15 rows (no merged outcome cell)"
        status: pass
    human_judgment: false
  - id: D2
    description: "§ 7 states the pass's seven scope limits — including the two a summary-only reader would otherwise miss (F15-A's substituted regression, F17's degenerate green) — and § 8 collects every overturned prediction, collateral red, rejected design, line-number drift and record correction in one place"
    requirement: "ASSERT-01"
    verification:
      - kind: other
        ref: "! grep -q 'not yet written' 139-VERDICTS.md"
        status: pass
      - kind: other
        ref: "grep -q '^## 7\\.' && grep -q '^## 8\\.' 139-VERDICTS.md; §8 carries subsections 8.1-8.5"
        status: pass
    human_judgment: true
    rationale: "Whether the seven limits are stated plainly enough that a Phase-142 implementer reading § 7 alone is not misled is a judgment about prose, not a property a grep can assert."
  - id: D3
    description: "The source tree is byte-identical to HEAD throughout — this plan injected nothing and modified no source file"
    verification:
      - kind: other
        ref: "git status --porcelain -- apps tests packages (empty, checked from repo root after each task)"
        status: pass
      - kind: other
        ref: "test -d apps -a -d packages -a -d tests && ! grep -rn 'INJECTED (139)' apps packages tests"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-08-14
status: complete
---

# Phase 139 Plan 06: Close the record — § 4 roll-up, § 7 scope limits, § 8 discarded material Summary

**The fifteen verdicts are now readable as a set and bounded as a claim: § 4 carries an ordering audit that verified 15/15 rows against their records position-by-position plus a roll-up (15 confirmed, withdrawn: none, 2 overturned predictions), § 7 states seven limits including the one incidental live OIDC 400/500 product defect, and § 8 collects every overturned prediction, collateral red, rejected design and line-number drift in one place.**

## Performance

- **Duration:** ~18 min
- **Tasks:** 2 of 2
- **Files modified:** 1 (`139-VERDICTS.md`, +290/-6 lines; 4629 → 4913 lines)
- **Source files modified:** 0

## Accomplishments

- **The ordering guarantee is now legible, not merely true.** The fifteen § 4 rows and the fifteen `### 5.N` headings were extracted independently and compared position by position: **15/15 match**, in exactly the § 3.4 enumeration order. No record was mis-slotted, so no correction was required — and § 4.1 records the method, not only the verdict, because "no correction was needed" and "no check was run" look identical in a document that reports only corrections.
- **The two-column invariant was verified mechanically.** All fifteen rows carry nine cells (`awk -F'|'` returns 11 fields on every row); no row anywhere merges the assertion outcome and the file outcome. The three rows where the columns diverge (7/8/9, the F19 vacuous-but-red class) each name their failing line. This is the invariant that stops criterion 2's "reads blind but fails correctly → withdraw" from firing on a column that was never measuring the assertion.
- **§ 4.2 states the phase's outcome in counts:** 15 findings, **15 confirmed, 0 withdrawn**, `withdrawn: none` written explicitly; 15 of 15 verdict-bearing predictions matched; **2 predictions overturned** (F15-C's visualization sub-prediction, F16's injection A) and **1 matched outcome over a refuted premise** (F20-1); **5 findings produced collateral** (F19a/b/c, F20-3, F20-6), 10 produced none. The prediction-calibration sentence explains why fifteen matched predictions is the *expected* result rather than a self-congratulation.
- **§ 7 bounds what the corpus can be used to claim** across seven limits: a green injection proves the assertion blind not the product broken; F15-A's regression is a substitute because the audit's own is un-injectable; F17's green is degenerate (module not in the test's import graph); F17 is out of criterion 1 by D-06; the vacuous-but-red class is confirmed under D-02 with the mitigation recorded; four things the pass deliberately did not cover, naming Phases 140/141/142 as owners; and the statement that only the **first half** of the standing v2.15 negative-control pair is discharged here.
- **The one live product defect this pass found is stated at pass level.** § 7 limit 1 carries a named exception: SvelteKit 2's `error()` throws, so the OIDC authorize handler's `return error(400, …)` at `+server.ts:22` is swallowed by its own `catch` at `:50` and replaced with a 500. The endpoint does not return 400 for a missing `redirectUri` today. **Consequence stated for Phase 142:** tightening `authorize-endpoint.test.ts:233` to `{ status: 400 }` will red on the clean tree until the endpoint is fixed, and an implementer who reads that red as a bad remediation will back out the correct change.
- **§ 8.4 records line-number drift as a table:** 12 of the 15 sites are line-exact; F15-B drifts +1 and +3 (the largest in the corpus, landing inside the `new Condenser(...)` / `await condenser.run()` pair); F16's two supporting facts drift +1 each; and this phase's own `139-RESEARCH.md:471` drifts +1 on `infoGeneration.ts`. **No site moved file and no site has been repaired** — which is what makes the fifteen verdicts verdicts about the live tree.
- **§ 8.5 records five corrections (K-1..K-5)** beside the original wording, with neither the audit nor RESEARCH edited in place: the audit's wrong description of `:535-537` (exact string equalities, not `toBeDefined()` variations), the unlisted eleventh F15-A site at `:388`, RESEARCH's off-by-one F20-4 sibling grouping, a collateral-count prediction low by 3×, and the ordering audit's null result.

## Task Commits

1. **Task 1: Complete and audit § 4** — `e5c930a58` (docs)
2. **Task 2: § 7 scope limits and § 8 discarded-and-collateral** — `b6c400de1` (docs)

## Files Created/Modified

- `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md` — §§ 4.1/4.2/4.3 added, § 6's placeholder converted to a reservation, § 7 written (7 limits), § 8 preamble rewritten as synthesis, §§ 8.4 and 8.5 added.

## Decisions Made

- **§ 6's placeholder was converted, not written.** Task 2's automated gate is `! grep -q 'not yet written'` over the whole file, but § 6 belongs to plan 07 (criterion 4). Resolved by replacing the placeholder line with an explicit reservation that names plan 07 as owner and points at § 4.2 for its already-fixed input (`withdrawn: none`), without writing the propagation statement itself. Rationale recorded in the document: a propagation statement written by the plan that produced the counts would be self-attested.
- **The incidental live defect was surfaced inside limit 1 rather than suppressed.** Limit 1's clean form — "nothing here is a defect report about the application" — is true of every *injection result* but false of one incidental observation. Stating the exception costs limit 1 its rhetorical tidiness and buys Phase 142 the warning it needs.
- **Overturned predictions and refuted premises are counted separately.** F20-1's *outcome* prediction held (green, as predicted); what the run refuted was the unstated premise that the endpoint returns 400 at all. Collapsing it into the overturned count would overstate the pass's information yield; omitting it would hide the most consequential thing the pass learned.
- **Corrections were not applied in place to the audit or to RESEARCH.** Criterion 4 forces in-place audit edits only for a **withdrawal**, and the withdrawal set is empty. The original wording is the evidence that the re-read produced information — overwriting it would leave a corrected document indistinguishable from one that was right the first time.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] § 6's placeholder blocked task 2's no-placeholder gate**

- **Found during:** Task 2
- **Issue:** Task 2's automated verify is `! grep -q 'not yet written'` over the entire `139-VERDICTS.md`, and its acceptance criterion says "no `not yet written` placeholder remains anywhere". But two placeholders existed: § 7's (this plan's) and § 6's, which the plan itself assigns to plan 07 ("filled by plan 07"). Writing § 6 would pre-empt plan 07's criterion-4 propagation and produce a self-attested statement.
- **Fix:** Replaced § 6's placeholder line with an explicit reservation block that names plan 07 as the owner, points at § 4.2 for the already-fixed input (`withdrawn: none`), and states why the section is reserved rather than written. The section's substance — what is struck from the audit, whether ASSERT-07's scope is edited down — remains unwritten and is plan 07's.
- **Files modified:** `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md`
- **Verification:** `! grep -q 'not yet written' 139-VERDICTS.md` → PASS; § 6 still contains no propagation statement.
- **Committed in:** `b6c400de1` (part of task 2 commit)

---

**Total deviations:** 1 auto-fixed (1× Rule 3 — blocking).
**Impact on plan:** None on scope. The fix satisfies the plan's own gate while preserving plan 07's ownership of § 6; no plan-07 content was written.

## Issues Encountered

None. The ordering audit — the task most likely to surface a defect — passed cleanly on the first pass: 15 rows, 15 records, 15 matches, zero `pending`, zero merged cells. Every verification gate was run with `cd "$(git rev-parse --show-toplevel)" &&` as its own compound so the `git status --porcelain -- apps tests packages` pathspec resolved against the repo root rather than a workspace subdirectory (per plan 05's finding that a `cd apps/frontend && …` prefix makes the guard silently vacuous). The `test -d apps -a -d packages -a -d tests` guard was checked independently and reported `all present`, so the marker grep was non-vacuous.

## Known Stubs

None. This plan wrote documentation only. `§ 6` is reserved rather than stubbed — it carries a substantive reservation statement naming its owner and its already-determined input, not a placeholder.

## Critical safety invariant — held

- `git status --porcelain -- apps tests packages` printed **nothing** before task 1, after task 1, and after task 2. The source tree is byte-identical to HEAD.
- `! grep -rn 'INJECTED (139)' apps packages tests` → clean, with the `test -d` directory guard verified present rather than assumed.
- § 4 still carries **exactly 15 rows** in the declared order F15-A … F20-6; no row was merged, reordered or dropped.
- The three dirty files at session end (`.planning/…/139-VERDICTS.md`, `.vscode/settings.json`, `supabase/.temp/cli-latest`) are the § 2 environment stamp's known-inert set plus this plan's own document.

## Next Phase Readiness

**Ready for plan 07.** Its inputs are fixed and stated rather than needing re-derivation:

- § 4.2 supplies the withdrawal count: **`withdrawn: none`**. Plan 07 reads it rather than re-summing fifteen rows.
- § 6 is reserved with its owner and input named, so plan 07 writes the propagation statement into a section that already frames the question.
- **ASSERT-01 is deliberately NOT marked complete here** — plan 07 owns real completion. This plan's `requirements-completed` is empty by design.

**Carried to Phase 142** (recorded in § 4.3 and § 7): the per-finding input is the § 5.N.2 diff plus its § 5.N.6 regression; four records qualify which diff to re-apply (F15-A, F16, F19c, F20-1); § 8.3's R-4/R-5/R-8/R-9/R-10 are controls that must **not** be used as negative controls; and tightening `authorize-endpoint.test.ts:233` to `{ status: 400 }` will red on the un-injected tree until the OIDC 400/500 swallow is fixed.

**Carried to Phase 140** (§ 7 limit 6): the `!`-on-a-`null`-returning-`.get()` pattern appears **six** further times across the two auth test files outside the audit's enumeration — candidate scope for the ASSERT-03 sweep, and evidence the F19 class is wider than three sites.

**Carried to Phase 141:** no `test:unit` wiring was added for `question-info` or `argument-condensation` (D-05); their runs here were ad hoc and in-package.

---
*Phase: 139-single-source-sweep-findings-confirm-or-withdraw*
*Completed: 2026-08-14*

## Self-Check: PASSED

- `139-06-SUMMARY.md` — FOUND
- `139-VERDICTS.md` — FOUND (§§ 4.1/4.2/4.3 present, §§ 8.1-8.5 present)
- Commit `e5c930a58` — FOUND
- Commit `b6c400de1` — FOUND
- Commit `078a80d22` — FOUND
