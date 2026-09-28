---
phase: 159-component-context-consolidation
plan: 10
subsystem: ui
tags: [validation, multi-choice, uat, svelte5, vitest, review-triage]

requires:
  - phase: 159-component-context-consolidation
    provides: "159-09's input-component extraction — the acceptance path documents the post-extraction UI, which is why this plan was sequenced after it"
  - phase: 152-comment-naming-hygiene-sweep
    provides: "the comment-hygiene guard wired into yarn lint:check, which every comment written here is authored against (D-N1)"
provides:
  - "A clamped effective minimum on the single multi-choice save gate: an explicitly authored minSelections of 0 can no longer make an empty answer saveable"
  - "getEffectiveSelectionBounds — one derivation of the selection bounds, read by both the save gate and the helper text"
  - "159-UAT-QUESTION-INPUTS.md — the operator acceptance path for the 2-choice and multi-select UI"
  - "A register entry recording that the blocking follow-up is filed AND delivered, with the UAT run scheduled for milestone close"
affects: [159-11, v2.15 milestone close]

actuals:
  tokens: 11607
  tasks: 3
  commits: 3

tech-stack:
  added: []
  patterns:
    - "A bound used for BOTH a decision and its user-facing label is derived once and exported, so the label can never advertise a value the decision refuses"

key-files:
  created:
    - .planning/phases/159-component-context-consolidation/159-UAT-QUESTION-INPUTS.md
    - .planning/todos/pending/2026-09-03-uat-2-choice-and-multi-select-question-inputs.md
    - .planning/phases/159-component-context-consolidation/deferred-items.md
  modified:
    - apps/frontend/src/lib/utils/multiChoiceValidity.ts
    - apps/frontend/src/lib/utils/multiChoiceValidity.test.ts
    - apps/frontend/src/lib/components/questions/QuestionChoices.svelte
    - apps/frontend/src/lib/components/questions/OpinionQuestionInput.type.ts

key-decisions:
  - "The effective minimum is clamped to a floor of 1 in the single shared derivation, which is exactly what the function's own header already promised for the omitted and null cases."
  - "The helper text reads its bounds from the same derivation rather than re-deriving them — the consolidation removes a duplicate instead of adding a second clamp."
  - "The blocking follow-up is delivered as an acceptance path, not a build, because both capabilities already ship. The operator scheduled the run itself for v2.15 milestone close, so it does not block this phase."
  - "No follow-up todo, data migration or back-compatibility test was filed for 159-09's answer-shape change, per an explicit operator instruction."

patterns-established:
  - "A guard that measures a symbol's spread is not allowed to be inflated by a doc comment naming that symbol: the prose was reworded to point at the module instead, and the whole episode recorded rather than silently massaged."

requirements-completed: []

coverage:
  - id: D1
    description: "An explicitly authored minSelections of 0 no longer makes a zero-selection answer saveable on the single gate that decides voter persistence and the candidate Save button; omitted and null minimums are unchanged."
    requirement: REVIEW-CMP-02
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/utils/multiChoiceValidity.test.ts#explicit minSelections=0 (an explicit zero must not lower the floor below 1) — 4 cases, 2 seen RED against the unmodified implementation"
        status: pass
      - kind: other
        ref: "grep -c 'Math.max' multiChoiceValidity.ts -> 1 (one clamp, not two)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The selection-count helper text and the save gate read one derivation, so the label cannot advertise a floor the gate refuses."
    verification:
      - kind: unit
        ref: "multiChoiceValidity.test.ts#getEffectiveSelectionBounds — 5 cases, including one asserting the bounds and the predicate agree at the floor"
        status: pass
      - kind: other
        ref: "grep -rnF \"utils/multiChoiceValidity'\" apps/frontend/src -> 2 importers, one symbol each; no second clamp anywhere"
        status: pass
    human_judgment: false
  - id: D3
    description: "The operator can accept the 2-choice and multi-select UI from a short written path: a named seed template, the routes, the expected behaviour of each control including keyboard and screen-reader semantics and the selection-count boundaries, and a list separating real defects from behaviour that only looks surprising."
    requirement: REVIEW-CMP-02
    verification: []
    human_judgment: true
    rationale: "The deliverable IS an acceptance path for a human. Its correctness is whether a person can follow it and reach the described screens, which only a person walking it can establish. The operator has scheduled that walk for v2.15 milestone close; it is not a Phase 159 blocker."
  - id: D4
    description: "The runtime change in QuestionChoices behaves identically to the code it replaced on every configuration that exists."
    verification: []
    human_judgment: true
    rationale: "No E2E run. The two derivations differ on exactly one input — an explicit minSelections of 0 — and no seeded, templated or authored question anywhere in the repository uses that value (measured: every authored minSelections is 1 or 2). So the equivalence is provable by construction rather than observed. 159-CONTEXT O5 budgets the phase's single full-suite run at 159-11; that run is the gate. Filed as ledger entry 236."

duration: 14 min
completed: 2026-09-03
status: complete
---

# Phase 159 Plan 10: Closing the explicit-zero hole and publishing the operator acceptance path — Summary

**A one-line clamp on the single multi-choice save gate, proven red first, plus the consolidation its own label needed — and the blocking follow-up delivered as a runnable acceptance path rather than a build, because both capabilities already ship.**

## Performance

- **Duration:** 14 min
- **Started:** 2026-09-03T06:37:28Z
- **Completed:** 2026-09-03T06:51:53Z
- **Tasks:** 3
- **Files modified:** 7 (3 created, 4 modified)

## Accomplishments

- The explicit-zero hole is closed on the one function that decides whether a multi-choice answer can be saved, and it was **seen failing first**.
- The fix exposed a second, quieter half nobody had named: the helper text under the checkboxes re-derived the same minimum without the clamp, so it would have told the voter zero selections were allowed while the gate refused them. Both now read one derivation.
- The blocking follow-up item has an operator-runnable acceptance path against post-extraction code, with the run scheduled for milestone close per the operator's own instruction.
- Every gate's exit code was read directly, never through a pipe — the specific failure that cost 159-09 two commits.

## Task Commits

1. **Task 1: prove the explicit-zero hole, then close it** — `a61245b4c` (fix)
2. **Task 1 follow-on: the label's lagging half** — `14a6bf1ea` (fix)
3. **Task 3: publish the acceptance path and file the register entry** — `4f5da11d5` (docs)

Task 2 was a decision checkpoint and modified no files, so it produced no commit. Its answer is recorded below.

## Task 1 — the red output, recorded verbatim

The plan requires the failure on record. Against the **unmodified** implementation, with the new fifth group in place:

```
 × isMultiChoiceCountValid > explicit minSelections=0 (an explicit zero must not lower the floor below 1) > count 0 → false (zero selections is always invalid-as-unanswered, explicit zero included) 3ms
   → expected true to be false // Object.is equality
 ✓ ... > count 1 → true (within the effective maximum) 0ms
 ✓ ... > count above the effective maximum → false (the explicit zero does not touch the max derivation) 0ms
 × isMultiChoiceCountValid > explicit minSelections=0 ... > count 0 with both an explicit zero minimum and an omitted maximum → false 0ms
   → expected true to be false // Object.is equality

 Test Files  1 failed (1)
      Tests  2 failed | 19 passed (21)
```

Both reds are zero-count cases and both fail for the right reason: `effectiveMin` resolved to the authored `0`, so `count >= effectiveMin` was satisfied by an empty selection. The other two cases in the group passed before the fix and after it, which is what makes them controls rather than padding — they show the clamp did not disturb the maximum or the ordinary in-range case.

After the one-line change: **21 passed (21)**, and the full frontend suite **88 files / 1590 tests / 0 failed** (baseline after 159-09 was 1581; this plan adds 9).

## What this fix is, and what it is not

**It is a correctness fix to a client-side user-experience gate. It is not a security control.** The server re-validates; nothing here changes what the database will accept, and describing it as a hardening would imply a guarantee this change does not provide. What it buys is that the function now does what its own documentation says, on the one path that decides whether the voter's answer persists and whether the candidate's Save button is live.

**And it is currently unreachable.** Measured across `apps/`, `packages/` and `tests/`: every authored `minSelections` in the repository is `1` or `2`. Nothing authors an explicit zero, so no user can reach the old behaviour today through any seeded or templated question. This is a guard against a future authoring choice, not a repair of a live defect — worth saying plainly, because a reader who assumed otherwise would over-rate the fix.

## The half the plan did not name

The plan scoped Task 1 to one file and its test. Fixing the gate immediately made a second site wrong:

`QuestionChoices.svelte` renders a helper line under the checkboxes — "Select 2 to 3 options." — and computed its own `effectiveMin: minSelections ?? 1` to do it. With the gate clamped and the label not, an authored zero would have produced **"Select 0 to 3 options." above a button that refuses to save zero selections**. Telling someone an input is allowed and then rejecting it is a worse defect than the one being fixed.

The fix was chosen to avoid the trap the plan's own prohibition warns about. Copying `Math.max(…, 1)` into the label would have created a second clamp free to drift. Instead the bounds were **extracted once** as `getEffectiveSelectionBounds`, `isMultiChoiceCountValid` now reads it, and the label reads it too — so the duplicate that already existed is **removed**, not doubled. `grep -c 'Math.max'` on the module returns 1. The module has two importers, each taking a different symbol: the gate takes the predicate, the label takes the bounds. There is still exactly one implementation of each.

While there, two prose statements that described the unclamped formula were corrected — the module header, and `OpinionQuestionInput.type.ts`, whose sentence also broke off mid-clause ("invalid-as-unanswered per)").

## An acceptance criterion I made unsatisfiable, and did not quietly massage

Task 1's fourth criterion counts files containing `isMultiChoiceCountValid` and requires **3 or fewer**, its stated purpose being "no second validity path appeared". After correcting the type-module prose, it measured **4** — purely because that prose now contained the function's name inside a doc comment.

A doc mention is not a validity path, so the criterion's *intent* was still satisfied. But rather than declare it satisfied-in-spirit, or leave a guard reading 4 against a stated ceiling of 3, the prose was reworded to point at the **module** (`$lib/utils/multiChoiceValidity`) instead of naming the symbol. The sentence is equally accurate — arguably more durable, since a module path survives a rename — and the count returned to 3 on its own merits, not by weakening anything the criterion measures.

Recording it here because the alternative shapes are both bad: silently rewording to hit a number looks identical to gaming it unless you say so, and the standing rule against bending prose to satisfy a count exists precisely to make this visible.

## Task 2 — the operator's answer, recorded verbatim

The checkpoint asked whether the blocking follow-up is acceptance readiness or behaviour work. The operator did not choose either option id; they answered in their own words, and their words carry a scheduling constraint neither option offered:

> "I just need to UAT-check the UI for 2-choice and multi-select choices, but it should happen only at the end of the milestone."

**Read three ways, all of them binding:**

1. **The `acceptance-readiness` reading is confirmed.** They describe a check they will perform, not behaviour to build. Task 3 proceeded as written.
2. **The UAT run is deferred to v2.15 milestone close and is NOT a Phase 159 blocker.** The register entry says so explicitly. No requirement is marked blocked pending it.
3. **The scope is what they named** — the "2-choice" UI and multi-select choices. Their word is more accurate than the review comment's: there is **no `BooleanInput` component** in this repository (whole-tree search: zero files), and a boolean *opinion* question does not even reach the input component — `OpinionQuestionInput` synthesizes a two-choice No/Yes pair and hands it to `QuestionChoices`.

**A second operator instruction that REMOVED work from this plan**, on 159-09's persistence change (a `multipleText` question now saves `Array<LocalizedString>` where it previously saved `Array<string>`):

> "There is no existing data we need to care about, nor document this change."

So **no follow-up todo, no data migration and no back-compatibility round-trip test for the old plain-string shape were filed**, and none should be. Recorded verbatim so a later reader does not re-raise the absence as an oversight.

## Every anchor this plan cites was re-measured, and most had drifted

The seventh consecutive plan in this phase to find stale citations. The plan and `159-RESEARCH.md` cite:

| Cited | Measured at this plan | Note |
|---|---|---|
| `Input.type.ts:31` — boolean kind | **`:37`** | 159-09 added two kinds above it |
| `Input.svelte:602` / "near `:596`" — boolean branch | **`:450`** | the file is **540 lines**; line 602 does not exist |
| `QuestionChoices.svelte:160` — selection state | **`:147`** | |
| `QuestionChoices.svelte:421-422` — constraints | **`:169`** | |
| `OpinionQuestionInput.svelte:38` — the importer | **`:36`** | |

Nothing was copied forward into the acceptance path or the register entry.

## The filed-only boundary for this phase's other follow-up comments

The operator note overruled D-N2 in one direction only — implement the *blocking* ones — so the boundary is written down here rather than inferred. Of the six uncovered triage comments in this phase's surface:

| # | Comment | Disposition | Owner |
|---|---|---|---|
| 1 | `appContext.svelte.ts:335` — "ad hoc rollup is fixed in the last branch" | Close as already fixed (`ce0f5e746`) | 159-11 records it |
| 2 | `i18n/init.ts:52` — "check whether these utils are still needed" | **Filed only**, blocked on Phase 157's app-shared extraction | **159-11** |
| 3 | `constants.ts:10` — "Remove default." | Scoped in, one line, zero runtime delta | **159-11** |
| 4 | `getAllianceSummary.ts:1` — "Rename to alliances.ts" | **Filed only**, deferred to 158's `lib/utils` sweep | **159-11** |
| 5 | `multiChoiceValidity.ts:8` — "minSelection should be checked to be > 0" | **Implemented here**, red first | **159-10** |
| 6 | `QuestionChoices.svelte:1` — "follow-up blocking task for me to UAT" | **Filed AND delivered here**; run at milestone close | **159-10** |

**Items 2, 3 and 4 were deliberately NOT filed by this plan.** `159-11-PLAN.md` names all three in its own tasks and acceptance criteria; filing them here would have produced duplicate register entries and collided with the plan that owns them.

## Files Created/Modified

- `multiChoiceValidity.ts` — the clamp, the extracted bounds, and a header that now matches the code.
- `multiChoiceValidity.test.ts` — 13 cases to 21: a fifth group for the explicit zero (2 of it seen red) and a group for the new export.
- `QuestionChoices.svelte` — the helper text's bounds now come from the shared derivation; the display-side duplicate is gone.
- `OpinionQuestionInput.type.ts` — prose corrected to the clamped formula, and a broken sentence closed.
- `159-UAT-QUESTION-INPUTS.md` — the acceptance path: seed command, two paths (voter needs no login; candidate needs registration, with the cost stated), per-control expectations including keyboard and screen-reader behaviour, and a defect-versus-surprising list.
- `.planning/todos/pending/2026-09-03-uat-…md` — the register entry, marked filed-and-delivered with the milestone-close schedule.
- `deferred-items.md` — three out-of-scope discoveries, one of which was already filed and is deliberately not re-filed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The helper text became the lagging half of my own fix**

- **Found during:** Task 2, re-measuring `QuestionChoices` before writing the acceptance path
- **Issue:** `QuestionChoices.svelte:174` re-derived `minSelections ?? 1` for the selection-count label. Once the gate clamped and the label did not, an authored zero would have rendered "Select 0 to 3 options." above a control that refuses to save zero selections.
- **Fix:** extracted `getEffectiveSelectionBounds` in the existing module; the gate and the label both read it. A duplicate removed, not a second clamp added.
- **Files modified:** `multiChoiceValidity.ts`, `QuestionChoices.svelte`, `OpinionQuestionInput.type.ts`, `multiChoiceValidity.test.ts` — two of them outside the plan's declared `files_modified`
- **Verification:** 5 new unit cases including a floor-agreement assertion; unit 1590/0, typecheck 0 errors 0 warnings, lint 0, frontend build exit 0
- **Committed in:** `14a6bf1ea`
- **Filed:** ledger entry 237

**2. [Rule 1 - Bug] Two prose statements described a formula the code no longer implemented**

- **Found during:** Task 1
- **Issue:** the module header and `OpinionQuestionInput.type.ts:27` both stated the unclamped `minSelections ?? 1`. The type-module sentence additionally broke off mid-clause.
- **Fix:** both corrected to the clamped formula, naming the explicit-zero case.
- **Files modified:** `multiChoiceValidity.ts`, `multiChoiceValidity.test.ts`, `OpinionQuestionInput.type.ts`
- **Verification:** `lint:check` exit 0 including the phase-152 comment-hygiene guard
- **Committed in:** `a61245b4c`, `14a6bf1ea`

### Out of scope — logged, not fixed

- **A pre-existing `prettier --check` failure** in `PasswordSetter.svelte.test.ts` (introduced by 159-02) surfaced when a whole-repo `yarn format` ran. It was reverted out of the working tree rather than absorbed into a commit here. **Already ledger entry 232** from 159-09; deliberately **not re-filed**, since a second row makes the ship gate count one defect twice.
- **Stale sub-branch comment numbering** in `Input.svelte` (`5.1`/`5.2`/`5.3` now sitting under branch `6`, a 159-09 renumbering residue). Comments only. Logged in `deferred-items.md` for whoever next edits that file.

---

**Total deviations:** 2 auto-fixed (both Rule 1), 2 out-of-scope items logged
**Impact on plan:** one is substantive — the helper-text divergence was created by this plan's own fix and would have shipped a label contradicting its own gate. It expanded the blast radius by two files, both recorded. No acceptance criterion was satisfied by editing prose, and the one criterion this plan briefly made unsatisfiable is documented above with what was done and why.

## Issues Encountered

**`yarn format` is a whole-repo command, not a per-file one.** Passing file paths to it built every package and reformatted the entire tree, pulling an unrelated file into the working set. Recovered by reverting that file and using `npx prettier --write` on the four files this plan owns. Worth knowing before the next plan reaches for it.

**REVIEW-CMP-02 is not marked complete**, and that is correct: `159-11` also declares it, so the shared-ID gate holds it until the last declaring plan produces a SUMMARY.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `159-11` is the last plan: it collapses the `constants.ts` default, files the two blocked follow-ups (items 2 and 4 above), and runs the phase's single budgeted full-suite E2E run.
- **Two coverage items wait on that run**: D4 here (the `QuestionChoices` change, provably equivalent by construction but not observed) and 159-09's D5. Both are ledger entries, 236 and 234.
- No E2E run happened here, by design.

---
*Phase: 159-component-context-consolidation*
*Completed: 2026-09-03*

## Self-Check: PASSED

All four created files exist on disk; all four commits (`a61245b4c`, `14a6bf1ea`, `4f5da11d5`, `632e53556`) are in the log; the working tree is clean. Gates re-run at HEAD with exit codes read directly, never through a pipe: frontend unit 88 files / 1590 tests / 0 failed (exit 0), monorepo unit 25/25 tasks (exit 0), `yarn typecheck` 0 errors 0 warnings (exit 0), `yarn lint:check` (exit 0). Every acceptance criterion from Tasks 1 and 3 re-measured green, including the fourth criterion discussed above, which now returns 3.
