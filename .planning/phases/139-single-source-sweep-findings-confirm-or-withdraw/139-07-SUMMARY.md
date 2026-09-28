---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 07
subsystem: testing
tags: [assertion-audit, fake-guard-sweep, evidence-record, criterion-4-propagation, phase-close-gate, vitest]

# Dependency graph
requires:
  - phase: 139 (plan 06)
    provides: "139-VERDICTS.md § 4.2's roll-up (15 confirmed, withdrawn: none), § 4.1's ordering audit, § 7's scope limits and § 8's discarded material — the inputs § 6 reads rather than re-derives"
  - phase: 139 (plans 01-05)
    provides: "All fifteen § 5.N records, each with its executed injection, and the per-task HYGIENE-LOOP reverts § 9's gate re-checks whole"
provides:
  - "139-VERDICTS.md § 6 — the criterion-4 propagation record: the zero-withdrawal outcome as a positive statement, all THREE targets named with their current enumerations quoted verbatim, and the reconciliation grep pasted (§ 6.5)"
  - "139-VERDICTS.md § 6.3 — the answer, in the audit and in the record, to the prediction the audit's `## Not assessed` first bullet invited someone to check"
  - "139-VERDICTS.md § 9 — the phase-close gate: 113/113 tests green across seven vehicles, empty scoped porcelain, empty scoped diff, marker grep exit 1"
  - "ASSERT-01 recorded complete in REQUIREMENTS.md with an inline evidence clause in the file's own convention"
  - "The audit annotated in place: its `## Not assessed` bullet now carries the outcome of the test it invited"
affects: [phase-140-assert-03-sweep, phase-141-test-unit-wiring, phase-142-assert-07-redesign]

actuals:
  tokens: 7388
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "Zero-case propagation recorded as a positive statement — every target named, its current enumeration quoted verbatim, and the action recorded as 'inspected and deliberately left unchanged' rather than expressed as an absent edit"
    - "Empty-diff-as-evidence, made meaningful by pairing it with the recorded inspection that produced it — on its own an empty diff is indistinguishable from a file nobody opened"
    - "In-place answer to a document's own staked prediction — the audit bullet that invited a check now carries the check's outcome, with the original wording untouched"
    - "Non-vacuous negative gate — `test -d` guard pasted alongside the marker grep and its exit status, so a mistyped pathspec cannot masquerade as a clean tree"

key-files:
  created:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-07-SUMMARY.md
  modified:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md
    - .planning/audits/2026-08-11-fake-guard-sweep.md
    - .planning/REQUIREMENTS.md

key-decisions:
  - "ASSERT-01's traceability status set to `Complete` rather than `Satisfied` — both values exist in the table, `Complete` is the majority value (3 vs 2) and is the one used by the Phase-138 rows that also carry inline evidence clauses, which is the convention this row now matches"
  - "The three record corrections K-1..K-3 were NOT propagated into the audit's prose. Criterion 4 forces an in-place audit edit only for a WITHDRAWAL; editing a confirmed finding's entry would overwrite the evidence that the re-read produced information"
  - "The six unenumerated F19-class sites (§ 8.1 C-2/C-4) were not added to ASSERT-07. Criterion 4 is a shrink mechanism; this phase does not use it to widen scope on the strength of sites it never verdicted — they are proposed to Phase 140 instead"
  - "Vehicle 7's per-file summary lines are quoted from a second confirming invocation, with a note that vitest's completion order and per-file timings vary run to run and only the counts are invariant — rather than silently stitching two runs' output into one block"
  - "`.planning/ROADMAP.md` received zero content edits from this plan's tasks (the propagation targets were inspected and unchanged); its only change is the mechanical plan-progress update at phase close"

patterns-established:
  - "A propagation target list is verified against the live document, not against the criterion's wording — criterion 4 names two documents and there are three, and the third's enumeration is invisible to a `grep ASSERT-07` because it names findings rather than the requirement id"
  - "Every hygiene gate run from the repo root as its own command — a compound `cd pkg && …` makes `git status --porcelain -- apps tests packages` match nothing and short-circuit into a false pass"
  - "A grep used as a negative gate records its exit status (1 = pass) and is preceded by a pasted `test -d` guard"

requirements-completed: [ASSERT-01]

coverage:
  - id: D1
    description: "The zero-withdrawal outcome is recorded as a positive statement across all three criterion-4 targets — counts, an explicit `Withdrawn: none.`, each target named by path with its current enumeration quoted verbatim, and the action recorded as a deliberate non-edit"
    requirement: "ASSERT-01"
    verification:
      - kind: other
        ref: "grep -q '^## 6\\. Withdrawals and their propagation' 139-VERDICTS.md && ! grep -q 'not yet written' 139-VERDICTS.md"
        status: pass
      - kind: other
        ref: "§ 6 names all three paths — fake-guard-sweep.md, REQUIREMENTS.md, ROADMAP.md — all three greps pass"
        status: pass
      - kind: other
        ref: "REQUIREMENTS.md:60 and ROADMAP Phase 142 criteria 2/3 byte-identical to pre-task state: `git diff --stat -- .planning/ROADMAP.md` empty; REQUIREMENTS diff touches only :54 and :143"
        status: pass
    human_judgment: true
    rationale: "Whether a later reader can tell the propagation was checked-and-found-unnecessary rather than forgotten is a judgment about the prose, not a property a grep asserts."
  - id: D2
    description: "The audit answers, in place, the prediction its own `## Not assessed` first bullet invited someone to check — without deleting or rewriting any original text"
    requirement: "ASSERT-01"
    verification:
      - kind: other
        ref: "grep -cE '^### F1[5-9] |^### F20 ' fake-guard-sweep.md == 6 (no entry deleted)"
        status: pass
      - kind: other
        ref: "git diff -- fake-guard-sweep.md == 8 insertions, 0 deletions, all inside the `## Not assessed` bullet"
        status: pass
    human_judgment: false
  - id: D3
    description: "ASSERT-01 is recorded complete in REQUIREMENTS.md in the file's own convention — `- [x]` plus an inline `— Evidence: <artifact> § <section> (<specific observation>)` clause citing 139-VERDICTS.md § 4 and the verdict counts"
    requirement: "ASSERT-01"
    verification:
      - kind: other
        ref: "grep -q '\\*\\*ASSERT-01\\*\\*' && grep -q '139-VERDICTS.md' .planning/REQUIREMENTS.md"
        status: pass
      - kind: other
        ref: "traceability row :143 reads `Complete`, matching the value used by the other completed rows"
        status: pass
    human_judgment: false
  - id: D4
    description: "The corpus is restored: all seven vehicles at their pre-phase baselines (113 total), zero source diff, zero surviving phase markers — proven across all seven rather than trusted from the per-task gates"
    requirement: "ASSERT-01"
    verification:
      - kind: other
        ref: "7 + 11 + 3 + 5 + 34 + 1 + 52 = 113 passed, 0 failed, 0 skipped — each command run from the repo root"
        status: pass
      - kind: other
        ref: "git status --porcelain -- apps tests packages (empty) && git diff --stat -- apps packages tests (empty)"
        status: pass
      - kind: other
        ref: "test -d apps -a -d packages -a -d tests && ! grep -rn 'INJECTED (139)' apps packages tests (exit 1 = no match = pass)"
        status: pass
    human_judgment: false

# Metrics
duration: 12min
completed: 2026-08-14
status: complete
---

# Phase 139 Plan 07: Criterion 4 — propagation, the audit's answered prediction, and the phase-close gate Summary

**The zero-withdrawal outcome is now a statement rather than an absence: § 6 names all three criterion-4 targets, quotes each one's current enumeration verbatim and records it as inspected-and-deliberately-unchanged; the audit's `## Not assessed` bullet carries the outcome of the very prediction it invited someone to check; and § 9 proves the tree byte-identical to the one the phase started with — 113/113 tests across seven vehicles, empty scoped porcelain, empty scoped diff, marker grep exit 1.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~12 min |
| Tasks | 3/3 |
| Commits | 3 (plus this metadata commit) |
| Files modified | 3 planning documents (0 source files) |
| Tests run | 113 across 7 vehicles — 113 passed, 0 failed, 0 skipped |
| Source-tree delta | **zero** — scoped porcelain and scoped diff both empty |

## Accomplishments

**§ 6 — the propagation record, written for the zero case.** § 4.2's roll-up (15 confirmed, 0 withdrawn) is read rather than re-derived, then stated three ways: as counts, as an explicit `Withdrawn: none.` line, and as the fifteen confirmed ids in enumeration order. § 6.2 carries a four-column table of the three propagation targets — the audit, `REQUIREMENTS.md:60`, and ROADMAP Phase 142 criteria 2 and 3 — each with the edit shape a withdrawal would have taken, the current enumeration quoted verbatim, and the action actually taken (inspected; unchanged).

**The third target was confirmed live, not assumed.** The plan warned that criterion 4's wording names two documents while three exist. Verified against the live ROADMAP at `:421-422`: criterion 2 names F15 and its three sub-sites in prose; criterion 3 names F16, F17, F18 and "each of the six F20 sites". Both were compared to the withdrawal set by hand — the count **six** still matches the surviving F20 set exactly — and left unedited. § 6.5 records that a `grep ASSERT-07` does **not** surface either criterion (they name findings, not the requirement id), which is precisely why the third target is easy to miss.

**§ 6.3 — the audit's own prediction, answered in both places.** The `## Not assessed` first bullet is quoted verbatim and answered: the prediction held for all of F15, F16, F18, F19 and the F20 table. Two of its *descriptions* were corrected without changing a verdict (K-1, K-2), and both corrections strengthen the auditor's stated ground — his reason was F15's mock-in/mock-out shape, and K-1 finds the three sites he mis-described are the purest instance of exactly that shape. The bullet's two cited grounds are then stated precisely rather than generously: three of the four independently-verified findings were **not** re-examined here, and `condenserIntegration.test.ts` — the file whose header he read independently — is **not in this corpus**, so this pass neither confirms nor denies that read. The audit itself now carries a closing sentence recording the outcome, with its original wording untouched.

**§ 6.4 — three near-boundary items named so their silence is not read as oversight.** F17 (in ASSERT-07, outside criterion 1 under D-06 — criterion 1's coverage tally is fourteen, not fifteen); the `getIdTokenClaims` coverage gap (a missing test, not a fake one — outside ASSERT-07 in both directions); and the six unenumerated F19-class sites (no verdict here, proposed to Phase 140 rather than added to ASSERT-07, because criterion 4 shrinks scope and must not be used to widen it). The incidental live OIDC 400/500 defect is restated with its consequence for Phase 142 and explicitly **not fixed** — this phase ships zero product code.

**ASSERT-01 completed for real.** `REQUIREMENTS.md:54` ticked with an inline evidence clause in the INTEG-row convention; `:143`'s running `Pending (15 of 15 findings verdicted …)` note advanced to `Complete`, the majority value used by the table's other finished rows.

**§ 9 — the gate run, not asserted.** All seven vehicle commands executed from the repo root, each returning its exact baseline (7, 11, 3, 5, 34, 1, 52 = **113**). § 9.2 records why `yarn test:unit` is deliberately not the gate — turbo cannot reach `question-info` or `argument-condensation` (D-05), so the shorter command would skip four of the fifteen sites (26 tests) while reporting green — with an explicit instruction not to "improve" the gate until Phase 141 lands. § 9.3 pastes the scoped porcelain (empty), the scoped diff (empty), the `test -d` guard and the marker grep with its exit status of 1, plus the bare porcelain as non-gate context.

## Task Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | § 6 Withdrawals and their propagation, and the audit record | `6c6707592` | `139-VERDICTS.md`, `.planning/audits/2026-08-11-fake-guard-sweep.md` |
| 2 | Propagate to REQUIREMENTS.md and ROADMAP.md | `74a29621a` | `.planning/REQUIREMENTS.md`, `139-VERDICTS.md` (§ 6.5) |
| 3 | The phase-close gate — 113 tests green, zero source diff, zero markers | `aae1b5efa` | `139-VERDICTS.md` (§ 9) |

## Files Created/Modified

- `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md` — § 6 written (6.1-6.5, replacing plan 06's reservation), § 9 appended. +403 / −7 lines.
- `.planning/audits/2026-08-11-fake-guard-sweep.md` — +8 / −0, entirely inside the `## Not assessed` first bullet. No finding entry touched.
- `.planning/REQUIREMENTS.md` — +2 / −2: ASSERT-01's checkbox and evidence clause at `:54`, traceability status at `:143`.
- `.planning/ROADMAP.md` — **no content edit** from the plan's tasks; only the mechanical plan-progress update at phase close.

## Decisions Made

1. **`Complete`, not `Satisfied`, for ASSERT-01's traceability status.** The table carries both (3× `Complete`, 2× `Satisfied` + 1 qualified). `Complete` is the majority value and belongs to the Phase-138 rows that also carry inline evidence clauses — the convention this row now joins. Recorded because the plan explicitly said to match an existing value rather than invent one, and the file offered two.
2. **K-1..K-3 not propagated into the audit's prose.** Criterion 4 forces an in-place audit edit only on a withdrawal. Editing a *confirmed* finding's entry would overwrite the evidence that the re-read produced information and leave a corrected document indistinguishable from one that was right the first time (§ 8.5's standing rule). The corrections stay in § 5.1.1 and § 8.5, where § 4.3 directs Phase 142 to read them.
3. **The six unenumerated F19-class sites were not added to ASSERT-07.** Criterion 4 is a shrink mechanism; using it to widen scope on sites this pass never verdicted would put unverified work into Phase 140's requirement. They are recorded as a proposal in § 6.4 and § 7 limit 6 instead.
4. **Vehicle 7's per-file lines quoted from a second confirming invocation, with the variance stated.** vitest prints per-file lines in completion order with per-run timings; stitching the first run's tail into one block would have produced a "verbatim" quote that no single run ever emitted. The counts (13+10+5+9+8+7 = 52) are the invariant and are labelled as such.

## Deviations from Plan

**None affecting scope or outcome.** Two clarifications worth recording:

- **Task 1's `not yet written` gate was already satisfied on entry.** Plan 06 had converted § 6's placeholder into an explicit reservation naming plan 07 as owner, so the phrase was absent before this plan ran. The reservation paragraph was replaced wholesale by § 6's content; the gate is still meaningful as a post-condition.
- **Task 2's Parts B and C were correctly no-ops.** Both are conditional on a non-empty withdrawal set. With `withdrawn: none` the correct action is inspection without edit — which is why the plan required the *inspection* to be recorded (§ 6.2, § 6.5) rather than inferred from an empty diff.

### Auto-fixed Issues

None. No bug, missing critical functionality or blocking issue was encountered; this plan modified no code.

## Issues Encountered

None. All twelve automated verification gates across the three tasks passed on first run, and all seven vehicle commands returned their exact baselines on first invocation.

## Known Stubs

None. This plan created no placeholder, no TODO and no unwired path. `139-VERDICTS.md` now carries no `not yet written` / `not yet run` placeholder anywhere in its 5309 lines, and all nine sections (§§ 1-9) are written.

## Critical safety invariant — held

This plan ships **zero product code**, and the phase's other deliverable — a source tree byte-identical to the one it started with — is proven rather than assumed:

```
$ git status --porcelain -- apps tests packages     → (no output)
$ git diff --stat -- apps packages tests            → (no output)
$ test -d apps -a -d packages -a -d tests           → present
$ grep -rn 'INJECTED (139)' apps packages tests     → (no output), exit 1
$ 7 vehicles                                        → 113 passed / 0 failed / 0 skipped
```

Every gate was run from the repo root as its own command, so no `cd` into a package could make the `-- apps tests packages` pathspec vacuous. The two pre-existing dirty session files (`.vscode/settings.json`, `supabase/.temp/cli-latest`) were dirty before the phase began and were neither committed nor reverted. No `yarn dev`, `yarn test:e2e` or Playwright command was run at any point in Phase 139.

## Next Phase Readiness

**Phase 139 is complete.** All seven plans executed; ASSERT-01 is met and recorded with evidence.

What downstream phases inherit:

- **Phase 142 (ASSERT-07)** — scope is **unchanged**: F15, F16, F17, F18, F20, all confirmed, criteria 2 and 3 intact. Its input for each finding is the § 5.N.2 / § 5.N.6 pair (§ 4.3). Four records qualify which diff to re-apply (F15-A, F16, F19c, F20-1), and § 8.3 names ten designs that must **not** be used as negative controls. One live-defect warning: tightening `authorize-endpoint.test.ts:233` to `{ status: 400 }` will go red against the clean tree until the OIDC handler's swallowed 400 is fixed.
- **Phase 140 (ASSERT-03)** — a candidate scope addition it may accept or decline: the six further `!`-on-a-`null`-returning-`.get()` sites recorded in § 8.1 C-2 and C-4, outside the audit's enumeration and carrying no verdict.
- **Phase 141 (UNIT-01..04)** — § 9.2 records exactly why `yarn test:unit` cannot yet serve as this corpus's gate, and which four vehicles it misses.
- **A future coverage phase** — `getIdTokenClaims.test.ts` has no negative test for a bad signature, wrong `issuer` or wrong `audience` (§ 7 limit 6). A missing test, not a fake one.

## Self-Check: PASSED

All four claimed files exist on disk (`139-07-SUMMARY.md`, `139-VERDICTS.md`, `2026-08-11-fake-guard-sweep.md`, `REQUIREMENTS.md`) and all three task commits are present in `git log` (`6c6707592`, `74a29621a`, `aae1b5efa`). No missing items.
