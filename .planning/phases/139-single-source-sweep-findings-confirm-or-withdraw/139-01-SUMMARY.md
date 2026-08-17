---
phase: 139-single-source-sweep-findings-confirm-or-withdraw
plan: 01
subsystem: testing
tags: [vitest, assertion-quality, negative-control, audit-verification, dev-seed, injection-testing]

# Dependency graph
requires:
  - phase: 138-def-135-04-eperm-07-root-cause-cardinal-rule-waiver-discharg
    provides: "138-NEGATIVE-CONTROL.md — the record shape, the scoped-porcelain hygiene gate, and the verbatim-failure-block convention this document copies rather than invents"
provides:
  - "139-VERDICTS.md — the phase evidence artifact: apparatus (SS 1-3), 15-row verdict summary table (S 4), fifteen per-finding record stubs (S 5), SS 6-8 placeholders"
  - "HYGIENE-LOOP — the five-step named injection procedure (pre-gate, inject, run, revert, post-gate) invoked by name in plans 02-05"
  - "TWO-COLUMN RULE — assertion outcome and file outcome recorded as separate observations; the verdict cites the assertion column"
  - "COLLATERAL RULE — only the fifteen enumerated sites are verdict evidence; every other red is collateral"
  - "THE 15-ROW ENUMERATION — fixed order F15-A..F20-6, greppable as one sentence, so a dropped finding is impossible"
  - "F20-4 verdict: confirmed, backed by an executed injection at supabaseAdminClient.ts:708"
  - "F18 verdict: confirmed, backed by two executed runs (isolated verdict + whole-file collateral) at candidates-override.ts:53"
affects: [139-02, 139-03, 139-04, 139-05, 139-06, 139-07, phase-140, phase-142, ASSERT-07-scope]

# Actuals (#2632)
actuals:
  tokens: 10473
  tasks: 2
  commits: 2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Injection-and-revert verdict loop with three-gate hygiene (per-path, scoped, marker)"
    - "Two-column outcome recording to separate a blind-but-passing assertion from a red file"
    - "Positive control alongside a green injection run, proving the break was live rather than a no-op"

key-files:
  created:
    - .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md
  modified: []

key-decisions:
  - "Scoped porcelain (`git status --porcelain -- apps tests packages`) is the hygiene gate, never the bare form — three tracked files are dirty at session start in this linked worktree, so a bare gate would never pass and would get disabled"
  - "The verdict vocabulary is exactly two values, `confirmed` and `withdrawn`; the severity-qualified third tier was rejected, so a vacuous-but-red assertion is plain `confirmed` with the mitigation in the verdict body (D-02)"
  - "All fifteen record stubs and all fifteen summary-table rows are created before the first injection runs, so a finding can be left visibly unfilled but never silently absent"
  - "Every correctly-designed injection in this corpus predicts PASS; a predicted FAIL is a design smell, not a withdrawal — recorded as the prediction-calibration note in S 3.4"
  - "A green injection run is only evidence of blindness if the break reached the module; F18 therefore carries a `npx tsx` positive control showing the live constant and its arithmetic effect"

patterns-established:
  - "HYGIENE-LOOP: pre-gate -> inject (Edit at named file:line) -> run (from the workspace dir, log to ${TMPDIR}/gsd-139 outside the repo) -> `git checkout --` revert -> three-part post-gate"
  - "TWO-COLUMN RULE: every verdict row and every Observed block carries assertion outcome AND file outcome plus the failing line where they differ; the verdict cites the assertion column"
  - "COLLATERAL RULE: verdict run isolated with `vitest -t '<title>'`, collateral recorded from a whole-file run, collateral explicitly excluded from the verdict"
  - "Marker-exemption disclosure: where `INJECTED (139)` is not syntactically legal or would distort the injected value, the omission is recorded as a decision in the finding's S N.2"

requirements-completed: [ASSERT-01]

coverage:
  - id: D1
    description: "139-VERDICTS.md exists with the apparatus stated once — HYGIENE-LOOP, TWO-COLUMN RULE, COLLATERAL RULE, the 15-row enumeration — and all fifteen per-finding record stubs present"
    requirement: "ASSERT-01"
    verification:
      - kind: automated_ui
        ref: "grep -c '^### 5\\.' 139-VERDICTS.md == 15; grep -c '^## ' == 8; grep -c '^### 3\\.' == 4; grep -cE '^\\| +[0-9]{1,2} \\| F' == 15"
        status: pass
    human_judgment: false
  - id: D2
    description: "F20-4 carries a complete observation-backed verdict: re-read file:line, verbatim injected diff, verbatim invocation, verbatim runner output, two-column outcome, verdict word"
    requirement: "ASSERT-01"
    verification:
      - kind: unit
        ref: "cd packages/dev-seed && npx vitest run tests/templates/default.test.ts tests/supabaseAdminClient.test.ts (34 passed under the live injection AND after revert)"
        status: pass
    human_judgment: false
  - id: D3
    description: "F18 carries a complete observation-backed verdict produced by two runs — isolated for the verdict, whole-file for the collateral record — plus a positive control proving the injection was live"
    requirement: "ASSERT-01"
    verification:
      - kind: unit
        ref: "cd packages/dev-seed && npx vitest run tests/templates/default.test.ts -t 'Test 10' (1 passed | 26 skipped, exit 0) and whole-file (27 passed, exit 0)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The source tree is byte-identical to HEAD — no injected regression survived its own task, and no phase marker survives anywhere under apps/packages/tests"
    requirement: "ASSERT-01"
    verification:
      - kind: automated_ui
        ref: "[ -z \"$(git status --porcelain -- apps tests packages)\" ] && ! grep -rn 'INJECTED (139)' apps packages tests"
        status: pass
    human_judgment: false

# Metrics
duration: 14min
completed: 2026-08-14
status: complete
---

# Phase 139 Plan 01: The Verdict Apparatus, Proven on F20-4 and F18 Summary

**Built the phase's injection-verdict apparatus as four named, reusable procedures and proved it end to end on two findings — both assertions stayed green while the behaviour they claim to guard was deliberately destroyed, so F20-4 and F18 are both `confirmed` on observation rather than on a paper read.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-08-14T11:33:43Z
- **Completed:** 2026-08-14T11:47:00Z
- **Tasks:** 2 of 2
- **Files modified:** 1 created (`139-VERDICTS.md`); 2 source files injected and reverted within their own tasks, net zero change

## Accomplishments

- **The apparatus exists once and is named.** `139-VERDICTS.md` (726 lines) defines HYGIENE-LOOP (S 3.1), TWO-COLUMN RULE (S 3.2), COLLATERAL RULE (S 3.3) and the 15-row enumeration (S 3.4). Plans 02-07 invoke these by name instead of re-deriving them fifteen times.
- **All fifteen verdict rows and all fifteen record stubs were created before the first injection ran.** A finding can now be left visibly unfilled — `grep -c 'not yet run'` returns exactly 13 — but it cannot be silently dropped, and S 4 row N is S 5.N by construction.
- **F20-4 confirmed by observation.** `id` was removed from the select list at `supabaseAdminClient.ts:708`; `expect(mockState.selectCalls[0]).toContain('id')` at `supabaseAdminClient.test.ts:151` passed anyway, because `'external_id, first_name, last_name'.includes('id')` is true via the substring inside `external_id`. Assertion PASS, file PASS, exit 0, zero collateral. Prediction matched.
- **F18 confirmed by observation, run twice.** `LOCALE_BLOCK_SIZE` was changed 109 -> 327 at `candidates-override.ts:53`, collapsing all 327 candidates into a single `en` block. Isolated verdict run (`-t 'Test 10'`) PASS/PASS; whole-file collateral run 27 passed — Test 9's determinism comparison stayed green exactly as predicted, so nothing goes to S 8.
- **Both verdicts carry a pre-specified Phase 142 regression and the stronger matcher to reach** (ROADMAP criterion 3), so remediation is mechanical rather than re-invented.
- **The source tree is byte-identical to HEAD.** Scoped porcelain empty, marker grep clean, and the `packages/dev-seed` vehicle back at its 34-green baseline after both reverts.

## Task Commits

Each task was committed atomically:

1. **Task 1 (tracer): End-to-end verdict for F20-4 — the apparatus, proven on one finding** - `3b30fb199` (docs)
2. **Task 2: F18 — the locale-block-size regression, run isolated and whole-file** - `2f5e49e53` (docs)

## Files Created/Modified

- `.planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md` — created. The phase evidence artifact: header + SS 1-4 apparatus and summary table, fifteen S 5.x per-finding records (two filled), SS 6-8 placeholders for plans 06-07.
- `packages/dev-seed/src/supabaseAdminClient.ts` — injected at `:708` and reverted inside Task 1. **Not** a deliverable; net zero change against HEAD.
- `packages/dev-seed/src/templates/defaults/candidates-override.ts` — injected at `:53` and reverted inside Task 2. **Not** a deliverable; net zero change against HEAD.

## Decisions Made

- **Stub placeholder granularity.** Each of the fifteen `### 5.x` stubs carries **one** `not yet run` status line plus six bold sub-part labels, rather than six placeholder lines. This makes `grep -c 'not yet run'` a direct count of unfilled findings (15 -> 14 -> 13 across this plan), which is what the plan's own verify commands assert.
- **A positive control was added to F18 beyond what the plan asked for.** A green run only proves the assertion is blind if the break actually reached the module under test; otherwise a mis-applied injection produces the same green. An `npx tsx` probe against the live tree recorded `LOCALE_BLOCK_SIZE = 327` and all three test-probed indices (0, 109, 218) resolving to `LOCALE_ORDER[0]`. The probe script was written to `${TMPDIR}/gsd-139/`, outside the repository, so it could not trip the hygiene gate.
- **Both marker exemptions were recorded as decisions, not omissions.** Neither injection carries an `INJECTED (139)` comment — F20-4's `+` line is a string-literal argument and F18's is a constant reassignment whose value is the experiment. Each finding's S N.2 states the exemption and notes that gates (a) and (b) carry the hygiene claim for that site.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Evidence correction] RESEARCH's F20-4 sibling-assertion grouping is off by one**

- **Found during:** Task 1 (F20-4 re-read evidence, checking the zero-collateral claim rather than assuming it)
- **Issue:** `139-RESEARCH.md` S F20-4 groups the sibling assertions as `:152-155`, `:156-158` and `:159-160`. The live tree has them at `:152-154` (three column names), `:155-157` (eq/like/order) and `:158-159` (mocked return data); `:160` is the closing `});`, not an assertion.
- **Fix:** Recorded the correction in place in S 5.13.1 rather than silently using the right numbers. The substance of the zero-collateral claim — three groups, none reachable by the injection — is unaffected and was independently confirmed by the observed run.
- **Files modified:** `139-VERDICTS.md`
- **Verification:** `awk` line-numbered read of `packages/dev-seed/tests/supabaseAdminClient.test.ts:138-165`; the whole-file run under injection showed all 7 tests green.
- **Committed in:** `3b30fb199`

**2. [Rule 2 - Missing critical evidence] F18's green run needed a positive control**

- **Found during:** Task 2 (F18 observed block)
- **Issue:** The plan specifies two runs, both of which came back green. Green is the predicted and correct result — but on its own it does not distinguish "the assertion is blind" from "the injection never took effect". The phase's own prohibition is that a run which did not execute carries no verdict; the same logic applies to an injection that did not take.
- **Fix:** Added an `npx tsx` probe (S 5.6.4, "Positive control") importing the same source specifier the test imports, showing the live `LOCALE_BLOCK_SIZE = 327` and `Math.floor(idx / 327) === 0` for each of the three indices the test iterates. Probe script written outside the repository.
- **Files modified:** `139-VERDICTS.md`
- **Verification:** Probe output pasted verbatim into S 5.6.4; scoped porcelain and marker gates clean afterwards.
- **Committed in:** `2f5e49e53`

**3. [Rule 1 - False completion claim] `requirements.mark-complete ASSERT-01` marked the requirement satisfied after 2 of 15 findings**

- **Found during:** State updates, after both task commits
- **Issue:** The plan's frontmatter carries `requirements: [ASSERT-01]`, so the standard state-update step ran `requirements mark-complete ASSERT-01`, which flipped `.planning/REQUIREMENTS.md:54` to `- [x]` and its traceability row at `:143` to `Complete`. ASSERT-01 requires that *each* single-source finding be independently confirmed or withdrawn; thirteen of the fifteen still carry a `not yet run` placeholder. Leaving it checked would assert exactly the kind of unearned completion this phase exists to detect.
- **Fix:** Reverted `:54` to `- [ ]` and set `:143` to `Pending (2 of 15 findings verdicted — 139-01; plans 02-07 outstanding)`, so the partial progress is visible without the claim being made. Plan 07 owns the actual completion.
- **Files modified:** `.planning/REQUIREMENTS.md`
- **Verification:** `grep -n 'ASSERT-01' .planning/REQUIREMENTS.md` shows the unchecked box and the annotated status.
- **Committed in:** plan metadata commit

---

**Total deviations:** 3 auto-fixed (2 x Rule 1 correctness, 1 x Rule 2 missing critical evidence)
**Impact on plan:** All three strengthen or correct the record rather than widen scope. None adds product code, none changes the injection diffs Phase 142 will re-apply, and none alters a verdict. No scope creep.

## Issues Encountered

**A `sed` on STATE.md over-matched and was reverted.** `state add-decision` writes new decisions with a
literal `- [Phase ?]: ` prefix when it cannot infer the phase number. An attempt to relabel the four
new entries to `[Phase 139]` used an unanchored-to-content `sed` substitution and rewrote **173**
pre-existing decision lines — `[Phase ?]` turns out to be the file's established convention across the
whole Decisions section, not a defect. Detected immediately from the `git diff --numstat` (190 added /
185 removed against an expected ~10). Reverted with the inverse substitution after confirming `HEAD`
contained zero `- [Phase 139]: ` lines, so the inverse could not over-match in turn; `git diff` on
`.planning/STATE.md` now shows only the intended position, metric, session and four-decision changes.
The four new decisions keep the `[Phase ?]` prefix, matching every other entry in the file. Nothing was
committed while the file was in the damaged state.

**The plan's `not yet run` accounting was ambiguous.** Part A says each stub "carries the six sub-parts as bold labels with the placeholder line `not yet run`", which reads as six placeholder lines per stub — but Task 2's verify asserts `grep -c 'not yet run' == 13`, which requires exactly one per stub. Resolved in favour of the executable check: one status line per stub, six bold sub-part labels beneath it. Both readings satisfy the must_haves truth that every stub carries the six required sub-parts.

**No E2E or dev-server command was run at any point**, per the plan's `<context>` constraint and CLAUDE.md's cardinal rule. This phase transiently breaks production source, so an overlapping E2E run would have gone red for a manufactured reason. The `packages/dev-seed` vitest vehicle needs no Supabase, no dev server and no network.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

**Ready for plans 02-05 (the remaining thirteen injections).** The apparatus they consume is committed and named: they invoke HYGIENE-LOOP, TWO-COLUMN RULE and COLLATERAL RULE by name, fill their `### 5.x` stub, and update their S 4 row from `pending`. The `packages/dev-seed` vehicle is finished — the remaining sites live in `packages/question-info`, `packages/argument-condensation`, `packages/data` and `apps/frontend`.

**Two carry-forward warnings for the auth-tree plans (139-04, 139-05).** Those injections remove authentication material from an OIDC flow (the Idura JAR request object, the client assertion) and short-circuit ID-token verification. S 3.1's post-gate is the only thing standing between those injections and a commit, and the marker gate (c) becomes load-bearing there in a way it was not for either `dev-seed` site — both of this plan's injections were legitimately marker-exempt, so gate (c) has not yet been exercised against a real marker.

**One shape note for the F19 plans.** S 3.2 exists specifically for them: their `toBeDefined()` will pass while the next line throws, and a single-column record would withdraw three valid findings and shrink ASSERT-03/Phase 140 as collateral damage. Both records filled in this plan happen to have agreeing columns, so the divergent case is still unexercised.

## Self-Check: PASSED

- `FOUND: .planning/phases/139-single-source-sweep-findings-confirm-or-withdraw/139-VERDICTS.md` (726 lines)
- `FOUND: 3b30fb199` (Task 1)
- `FOUND: 2f5e49e53` (Task 2)
- `git status --porcelain -- apps tests packages` — empty
- `grep -rn 'INJECTED (139)' apps packages tests` — no hits
- `cd packages/dev-seed && npx vitest run tests/templates/default.test.ts tests/supabaseAdminClient.test.ts` — 34 passed

---
*Phase: 139-single-source-sweep-findings-confirm-or-withdraw*
*Completed: 2026-08-14*
