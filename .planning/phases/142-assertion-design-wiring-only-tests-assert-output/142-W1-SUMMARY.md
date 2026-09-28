---
phase: 142-assertion-design-wiring-only-tests-assert-output
plan: W1
subsystem: testing
tags: [gap-closure, negative-control, assertion-design, question-info, record-correction, verification-finding]
status: complete

# Dependency graph
requires:
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 01
    provides: 'D-01''s product fix (question type + choice labels reach the prompt) — without it the assertions added here would be red on the clean tree; and the `capturedPrompts()` helper with its A-09 hard call-count guard, reused verbatim'
  - phase: 142-assertion-design-wiring-only-tests-assert-output
    plan: 06
    provides: 'The Final counts table and the derive-once-propagate-thrice convention this pass had to reconcile rather than re-derive'
provides:
  - 'W-1 closed on both halves the verifier asked for: Configuration 2 of `questionTypes.test.ts` now asserts the composed prompt, AND the residue is on the record'
  - 'Ledger row 1s — a second negative-control pair for F15-A, both halves measured, under two new post-D-01 injections (type-emptied, choices-emptied)'
  - 'D-01-iii''s mitigation now has a guard: the ordinal choice labels that alone separate a 5-point from a 7-point ordinal are asserted, and measured red when removed'
  - 'ROADMAP Outcome block addresses all five success criteria — criteria 2 and 3 were previously unaddressed'
  - 'Pair count reconciled to 13 across all four records, with the derivation stated and the two supplementary pairs named'
  - 'W-2 closed: the `142-05`/`142-04` commit misattribution in a done todo'
affects: []

actuals:
  tokens: 41000
  tasks: 4
  commits: 3

tech-stack:
  added: []
  patterns:
    - 'When a phase''s own verification finds a residue, close it through the SAME apparatus the phase used — a gap-closure assertion with no negative control would be exactly the class of guard the phase exists to remove'
    - 'An injection prohibited on the pre-fix tree can become the correct control on the post-fix tree, and the prohibition''s STATED GROUND is what to re-check, not its name (§ 8.3 R-2 here; A-03 at row 7 is the precedent)'
    - 'Amend a sealed SUMMARY with a visible banner giving both the as-executed figure and the current one, never by silent rewrite'

key-files:
  created:
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-W1-SUMMARY.md
  modified:
    - packages/question-info/tests/questionTypes.test.ts
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-NEGATIVE-CONTROL-LEDGER.md
    - .planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-06-SUMMARY.md
    - .planning/audits/2026-08-11-fake-guard-sweep.md
    - .planning/REQUIREMENTS.md
    - .planning/ROADMAP.md
    - .planning/todos/done/playwright-config-bank-auth-doc-drift.md

key-decisions:
  - 'Both halves of W-1''s suggested disposition were taken, not one: the assertion was added AND the record corrected. The verifier offered them as alternatives; the operator directed both'
  - '139 § 5.1.2''s substitute injection was NOT used for this pair — it empties the question NAME, which row 1 measured as leaving type/choice assertions green, so it is off-axis here and could not have reddened anything added'
  - 'Two injections (type-emptied, choices-emptied) count as ONE pair, on row 9''s B/B′ precedent — counting them separately would report 14 and overstate what was executed'
  - 'The 7-point test was strengthened too, not only the 5-point one: W-1''s disposition (a) asks that no ordinal test remain mock-in/mock-out, and the two blocks differing observably from one another is the criterion''s own wording'
  - 'No E2E gate was re-run: this pass changed one test file and documentation, zero product source. The phase''s E2E gates existed for its product changes'

requirements-completed: []

duration: 35 min
completed: 2026-08-21
---

# Phase 142 W-1: Configuration 2 Asserts the Ordinal Prompt — Gap-Closure Summary

Closed the single finding from `142-VERIFICATION.md` — Configuration 2 of `questionTypes.test.ts`
asserted only the canned payload it handed the mock — by adding prompt assertions on both ordinal
tests with a measured negative-control pair, then corrected the phase record so the ROADMAP Outcome
block addresses all five success criteria instead of three.

**This is an amendment to a closed phase, appended rather than folded in.** `142-06-SUMMARY.md` was
edited (its counts table) and carries a visible banner saying so; nothing else in any sealed summary
was touched.

## What was actually wrong

`capturedPrompts()` was called at `:113` (Configuration 1) and `:422` (Configuration 3) but **nowhere**
between `:173` and `:296`. Configuration 2's two tests asserted `toHaveLength(1)`,
`data.questionId).toBe('ordinal-1')`, `data.infoSections).toBeDefined()`, `data.terms).toHaveLength(2)`
— every one the payload the test itself supplied. Those exact sites (pre-phase `:199`, `:263`, `:264`)
are three of the eleven the ledger records at row 1 as *"All eleven assertions passed blind"*, **and
they still passed blind**.

The cause is traceable and was not an oversight: A-04 correctly rejected 139 § 5.1.6's literal target
(pairwise inequality across three *differently-named* Configuration blocks, which passes for the wrong
reason) and substituted a same-name/varying-type fixture — built from **Boolean + Categorical only**.
So after remediation no assertion anywhere in the file observed an **ordinal** question's prompt,
landing precisely on the branch D-01-iii flags as weakest.

## Accomplishments

### 1. Configuration 2 asserts output (`d1fc0f745`)

Three assertions, all on the composed prompt the mocked provider received:

| Site | Assertion | Why it is not a new wiring-only assertion |
|---|---|---|
| `:239` | `toContain(QUESTION_TYPE.SingleChoiceOrdinal)` | Observes what the product interpolated, read **from the constant** (row 6's E2 discipline) rather than a re-typed literal |
| `:246` | `toContain('Very dissatisfied, Dissatisfied, Neutral, Satisfied, Very satisfied')` | The five labels **as the product's own `', '` join**, derived from `infoGeneration.ts:105`'s semantics, not copied from run output (E3's rule). A regression in the separator or the label **order** reds too |
| `:318` | the 7-point test's seven labels, likewise joined | The only thing that can separate the two ordinal blocks — both are `singleChoiceOrdinal` (**D-01-iii**). Also runs the `generateTerms` template, so it pins `{{choices}}` on a second template |

**A-04's rejection is untouched.** Nothing added compares differently-named fixtures; 139 § 5.1.6's
target 2 is still absent from the file.

### 2. The negative-control pair — ledger row 1s, both halves measured

The full HYGIENE-LOOP was run per injection: pre-gate → inject by content → run → revert with
`git checkout HEAD -- <path>` → three-condition post-gate.

**139 § 5.1.2's substitute was NOT used, and the reason is measured rather than asserted:** it empties
the question *name*, and row 1 records that T2/T3 stayed green under it — it is off-axis for a
type/choices assertion and could not have reddened anything added here. Two new injections were used
instead, available only because D-01 landed:

| ID | Diff (at `infoGeneration.ts`) | OLD half (pre-assertion tree) | NEW half (at `d1fc0f745`) |
|---|---|---|---|
| **Q** | `:104` `questionType: question.type,` → `questionType: '',` | **GREEN blind**, exit 0, `Tests 9 passed (9)`; package-wide `22 passed (22)` | **RED**, exit 1, `1 failed \| 8 passed (9)` — `questionTypes.test.ts:239:22`, `expected '…' to contain 'singleChoiceOrdinal'`. **Zero collateral in the file** |
| **C** | `:105` `choices: 'choices' in question ? … : '',` → `choices: '',` | **GREEN blind**, exit 0, `Tests 2 passed \| 7 skipped (9)` (filter matched exactly the 2 intended) | **RED**, exit 1, `2 failed \| 7 skipped (9)` — `:246:22` and `:318:36`, each naming its own joined label string |

**The sharpest single measurement of W-1** is injection C's whole-file OLD-half run
(`F15-A-W1-OLD-C-collateral-1.log`, exit 1, `Tests 2 failed | 7 passed (9)`): with the choices removed
from every prompt, Configuration 3's binary test and the Mixed-block T3 went **red** — while **both
Configuration 2 tests stayed green**. The file caught the regression everywhere except the ordinal
block. That is the residue, measured rather than argued.

**On § 8.3 R-2, checked by name.** R-2 forbids the audit's own F15-A sentence, and its stated ground is
*"Un-injectable — zero delta. The shipped code already ignores question type."* That ground is a
property of the pre-D-01 tree; D-01 landed the type and choices into the prompt, so the same edit now
has a transcribed non-zero delta and a measured red. This is A-03's reasoning at row 7, where an
injection off-path on one tree becomes the correct control on the other. **R-3 and R-4 were checked and
not used** — R-4's `generalInstructions` key sits one line below C's site and is byte-unchanged in
every diff taken.

**Logs** (all under `${TMPDIR:-/tmp}/gsd-142/`, resolved `$TMPDIR` as recorded in the ledger):
`F15-A-W1-OLD-0-cleantree.log`, `F15-A-W1-OLD-Q-1.log`, `F15-A-W1-OLD-Q-collateral-1.log`,
`F15-A-W1-OLD-C-1.log`, `F15-A-W1-OLD-C-collateral-1.log`, `F15-A-W1-OLD-postrevert.log`,
`F15-A-W1-cleantree-postedit.log`, `F15-A-W1-NEW-Q-1.log`, `F15-A-W1-NEW-Q-collateral-1.log`,
`F15-A-W1-NEW-C-1.log`, `F15-A-W1-NEW-C-collateral-1.log`, `F15-A-W1-NEW-postrevert.log`,
`W1-unit-gate-1.log`.

### 3. The record corrected

- **Ledger** — register row `1s` (nine columns), a full per-row record inside Row 1's section, a
  residue note on Row 1 itself explaining why Configuration 2 was left uncovered, the ordering-guarantee
  clause extended to say when and why the two supplementary rows were opened, and D-01-iii's deferred
  entry updated to record that its mitigation now has a guard.
- **ROADMAP Outcome** — **criteria 2 and 3 were previously unaddressed and now are.** Criterion 2 states
  A-04's rejection of 139's literal target and *why* it would have shipped a new fake guard, names the
  substitute fixture, records that all three Configuration blocks now carry prompt assertions, and names
  the residue (D-01-iii's implicit scale semantics; D-01-i and D-01-ii open by design). Criterion 3
  states each per-finding outcome, **with F17's `N/A — by construction` scoped exception intact and
  explicitly not rounded away**. A paragraph records the gap-closure pass as a reopening.
- **Counts reconciled to 13 in all four records** — ledger Final counts, audit § Remediation status,
  `REQUIREMENTS.md:60`, `ROADMAP.md` (both the milestone line and the Outcome block), plus the amended
  table in `142-06-SUMMARY.md`. Derivation: 11 + 1 (row 5s) + 1 (row 1s) = 13; OLD halves 8 cited + 5
  re-run = 13; NEW halves 13. A fourth uncounted measurement was added to the "deliberately NOT counted"
  list: Q and C are **one** pair, on B/B′'s precedent.

### 4. W-2 — commit attribution corrected

`.planning/todos/done/playwright-config-bank-auth-doc-drift.md:52` read *"(`142-05`, commit
`f4e0fc1ec`)"*. Verified: `git log` gives `docs(142-04): correct bank-auth opt-in claim…` and
`142-04-PLAN.md:5` is `wave: 5` — plan 04, executed as wave 5. Corrected to name both.

## Verification

| Gate | Result |
|---|---|
| `packages/question-info` suite, clean tree | exit **0**, `Test Files 2 passed (2)`, `Tests 22 passed (22)` |
| Root `yarn test:unit` | exit **0**, `Tasks: 25 successful, 25 total`; **11 cache bypasses** (all wired workspaces force-executed), `@openvaa/question-info:test:unit` confirmed executing at log line 725 |
| Phase-141 coverage guard | `Check 1 … 0 violation(s); Check 2 … 0 violation(s), 11 workspace(s) executed`, `Total: 0 violation(s)` |
| `npx prettier --check` + `npx eslint` on the edited test | both clean |
| Three-condition post-gate, after **every** injection | per-path porcelain empty, scoped `-- apps tests packages` empty, `grep -rn 'INJECTED (142)' apps packages tests` no hits |
| `git diff --exit-code HEAD -- packages/question-info` after the last revert | exit 0 |

**E2E was not re-run, deliberately.** This pass changed one test file and documentation — **zero product
source**. The phase's E2E gates (D-16, A-05) existed to cover its four product changes; nothing this
pass touched can reach a browser. Stated rather than left to inference.

## Deviations from Plan

**One, and it is a widening the brief invited.** The brief asked for *"a prompt assertion"* (singular) on
Configuration 2. Three were added, across **both** ordinal tests, because W-1's own disposition (a) is
*"no ordinal test remains mock-in/mock-out"* and because criterion 2's wording is that the blocks differ
**observably from one another** — which, for two questions sharing the `singleChoiceOrdinal`
discriminant, only the choice labels can deliver. Every added assertion is covered by a measured red:
`:239` by injection Q, `:246` and `:318` by injection C. No assertion was added without a control.

## Known Stubs

None. No assertion added here is a placeholder, and none asserts a value the test handed the mock.

## Honesty notes — measurements that qualify the above

1. **The injections are not 139's.** They did not exist in 139's record and could not have: the code
   they regress was written by D-01 in this phase. Both halves were therefore measured here, and the
   ledger row says so in the `OLD half` cell rather than citing.
2. **Injection C carries real collateral**, recorded in the `Collateral` cell and never in the assertion
   cell: the two **pre-existing** choices assertions (`:423-424`, `:649`) red under C on any tree.
3. **Injection liveness is transcribed, not logged** — the same structural limit `142-VERIFICATION.md`
   records as I-1. The `git diff` was taken while each injection was live and is reproduced in the
   ledger row; no log body carries the `INJECTED (142)` marker.
4. **The vitest logs carry an appended `EXITCODE=` line** written by the runner command, unlike the
   phase's earlier vitest logs which required inferring the exit code from the pass/fail summary. This
   is an improvement on the apparatus, noted so a later reader does not think the earlier logs were
   doctored.
5. **`.env.example` still lacks `SUPABASE_ANON_KEY`** (B-1). Unchanged by this pass; still open and
   operator-owned.

## Self-Check: PASSED

- `packages/question-info/tests/questionTypes.test.ts` — FOUND, assertions present at `:239`, `:246`,
  `:318`.
- `.planning/phases/142-assertion-design-wiring-only-tests-assert-output/142-W1-SUMMARY.md` — FOUND.
- Commit `d1fc0f745` — FOUND in `git log`.
- All four records grep to the same pair count (**13**) and the same re-run count (**5**).
